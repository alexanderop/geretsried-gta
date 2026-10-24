import { describe, expect, it } from "vitest"
import type { GameMap, Road } from "#/map/types.ts"
import { makeRoadGraph, nearestNode, route } from "./route.ts"

const road = (nodes: Array<number>, pts: Array<number>, oneway = false): Road => ({ kind: "residential", name: "", width: 6, oneway, pts, nodes })

// A square block: 1 (0,0) – 2 (100,0) – 3 (100,100) – 4 (0,100), plus a long detour 1 – 5 – 3.
const map: GameMap = {
  width: 400,
  height: 400,
  bbox: { south: 0, west: 0, north: 1, east: 1 },
  roads: [road([1, 2, 3], [0, 0, 100, 0, 100, 100], true), road([3, 4, 1], [100, 100, 0, 100, 0, 0]), road([1, 5, 3], [0, 0, 300, 300, 100, 100])],
  buildings: [],
  areas: [],
  waterways: [],
  pois: [],
  signals: [],
  covered: [],
}

describe("street routes", () => {
  const g = makeRoadGraph(map)

  it("finds the nearest street node", () => {
    expect(g.xs[nearestNode(g, 95, 3)]).toBe(100)
    expect(nearestNode(g, 390, 10, 20)).toBe(-1)
  })

  it("takes the shortest way round the block, against one-way streets too", () => {
    expect(route(g, 100, 100, 0, 0)).toEqual([100, 100, 100, 0, 0, 0])
    expect(route(g, 0, 0, 100, 100)).toHaveLength(6)
  })
})
