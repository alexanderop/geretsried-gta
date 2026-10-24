import type { AreaKind, GameMap, Road, RoadKind } from "#/map/types.ts"
import { boxOf, distToSegmentSq, pointInPolygon } from "./geometry.ts"
import { Grid } from "./grid.ts"

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
}

export const makeWorld = (map: GameMap): World => {
  const buildingGrid = new Grid(map.width, map.height, CELL)
  const buildingBoxes = map.buildings.map((b, i) => {
    const box = boxOf(b.pts)
    buildingGrid.insert(i, box)
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
      if (i > best && a !== undefined && pointInPolygon(x, y, a.pts)) best = i
    }
    return map.areas[best]?.kind ?? null
  }

  const isSolid = (x: number, y: number) => {
    for (const i of buildingGrid.at(x, y)) {
      const box = buildingBoxes[i]
      const b = map.buildings[i]
      if (box === undefined || b === undefined) continue
      if (x < box.minX || x > box.maxX || y < box.minY || y > box.maxY) continue
      if (pointInPolygon(x, y, b.pts)) return true
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

  return { map, isSolid, isWater, roadAt, junctions: graph(DRIVABLE), walkJunctions: graph(WALKABLE), areaAt }
}

const nearestOnPolyline = (x: number, y: number, pts: ReadonlyArray<number>): number => {
  let best = Infinity
  for (let i = 0; i + 3 < pts.length; i += 2) {
    const d = distToSegmentSq(x, y, pts[i] ?? 0, pts[i + 1] ?? 0, pts[i + 2] ?? 0, pts[i + 3] ?? 0)
    if (d < best) best = d
  }
  return best
}
