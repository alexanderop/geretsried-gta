import { readFileSync } from "node:fs"
import { Schema } from "effect"
import { describe, expect, it } from "vitest"
import { GameMap } from "#/map/types.ts"
import { makeWorld } from "#/world/world.ts"
import { DT, newGame, step, type Game, type Input } from "./game.ts"
import { SKID_S, fadeSkids, isSkidding, markSkids, newSkids } from "./skids.ts"

const map = Schema.decodeUnknownSync(GameMap)(JSON.parse(readFileSync("public/geretsried.map.json", "utf8")))
const world = makeWorld(map)
const idle: Input = { up: false, down: false, left: false, right: false, handbrake: false, sprint: false, use: false, attack: false, cycle: 0 }
const run = (game: Game, input: Input, seconds: number) => {
  for (let t = 0; t < seconds / DT; t++) step(world, game, input)
}

describe("tyre marks", () => {
  it("are left by a slide, a locked handbrake or hard braking at speed, not by driving straight or creeping", () => {
    expect(isSkidding(15, 0.5, false)).toBe(true)
    expect(isSkidding(15, 0, true)).toBe(true)
    expect(isSkidding(15, 0.05, false)).toBe(false)
    expect(isSkidding(3, 0.8, true)).toBe(false)
  })

  it("draw two lines from the rear wheels while it lasts and break off when it stops", () => {
    const skids = newSkids()
    const car = { x: 0, y: 0, angle: 0, vx: 10, vy: 0, model: 0, vitals: { hp: 100, armour: 0, lastHit: null, fire: 0 } }
    for (let i = 0; i < 20; i++) {
      car.x += 0.5
      markSkids(skids, car, true, i * DT)
    }
    expect(skids.marks.length).toBe(2 * 19)
    // The two lines run side by side behind the car.
    const [left, right] = skids.marks
    expect(left !== undefined && right !== undefined && Math.abs(left.ay - right.ay)).toBeGreaterThan(1)
    markSkids(skids, car, false, 1)
    expect(skids.from).toBeNull()
  })

  it("stay on a handbrake turn in town and are gone after SKID_S", () => {
    const game = newGame(world, 3)
    step(world, game, { ...idle, use: true })
    run(game, { ...idle, up: true }, 2)
    run(game, { ...idle, up: true, right: true, handbrake: true }, 1)
    const laid = game.skids.marks.length
    expect(laid).toBeGreaterThan(10)
    run(game, idle, SKID_S / 2)
    expect(game.skids.marks.length).toBe(laid)
    run(game, idle, SKID_S / 2 + 1)
    expect(game.skids.marks.length).toBe(0)
  })

  it("forget the oldest first", () => {
    const skids = newSkids()
    skids.marks.push({ ax: 0, ay: 0, bx: 1, by: 0, t: 0 }, { ax: 0, ay: 0, bx: 1, by: 0, t: 20 })
    fadeSkids(skids, SKID_S + 1)
    expect(skids.marks.map((s) => s.t)).toEqual([20])
  })
})
