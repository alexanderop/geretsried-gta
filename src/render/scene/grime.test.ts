import { readFileSync } from "node:fs"
import { Schema } from "effect"
import { describe, expect, it } from "vitest"
import { GameMap } from "#/map/types.ts"
import { makeWorld } from "#/world/world.ts"
import { grimeOf } from "./grime.ts"

const map = Schema.decodeUnknownSync(GameMap)(JSON.parse(readFileSync("public/geretsried.map.json", "utf8")))
const world = makeWorld(map)
const all = grimeOf(world)

describe("street grime", () => {
  it("stains the lanes, cracks the kerbs and wears the junctions, the same every game", () => {
    expect(all.filter((g) => g.kind === "stain").length).toBeGreaterThan(1000)
    expect(all.filter((g) => g.kind === "crack").length).toBeGreaterThan(500)
    expect(grimeOf(world)).toEqual(all)
  })

  it("lies on the ground, never under a house, and only darkens a little", () => {
    const off = all.filter((g) => world.isSolid(g.x, g.y) || world.isWater(g.x, g.y))
    expect(off).toEqual([])
    expect(Math.max(...all.map((g) => (g.kind === "stain" ? g.dark : 0)))).toBeLessThanOrEqual(110)
  })
})
