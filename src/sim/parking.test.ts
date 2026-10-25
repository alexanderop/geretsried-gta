import { readFileSync } from "node:fs"
import { Schema } from "effect"
import { describe, expect, it } from "vitest"
import { GameMap } from "#/map/types.ts"
import { DRIVABLE, makeWorld } from "#/world/world.ts"
import { distToSegmentSq } from "#/world/geometry.ts"
import { carOutline } from "./car.ts"
import { CAR_HP, vitals } from "./damage.ts"
import { DT, newGame, step, type Game, type Input } from "./game.ts"
import { LANE_CLEAR, PARK_FAR, POINT_CLEAR_M, isFilled, kerbSlots, type Slot } from "./parking.ts"
import { POLICE_MODEL, BUS_MODEL } from "./vehicles.ts"

const map = Schema.decodeUnknownSync(GameMap)(JSON.parse(readFileSync("public/geretsried.map.json", "utf8")))
const world = makeWorld(map)
const slots = kerbSlots(world)
const idle: Input = { up: false, down: false, left: false, right: false, handbrake: false, sprint: false, use: false, attack: false, cycle: 0 }
const run = (game: Game, input: Input, seconds: number) => {
  for (let t = 0; t < seconds / DT; t++) step(world, game, input)
}

/** Nodes where three or more road ends of the drivable network meet. */
const junctionNodes = () => {
  const ends = new Map<number, number>()
  const at = new Map<number, readonly [number, number]>()
  for (const road of map.roads) {
    if (!DRIVABLE.has(road.kind)) continue
    road.nodes.forEach((node, i) => {
      const last = i === 0 || i === road.nodes.length - 1
      ends.set(node, (ends.get(node) ?? 0) + (last ? 1 : 2))
      at.set(node, [road.pts[i * 2] ?? 0, road.pts[i * 2 + 1] ?? 0])
    })
  }
  return [...ends].filter(([, n]) => n > 2).map(([node]) => at.get(node) ?? [Infinity, Infinity])
}

/** Every lane traffic drives (keep right by a quarter of the width; one-way streets in the middle), as segments. */
const laneSegments = () =>
  map.roads.flatMap((road) => {
    if (!DRIVABLE.has(road.kind)) return []
    const lane = road.oneway ? 0 : road.width / 4
    const out: Array<readonly [number, number, number, number]> = []
    for (let i = 0; i + 3 < road.pts.length; i += 2) {
      const ax = road.pts[i] ?? 0
      const ay = road.pts[i + 1] ?? 0
      const bx = road.pts[i + 2] ?? 0
      const by = road.pts[i + 3] ?? 0
      const len = Math.hypot(bx - ax, by - ay) || 1
      const nx = -(by - ay) / len
      const ny = (bx - ax) / len
      for (const side of road.oneway ? [0] : [1, -1]) out.push([ax + nx * lane * side, ay + ny * lane * side, bx + nx * lane * side, by + ny * lane * side])
    }
    return out
  })

const slotNear = (game: Game) => {
  const p = game.player
  return slots.filter((s) => isFilled(s) && Math.hypot(s.x - p.x, s.y - p.y) < 100)
}
const kerbKey = (g: Game) => [...g.kerb].map(([id, c]) => `${id}:${c.model}:${c.x.toFixed(2)},${c.y.toFixed(2)}`).toSorted()
const carAt = (game: Game, slot: Slot) => game.parked.find((c) => Math.hypot(c.x - slot.x, c.y - slot.y) < 0.5)

describe("kerbside slots", () => {
  it("line the town's streets", () => {
    expect(slots.length).toBeGreaterThan(5000)
  })

  it("never stand in a building, a wall or the water", () => {
    for (const s of slots) {
      const car = { x: s.x, y: s.y, angle: s.angle, vx: 0, vy: 0, model: 0, vitals: vitals(CAR_HP) }
      expect(carOutline(car).some(([x, y]) => world.isSolid(x, y) || world.isWater(x, y))).toBe(false)
    }
  })

  it("keep clear of every junction", () => {
    const nodes = junctionNodes()
    let closest = Infinity
    for (const s of slots) for (const [x, y] of nodes) if (Math.abs(x - s.x) < 20 && Math.abs(y - s.y) < 20) closest = Math.min(closest, Math.hypot(x - s.x, y - s.y))
    expect(closest).toBeGreaterThanOrEqual(POINT_CLEAR_M)
  })

  it("stand far enough from every moving lane that traffic drives past", () => {
    const lanes = laneSegments()
    let closest = Infinity
    for (const s of slots) {
      for (const [ax, ay, bx, by] of lanes) {
        if (Math.min(ax, bx) > s.x + 20 || Math.max(ax, bx) < s.x - 20 || Math.min(ay, by) > s.y + 20 || Math.max(ay, by) < s.y - 20) continue
        closest = Math.min(closest, Math.sqrt(distToSegmentSq(s.x, s.y, ax, ay, bx, by)))
      }
    }
    expect(closest).toBeGreaterThanOrEqual(LANE_CLEAR - 0.01)
  })
})

describe("kerbside parked cars", () => {
  it("stand along the streets round the start, ordinary cars only, parallel to the kerb", () => {
    const game = newGame(world, 3)
    const kerb = [...game.kerb.values()]
    expect(kerb.length).toBeGreaterThan(20)
    for (const c of kerb) {
      expect(game.parked.includes(c)).toBe(true)
      expect([POLICE_MODEL, BUS_MODEL]).not.toContain(c.model)
    }
  })

  it("are the same cars in the same places whatever the seed", () => {
    expect(kerbKey(newGame(world, 1))).toEqual(kerbKey(newGame(world, 99)))
  })

  it("leave a taken car's slot empty, and park there again once you have been away", () => {
    const game = newGame(world, 3)
    const slot = slotNear(game).find((s) => carAt(game, s) !== undefined)
    if (slot === undefined) throw new Error("expected a kerbside car near the start")
    const car = carAt(game, slot)
    game.npcs = []
    Object.assign(game.player, { x: slot.x + 2.5 * Math.sin(slot.angle), y: slot.y - 2.5 * Math.cos(slot.angle) })
    step(world, game, { ...idle, use: true })
    expect(game.player.car).toBe(car)
    // Driven off and left 40 m away.
    Object.assign(game.player.car ?? {}, { x: slot.x + 40, y: slot.y })
    step(world, game, { ...idle, use: true })
    // Out of sight of the slot, but still in range: it stays empty.
    Object.assign(game.player, { x: slot.x + 100, y: slot.y })
    run(game, idle, 2.5)
    expect(game.kerb.has(slot.id)).toBe(true)
    expect(carAt(game, slot)).toBeUndefined()
    // Far away and back, but not right there: the slot fills again.
    Object.assign(game.player, { x: slot.x + PARK_FAR + 400, y: slot.y })
    run(game, idle, 1.1)
    expect(game.kerb.has(slot.id)).toBe(false)
    Object.assign(game.player, { x: slot.x + 90, y: slot.y })
    run(game, idle, 1.1)
    expect(carAt(game, slot)).toBeDefined()
  })

  it("let you drive past them in the lane without scraping one", () => {
    const game = newGame(world, 3)
    game.npcs = []
    const slot = slotNear(game).find((s) => carAt(game, s) !== undefined)
    if (slot === undefined) throw new Error("expected a kerbside car near the start")
    step(world, game, { ...idle, use: true })
    const car = game.player.car
    if (car === null) throw new Error("expected the start car")
    // In the lane, LANE_CLEAR beside the parked car and a few meters behind it, at 30 km/h.
    const fx = Math.cos(slot.angle)
    const fy = Math.sin(slot.angle)
    Object.assign(car, { x: slot.x + fy * LANE_CLEAR - fx * 4, y: slot.y - fx * LANE_CLEAR - fy * 4, angle: slot.angle, vx: fx * 8.3, vy: fy * 8.3 })
    const hp = car.vitals.hp
    run(game, { ...idle, up: true }, 1)
    expect(car.vitals.hp).toBe(hp)
    expect((car.x - slot.x) * fx + (car.y - slot.y) * fy).toBeGreaterThan(4)
  })

  it("never park on a car someone left in the slot", () => {
    const game = newGame(world, 3)
    const slot = slotNear(game).find((s) => carAt(game, s) !== undefined)
    if (slot === undefined) throw new Error("expected a kerbside car near the start")
    Object.assign(game.player, { x: slot.x + PARK_FAR + 400, y: slot.y })
    run(game, idle, 1.1)
    expect(carAt(game, slot)).toBeUndefined()
    // Someone's own car, a little skewed, where the slot is.
    const left = { x: slot.x + 1, y: slot.y, angle: slot.angle + 0.3, vx: 0, vy: 0, model: 2, vitals: vitals(CAR_HP) }
    game.parked.push(left)
    Object.assign(game.player, { x: slot.x + 90, y: slot.y })
    run(game, idle, 1.1)
    expect(game.parked.filter((c) => Math.hypot(c.x - slot.x, c.y - slot.y) < 3)).toEqual([left])
  })
})
