import { readFileSync } from "node:fs"
import { Schema } from "effect"
import { describe, expect, it } from "vitest"
import { GameMap } from "#/map/types.ts"
import { makeWorld } from "#/world/world.ts"
import { pointInPolygon } from "#/world/geometry.ts"
import { ISLAND_M, PUMP_HP, hurtPump, nearestOnIsland, planStations, pumpsOf } from "./stations.ts"

const map = Schema.decodeUnknownSync(GameMap)(JSON.parse(readFileSync("public/geretsried.map.json", "utf8")))
const world = makeWorld(map)
const stations = planStations(world)

describe("petrol stations", () => {
  it("stand at every fuel place in town, two of them under the canopies OSM maps", () => {
    expect(stations.length).toBe(map.pois.filter((p) => p.kind === "fuel").length)
    expect(stations.filter((s) => s.mapped).length).toBeGreaterThanOrEqual(2)
  })

  it("hold their canopies up on pillars under the roof, and nothing solid underneath", () => {
    for (const s of stations) {
      expect(s.pillars.length).toBeGreaterThanOrEqual(3)
      for (const p of s.pillars) expect(pointInPolygon(p.x, p.y, s.canopy)).toBe(true)
      // A car drives under the canopy: its middle is free.
      for (const i of s.islands) expect(world.isSolid(i.x, i.y)).toBe(false)
    }
  })

  it("put pump islands under the canopy, a car's width apart", () => {
    for (const s of stations) {
      expect(s.islands.length).toBeGreaterThanOrEqual(1)
      for (const i of s.islands) expect(pointInPolygon(i.x, i.y, s.canopy)).toBe(true)
      const gaps = s.islands.flatMap((a, i) => s.islands.slice(i + 1).map((b) => Math.hypot(a.x - b.x, a.y - b.y)))
      expect(Math.min(Infinity, ...gaps)).toBeGreaterThan(3.5)
    }
  })

  it("lay out a canopy clear of buildings where OSM has none", () => {
    for (const s of stations.filter((o) => !o.mapped)) {
      for (let i = 0; i + 1 < s.canopy.length; i += 2) expect(world.isSolid(s.canopy[i] ?? 0, s.canopy[i + 1] ?? 0)).toBe(false)
    }
  })
})

describe("a pump island", () => {
  it("holds until it is out of hp, then goes up after its fuse", () => {
    const [pump] = pumpsOf(stations)
    if (pump === undefined) throw new Error("no pumps")
    hurtPump(pump, PUMP_HP - 1, 0.2)
    expect(pump.fuse).toBeNull()
    hurtPump(pump, 5, 0.2)
    expect(pump.fuse).toBe(0.2)
  })

  it("is bumped along its spine, not past its ends", () => {
    const p = { x: 0, y: 0, angle: 0 }
    expect(nearestOnIsland(p, 10, 3).x).toBeLessThan(ISLAND_M / 2)
    expect(nearestOnIsland(p, 1, 3)).toEqual({ x: 1, y: 0 })
  })
})
