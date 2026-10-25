import { readFileSync } from "node:fs"
import { Schema } from "effect"
import { describe, expect, it } from "vitest"
import { GameMap } from "#/map/types.ts"
import { DT, newGame, step, type Input } from "#/sim/game.ts"
import { CAKE_COST } from "#/sim/shops.ts"
import { arrive, stepGuest } from "#/sim/guests.ts"
import type { Walker } from "#/sim/pedestrians.ts"
import { boxOf, pointInPolygon } from "./geometry.ts"
import { CAKE_PAD, PATH, PAVILION, ROOM, TERRACE, toWorld } from "./cafe.ts"
import { makeWorld } from "./world.ts"

const map = Schema.decodeUnknownSync(GameMap)(JSON.parse(readFileSync("public/geretsried.map.json", "utf8")))
const world = makeWorld(map)
const idle: Input = { up: false, down: false, left: false, right: false, handbrake: false, sprint: false, use: false, attack: false, cycle: 0 }
const cafe = world.cafe
const key = (i: number, j: number) => i * 100000 + j

describe("Cafe Waldmann", () => {
  it("stands on the lawn in front of the block at Sudetenstraße, clear of every mapped building and street", () => {
    expect(cafe).not.toBeNull()
    if (cafe === null) return
    const samples: Array<readonly [number, number]> = []
    for (let u = PAVILION[0]; u <= PAVILION[1]; u += 0.5) for (let n = TERRACE[2]; n <= PAVILION[3]; n += 0.5) samples.push(toWorld(cafe.frame, u, n))
    for (const [x, y] of samples) {
      expect(map.buildings.some((b) => b.canopy !== true && pointInPolygon(x, y, b.pts)), `building at ${x}, ${y}`).toBe(false)
      const road = world.roadAt(x, y, 0)
      expect(road !== null && road.dist < road.road.width / 2, `street at ${x}, ${y}`).toBe(false)
    }
    // The terrace's path reaches the sidewalk.
    const [px, py] = toWorld(cafe.frame, (PATH[0] + PATH[1]) / 2, PATH[2])
    expect(world.roadAt(px, py, 8)?.road.name).toBe("Sudetenstraße")
  })

  it("can be walked into from the street, through the door, up to the cake counter", () => {
    if (cafe === null) throw new Error("no cafe")
    // Flood the room and terrace on a 0.2 m grid, as the player's 0.4 m radius fits.
    const STEP = 0.2
    const R = 0.4
    const free = (x: number, y: number) => !world.isSolid(x + R, y) && !world.isSolid(x - R, y) && !world.isSolid(x, y + R) && !world.isSolid(x, y - R) && !world.isSolid(x, y)
    const start = toWorld(cafe.frame, (PATH[0] + PATH[1]) / 2, PATH[2] + 0.5)
    const goal = toWorld(cafe.frame, CAKE_PAD.u, CAKE_PAD.n)
    const box = boxOf([...toWorld(cafe.frame, PAVILION[0] - 2, PATH[2] - 1), ...toWorld(cafe.frame, PAVILION[1] + 2, PATH[2] - 1), ...toWorld(cafe.frame, PAVILION[1] + 2, ROOM[3]), ...toWorld(cafe.frame, PAVILION[0] - 2, ROOM[3])])
    const at = (i: number, j: number) => [box.minX + i * STEP, box.minY + j * STEP] as const
    const cell = (x: number, y: number) => [Math.round((x - box.minX) / STEP), Math.round((y - box.minY) / STEP)] as const
    const [si, sj] = cell(...start)
    const [gi, gj] = cell(...goal)
    const seen = new Set([key(si, sj)])
    const queue: Array<readonly [number, number]> = [[si, sj]]
    let reached = false
    while (queue.length > 0) {
      const [i, j] = queue.shift() ?? [0, 0]
      if (Math.abs(i - gi) <= 2 && Math.abs(j - gj) <= 2) {
        reached = true
        break
      }
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const ni = i + di
        const nj = j + dj
        const [x, y] = at(ni, nj)
        if (x < box.minX || y < box.minY || x > box.maxX || y > box.maxY || seen.has(key(ni, nj)) || !free(x, y)) continue
        seen.add(key(ni, nj))
        queue.push([ni, nj])
      }
    }
    expect(reached).toBe(true)
  })

  it("keeps its walls solid and the room open", () => {
    if (cafe === null) throw new Error("no cafe")
    expect(world.isSolid(...toWorld(cafe.frame, 0, PAVILION[2] + 0.1))).toBe(true)
    expect(world.isSolid(...toWorld(cafe.frame, 2, ROOM[3] + 0.1))).toBe(true)
    expect(world.isSolid(...toWorld(cafe.frame, CAKE_PAD.u, CAKE_PAD.n))).toBe(false)
  })

  it("sells a slice of cake at the counter that heals you fully, once per visit to the counter", () => {
    const game = newGame(world, 3)
    const shop = game.shops.find((s) => s.kind === "cake")
    expect(shop).toBeDefined()
    if (shop === undefined) return
    game.score.money = 100
    game.player.vitals.hp = 30
    Object.assign(game.player, { x: shop.x, y: shop.y })
    for (let t = 0; t < 1 / DT; t++) step(world, game, idle)
    expect(game.player.vitals.hp).toBe(100)
    expect(game.score.money).toBe(100 - CAKE_COST)
    expect(game.messages.some((m) => m.kind === "pickup" && m.text.includes("Cafe Waldmann"))).toBe(true)
  })

  it("tells you the price when you cannot pay", () => {
    const game = newGame(world, 3)
    const shop = game.shops.find((s) => s.kind === "cake")
    if (shop === undefined) throw new Error("no cake counter")
    game.score.money = 0
    game.player.vitals.hp = 30
    Object.assign(game.player, { x: shop.x, y: shop.y })
    step(world, game, idle)
    expect(game.player.vitals.hp).toBe(30)
    expect(game.messages.some((m) => m.kind === "mission" && m.text.includes(`$${CAKE_COST}`))).toBe(true)
  })

  it("has guests who walk in, buy cake, eat it at a chair (maybe visit the WC) and walk out, never through a wall", () => {
    if (cafe === null) throw new Error("no cafe")
    let seeded = 0.37
    const random = () => (seeded = (seeded * 9301 + 49297) % 233280) / 233280
    for (let id = 0; id < 6; id++) {
      const guest = arrive(world, cafe.frame, id, random)
      if (guest === null) throw new Error("no sidewalk for the guest")
      const walkers: Array<Walker> = [guest]
      const phases = new Set<string>()
      for (let t = 0; t < 240 / DT && guest.visit !== undefined; t++) {
        phases.add(guest.visit.phase)
        stepGuest(world, guest, walkers, DT, random)
        expect(world.isSolid(guest.x, guest.y), `${guest.visit?.phase} at ${guest.x.toFixed(1)}, ${guest.y.toFixed(1)}`).toBe(false)
      }
      expect(guest.visit).toBeUndefined()
      expect([...phases]).toEqual(expect.arrayContaining(["enter", "order", "seat", "eat", "leave"]))
      // Back on Sudetenstraße's sidewalk, walking on.
      expect(map.roads[guest.road]?.name).toBe("Sudetenstraße")
    }
  })
})
