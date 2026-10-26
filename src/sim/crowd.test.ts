import { readFileSync } from "node:fs"
import { Schema } from "effect"
import { describe, expect, it } from "vitest"
import { GameMap } from "#/map/types.ts"
import { makeWorld } from "#/world/world.ts"
import { findSpot } from "#/world/teleport.ts"
import { DT, FOOT_VIEW, crowdTarget, fillCrowd, newGame, step, type Game, type Input } from "./game.ts"

const map = Schema.decodeUnknownSync(GameMap)(JSON.parse(readFileSync("public/geretsried.map.json", "utf8")))
const world = makeWorld(map)
const idle: Input = { up: false, down: false, left: false, right: false, handbrake: false, sprint: false, use: false, attack: false, cycle: 0 }
const run = (game: Game, seconds: number) => {
  for (let t = 0; t < seconds / DT; t++) step(world, game, idle)
}
const at = (name: string, seed = 5) => {
  const game = newGame(world, seed)
  const spot = findSpot(world, name)
  if (spot === null) throw new Error(`no spot ${name}`)
  Object.assign(game.player, { x: spot.x, y: spot.y })
  return game
}
/** On the walking view's 16:10 screen round the player. */
const inView = (game: Game, o: { readonly x: number; readonly y: number }) => Math.abs(o.x - game.player.x) < 20 && Math.abs(o.y - game.player.y) < 12.5
const dist = (game: Game, o: { readonly x: number; readonly y: number }) => Math.hypot(o.x - game.player.x, o.y - game.player.y)

describe("the crowd round the camera (GTA 2's density)", () => {
  it("has people and moving cars on every screen of a shop street", () => {
    let samples = 0
    let crowded = 0
    let traffic = 0
    for (const name of ["edeka", "kaufland", "sparkasse"]) {
      const game = at(name)
      for (let s = 1; s <= 20; s++) {
        run(game, 1)
        if (s < 3) continue
        samples++
        if (game.walkers.filter((w) => !w.dead && inView(game, w)).length >= 8) crowded++
        if (game.npcs.filter((n) => n.speed > 0.5 && inView(game, n)).length >= 3) traffic++
      }
    }
    expect(crowded / samples).toBeGreaterThan(0.9)
    expect(traffic / samples).toBeGreaterThan(0.65)
  }, 30_000)

  it("brings new people and cars in just out of sight, never on screen", () => {
    const game = at("edeka")
    run(game, 3)
    const before = new Set([...game.walkers, ...game.npcs])
    for (let k = 0; k < 20; k++) {
      game.walkers = game.walkers.filter((w) => !inView(game, w))
      fillCrowd(world, game)
    }
    const fresh = [...game.walkers, ...game.npcs].filter((o) => !before.has(o))
    expect(fresh.length).toBeGreaterThan(10)
    for (const o of fresh) {
      expect(dist(game, o)).toBeGreaterThan(FOOT_VIEW)
      expect(dist(game, o)).toBeLessThan(FOOT_VIEW * 2.1)
    }
  })

  it("lets go of what fell far behind or walked out of sight, and fills the circle at once after a jump across town", () => {
    const game = at("edeka")
    run(game, 3)
    // (A car parking or pulling out finishes that first.)
    const old = new Set([...game.walkers, ...game.npcs.filter((n) => n.bus === undefined && n.mode.kind === "driving")])
    const far = findSpot(world, "rathaus")
    if (far === null) throw new Error("no Rathaus")
    Object.assign(game.player, { x: far.x, y: far.y })
    fillCrowd(world, game)
    expect([...game.walkers, ...game.npcs].some((o) => old.has(o))).toBe(false)
    expect(game.walkers.filter((w) => inView(game, w)).length).toBeGreaterThan(0)
    expect(game.walkers.length).toBeGreaterThan(10)
  })

  it("is bigger when the car camera opens up, within the town-wide caps, and thinner in the Wohngebiete", () => {
    const shop = at("edeka")
    const foot = crowdTarget(world, shop)
    shop.view = FOOT_VIEW * 2.24
    const fast = crowdTarget(world, shop)
    expect(fast.walkers).toBeGreaterThan(foot.walkers * 2)
    expect(fast.cars).toBeGreaterThan(foot.cars * 2)
    shop.view = FOOT_VIEW * 50
    expect(crowdTarget(world, shop)).toEqual({ walkers: 120, cars: 70 })
    // A residential street: the first one with no POI within 100 m.
    const street = map.roads.find((r) => r.kind === "residential" && map.pois.every((p) => Math.hypot(p.x - (r.pts[0] ?? 0), p.y - (r.pts[1] ?? 0)) > 100))
    const quiet = newGame(world, 5)
    Object.assign(quiet.player, { x: street?.pts[0] ?? 0, y: street?.pts[1] ?? 0 })
    expect(crowdTarget(world, quiet).walkers).toBeLessThan(foot.walkers)
  })
})
