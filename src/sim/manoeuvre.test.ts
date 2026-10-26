import { readFileSync } from "node:fs"
import { Schema } from "effect"
import { describe, expect, it } from "vitest"
import { GameMap } from "#/map/types.ts"
import { makeWorld } from "#/world/world.ts"
import { DT, newGame, step, type Game, type Input } from "./game.ts"
import { beginPullIn, beginPullOut } from "./manoeuvre.ts"
import { PARKED_COUNT, kerbCars, kerbSlots, laneFor, slotFree, type Slot } from "./parking.ts"
import { laneOf, npcOn, type Npc } from "./traffic.ts"
import { CAR_HP, vitals } from "./damage.ts"

const map = Schema.decodeUnknownSync(GameMap)(JSON.parse(readFileSync("public/geretsried.map.json", "utf8")))
const world = makeWorld(map)
const slots = kerbSlots(world)
const idle: Input = { up: false, down: false, left: false, right: false, handbrake: false, sprint: false, use: false, attack: false, cycle: 0 }
const turn = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(b - a), Math.cos(b - a)))
const along = (slot: Slot) => {
  const lane = laneOf(world, laneFor(slot))
  return { lane, at: (slot.x - lane.x) * lane.dx + (slot.y - lane.y) * lane.dy }
}
/** Slots near the player on a lane with room behind them (`behind` m) and ahead (`ahead` m) of their place along it. */
const slotsNear = (game: Game, behind: number, ahead: number) =>
  slots.filter((s) => {
    if (Math.hypot(s.x - game.player.x, s.y - game.player.y) > 120 || (s.side === -1 && map.roads[s.road]?.oneway === true)) return false
    const { lane, at } = along(s)
    return at > behind && lane.len - at > ahead
  })
const driving = (game: Game, slot: Slot, back: number, speed: number, id: number): Npc => {
  const { at } = along(slot)
  const npc = npcOn(world, id, laneFor(slot), at - back, 0, vitals(CAR_HP), { kind: "driving" }, () => 0.5)
  npc.speed = speed
  game.npcs.push(npc)
  return npc
}

describe("traffic pulling in to the kerb", () => {
  it("curves into a free slot without a jump, stops parallel in it and becomes a kerbside car", () => {
    const game = newGame(world, 3)
    game.npcs = []
    const slot = slotsNear(game, 40, 2).find((s) => slotFree(game, s))
    if (slot === undefined) throw new Error("expected a free slot near the start")
    const npc = driving(game, slot, 30, 8, 9001)
    beginPullIn(world, npc, slot)
    let worstJump = 0
    let worstTurn = 0
    let curving = 0
    for (let t = 0; t < 20 / DT && game.npcs.includes(npc); t++) {
      const before = { x: npc.x, y: npc.y, angle: npc.angle }
      step(world, game, idle)
      worstJump = Math.max(worstJump, Math.hypot(npc.x - before.x, npc.y - before.y) - npc.speed * DT)
      worstTurn = Math.max(worstTurn, turn(before.angle, npc.angle))
      if (npc.mode.kind === "pullingIn" && npc.mode.path !== null) curving += DT
    }
    expect(game.npcs.includes(npc)).toBe(false)
    expect(worstJump).toBeLessThan(0.05)
    expect(worstTurn).toBeLessThan(0.06)
    // A couple of seconds off the lane, as a driver parks.
    expect(curving).toBeGreaterThan(1.5)
    expect(curving).toBeLessThan(4)
    const car = game.kerb.get(slot.id)
    expect(car).toMatchObject({ x: slot.x, y: slot.y, angle: slot.angle, model: npc.model, vx: 0, vy: 0 })
    expect(car?.vitals).toBe(npc.vitals)
    expect(car !== undefined && kerbCars(world, game).has(car)).toBe(true)
  })
})

describe("kerbside cars pulling out", () => {
  it("wait while a car comes along the lane, then pull out behind it and drive on", () => {
    const game = newGame(world, 3)
    game.npcs = []
    // A view as wide as the scene, so the crowd (fillCrowd) keeps the car coming out of sight of the player.
    game.view = 400
    const standing = kerbCars(world, game)
    const slot = slotsNear(game, 45, 12).find((s) => {
      const c = game.kerb.get(s.id)
      return c !== undefined && standing.has(c)
    })
    if (slot === undefined) throw new Error("expected a kerbside car near the start")
    const out = beginPullOut(world, game, slot)
    if (out === null) throw new Error("expected the car to pull out")
    const coming = driving(game, slot, 35, 8, 9002)
    const { lane, at } = along(slot)
    const ahead = (n: Npc) => (n.x - lane.x) * lane.dx + (n.y - lane.y) * lane.dy - at
    let waitedFor = 0
    let crept = 0
    let wentAt: number | null = null
    let worstJump = 0
    let worstTurn = 0
    for (let t = 0; t < 20 / DT && out.mode.kind !== "driving"; t++) {
      const before = { x: out.x, y: out.y, angle: out.angle }
      step(world, game, idle)
      worstJump = Math.max(worstJump, Math.hypot(out.x - before.x, out.y - before.y) - out.speed * DT)
      worstTurn = Math.max(worstTurn, turn(before.angle, out.angle))
      const still = out.mode.kind === "pullingOut" && out.mode.path === null
      if (still) {
        crept = Math.max(crept, Math.hypot(out.x - slot.x, out.y - slot.y))
        if (game.npcs.includes(coming) && ahead(coming) < 0) waitedFor += DT
      } else wentAt ??= game.npcs.includes(coming) ? ahead(coming) : Infinity
    }
    // It stood still while the other car came, and went once it was by.
    expect(crept).toBe(0)
    expect(waitedFor).toBeGreaterThan(1.5)
    expect(wentAt).toBeGreaterThan(10)
    expect(out.mode.kind).toBe("driving")
    expect(game.npcs.includes(out)).toBe(true)
    expect(worstJump).toBeLessThan(0.05)
    expect(worstTurn).toBeLessThan(0.06)
    // Its slot is empty now.
    expect(slotFree(game, slot)).toBe(true)
    // And it drives on along the road.
    const from = { x: out.x, y: out.y }
    for (let t = 0; t < 3 / DT; t++) step(world, game, idle)
    expect(Math.hypot(out.x - from.x, out.y - from.y)).toBeGreaterThan(8)
  })
})

/** A run of the game, with what traffic did at the kerb: who started pulling in or out, and when. */
const watch = (seed: number, seconds: number) => {
  const game = newGame(world, seed)
  // The town's traffic as a whole, not only the crowd round one screen: a view a few hundred meters across.
  game.view = 120
  const events: Array<string> = []
  let modes = new Map<number, string>()
  let doubleClaims = 0
  let mostAtKerb = 0
  for (let t = 0; t < seconds / DT; t++) {
    step(world, game, idle)
    const now = new Map(game.npcs.map((n) => [n.id, n.mode.kind === "driving" ? "driving" : `${n.mode.kind}:${n.mode.slot}`]))
    for (const [id, m] of now) if (modes.get(id) !== m) events.push(`${t} ${id} ${m}`)
    for (const [id, m] of modes) if (!now.has(id)) events.push(`${t} ${id} gone after ${m}`)
    modes = now
    const claims = game.npcs.flatMap((n) => (n.mode.kind === "driving" ? [] : [n.mode.slot]))
    if (new Set(claims).size !== claims.length) doubleClaims++
    if (t % 10 === 0) mostAtKerb = Math.max(mostAtKerb, kerbCars(world, game).size)
  }
  return { game, events, doubleClaims, mostAtKerb }
}

describe("the kerb and the traffic over a while", () => {
  const { game, events, doubleClaims, mostAtKerb } = watch(1, 120)
  const parks = events.filter((e) => / gone after pullingIn:/.test(e)).length
  const pulls = events.filter((e) => / pullingOut:/.test(e)).length

  it("trade cars now and then: some park, some pull out, a few a minute", () => {
    expect(parks).toBeGreaterThan(2)
    expect(pulls).toBeGreaterThan(2)
    expect(parks + pulls).toBeLessThan(40)
  })

  it("never let two cars claim the same slot, and never park more than the kerb's cap", () => {
    expect(doubleClaims).toBe(0)
    expect(mostAtKerb).toBeLessThanOrEqual(PARKED_COUNT)
    expect(kerbCars(world, game).size).toBeLessThanOrEqual(PARKED_COUNT)
  })

  it("happen the same way for the same seed", () => {
    expect(watch(1, 60).events).toEqual(events.filter((e) => Number(e.split(" ")[0]) < 60 / DT))
  })
})
