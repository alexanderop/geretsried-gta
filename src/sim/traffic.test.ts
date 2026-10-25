import { describe, expect, it } from "vitest"
import type { GameMap, Road } from "#/map/types.ts"
import { makeWorld } from "#/world/world.ts"
import { CAR_LENGTH } from "./car.ts"
import { DT } from "./game.ts"
import { makeRandom } from "./random.ts"
import { makeSignals } from "./signals.ts"
import { IDM, bendSpeedOnto, stepNpc, type Npc } from "./traffic.ts"
import { vitals } from "./damage.ts"

const road = (pts: ReadonlyArray<number>): Road => ({ kind: "primary", name: "Teststraße", width: 8, oneway: false, pts, nodes: pts.filter((_, i) => i % 2 === 0).map((_, i) => i + 1) })
/** A street of its own on an empty map, with no lights. */
const town = (pts: ReadonlyArray<number>) => {
  const map: GameMap = {
    width: 600,
    height: 600,
    bbox: { south: 47.85, west: 11.48, north: 47.86, east: 11.49 },
    roads: [road(pts)],
    buildings: [],
    areas: [],
    waterways: [],
    pois: [],
    signals: [],
    crossings: [],
    props: [],
    districts: [],
    covered: [],
    buses: [],
  }
  const world = makeWorld(map, [], [])
  return { world, signals: makeSignals(world) }
}
/** A car on the street's first segment, `s` meters in at `speed`, about to drive on along the street. */
const car = (s: number, speed: number, segments: number): Npc => ({
  id: 1,
  road: 0,
  from: 0,
  dir: 1,
  s,
  speed,
  x: 0,
  y: 0,
  angle: 0,
  prev: null,
  route: Array.from({ length: segments - 1 }, (_, i) => ({ road: 0, from: i + 1, dir: 1 as const })),
  model: 0,
  vitals: vitals(100),
  mode: { kind: "driving" },
  give: null,
})
const turn = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(b - a), Math.cos(b - a)))

describe("NPC traffic", () => {
  // 100 m east, a right-angle bend, 100 m on.
  const corner = town([50, 200, 150, 200, 150, 300])
  const bend = { x: 150, y: 200 }

  it("takes a right-angle bend as a curve: no jump sideways, no jerk of the heading", () => {
    const { world, signals } = corner
    const npc = car(60, 0, 2)
    const random = makeRandom(1)
    stepNpc(world, signals, 0, npc, null, DT, random)
    let worstJump = 0
    let worstTurn = 0
    let turned = 0
    for (let t = 0; t < 30 / DT && !(npc.from === 1 && npc.s > 30); t++) {
      const before = { x: npc.x, y: npc.y, angle: npc.angle }
      stepNpc(world, signals, t * DT, npc, null, DT, random)
      worstJump = Math.max(worstJump, Math.hypot(npc.x - before.x, npc.y - before.y) - npc.speed * DT)
      worstTurn = Math.max(worstTurn, turn(before.angle, npc.angle))
      turned += turn(before.angle, npc.angle)
    }
    expect(npc.from).toBe(1)
    expect(worstJump).toBeLessThan(0.05)
    // About a quarter turn in all, a few degrees at most per step.
    expect(turned).toBeCloseTo(Math.PI / 2, 1)
    expect(worstTurn).toBeLessThan(0.06)
  })

  it("brakes ahead of a bend and takes it no faster than the bend allows", () => {
    const { world, signals } = corner
    const npc = car(0, 14, 2)
    const random = makeRandom(1)
    const vb = bendSpeedOnto(world, npc, { road: 0, from: 1, dir: 1 })
    expect(vb).toBeLessThan(10)
    let atBend = Infinity
    let closest = Infinity
    let hardest = 0
    for (let t = 0; t < 30 / DT && !(npc.from === 1 && npc.s > 10); t++) {
      const v = npc.speed
      stepNpc(world, signals, t * DT, npc, null, DT, random)
      hardest = Math.max(hardest, (v - npc.speed) / DT)
      const d = Math.hypot(npc.x - bend.x, npc.y - bend.y)
      if (d < closest) {
        closest = d
        atBend = npc.speed
      }
    }
    expect(atBend).toBeLessThanOrEqual(vb + 0.05)
    // Comfortably: no slamming on the brakes at the last moment.
    expect(hardest).toBeLessThan(3.5)
  })

  it("follows a car standing ahead: slows down smoothly and stops a few meters behind it", () => {
    const { world, signals } = town([0, 300, 500, 300])
    const npc = car(0, 14, 1)
    const random = makeRandom(1)
    const leaderS = 150
    let gap = leaderS - npc.s - CAR_LENGTH
    let smallest = gap
    let harshest = 0
    for (let t = 0; t < 40 / DT; t++) {
      const v = npc.speed
      stepNpc(world, signals, t * DT, npc, { gap, speed: 0 }, DT, random)
      // Braking harder than an emergency stop is only allowed once it is already too close.
      if (gap >= IDM.s0) harshest = Math.max(harshest, (v - npc.speed) / DT)
      gap = leaderS - npc.s - CAR_LENGTH
      smallest = Math.min(smallest, gap, npc.speed)
    }
    expect(harshest).toBeLessThanOrEqual(IDM.emergency + 1e-6)
    // Never into it, never backwards.
    expect(smallest).toBeGreaterThanOrEqual(0)
    expect(gap).toBeGreaterThanOrEqual(IDM.s0 - 0.3)
    expect(gap).toBeLessThan(IDM.s0 + 1)
    expect(npc.speed).toBeLessThan(0.1)
  })
})
