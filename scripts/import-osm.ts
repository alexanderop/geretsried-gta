/**
 * Builds public/geretsried.map.json from OpenStreetMap.
 *   pnpm map        reuse data/raw.json
 *   pnpm map:fetch  download a fresh copy from Overpass first (also data/routes.json, the bus lines)
 * Data © OpenStreetMap contributors, ODbL. Roof colours, trees and paved ground
 * (public/ground.png) are read from the DOP40 aerial photo, © Bayerische
 * Vermessungsverwaltung, CC BY 4.0 (see scripts/dop40.ts).
 */
import { Console, Effect, FileSystem, Schema } from "effect"
import { NodeRuntime, NodeServices } from "@effect/platform-node"
import { buildMap } from "../src/map/build.ts"
import { encodeCrowns } from "../src/map/crowns.ts"
import { encodePng } from "../src/map/png.ts"
import { readPhoto } from "../src/map/photo.ts"
import { loadPhoto } from "./dop40.ts"
import type { Bbox } from "../src/map/project.ts"

const RAW = "data/raw.json"
const PLACES = "data/places.json"
const EXTRA = "data/extra.json"
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
  const decode = Schema.decodeUnknownEffect(Schema.fromJsonString(PlacesResponse))
  const placesRaw = [...(yield* decode(yield* fs.readFileString(PLACES))).elements, ...(yield* decode(yield* fs.readFileString(EXTRA))).elements]
  const places = placesRaw.flatMap((e) => {
    const lat = e.lat ?? e.center?.lat
    const lon = e.lon ?? e.center?.lon
    return lat === undefined || lon === undefined ? [] : [{ id: e.id, lat, lon, tags: e.tags }]
  })
  const routes = (yield* Schema.decodeUnknownEffect(Schema.fromJsonString(RoutesResponse))(yield* fs.readFileString(ROUTES))).elements
  const raw = yield* Schema.decodeUnknownEffect(Schema.fromJsonString(OverpassResponse))(yield* fs.readFileString(RAW))
  const ways = raw.elements.filter((e) => e.type === "way")
  const photo = yield* loadPhoto(BBOX)
  const { map, crowns, paved } = readPhoto(buildMap(ways, places, BBOX, routes), photo)
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
