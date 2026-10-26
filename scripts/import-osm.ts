/**
 * Builds public/geretsried.map.json from OpenStreetMap.
 *   pnpm map        reuse data/raw.json and the other caches in data/ (each one missing is downloaded)
 *   pnpm map:fetch  download a fresh copy of every cache from Overpass first (also data/routes.json, the bus lines)
 * To refresh one cache alone (so the rest stays byte-identical), delete that file and run `pnpm map`.
 * Data © OpenStreetMap contributors, ODbL. Roof colours, trees and paved ground
 * (public/ground.png) are read from the DOP40 aerial photo, © Bayerische
 * Vermessungsverwaltung, CC BY 4.0 (see scripts/dop40.ts).
 */
import { Console, Effect, FileSystem, Schema } from "effect"
import { NodeRuntime, NodeServices } from "@effect/platform-node"
import { buildMap, poiKind, relationBuildings, sportSkip, type OsmRelation, type OsmWay } from "../src/map/build.ts"
import { EXTRA_POIS, EXTRA_POIS_NEXT } from "../src/map/extra-pois.ts"
import { dressMap } from "../src/world/places/dressing.ts"
import { PLACES as DRESSINGS } from "../src/world/places/index.ts"
import { encodeCrowns } from "../src/map/crowns.ts"
import { encodePng } from "../src/map/png.ts"
import { groundTint, readPhoto } from "../src/map/photo.ts"
import { loadPhoto } from "./dop40.ts"
import type { Bbox } from "../src/map/project.ts"

const RAW = "data/raw.json"
const PLACES = "data/places.json"
const EXTRA = "data/extra.json"
const PLACES_MORE = "data/places-more.json"
const BUILDINGS_REL = "data/buildings-rel.json"
const PLACES_NEXT = "data/places-next.json"
const AREAS_MORE = "data/areas-more.json"
const ROUTES = "data/routes.json"
const OUT = "public/geretsried.map.json"
const GROUND_OUT = "public/ground.png"
const TREES_OUT = "public/trees.bin"
/** The main server is often at capacity (502): then the next one answers. */
const OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.openstreetmap.fr/api/interpreter"]

/** Geretsried town, Gelting and the Isar on the west edge. */
const BBOX: Bbox = { south: 47.845, west: 11.43, north: 47.9, east: 11.505 }

const QUERY = `[out:json][timeout:120];
(
  way["highway"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["building"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["waterway"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["natural"~"water|wood"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["landuse"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["leisure"~"park|pitch"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["amenity"="parking"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
);
out geom;`

const B = `${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east}`
const PLACES_QUERY = `[out:json][timeout:120];
(
  nwr["shop"](${B});
  nwr["amenity"~"^(fuel|pharmacy|bank|police|post_office|townhall|fast_food|restaurant|cafe|ice_cream|pub|biergarten|cinema|hospital|doctors|school|library)$"](${B});
  node["highway"="traffic_signals"](${B});
);
out center tags;`

/**
 * Places the first query leaves out (I-1): gyms, dojos, health care, kindergartens, care homes, bars and clubs,
 * parcel lockers, offices and craft businesses. Its own query and cache, so the older POIs keep their ids: these come
 * after them. Only named sports centres; buildMap keeps those with sport=fitness (poiKind).
 */
const PLACES_MORE_QUERY = `[out:json][timeout:120];
(
  nwr["leisure"="fitness_centre"](${B});
  nwr["leisure"="sports_centre"]["name"](${B});
  nwr["amenity"~"^(dojo|dentist|veterinary|kindergarten|childcare|social_facility|bar|nightclub|parcel_locker)$"](${B});
  nwr["office"](${B});
  nwr["craft"](${B});
  nwr["healthcare"](${B});
);
out center tags;`

/**
 * Places of the next step (I-2): the Feuerwehrschule (college), driving schools, the Kulturbühne (arts centre) and the
 * named stadiums. Its own query and cache, appended after the I-1 places; the named sports centres it turns into sport
 * POIs are in PLACES_MORE_QUERY's cache already.
 */
const PLACES_NEXT_QUERY = `[out:json][timeout:120];
(
  nwr["amenity"~"^(college|driving_school|arts_centre)$"](${B});
  nwr["leisure"="stadium"]["name"](${B});
);
out center tags;`

/**
 * Playgrounds, tracks and fitness stations (I-2): QUERY fetches parks and pitches only. Its own cache, so data/raw.json
 * and every older area stay as they are. Not leisure=stadium (its outline wraps the pitch and track, which draw anyway)
 * nor swimming_pool (garden pools; the Hallenbad's is under its roof). Playground nodes are left out.
 */
const AREAS_MORE_QUERY = `[out:json][timeout:120];
(
  way["leisure"~"^(playground|track|fitness_station)$"](${B});
  relation["leisure"~"^(playground|track)$"]["type"="multipolygon"](${B});
);
out geom;`

/** Buildings mapped as multipolygon relations (a ring around a courtyard); QUERY fetches way buildings only. */
const BUILDINGS_REL_QUERY = `[out:json][timeout:120];
relation["building"](${B});
out geom;`

/** Churches, districts, crossings, bus stops and bottle banks; town signs a little past the west edge name Gelting. */
const EXTRA_QUERY = `[out:json][timeout:120];
(
  nwr["amenity"="place_of_worship"](${B});
  node["place"~"^(suburb|quarter|neighbourhood|village)$"](${B});
  node["highway"="crossing"](${B});
  node["highway"="bus_stop"](${B});
  nwr["amenity"="recycling"]["recycling:glass_bottles"="yes"](${B});
  node["traffic_sign"="city_limit"]["name"](${BBOX.south},${BBOX.west - 0.02},${BBOX.north},${BBOX.east});
);
out center tags;`

/** Every bus route through the map (OSM relations), then their ways and nodes: `>` fetches the whole of each route, also the part outside the box. */
const ROUTES_QUERY = `[out:json][timeout:180];
rel["type"="route"]["route"="bus"](${B});
out body;
>;
out body qt;`

const RoutesResponse = Schema.Struct({
  elements: Schema.Array(
    Schema.Struct({
      type: Schema.String,
      id: Schema.Number,
      lat: Schema.optionalKey(Schema.Number),
      lon: Schema.optionalKey(Schema.Number),
      nodes: Schema.optionalKey(Schema.Array(Schema.Number)),
      members: Schema.optionalKey(Schema.Array(Schema.Struct({ type: Schema.String, ref: Schema.Number, role: Schema.String }))),
      tags: Schema.optionalKey(Schema.Record(Schema.String, Schema.String)),
    }),
  ),
})

const PlacesResponse = Schema.Struct({
  elements: Schema.Array(
    Schema.Struct({
      type: Schema.String,
      id: Schema.Number,
      lat: Schema.optionalKey(Schema.Number),
      lon: Schema.optionalKey(Schema.Number),
      center: Schema.optionalKey(Schema.Struct({ lat: Schema.Number, lon: Schema.Number })),
      tags: Schema.Record(Schema.String, Schema.String),
    }),
  ),
})

const OverpassResponse = Schema.Struct({
  elements: Schema.Array(
    Schema.Struct({
      type: Schema.String,
      id: Schema.Number,
      nodes: Schema.Array(Schema.Number),
      geometry: Schema.Array(Schema.Struct({ lat: Schema.Number, lon: Schema.Number })),
      tags: Schema.Record(Schema.String, Schema.String),
    }),
  ),
})

/** Ways and relations with `out geom`: a way carries its geometry, a relation its members' geometry. */
const AreasResponse = Schema.Struct({
  elements: Schema.Array(
    Schema.Struct({
      type: Schema.String,
      id: Schema.Number,
      nodes: Schema.optionalKey(Schema.Array(Schema.Number)),
      geometry: Schema.optionalKey(Schema.Array(Schema.Struct({ lat: Schema.Number, lon: Schema.Number }))),
      members: Schema.optionalKey(
        Schema.Array(
          Schema.Struct({
            type: Schema.String,
            ref: Schema.Number,
            role: Schema.String,
            geometry: Schema.optionalKey(Schema.Array(Schema.Struct({ lat: Schema.Number, lon: Schema.Number }))),
          }),
        ),
      ),
      tags: Schema.Record(Schema.String, Schema.String),
    }),
  ),
})

const RelationsResponse = Schema.Struct({
  elements: Schema.Array(
    Schema.Struct({
      id: Schema.Number,
      tags: Schema.Record(Schema.String, Schema.String),
      members: Schema.Array(
        Schema.Struct({
          type: Schema.String,
          ref: Schema.Number,
          role: Schema.String,
          geometry: Schema.optionalKey(Schema.Array(Schema.Struct({ lat: Schema.Number, lon: Schema.Number }))),
        }),
      ),
    }),
  ),
})

class OverpassError extends Schema.TaggedError<OverpassError>()("OverpassError", {
  status: Schema.Number,
}) {}

const download = (query: string) =>
  Effect.gen(function* () {
    for (const url of OVERPASS) {
      yield* Console.log(`Downloading from ${url}…`)
      const res = yield* Effect.tryPromise(() =>
        fetch(url, { method: "POST", headers: { "User-Agent": "geretsried-gta-poc" }, body: new URLSearchParams({ data: query }) }),
      ).pipe(Effect.orElseSucceed(() => null))
      if (res?.ok === true) return yield* Effect.tryPromise(() => res.text())
      yield* Console.log(res === null ? "  not reachable" : `  answered ${res.status}`)
    }
    return yield* new OverpassError({ status: 502 })
  })

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  const fresh = process.argv.includes("--fetch")
  yield* fs.makeDirectory("data", { recursive: true })
  if (fresh || !(yield* fs.exists(RAW))) yield* fs.writeFileString(RAW, yield* download(QUERY))
  if (fresh || !(yield* fs.exists(PLACES))) yield* fs.writeFileString(PLACES, yield* download(PLACES_QUERY))
  if (fresh || !(yield* fs.exists(EXTRA))) yield* fs.writeFileString(EXTRA, yield* download(EXTRA_QUERY))
  if (fresh || !(yield* fs.exists(ROUTES))) yield* fs.writeFileString(ROUTES, yield* download(ROUTES_QUERY))
  if (fresh || !(yield* fs.exists(PLACES_MORE))) yield* fs.writeFileString(PLACES_MORE, yield* download(PLACES_MORE_QUERY))
  if (fresh || !(yield* fs.exists(BUILDINGS_REL))) yield* fs.writeFileString(BUILDINGS_REL, yield* download(BUILDINGS_REL_QUERY))
  if (fresh || !(yield* fs.exists(PLACES_NEXT))) yield* fs.writeFileString(PLACES_NEXT, yield* download(PLACES_NEXT_QUERY))
  if (fresh || !(yield* fs.exists(AREAS_MORE))) yield* fs.writeFileString(AREAS_MORE, yield* download(AREAS_MORE_QUERY))
  const decode = Schema.decodeUnknownEffect(Schema.fromJsonString(PlacesResponse))
  type Element = (typeof PlacesResponse.Type)["elements"][number]
  const located = (elements: ReadonlyArray<Element>) =>
    elements.flatMap((e) => {
      const lat = e.lat ?? e.center?.lat
      const lon = e.lon ?? e.center?.lon
      return lat === undefined || lon === undefined ? [] : [{ id: e.id, lat, lon, tags: e.tags }]
    })
  const first = [...(yield* decode(yield* fs.readFileString(PLACES))).elements, ...(yield* decode(yield* fs.readFileString(EXTRA))).elements]
  const places = located(first)
  // An element both queries match (a pharmacy with healthcare=pharmacy) is already in `places`.
  const seen = new Set(first.map((e) => `${e.type}/${e.id}`))
  const moreElements = (yield* decode(yield* fs.readFileString(PLACES_MORE))).elements.filter((e) => !seen.has(`${e.type}/${e.id}`))
  const morePlaces = located(moreElements)
  for (const e of moreElements) seen.add(`${e.type}/${e.id}`)
  const nextElements = (yield* decode(yield* fs.readFileString(PLACES_NEXT))).elements.filter((e) => !seen.has(`${e.type}/${e.id}`))
  const nextPlaces = located(nextElements)
  // What the next step's kinds leave out, and why: school gyms, and the unnamed (no name, no POI).
  for (const e of [...first, ...moreElements, ...nextElements]) {
    const venue = (e.tags.leisure === "sports_centre" && poiKind(e.tags) !== "gym") || e.tags.leisure === "stadium"
    if (!venue && !["school", "college", "driving_school", "arts_centre"].includes(e.tags.amenity ?? "")) continue
    const why = e.tags.name === undefined ? "no name" : venue ? sportSkip(e.tags) : null
    if (why !== null) yield* Console.log(`skipped: ${e.type} ${e.id} ${e.tags.name ?? "(unnamed)"} (${e.tags.amenity ?? `leisure=${e.tags.leisure}`}): ${why}`)
  }
  const areaElements = (yield* Schema.decodeUnknownEffect(Schema.fromJsonString(AreasResponse))(yield* fs.readFileString(AREAS_MORE))).elements
  const leisureAreas = {
    ways: areaElements.flatMap((e): Array<OsmWay> => (e.type === "way" && e.geometry !== undefined ? [{ id: e.id, nodes: e.nodes ?? [], geometry: e.geometry, tags: e.tags }] : [])),
    relations: areaElements.flatMap((e): Array<OsmRelation> => (e.type === "relation" && e.members !== undefined ? [{ id: e.id, tags: e.tags, members: e.members }] : [])),
  }
  const buildingRelations = (yield* Schema.decodeUnknownEffect(Schema.fromJsonString(RelationsResponse))(yield* fs.readFileString(BUILDINGS_REL))).elements
  const routes = (yield* Schema.decodeUnknownEffect(Schema.fromJsonString(RoutesResponse))(yield* fs.readFileString(ROUTES))).elements
  const raw = yield* Schema.decodeUnknownEffect(Schema.fromJsonString(OverpassResponse))(yield* fs.readFileString(RAW))
  const ways = raw.elements.filter((e) => e.type === "way")
  const photo = yield* loadPhoto(BBOX)
  const tints: Array<string> = []
  const tintOf = (id: number, pts: ReadonlyArray<number>, holes: ReadonlyArray<ReadonlyArray<number>>) => {
    const t = groundTint(photo, pts, holes)
    tints.push(`${id} ${t === null ? "no pixel: drawn as paving" : `photo ${t.photo} → ${t.tint}`}`)
    return t?.tint ?? null
  }
  const built = buildMap(ways, places, BBOX, routes, {
    places: morePlaces,
    extraPois: EXTRA_POIS,
    buildingRelations,
    next: { places: nextPlaces, extraPois: EXTRA_POIS_NEXT },
    leisureAreas,
    groundTint: tintOf,
  })
  for (const t of tints) yield* Console.log(`area tint ${t}`)
  const { map, crowns, paved } = readPhoto(dressMap(built, DRESSINGS), photo)
  const wayBuildings = new Set(ways.filter((w) => w.tags.building !== undefined).map((w) => w.id))
  for (const rel of relationBuildings(buildingRelations, wayBuildings, BBOX))
    yield* Console.log(`relation building ${rel.id} ${rel.name === "" ? "(unnamed)" : rel.name}: ${rel.area} m², ${rel.status === "new" ? `new, ${rel.buildings.reduce((n, b) => n + (b.holes?.length ?? 0), 0)} courtyard(s)` : "duplicate of a way building, skipped"}`)
  const kinds = new Map<string, number>()
  for (const p of map.pois) kinds.set(p.kind, (kinds.get(p.kind) ?? 0) + 1)
  yield* Console.log(`places per kind: ${[...kinds].map(([k, n]) => `${k} ${n}`).join(", ")}`)
  const areaKinds = new Map<string, number>()
  for (const a of map.areas) areaKinds.set(a.kind, (areaKinds.get(a.kind) ?? 0) + 1)
  yield* Console.log(`areas per kind: ${[...areaKinds].map(([k, n]) => `${k} ${n}`).join(", ")}`)
  yield* fs.writeFileString(OUT, JSON.stringify(map))
  yield* fs.writeFile(GROUND_OUT, encodePng(paved))
  // Row by row, so neighbours sit together and the file gzips well.
  yield* fs.writeFile(TREES_OUT, encodeCrowns(crowns.toSorted((a, b) => Math.floor(a[1] / 8) - Math.floor(b[1] / 8) || a[0] - b[0])))
  const size = (yield* fs.stat(OUT)).size
  yield* Console.log(
    `${OUT}: ${Math.round(map.width)}×${Math.round(map.height)} m, ${map.roads.length} roads, ` +
      `${map.buildings.length} buildings, ${map.areas.length} areas, ${map.waterways.length} waterways, ` +
      `${map.pois.length} places, ${map.signals.length} traffic lights, ${map.crossings.length} crossings, ${map.districts.length} districts, ` +
      `${map.props.length} props, ${map.buses.length} bus lines (${map.buses.map((l) => `${l.ref}: ${l.runs.length} runs, ${l.runs.reduce((n, r) => n + r.stops.length, 0)} stops`).join("; ")}), ${crowns.length} trees, ` +
      `${(Number(size) / 1e6).toFixed(1)} MB`,
  )
})

program.pipe(Effect.provide(NodeServices.layer), NodeRuntime.runMain)
