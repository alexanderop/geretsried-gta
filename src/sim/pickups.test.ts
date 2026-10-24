import { readFileSync } from "node:fs"
import { Schema } from "effect"
import { describe, expect, it } from "vitest"
import { GameMap } from "#/map/types.ts"
import { makeWorld } from "#/world/world.ts"
import { PICKUP_COUNT, RESPAWN_S, collect, isAvailable, placePickups, stepPickups, type Pickup } from "./pickups.ts"

describe("pickup respawn", () => {
  it("is taken by walking over it and comes back after a minute", () => {
    const pickups: Array<Pickup> = [{ kind: "pistol", x: 10, y: 10, respawn: 0 }]
    expect(collect(pickups, 20, 10, () => true)).toBeNull()
    expect(collect(pickups, 10.5, 10, () => true)?.kind).toBe("pistol")
    expect(collect(pickups, 10.5, 10, () => true)).toBeNull()
    stepPickups(pickups, RESPAWN_S - 1)
    expect(pickups.some(isAvailable)).toBe(false)
    stepPickups(pickups, 1)
    expect(pickups.every(isAvailable)).toBe(true)
  })

  it("stays put when it is no use to you", () => {
    const pickups: Array<Pickup> = [{ kind: "health", x: 0, y: 0, respawn: 0 }]
    expect(collect(pickups, 0, 0, () => false)).toBeNull()
    expect(isAvailable(pickups[0] ?? { kind: "health", x: 0, y: 0, respawn: 1 })).toBe(true)
  })
})

describe("pickups in Geretsried", () => {
  const map = Schema.decodeUnknownSync(GameMap)(JSON.parse(readFileSync("public/geretsried.map.json", "utf8")))
  const world = makeWorld(map)
  const start = { x: 2700, y: 2700 }
  const pickups = placePickups(world, start)

  it("are about forty, the same every game, on free ground and spread out", () => {
    expect(pickups.length).toBeGreaterThanOrEqual(PICKUP_COUNT - 5)
    expect(pickups.length).toBeLessThanOrEqual(PICKUP_COUNT)
    expect(placePickups(world, start)).toEqual(pickups)
    for (const p of pickups) expect(world.isSolid(p.x, p.y) || world.isWater(p.x, p.y)).toBe(false)
    const gaps = pickups.flatMap((a) => pickups.filter((b) => b !== a).map((b) => Math.hypot(a.x - b.x, a.y - b.y)))
    expect(Math.min(...gaps)).toBeGreaterThan(50)
  })

  it("include every kind, with a pistol nearest the start", () => {
    expect(new Set(pickups.map((p) => p.kind)).size).toBe(8)
    const nearest = pickups.toSorted((a, b) => Math.hypot(a.x - start.x, a.y - start.y) - Math.hypot(b.x - start.x, b.y - start.y))[0]
    expect(nearest?.kind).toBe("pistol")
  })
})
