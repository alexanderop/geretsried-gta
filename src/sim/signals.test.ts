import { readFileSync } from "node:fs"
import { Schema } from "effect"
import { describe, expect, it } from "vitest"
import { GameMap } from "#/map/types.ts"
import { makeWorld } from "#/world/world.ts"
import { DT, newGame, step, type Input } from "./game.ts"
import { CYCLE, STOP_BACK, lightFor, makeSignals, stopKey } from "./signals.ts"
import type { Npc } from "./traffic.ts"

const map = Schema.decodeUnknownSync(GameMap)(JSON.parse(readFileSync("public/geretsried.map.json", "utf8")))
const world = makeWorld(map)
const must = <T,>(value: T | null | undefined): T => {
  if (value == null) throw new Error("expected a value")
  return value
}
const idle: Input = { up: false, down: false, left: false, right: false, handbrake: false, sprint: false, use: false, attack: false, cycle: 0 }

describe("traffic lights", () => {
  const signals = makeSignals(world)

  it("loads Geretsried's real lights and groups them into junctions", () => {
    expect(signals.lights.length).toBeGreaterThan(20)
    expect(new Set(signals.lights.map((l) => l.junction)).size).toBeLessThan(signals.lights.length)
  })

  it("never shows green to both directions of a junction", () => {
    const junction = signals.lights[0]?.junction
    expect(junction).toBeDefined()
    if (junction === undefined) return
    for (let t = 0; t < CYCLE; t += 0.5) {
      const main = lightFor(junction, junction.axis, t)
      const cross = lightFor(junction, junction.axis + Math.PI / 2, t)
      expect(main === "green" && cross === "green").toBe(false)
    }
  })

  it("puts a stop line a few meters before each controlled light, across the right-hand lane", () => {
    expect(signals.stops.length).toBeGreaterThan(signals.lights.length)
    for (const st of signals.stops) {
      const road = must(map.roads[st.road])
      const nx = road.pts[st.vertex * 2] ?? 0
      const ny = road.pts[st.vertex * 2 + 1] ?? 0
      expect(Math.hypot(nx - st.x, ny - st.y)).toBeCloseTo(st.back, 1)
      expect(st.back).toBeLessThanOrEqual(STOP_BACK.junction)
      // On the road, heading into the light.
      expect(world.roadAt(st.x, st.y, 1)).not.toBeNull()
      expect((nx - st.x) * Math.cos(st.heading) + (ny - st.y) * Math.sin(st.heading)).toBeGreaterThan(0)
      expect(st.to).toBeCloseTo(road.width / 2)
    }
    expect(signals.zebras.length).toBeGreaterThan(20)
  })

  it("stops NPC traffic at red behind the white line: nobody crosses it while it is red", () => {
    const game = newGame(world, 5)
    // Stand next to the busiest junction so traffic spawns around it.
    const light = game.signals.lights[0]
    if (light !== undefined) {
      game.player.x = light.x + 15
      game.player.y = light.y + 15
    }
    /** How far before its stop line the car's centre is, or null on a segment without one. */
    const beforeLine = (n: Npc) => {
      const st = game.signals.stopFor.get(stopKey(n.road, n.from + n.dir, n.dir))
      return st === undefined ? null : (st.x - n.x) * Math.cos(st.heading) + (st.y - n.y) * Math.sin(st.heading)
    }
    let waiting = 0
    let crossings = 0
    let violations = 0
    for (let t = 0; t < 60 / DT; t++) {
      const before = new Map(game.npcs.map((n) => [n.id, { road: n.road, from: n.from, ahead: beforeLine(n) }]))
      step(world, game, idle)
      for (const npc of game.npcs) {
        const b = before.get(npc.id)
        const now = beforeLine(npc)
        if (b === undefined || b.ahead === null || now === null || b.road !== npc.road || b.from !== npc.from) continue
        const st = must(game.signals.stopFor.get(stopKey(npc.road, npc.from + npc.dir, npc.dir)))
        const red = lightFor(st.light.junction, st.heading, game.time - DT) === "red"
        if (red && npc.speed === 0 && now > 0 && now < 4) waiting++
        if (b.ahead < 0 || now >= 0) continue
        crossings++
        if (red) violations++
      }
    }
    expect(crossings).toBeGreaterThan(0)
    expect(waiting).toBeGreaterThan(0)
    expect(violations).toBe(0)
    // 60 s of the whole town's traffic, buses included.
  }, 30_000)
})
