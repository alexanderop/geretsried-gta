import type { Area, AreaKind, Building, GameMap, Road, RoadKind, Waterway } from "./types.ts"
import { makeProjection, type Bbox, type LatLon } from "./project.ts"

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

const round = (n: number) => Math.round(n * 10) / 10

/**
 * Turn raw Overpass ways into the compact map the game loads.
 * Keeps every feature that touches the bbox; the renderer clips the rest.
 */
export const buildMap = (ways: ReadonlyArray<OsmWay>, bbox: Bbox): GameMap => {
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
      })
    } else if (tags.building !== undefined) {
      const levels = Number(tags["building:levels"])
      buildings.push({ id: way.id, levels: Number.isFinite(levels) && levels > 0 ? levels : 2, pts: flat(way.geometry) })
    } else if (tags.waterway !== undefined) {
      const width = tags.waterway === "river" ? 40 : tags.waterway === "canal" ? 12 : 3
      waterways.push({ width, pts: flat(way.geometry) })
    } else {
      const kind = areaKind(tags)
      if (kind !== null && way.geometry.length >= 3) areas.push({ kind, pts: flat(way.geometry) })
    }
  }

  // Big areas first so small ones (ponds, parks) paint on top.
  areas.sort((a, b) => polygonArea(b.pts) - polygonArea(a.pts))

  return {
    width: round(projection.width),
    height: round(projection.height),
    bbox,
    roads,
    buildings,
    areas,
    waterways,
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
