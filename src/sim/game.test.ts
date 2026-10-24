import { readFileSync } from "node:fs"
import { Schema } from "effect"
import { describe, expect, it } from "vitest"
import { GameMap } from "#/map/types.ts"
import { makeWorld } from "#/world/world.ts"
import { carOutline } from "./car.ts"
import { DT, newGame, step, type Input } from "./game.ts"
import { stepWalker } from "./pedestrians.ts"

const map = Schema.decodeUnknownSync(GameMap)(JSON.parse(readFileSync("public/geretsried.map.json", "utf8")))
const world = makeWorld(map)
const idle: Input = { up: false, down: false, left: false, right: false, handbrake: false, sprint: false, use: false }
const must = <T,>(value: T | null | undefined): T => {
  if (value == null) throw new Error("expected a value")
  return value
}
const run = (game: ReturnType<typeof newGame>, input: Input, seconds: number) => {
  for (let t = 0; t < seconds / DT; t++) step(world, game, input)
}

describe("Geretsried map", () => {
  it("has the town's streets and buildings", () => {
    expect(map.buildings.length).toBeGreaterThan(4000)
    expect(map.roads.some((r) => r.name === "Egerlandstraße")).toBe(true)
  })
})

describe("a new game", () => {
  it("starts on foot on Sudetenstraße, outside any building, next to a free car", () => {
    const game = newGame(world, 7)
    const { player } = game
    expect(world.isSolid(player.x, player.y)).toBe(false)
    expect(world.roadAt(player.x, player.y, 15)?.road.name).toBe("Sudetenstraße")
    expect(carOutline(must(game.parked[0])).some(([x, y]) => world.isSolid(x, y))).toBe(false)
  })

  it("lets the player take the car with F and drive off", () => {
    const game = newGame(world, 7)
    step(world, game, { ...idle, use: true })
    expect(game.player.car).not.toBeNull()
    const start = { x: game.player.x, y: game.player.y }
    run(game, { ...idle, up: true }, 3)
    expect(Math.hypot(game.player.x - start.x, game.player.y - start.y)).toBeGreaterThan(20)
  })

  it("never drives through a building, whatever you hold", () => {
    const game = newGame(world, 3)
    step(world, game, { ...idle, use: true })
    run(game, { ...idle, up: true, right: true }, 20)
    expect(carOutline(must(game.player.car)).some(([x, y]) => world.isSolid(x, y))).toBe(false)
  })

  it("fills the streets with moving traffic that stays on drivable roads", () => {
    const game = newGame(world, 11)
    const before = new Map(game.npcs.map((n) => [n.id, { x: n.x, y: n.y }]))
    run(game, idle, 10)
    expect(game.npcs.length).toBeGreaterThan(40)
    const moved = game.npcs.filter((n) => {
      const b = before.get(n.id)
      return b !== undefined && Math.hypot(n.x - b.x, n.y - b.y) > 30
    })
    expect(moved.length).toBeGreaterThan(20)
    for (const n of game.npcs) expect(world.roadAt(n.x, n.y, 3)).not.toBeNull()
  })
})

describe("pedestrians", () => {
  it("walk the sidewalks and footpaths, never inside buildings", () => {
    const game = newGame(world, 21)
    const start = new Map(game.walkers.map((w) => [w.id, { x: w.x, y: w.y }]))
    run(game, idle, 15)
    expect(game.walkers.length).toBeGreaterThan(50)
    const moved = game.walkers.filter((w) => {
      const s = start.get(w.id)
      return s !== undefined && Math.hypot(w.x - s.x, w.y - s.y) > 8
    })
    expect(moved.length).toBeGreaterThan(30)
    const inside = game.walkers.filter((w) => world.isSolid(w.x, w.y))
    expect(inside.length).toBeLessThan(game.walkers.length * 0.05)
    for (const w of game.walkers) expect(world.roadAt(w.x, w.y, 4)).not.toBeNull()
  })

  it("jump out of the way of a speeding car, or get knocked down", () => {
    const game = newGame(world, 21)
    const w = must(game.walkers[0])
    const at = (d: number) => ({ x: w.x - d * Math.cos(w.angle), y: w.y - d * Math.sin(w.angle), vx: 15 * Math.cos(w.angle), vy: 15 * Math.sin(w.angle) })
    stepWalker(world, w, at(10), DT, game.random)
    expect(w.panic).toBeGreaterThan(0)
    stepWalker(world, w, { ...at(0), x: w.x, y: w.y }, DT, game.random)
    expect(w.down).toBeGreaterThan(0)
  })
})
