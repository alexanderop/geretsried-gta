import type { Area, AreaKind, Building, Container, Crossing, District, GameMap, Poi, PoiKind, Prop, Road, RoadKind, Signal, Waterway } from "./types.ts"
import { makeProjection, type Bbox, type LatLon } from "./project.ts"
import { buildBusLines, type OsmElement } from "./bus.ts"
import type { ExtraPoi } from "./extra-pois.ts"
import { pointInPolygon } from "#/world/geometry.ts"

/** One `way` as Overpass returns it with `out geom`. */
export type OsmWay = {
  readonly id: number
  readonly nodes: ReadonlyArray<number>
  readonly geometry: ReadonlyArray<LatLon>
  readonly tags: Readonly<Record<string, string>>
}

const ROAD_KINDS: Readonly<Record<string, readonly [RoadKind, number]>> = {
  primary: ["primary", 10],
  primary_link: ["primary", 7],
  secondary: ["secondary", 9],
  tertiary: ["tertiary", 8],
  tertiary_link: ["tertiary", 6],
  unclassified: ["residential", 6.5],
  residential: ["residential", 6.5],
  living_street: ["living_street", 5],
  pedestrian: ["living_street", 6],
  service: ["service", 4],
  // Bus-only roads (the loop at the Schulzentrum): service roads that only buses drive.
  busway: ["service", 6],
  track: ["track", 3],
  footway: ["footway", 2],
  path: ["footway", 1.8],
  cycleway: ["footway", 2],
  steps: ["footway", 2],
  bridleway: ["footway", 1.8],
}

const areaKind = (tags: Readonly<Record<string, string>>): AreaKind | null => {
  if (tags.natural === "water" || tags.landuse === "reservoir" || tags.landuse === "basin") return "water"
  if (tags.natural === "wood" || tags.landuse === "forest") return "forest"
  if (tags.leisure === "park") return "park"
  if (tags.leisure === "pitch") return "pitch"
  if (tags.amenity === "parking") return "parking"
  switch (tags.landuse) {
    case "grass":
    case "meadow":
    case "recreation_ground":
    case "village_green":
    case "cemetery":
      return "grass"
    case "farmland":
    case "farmyard":
    case "orchard":
      return "farmland"
    case "residential":
      return "residential"
    case "industrial":
    case "commercial":
    case "retail":
      return "industrial"
    default:
      return null
  }
}

/** A node, or a way reduced to its center (Overpass `out center`). */
export type OsmPlace = {
  readonly id: number
  readonly lat: number
  readonly lon: number
  readonly tags: Readonly<Record<string, string>>
}

const POI_KINDS: Readonly<Record<string, PoiKind>> = {
  supermarket: "supermarket",
  convenience: "supermarket",
  discount: "supermarket",
  chemist: "drugstore",
  bakery: "bakery",
  pastry: "bakery",
  fuel: "fuel",
  pharmacy: "pharmacy",
  bank: "bank",
  restaurant: "food",
  fast_food: "food",
  cafe: "food",
  ice_cream: "food",
  pub: "food",
  biergarten: "food",
  police: "police",
  post_office: "post",
  school: "school",
  doctors: "doctor",
  hospital: "doctor",
  townhall: "civic",
  library: "civic",
  cinema: "civic",
  place_of_worship: "church",
  car_repair: "car_repair",
}

/** Amenities the later places queries (PLACES_MORE_QUERY, PLACES_NEXT_QUERY) bring; looked up after POI_KINDS, and never for shops. */
const MORE_AMENITY_KINDS: Readonly<Record<string, PoiKind>> = {
  dojo: "gym",
  dentist: "health",
  veterinary: "health",
  kindergarten: "kindergarten",
  childcare: "kindergarten",
  social_facility: "care_home",
  bar: "bar",
  nightclub: "bar",
  parcel_locker: "parcel_locker",
  // The Feuerwehrschule is a school campus; a driving school is a small business with a sign; the Kulturbühne is a stage.
  college: "school",
  driving_school: "office",
  arts_centre: "civic",
}

/** Gyms: every fitness centre; a sports centre only when fitness is one of its sports (the others are pools, halls, tennis). */
const isGym = (tags: Readonly<Record<string, string>>) =>
  tags.leisure === "fitness_centre" || (tags.leisure === "sports_centre" && (tags.sport ?? "").split(";").includes("fitness"))

/** Why a sports venue that is no gym is no POI either: a school's gym hall. Null for a public or club venue. */
export const sportSkip = (tags: Readonly<Record<string, string>>): string | null => {
  if (tags.name?.startsWith("Turnhalle") === true) return "school gym (name Turnhalle)"
  if (tags.building === "sports_hall") return "school gym (building=sports_hall)"
  return null
}

/** Public and club sports venues: stadiums, and sports centres that are no gym (pool, tennis), except school gyms. */
const isSport = (tags: Readonly<Record<string, string>>) => (tags.leisure === "stadium" || tags.leisure === "sports_centre") && sportSkip(tags) === null

/**
 * What a place is: its amenity, else a gym, else a sports venue, else health care (healthcare=*: not "doctor", so a dentist never
 * becomes the respawn hospital), else its shop, else an office or craft business; null for anything else.
 */
export const poiKind = (tags: Readonly<Record<string, string>>): PoiKind | null => {
  const amenity = tags.amenity === undefined ? undefined : (POI_KINDS[tags.amenity] ?? MORE_AMENITY_KINDS[tags.amenity])
  if (amenity !== undefined) return amenity
  if (isGym(tags)) return "gym"
  if (isSport(tags)) return "sport"
  if (tags.healthcare !== undefined) return "health"
  if (tags.shop !== undefined) return tags.shop === "vacant" ? null : (POI_KINDS[tags.shop] ?? "shop")
  if (tags.office !== undefined || tags.craft !== undefined) return "office"
  return null
}

/**
 * POI names OSM spells wrong, by the OSM id of the place they come from. The id, not the name, so the POI keeps its slot
 * (docs/poi-id-map.csv). Occasione (way 668663478, B6d-9): OSM says "Livestyle", its signs and website "Lifestyle".
 */
const NAME_FIXES: ReadonlyMap<number, string> = new Map([[668663478, "Occasione Mode & Lifestyle"]])

/** A place's POI name: a fixed one, else its brand, else its name. */
export const placeName = (place: OsmPlace): string | undefined => NAME_FIXES.get(place.id) ?? place.tags.brand ?? place.tags.name

/**
 * A later place this close to a POI whose name equals its own or starts with it, or the other way round, is the same
 * place (a pub node inside a gym's building way; "Champini" grounds round "Champini Sport- & Bewegungskita").
 */
const TWIN_M = 50

const twins = (a: Poi, b: Poi) => (a.name.startsWith(b.name) || b.name.startsWith(a.name)) && Math.hypot(a.x - b.x, a.y - b.y) <= TWIN_M

/**
 * Add `poi` unless a twin (TWIN_M) is on the map: then that one stays (its slot and position, so ids and dressings
 * keep it), takes the longer of the two names, and takes the newcomer's kind if its own is food and the newcomer's is not.
 */
const addPoi = (pois: Array<Poi>, poi: Poi) => {
  const twin = pois.findIndex((p) => twins(p, poi))
  const old = pois[twin]
  if (old === undefined) {
    pois.push(poi)
    return
  }
  const name = poi.name.length > old.name.length ? poi.name : old.name
  const kind = old.kind === "food" && poi.kind !== "food" ? poi.kind : old.kind
  if (name !== old.name || kind !== old.kind) pois[twin] = { ...old, name, kind }
}

/** One relation as Overpass returns it with `out geom`: its way members carry their geometry. */
export type OsmRelation = {
  readonly id: number
  readonly tags: Readonly<Record<string, string>>
  readonly members: ReadonlyArray<{ readonly type: string; readonly ref: number; readonly role: string; readonly geometry?: ReadonlyArray<LatLon> }>
}

const samePoint = (a: LatLon | undefined, b: LatLon | undefined) => a !== undefined && b !== undefined && a.lat === b.lat && a.lon === b.lon

/** Join ways end to end into closed rings (a multipolygon may split one ring over several ways); open leftovers are dropped. */
export const joinRings = (ways: ReadonlyArray<ReadonlyArray<LatLon>>): Array<Array<LatLon>> => {
  const left = ways.filter((w) => w.length >= 2).map((w) => [...w])
  const rings: Array<Array<LatLon>> = []
  while (left.length > 0) {
    const ring = left.shift() ?? []
    for (;;) {
      if (ring.length >= 4 && samePoint(ring[0], ring[ring.length - 1])) {
        rings.push(ring)
        break
      }
      const end = ring[ring.length - 1]
      const k = left.findIndex((w) => samePoint(w[0], end) || samePoint(w[w.length - 1], end))
      const next = left[k]
      if (next === undefined) break
      left.splice(k, 1)
      ring.push(...(samePoint(next[0], end) ? next : next.toReversed()).slice(1))
    }
  }
  return rings
}

/** A multipolygon building (OSM relation): its footprints, or "duplicate" when an outer way is a building of its own already. */
export type RelationBuilding = {
  readonly id: number
  readonly name: string
  /** m², the outer rings less the courtyards. */
  readonly area: number
  readonly status: "new" | "duplicate"
  readonly buildings: ReadonlyArray<Building>
}

/**
 * The building relations in the box as buildings: each outer ring a footprint (id = the relation's), the inner
 * rings inside it its `holes`. `wayBuildings` are the ids of the way buildings already on the map.
 */
export const relationBuildings = (
  relations: ReadonlyArray<OsmRelation>,
  wayBuildings: ReadonlySet<number>,
  bbox: Bbox,
  lod2Levels: ReadonlyMap<number, number> = new Map(),
): Array<RelationBuilding> => {
  const projection = makeProjection(bbox)
  const inside = (p: LatLon) => p.lat >= bbox.south && p.lat <= bbox.north && p.lon >= bbox.west && p.lon <= bbox.east
  const flat = (ring: ReadonlyArray<LatLon>) => ring.flatMap((p) => projection.toMeters(p).map(round))
  return relations.flatMap((rel) => {
    if (rel.tags.building === undefined || rel.tags.type !== "multipolygon") return []
    const ways = (role: string) => rel.members.flatMap((m) => (m.type === "way" && m.role === role && m.geometry !== undefined ? [m.geometry] : []))
    const outers = joinRings(ways("outer")).filter((r) => r.some(inside)).map(flat)
    if (outers.length === 0) return []
    const inners = joinRings(ways("inner")).map(flat)
    const duplicate = rel.members.some((m) => m.type === "way" && m.role === "outer" && wayBuildings.has(m.ref))
    const buildings = outers.map((pts): Building => {
      const holes = inners.filter((h) => pointInPolygon(h[0] ?? 0, h[1] ?? 0, pts))
      return { id: rel.id, levels: buildingLevels(rel.tags, lod2Levels.get(rel.id)), pts, ...(rel.tags.building === "roof" ? { canopy: true } : {}), ...(holes.length > 0 ? { holes } : {}) }
    })
    const area = buildings.reduce((s, b) => s + polygonArea(b.pts) - (b.holes ?? []).reduce((h, r) => h + polygonArea(r), 0), 0)
    return [{ id: rel.id, name: rel.tags.name ?? "", area: Math.round(area), status: duplicate ? "duplicate" : "new", buildings }]
  })
}

/** The leisure areas of the later area query: playgrounds, tracks, and fitness stations (small outdoor exercise patches, drawn as pitches). */
const leisureKind = (tags: Readonly<Record<string, string>>): AreaKind | null => {
  if (tags.leisure === "playground") return "playground"
  if (tags.leisure === "track") return "track"
  if (tags.leisure === "fitness_station") return "pitch"
  return null
}

/** Surfaces drawn as plain paving (the car park look); any other surface, or none, takes its colour from the aerial photo. */
const PAVED_SURFACES: ReadonlySet<string> = new Set(["asphalt", "paved", "concrete", "paving_stones", "sett"])

/** Width of a track mapped as a line when OSM gives none: the Franz-Marc-Schule's lanes measure about 4 m on the DOP20. */
const LANE_M = 4

/** Storeys a building type has when OSM does not say (most do not): the walls the renderer extrudes. */
const TYPICAL_LEVELS: Readonly<Record<string, number>> = {
  garage: 1,
  garages: 1,
  shed: 1,
  carport: 1,
  hut: 1,
  roof: 1,
  stable: 1,
  barn: 1,
  farm_auxiliary: 1,
  service: 1,
  kiosk: 1,
  retail: 1,
  // Geretsried's post-war blocks (Sudetenstraße, Egerlandstraße) have four storeys.
  apartments: 4,
}

/**
 * A building:levels tag this many storeys under the LoD2 model's walls counts only part of the building, and LoD2
 * wins: of the 149 tagged buildings LoD2 matches, the Sparkassengebäude (way 980958027: 5 over a 27.5 m flat roof),
 * way 188048816 (1 under a 7.8 m eave) and Kaufland (a place, which keeps its own). Every other tag is within one
 * storey of LoD2's or above it, and stays.
 */
const TAG_UNDER_LOD2 = 2

/** Storeys: OSM's building:levels (unless far under LoD2's), else the LoD2 model's (scripts/lod2-heights.ts), else the type's typical count. */
export const buildingLevels = (tags: Readonly<Record<string, string>>, lod2?: number): number => {
  const levels = Number(tags["building:levels"])
  if (Number.isFinite(levels) && levels > 0) return lod2 !== undefined && lod2 - levels >= TAG_UNDER_LOD2 ? lod2 : levels
  return lod2 ?? TYPICAL_LEVELS[tags.building ?? ""] ?? 2
}

const round = (n: number) => Math.round(n * 10) / 10

/** What each OSM recycling:* material puts in the row; a bottle bank comes as three (white, green and brown glass). */
const MATERIALS: ReadonlyArray<readonly [ReadonlyArray<string>, ReadonlyArray<Container>]> = [
  [["glass_bottles", "glass"], ["glass", "glass", "glass"]],
  [["paper", "cardboard"], ["paper"]],
  [["cans"], ["cans"]],
  [["clothes", "shoes"], ["clothes"]],
  [["green_waste", "garden_waste"], ["green"]],
]

/** A recycling point that names no material (most Wertstoffinseln in OSM): glass, paper and cans. */
const WERTSTOFFINSEL: ReadonlyArray<Container> = ["glass", "paper", "cans"]

/** The containers of a recycling point, from its recycling:*=yes tags. */
export const recyclingHolds = (tags: Readonly<Record<string, string>>): ReadonlyArray<Container> => {
  const holds = MATERIALS.flatMap(([keys, row]) => (keys.some((k) => tags[`recycling:${k}`] === "yes") ? row : []))
  return holds.length === 0 ? WERTSTOFFINSEL : holds
}

/**
 * The prop of a piece of street furniture (amenity bench, waste_basket, recycling, bicycle_parking), or null: a
 * recycling firm mapped on its building (recycling_type=centre with building=*) is no container in the street.
 */
export const furnitureProp = (tags: Readonly<Record<string, string>>, x: number, y: number): Prop | null => {
  switch (tags.amenity) {
    case "bench":
      return { kind: "bench", x, y }
    case "waste_basket":
      return { kind: "bin", x, y }
    case "recycling":
      return tags.building === undefined ? { kind: "recycling", x, y, holds: [...recyclingHolds(tags)] } : null
    case "bicycle_parking": {
      const capacity = Number.parseInt(tags.capacity ?? "", 10)
      return { kind: "bike_rack", x, y, ...(tags.covered === "yes" ? { covered: true } : {}), ...(Number.isFinite(capacity) && capacity > 0 ? { capacity } : {}) }
    }
    default:
      return null
  }
}

/**
 * Sources fetched apart from the first ones (each with its own cache), so adding them leaves every older
 * feature as it was: their POIs and buildings come after the older ones.
 */
export type MoreSources = {
  /** Places of the second places query: gyms, health care, kindergartens, offices, … (see MORE_AMENITY_KINDS, poiKind). */
  readonly places?: ReadonlyArray<OsmPlace>
  /** Places OSM lacks, appended last. */
  readonly extraPois?: ReadonlyArray<ExtraPoi>
  /** Building relations (multipolygons with courtyards), appended after the way buildings. */
  readonly buildingRelations?: ReadonlyArray<OsmRelation>
  /**
   * The next import step's places (I-2: colleges, driving schools, arts centres, stadiums; then restaurants and a
   * workshop added by hand), appended after all of the above. The sports venues among `places` come with them too.
   */
  readonly next?: { readonly places?: ReadonlyArray<OsmPlace>; readonly extraPois?: ReadonlyArray<ExtraPoi> }
  /** Leisure areas (see leisureKind): ways, and multipolygon relations whose outer rings become the areas. */
  readonly leisureAreas?: { readonly ways: ReadonlyArray<OsmWay>; readonly relations: ReadonlyArray<OsmRelation> }
  /** The ground colour (#rrggbb) of an area from the aerial photo, `holes` left out (null: none); `id` is its OSM way or relation. */
  readonly groundTint?: (id: number, pts: ReadonlyArray<number>, holes: ReadonlyArray<ReadonlyArray<number>>) => string | null
  /** Storeys from the LoD2 model (data/lod2-levels.json) by OSM way and relation id, used where OSM has no building:levels. */
  readonly lod2Levels?: { readonly ways: ReadonlyMap<number, number>; readonly relations: ReadonlyMap<number, number> }
  /** Street furniture (V-11: benches, litter bins, recycling points, bike racks), appended after every older prop. */
  readonly furniture?: ReadonlyArray<OsmPlace>
}

/**
 * Turn raw Overpass ways into the compact map the game loads.
 * Keeps every feature that touches the bbox; the renderer clips the rest.
 */
export const buildMap = (
  ways: ReadonlyArray<OsmWay>,
  places: ReadonlyArray<OsmPlace>,
  bbox: Bbox,
  routes: ReadonlyArray<OsmElement> = [],
  more: MoreSources = {},
): GameMap => {
  const projection = makeProjection(bbox)
  const inside = (p: LatLon) => p.lat >= bbox.south && p.lat <= bbox.north && p.lon >= bbox.west && p.lon <= bbox.east
  const flat = (geometry: ReadonlyArray<LatLon>) =>
    geometry.flatMap((p) => projection.toMeters(p).map(round))

  const roads: Array<Road> = []
  const buildings: Array<Building> = []
  const areas: Array<Area> = []
  const waterways: Array<Waterway> = []

  for (const way of ways) {
    if (way.geometry.length < 2 || !way.geometry.some(inside)) continue
    const { tags } = way
    const road = tags.highway === undefined ? undefined : ROAD_KINDS[tags.highway]
    if (road !== undefined) {
      if (tags.area === "yes") continue
      const lanes = Number(tags.lanes)
      const [kind, baseWidth] = road
      roads.push({
        kind,
        name: tags.name ?? tags.ref ?? "",
        width: Number.isFinite(lanes) && lanes > 2 ? Math.max(baseWidth, lanes * 3.2) : baseWidth,
        oneway: tags.oneway === "yes" || tags.junction === "roundabout",
        pts: flat(way.geometry),
        nodes: [...way.nodes],
        ...(tags.service === "parking_aisle" ? { aisle: true } : {}),
        id: way.id,
      })
    } else if (tags.building !== undefined) {
      buildings.push({ id: way.id, levels: buildingLevels(tags, more.lod2Levels?.ways.get(way.id)), pts: flat(way.geometry), ...(tags.building === "roof" ? { canopy: true } : {}) })
    } else if (tags.waterway !== undefined) {
      const width = tags.waterway === "river" ? 40 : tags.waterway === "canal" ? 12 : 3
      waterways.push({ width, pts: flat(way.geometry) })
    } else {
      const kind = areaKind(tags)
      if (kind !== null && way.geometry.length >= 3) areas.push({ kind, pts: flat(way.geometry) })
    }
  }

  const pois: Array<Poi> = []
  const signals: Array<Signal> = []
  const crossings: Array<Crossing> = []
  const props: Array<Prop> = []
  const districts: Array<District> = []
  /** Town signs by name: a place whose node lies outside the box (Gelting) is put between its signs. */
  const signs = new Map<string, Array<LatLon>>()
  for (const place of places) {
    if (place.tags.traffic_sign === "city_limit" && place.tags.name !== undefined) {
      signs.set(place.tags.name, [...(signs.get(place.tags.name) ?? []), place])
      continue
    }
    if (!inside(place)) continue
    const [px, py] = projection.toMeters(place)
    const x = round(px)
    const y = round(py)
    if (place.tags.highway === "traffic_signals") {
      const d = place.tags["traffic_signals:direction"]
      signals.push({ node: place.id, x, y, direction: d === "forward" || d === "backward" ? d : "both" })
      continue
    }
    const { tags } = place
    if (tags.highway === "crossing") {
      if (tags.crossing === "zebra" || tags.crossing === "traffic_signals" || tags.crossing === "marked" || tags.crossing_ref === "zebra")
        crossings.push({ node: place.id, x, y, signals: tags.crossing === "traffic_signals" })
      continue
    }
    if (tags.highway === "bus_stop") {
      props.push({ kind: "bus_stop", x, y, node: place.id, ...(tags.shelter === "no" ? { shelter: false } : {}) })
      continue
    }
    if (tags.amenity === "recycling") {
      const p = furnitureProp(tags, x, y)
      if (p !== null) props.push(p)
      continue
    }
    if (tags.place !== undefined) {
      if (tags.name !== undefined) districts.push({ name: tags.name, x, y })
      continue
    }
    // Only churches: a prayer room in an industrial estate is no save point.
    if (tags.amenity === "place_of_worship" && tags.religion !== "christian") continue
    const kind = poiKind(place.tags)
    const name = placeName(place)
    if (kind !== null && name !== undefined) pois.push({ name, kind, x, y })
  }

  // The newer sources, each after the one before so older ids stay: a place already on the map stays one POI (addPoi).
  const addPlaces = (batch: ReadonlyArray<OsmPlace>) => {
    for (const place of batch) {
      if (!inside(place)) continue
      const kind = poiKind(place.tags)
      const name = placeName(place)
      if (kind === null || name === undefined) continue
      const [x, y] = projection.toMeters(place).map(round)
      addPoi(pois, { name, kind, x: x ?? 0, y: y ?? 0 })
    }
  }
  const addExtras = (batch: ReadonlyArray<ExtraPoi>) => {
    for (const extra of batch) {
      if (!inside(extra)) continue
      const [x, y] = projection.toMeters(extra).map(round)
      addPoi(pois, { name: extra.name, kind: extra.kind, x: x ?? 0, y: y ?? 0 })
    }
  }
  // Sports venues came with the second query but are a kind of the next step: they join its batch.
  const isVenue = (place: OsmPlace) => poiKind(place.tags) === "sport"
  addPlaces((more.places ?? []).filter((p) => !isVenue(p)))
  addExtras(more.extraPois ?? [])
  addPlaces([...(more.places ?? []).filter(isVenue), ...(more.next?.places ?? [])])
  addExtras(more.next?.extraPois ?? [])
  const wayBuildings = new Set(buildings.map((b) => b.id))
  for (const rel of relationBuildings(more.buildingRelations ?? [], wayBuildings, bbox, more.lod2Levels?.relations)) if (rel.status === "new") buildings.push(...rel.buildings)

  for (const [name, at] of signs) {
    if (districts.some((d) => d.name === name) || at.length < 2) continue
    const [px, py] = projection.toMeters({ lat: at.reduce((s, p) => s + p.lat, 0) / at.length, lon: at.reduce((s, p) => s + p.lon, 0) / at.length })
    if (px > -500 && py > 0 && py < projection.height) districts.push({ name, x: round(Math.max(0, px)), y: round(py) })
  }

  // Leisure areas: their surface says paving, else the photo gives their colour; a track way without area=yes is lanes.
  const tint = (kind: AreaKind, tags: Readonly<Record<string, string>>, id: number, pts: ReadonlyArray<number>, holes: ReadonlyArray<ReadonlyArray<number>>) => {
    const photo = kind === "pitch" || PAVED_SURFACES.has(tags.surface ?? "") ? null : (more.groundTint?.(id, pts, holes) ?? null)
    return photo === null ? {} : { tint: photo }
  }
  for (const way of more.leisureAreas?.ways ?? []) {
    const kind = leisureKind(way.tags)
    if (kind === null || !way.geometry.some(inside)) continue
    const pts = flat(way.geometry)
    if (kind === "track" && way.tags.area !== "yes") {
      const width = Number.parseFloat(way.tags.width ?? "")
      if (way.geometry.length >= 2) areas.push({ kind, pts, width: Number.isFinite(width) && width > 0 ? width : LANE_M, ...tint(kind, way.tags, way.id, pts, []) })
    } else if (way.geometry.length >= 3) areas.push({ kind, pts, ...tint(kind, way.tags, way.id, pts, []) })
  }
  for (const rel of more.leisureAreas?.relations ?? []) {
    const kind = leisureKind(rel.tags)
    if (kind === null || rel.tags.type !== "multipolygon") continue
    const members = (role: string) => rel.members.flatMap((m) => (m.type === "way" && m.role === role && m.geometry !== undefined ? [m.geometry] : []))
    const inners = joinRings(members("inner")).map(flat)
    // The outer rings only: what lies in a ring (a stadium's pitch) is an area of its own and paints on top.
    for (const ring of joinRings(members("outer")).filter((r) => r.some(inside))) {
      const pts = flat(ring)
      areas.push({ kind, pts, ...tint(kind, rel.tags, rel.id, pts, inners.filter((h) => pointInPolygon(h[0] ?? 0, h[1] ?? 0, pts))) })
    }
  }

  // Big areas first so small ones (ponds, parks) paint on top.
  areas.sort((a, b) => polygonArea(b.pts) - polygonArea(a.pts))

  // A platform of a bus line that OSM maps without a highway=bus_stop node gets its shelter too.
  const buses = buildBusLines(routes, roads, bbox)
  for (const stop of buses.flatMap((l) => l.runs.flatMap((r) => r.stops))) {
    if (!props.some((p) => p.kind === "bus_stop" && Math.hypot(p.x - stop.x, p.y - stop.y) < 20)) props.push({ kind: "bus_stop", x: stop.x, y: stop.y })
  }
  // Where each piece stands on the ground is worked out against the buildings and paths at load (world/furniture.ts).
  for (const place of more.furniture ?? []) {
    if (!inside(place)) continue
    const [x, y] = projection.toMeters(place).map(round)
    const p = furnitureProp(place.tags, x ?? 0, y ?? 0)
    if (p !== null) props.push(p)
  }

  return {
    width: round(projection.width),
    height: round(projection.height),
    bbox,
    roads,
    buildings,
    areas,
    waterways,
    pois,
    signals,
    crossings,
    props,
    districts,
    covered: [],
    buses,
  }
}

/** Unsigned shoelace area of a flat polygon. */
export const polygonArea = (pts: ReadonlyArray<number>): number => {
  let sum = 0
  const n = pts.length / 2
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    sum += (pts[i * 2] ?? 0) * (pts[j * 2 + 1] ?? 0) - (pts[j * 2] ?? 0) * (pts[i * 2 + 1] ?? 0)
  }
  return Math.abs(sum) / 2
}
