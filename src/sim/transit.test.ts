import { readFileSync } from "node:fs"
import { Schema } from "effect"
import { describe, expect, it } from "vitest"
import { GameMap } from "#/map/types.ts"
import { makeWorld } from "#/world/world.ts"
import { DT, busNear, newGame, step, type Game, type Input } from "./game.ts"
import { DWELL_S, nextStop } from "./transit.ts"
import { spawnBus, type Npc } from "./traffic.ts"

const map = Schema.decodeUnknownSync(GameMap)(JSON.parse(readFileSync("public/geretsried.map.json", "utf8")))
const world = makeWorld(map)
const idle: Input = { up: false, down: false, left: false, right: false, handbrake: false, sprint: false, use: false, attack: false, cycle: 0 }
const pressF = (game: Game) => step(world, game, { ...idle, use: true })
/** Step until `done` holds (true) or `seconds` run out (false). */
const until = (game: Game, seconds: number, done: () => boolean) => {
  for (let t = 0; t < seconds / DT; t++) {
    if (done()) return true
    step(world, game, idle)
  }
  return done()
}
const busOf = (game: Game, ref: string) => {
  const bus = game.npcs.find((n) => n.bus?.line.ref === ref)
  if (bus === undefined) throw new Error(`no bus on line ${ref}`)
  return bus
}
/** The first bus of line `ref` to stand at a stop with more than `left` seconds to go there. */
const standingBus = (game: Game, ref: string, left = 1) => {
  const standing = () => game.npcs.find((n) => n.bus?.line.ref === ref && n.bus.dwell > left)
  until(game, 240, () => standing() !== undefined)
  const bus = standing()
  if (bus === undefined) throw new Error(`no bus of line ${ref} stopped`)
  return bus
}
/** Stand on the bus's door side (its right), out of the way of everything else. */
const standBeside = (game: Game, bus: Npc) => {
  const side = bus.angle + Math.PI / 2
  Object.assign(game.player, { x: bus.x + Math.cos(side) * 2.4, y: bus.y + Math.sin(side) * 2.4 })
}

describe("buses", { timeout: 60_000 }, () => {
  it("drive every line from the start, a few per line, 370 among them", () => {
    const game = newGame(world, 5)
    const buses = game.npcs.filter((n) => n.bus !== undefined)
    expect(buses.length).toBe(game.transit.reduce((n, l) => n + l.buses, 0))
    expect(buses.filter((n) => n.bus?.line.ref === "370").length).toBeGreaterThanOrEqual(2)
  })

  it("stand at their stops for a while, then drive on to the next", () => {
    const game = newGame(world, 5)
    const bus = standingBus(game, "370", 0)
    const trip = bus.bus
    expect(bus.speed).toBeLessThan(1.2)
    const halt = trip?.halt
    expect(until(game, DWELL_S + 1, () => trip?.halt !== halt)).toBe(true)
    expect(until(game, 20, () => bus.speed > 3)).toBe(true)
  })
})

describe("riding a bus", { timeout: 60_000 }, () => {
  it("F next to a standing bus gets you in; you go where it goes and cannot steer", () => {
    const game = newGame(world, 5)
    const bus = standingBus(game, "370")
    standBeside(game, bus)
    expect(busNear(game)).toBe(bus)
    pressF(game)
    expect(game.player.ride?.bus).toBe(bus)
    expect(until(game, 30, () => bus.speed > 5)).toBe(true)
    for (let t = 0; t < 1 / DT; t++) step(world, game, { ...idle, up: true, left: true })
    expect(game.player.car).toBeNull()
    expect(Math.hypot(game.player.x - bus.x, game.player.y - bus.y)).toBeLessThan(0.01)
  })

  it("F while it drives gets you off at the next stop, on the sidewalk side", () => {
    const game = newGame(world, 5)
    const bus = standingBus(game, "370")
    const trip = bus.bus
    standBeside(game, bus)
    pressF(game)
    expect(until(game, 30, () => bus.speed > 5)).toBe(true)
    const next = trip === undefined ? "" : nextStop(trip)
    pressF(game)
    expect(game.player.ride?.getOff).toBe(true)
    expect(game.player.ride).not.toBeNull()
    expect(until(game, 300, () => game.player.ride === null)).toBe(true)
    expect(trip === undefined ? "" : nextStop(trip)).toBe(next)
    expect(world.isSolid(game.player.x, game.player.y)).toBe(false)
    expect(Math.hypot(game.player.x - bus.x, game.player.y - bus.y)).toBeGreaterThan(2)
  })

  it("F while it stands gets you off at once", () => {
    const game = newGame(world, 5)
    const bus = standingBus(game, "370", 3)
    standBeside(game, bus)
    pressF(game)
    expect(game.player.ride).not.toBeNull()
    pressF(game)
    expect(game.player.ride).toBeNull()
  })

  it("boarding at the end of the line rides on into the way back", () => {
    const game = newGame(world, 5)
    const line = game.transit.find((l) => l.ref === "370")
    const [there, back] = line?.runs ?? []
    if (line === undefined || there === undefined || back === undefined) throw new Error("370 has no two runs")
    // A bus 150 m before the end of the way there, nothing else of its line about.
    game.npcs = game.npcs.filter((n) => n.bus?.line !== line)
    const bus = spawnBus(world, game.nextId++, line, (there.length - 150) / (there.length + back.length))
    game.npcs.push(bus)
    const trip = bus.bus
    const last = there.halts.length - 1
    expect(until(game, 120, () => trip?.run === 0 && trip.halt === last && trip.dwell > 1)).toBe(true)
    standBeside(game, bus)
    pressF(game)
    expect(until(game, 30, () => trip?.run === 1)).toBe(true)
    expect(game.player.ride?.bus).toBe(bus)
  })

  it("a moving bus does not take you", () => {
    const game = newGame(world, 5)
    const bus = busOf(game, "370")
    expect(until(game, 60, () => bus.speed > 5)).toBe(true)
    standBeside(game, bus)
    pressF(game)
    expect(game.player.ride).toBeNull()
    expect(game.player.car).toBeNull()
  })
})
