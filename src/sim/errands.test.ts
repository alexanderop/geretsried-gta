import { readFileSync } from "node:fs"
import { Schema } from "effect"
import { describe, expect, it } from "vitest"
import { GameMap } from "#/map/types.ts"
import { makeWorld } from "#/world/world.ts"
import { findSpot } from "#/world/teleport.ts"
import { DT, newGame, step, type Game, type Input } from "./game.ts"
import { KINDS, spawnWalker, stepWalker, type Walker } from "./pedestrians.ts"
import { shopLeaver, stepErrand } from "./errands.ts"

const map = Schema.decodeUnknownSync(GameMap)(JSON.parse(readFileSync("public/geretsried.map.json", "utf8")))
const world = makeWorld(map)
const idle: Input = { up: false, down: false, left: false, right: false, handbrake: false, sprint: false, use: false, attack: false, cycle: 0 }
const at = (name: string, seed = 5) => {
  const game = newGame(world, seed)
  const spot = findSpot(world, name)
  if (spot === null) throw new Error(`no spot ${name}`)
  Object.assign(game.player, { x: spot.x, y: spot.y })
  return game
}
const seeded = (seed: number) => {
  let s = seed
  return () => ((s = (s * 1103515245 + 12345) % 2 ** 31) / 2 ** 31)
}
const edeka = findSpot(world, "edeka")

describe("passers-by who differ and do things (errands.ts)", () => {
  it("are seniors, joggers, kids and grown-ups, each at their own kind of pace", () => {
    const random = seeded(3)
    const people: Array<Walker> = []
    for (let id = 0; people.length < 300 && id < 2000; id++) {
      const w = spawnWalker(world, id, edeka?.x ?? 0, edeka?.y ?? 0, 0, 80, random)
      if (w !== null) people.push(w)
    }
    const kinds = new Set(people.map((w) => w.kind))
    expect(kinds).toEqual(new Set(["adult", "senior", "jogger", "kid"]))
    for (const w of people) {
      expect(w.pace).toBeGreaterThanOrEqual(KINDS[w.kind].pace[0])
      expect(w.pace).toBeLessThanOrEqual(KINDS[w.kind].pace[1])
    }
    expect(new Set(people.map((w) => w.shade)).size).toBeGreaterThan(3)
  })

  it("stands still while stopped, turned the way they look, and walks on after", () => {
    const random = seeded(7)
    const w = spawnWalker(world, 1, edeka?.x ?? 0, edeka?.y ?? 0, 0, 40, random)
    expect(w).not.toBeNull()
    if (w === null) return
    w.stop = { left: 2, face: 1 }
    const [x, y] = [w.x, w.y]
    for (let t = 0; t < 1.5 / DT; t++) stepWalker(world, w, null, DT, random)
    expect(Math.hypot(w.x - x, w.y - y)).toBeLessThan(1e-6)
    expect(Math.cos(w.angle - 1)).toBeGreaterThan(0.95)
    for (let t = 0; t < 3 / DT; t++) stepWalker(world, w, null, DT, random)
    expect(w.stop).toBeNull()
    expect(Math.hypot(w.x - x, w.y - y)).toBeGreaterThan(1)
  })

  it("on a shop street, within two minutes some look in windows, some wait or chat, and some go into a shop and are gone", () => {
    const game: Game = at("edeka")
    const stopped = new Set<number>()
    const wentIn = new Set<number>()
    for (let t = 0; t < 120 / DT; t++) {
      step(world, game, idle)
      for (const w of game.walkers) {
        if (w.stop !== null) stopped.add(w.id)
        if (w.errand?.phase === "in") wentIn.add(w.id)
      }
    }
    expect(stopped.size).toBeGreaterThan(5)
    expect(wentIn.size).toBeGreaterThan(2)
    // Those who went in are gone, not stuck at the wall.
    const still = game.walkers.filter((w) => w.errand?.phase === "in")
    expect(still.length).toBeLessThan(wentIn.size)
    // Nobody is ever drawn inside a wall.
    expect(game.walkers.filter((w) => !w.dead && world.isSolid(w.x, w.y))).toEqual([])
  }, 60_000)

  it("steps out of a shop to the sidewalk and walks on along it", () => {
    const random = seeded(11)
    let w: Walker | null = null
    for (let id = 0; w === null && id < 200; id++) w = shopLeaver(world, id, edeka?.x ?? 0, edeka?.y ?? 0, 0, 60, random)
    expect(w).not.toBeNull()
    if (w === null) return
    expect(w.errand?.phase).toBe("out")
    for (let t = 0; t < 15 / DT && w.errand !== undefined; t++) stepErrand(world, w, null, DT)
    expect(w.errand).toBeUndefined()
    const [x, y] = [w.x, w.y]
    for (let t = 0; t < 2 / DT; t++) stepWalker(world, w, null, DT, random)
    expect(Math.hypot(w.x - x, w.y - y)).toBeGreaterThan(1)
    expect(world.isSolid(w.x, w.y)).toBe(false)
  })
})
