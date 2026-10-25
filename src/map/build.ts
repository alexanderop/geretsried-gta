import type { Area, AreaKind, Building, Crossing, District, GameMap, Poi, PoiKind, Prop, Road, RoadKind, Signal, Waterway } from "./types.ts"
import { makeProjection, type Bbox, type LatLon } from "./project.ts"
import { buildBusLines, type OsmElement } from "./bus.ts"

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

const poiKind = (tags: Readonly<Record<string, string>>): PoiKind | null => {
  const amenity = tags.amenity === undefined ? undefined : POI_KINDS[tags.amenity]
  if (amenity !== undefined) return amenity
  if (tags.shop === undefined || tags.shop === "vacant") return null
  return POI_KINDS[tags.shop] ?? "shop"
}

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

export const buildingLevels = (tags: Readonly<Record<string, string>>): number => {
  const levels = Number(tags["building:levels"])
  if (Number.isFinite(levels) && levels > 0) return levels
  return TYPICAL_LEVELS[tags.building ?? ""] ?? 2
}

const round = (n: number) => Math.round(n * 10) / 10

/**
 * Turn raw Overpass ways into the compact map the game loads.
 * Keeps every feature that touches the bbox; the renderer clips the rest.
 */
export const buildMap = (ways: ReadonlyArray<OsmWay>, places: ReadonlyArray<OsmPlace>, bbox: Bbox, routes: ReadonlyArray<OsmElement> = []): GameMap => {
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
      })
    } else if (tags.building !== undefined) {
      buildings.push({ id: way.id, levels: buildingLevels(tags), pts: flat(way.geometry), ...(tags.building === "roof" ? { canopy: true } : {}) })
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
      props.push({ kind: "bus_stop", x, y })
      continue
    }
    if (tags.amenity === "recycling") {
      props.push({ kind: "glass", x, y })
      continue
    }
    if (tags.place !== undefined) {
      if (tags.name !== undefined) districts.push({ name: tags.name, x, y })
      continue
    }
    // Only churches: a prayer room in an industrial estate is no save point.
    if (tags.amenity === "place_of_worship" && tags.religion !== "christian") continue
    const kind = poiKind(place.tags)
    const name = place.tags.brand ?? place.tags.name
    if (kind !== null && name !== undefined) pois.push({ name, kind, x, y })
  }

  for (const [name, at] of signs) {
    if (districts.some((d) => d.name === name) || at.length < 2) continue
    const [px, py] = projection.toMeters({ lat: at.reduce((s, p) => s + p.lat, 0) / at.length, lon: at.reduce((s, p) => s + p.lon, 0) / at.length })
    if (px > -500 && py > 0 && py < projection.height) districts.push({ name, x: round(Math.max(0, px)), y: round(py) })
  }

  // Big areas first so small ones (ponds, parks) paint on top.
  areas.sort((a, b) => polygonArea(b.pts) - polygonArea(a.pts))

  // A platform of a bus line that OSM maps without a highway=bus_stop node gets its shelter too.
  const buses = buildBusLines(routes, roads, bbox)
  for (const stop of buses.flatMap((l) => l.runs.flatMap((r) => r.stops))) {
    if (!props.some((p) => p.kind === "bus_stop" && Math.hypot(p.x - stop.x, p.y - stop.y) < 20)) props.push({ kind: "bus_stop", x: stop.x, y: stop.y })
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
