import type { AreaKind, GameMap, Road, RoadKind } from "#/map/types.ts"
import { boxOf, distToSegmentSq, inFootprint, pointInPolygon } from "./geometry.ts"
import { Grid } from "./grid.ts"
import { planCafe, type Cafe } from "./cafe.ts"
import { dressMap, resolveGrounds, resolvePlaces, type Ground, type GroundDressing, type Place, type PlaceDressing } from "./places/dressing.ts"
import { GROUNDS, PLACES } from "./places/index.ts"
import { STREETS } from "./places/streets.ts"
import { layoutStreet, type StreetLayout, type StreetProfile } from "./street-profile.ts"

const CELL = 32

/** Roads NPC traffic drives on. */
export const DRIVABLE: ReadonlySet<RoadKind> = new Set(["primary", "secondary", "tertiary", "residential", "living_street"])

/** Ways pedestrians use: footpaths, and the sidewalks along streets. */
export const WALKABLE: ReadonlySet<RoadKind> = new Set([...DRIVABLE, "footway", "service"])

/** A place where a road's vertex meets other roads (OSM node). */
export type Junction = ReadonlyArray<{ readonly road: number; readonly vertex: number }>

/**
 * Static queries over the loaded map: building hits, which road you are on, and
 * the junction graph traffic follows.
 */
export type World = {
  readonly map: GameMap
  readonly isSolid: (x: number, y: number) => boolean
  readonly isWater: (x: number, y: number) => boolean
  /** Nearest road within `maxDist` meters, with how far you are from its center line. */
  readonly roadAt: (x: number, y: number, maxDist?: number) => { road: Road; index: number; dist: number } | null
  readonly junctions: ReadonlyMap<number, Junction>
  /** Same as `junctions`, for the walking network. */
  readonly walkJunctions: ReadonlyMap<number, Junction>
  /** The smallest land-use area under the point (areas are stored largest first). */
  readonly areaAt: (x: number, y: number) => AreaKind | null
  /** Cafe Waldmann's pavilion, laid out by cafe.ts: its walls and furniture are solid. */
  readonly cafe: Cafe | null
  /** The dressed places (places/): their footprints in `map` already have the storeys they set. */
  readonly places: ReadonlyArray<Place>
  /** The dressed areas (places/, GROUNDS): free-standing equipment, never solid. */
  readonly grounds: ReadonlyArray<Ground>
  /** The street profiles (places/streets.ts) laid out on the map: their parked cars and bollards are solid. */
  readonly streets: ReadonlyArray<StreetLayout>
}

/** The world of `osm` with the place dressings applied (the registries unless given). */
export const makeWorld = (
  osm: GameMap,
  dressings: ReadonlyArray<PlaceDressing> = PLACES,
  profiles: ReadonlyArray<StreetProfile> = STREETS,
  grounds: ReadonlyArray<GroundDressing> = GROUNDS,
): World => {
  const map = dressMap(osm, dressings)
  // Buildings are solid: nothing drives or walks through them. Canopies (petrol stations) stand on pillars: you drive under them.
  const cafe = planCafe(map)
  // A courtyard (a building's `holes`) is open ground.
  const solids: ReadonlyArray<{ readonly pts: ReadonlyArray<number>; readonly holes?: ReadonlyArray<ReadonlyArray<number>> }> = [...map.buildings, ...(cafe?.solids ?? []).map((pts) => ({ pts }))]
  const buildingGrid = new Grid(map.width, map.height, CELL)
  const buildingBoxes = solids.map(({ pts }, i) => {
    const box = boxOf(pts)
    if (map.buildings[i]?.canopy !== true) buildingGrid.insert(i, box)
    return box
  })

  const roadGrid = new Grid(map.width, map.height, CELL)
  map.roads.forEach((r, i) => roadGrid.insert(i, boxOf(r.pts, r.width)))

  const water = map.areas.filter((a) => a.kind === "water")
  const waterGrid = new Grid(map.width, map.height, CELL)
  water.forEach((a, i) => waterGrid.insert(i, boxOf(a.pts)))
  const riverGrid = new Grid(map.width, map.height, CELL)
  map.waterways.forEach((w, i) => riverGrid.insert(i, boxOf(w.pts, w.width)))

  const areaGrid = new Grid(map.width, map.height, CELL)
  map.areas.forEach((a, i) => areaGrid.insert(i, boxOf(a.pts)))
  const areaAt = (x: number, y: number) => {
    let best = -1
    for (const i of areaGrid.at(x, y)) {
      const a = map.areas[i]
      // A line area (track lanes) is no polygon to stand in.
      if (i > best && a !== undefined && a.width === undefined && pointInPolygon(x, y, a.pts)) best = i
    }
    return map.areas[best]?.kind ?? null
  }

  const inBuilding = (x: number, y: number) => {
    for (const i of buildingGrid.at(x, y)) {
      const box = buildingBoxes[i]
      const solid = solids[i]
      if (box === undefined || solid === undefined) continue
      if (x < box.minX || x > box.maxX || y < box.minY || y > box.maxY) continue
      if (inFootprint(x, y, solid)) return true
    }
    return false
  }

  // Street profiles: laid out against the buildings alone; their parked cars and bollards then stand in the way too.
  const streets = profiles.flatMap((p) => layoutStreet(map, p, { isBuilding: inBuilding }) ?? [])
  const furniture = streets.flatMap((s) => s.solids)
  const furnitureGrid = new Grid(map.width, map.height, CELL)
  const furnitureBoxes = furniture.map((pts, i) => {
    const box = boxOf(pts)
    furnitureGrid.insert(i, box)
    return box
  })
  const isSolid = (x: number, y: number) => {
    if (inBuilding(x, y)) return true
    for (const i of furnitureGrid.at(x, y)) {
      const box = furnitureBoxes[i]
      const pts = furniture[i]
      if (box === undefined || pts === undefined) continue
      if (x < box.minX || x > box.maxX || y < box.minY || y > box.maxY) continue
      if (pointInPolygon(x, y, pts)) return true
    }
    return false
  }

  const isWater = (x: number, y: number) => {
    for (const i of waterGrid.at(x, y)) {
      const a = water[i]
      if (a !== undefined && pointInPolygon(x, y, a.pts)) return true
    }
    for (const i of riverGrid.at(x, y)) {
      const w = map.waterways[i]
      if (w !== undefined && nearestOnPolyline(x, y, w.pts) < (w.width / 2) ** 2) return true
    }
    return false
  }

  const roadAt = (x: number, y: number, maxDist = 12) => {
    let best: { road: Road; index: number; dist: number } | null = null
    for (const i of roadGrid.at(x, y)) {
      const road = map.roads[i]
      if (road === undefined) continue
      const dist = Math.sqrt(nearestOnPolyline(x, y, road.pts)) - road.width / 2
      if (dist > maxDist) continue
      // Prefer real streets over footpaths drawn on top of them.
      const score = dist + (road.kind === "footway" || road.kind === "track" ? 3 : 0)
      const bestScore = best === null ? Infinity : best.dist + (best.road.kind === "footway" || best.road.kind === "track" ? 3 : 0)
      if (score < bestScore) best = { road, index: i, dist }
    }
    return best
  }

  const graph = (kinds: ReadonlySet<RoadKind>) => {
    const out = new Map<number, Array<{ road: number; vertex: number }>>()
    map.roads.forEach((road, ri) => {
      if (!kinds.has(road.kind)) return
      road.nodes.forEach((node, vi) => {
        const list = out.get(node) ?? []
        list.push({ road: ri, vertex: vi })
        out.set(node, list)
      })
    })
    return out
  }

  return { map, isSolid, isWater, roadAt, junctions: graph(DRIVABLE), walkJunctions: graph(WALKABLE), areaAt, cafe, places: resolvePlaces(map, dressings), grounds: resolveGrounds(map, grounds), streets }
}

const nearestOnPolyline = (x: number, y: number, pts: ReadonlyArray<number>): number => {
  let best = Infinity
  for (let i = 0; i + 3 < pts.length; i += 2) {
    const d = distToSegmentSq(x, y, pts[i] ?? 0, pts[i + 1] ?? 0, pts[i + 2] ?? 0, pts[i + 3] ?? 0)
    if (d < best) best = d
  }
  return best
}
