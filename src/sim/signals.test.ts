import { readFileSync } from "node:fs"
import { Schema } from "effect"
import { describe, expect, it } from "vitest"
import { GameMap } from "#/map/types.ts"
import { makeWorld } from "#/world/world.ts"
import { DT, newGame, step, type Input } from "./game.ts"
import { CYCLE, controls, lightFor, makeSignals } from "./signals.ts"

const map = Schema.decodeUnknownSync(GameMap)(JSON.parse(readFileSync("public/geretsried.map.json", "utf8")))
const world = makeWorld(map)
const idle: Input = { up: false, down: false, left: false, right: false, handbrake: false, sprint: false, use: false, attack: false }

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

  it("stops NPC traffic at red: nobody crosses a light while it is red", () => {
    const game = newGame(world, 5)
    // Stand next to the busiest junction so traffic spawns around it.
    const light = game.signals.lights[0]
    if (light !== undefined) {
      game.player.x = light.x + 15
      game.player.y = light.y + 15
    }
    let crossings = 0
    let violations = 0
    for (let t = 0; t < 60 / DT; t++) {
      const before = new Map(game.npcs.map((n) => [n.id, { road: n.road, at: n.from + n.dir, dir: n.dir, x: n.x, y: n.y, angle: n.angle }]))
      step(world, game, idle)
      for (const npc of game.npcs) {
        const b = before.get(npc.id)
        if (b === undefined || (npc.road === b.road && npc.from + npc.dir === b.at)) continue
        const node = map.roads[b.road]?.nodes[b.at]
        const l = node === undefined ? undefined : game.signals.byNode.get(node)
        if (l === undefined || !controls(l, b.dir, b.x, b.y, b.angle)) continue
        crossings++
        if (lightFor(l.junction, b.angle, game.time - DT) === "red") violations++
      }
    }
    expect(crossings).toBeGreaterThan(0)
    expect(violations).toBe(0)
  })
})
