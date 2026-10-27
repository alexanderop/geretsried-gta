import { readFileSync } from "node:fs"
import { Schema } from "effect"
import { describe, expect, it } from "vitest"
import { GameMap } from "#/map/types.ts"
import { newGame } from "#/sim/game.ts"
import { makeWorld } from "#/world/world.ts"
import { followCamera, groundBox, groundScale, heightFor, project, startCamera, towersOf, viewMatrix, type View } from "./camera.ts"

const camera = { x: 100, y: 200, height: heightFor(60), leadX: 0, leadY: 0 }

describe("the perspective camera", () => {
  const view: View = { camera, aspect: 1.6, ortho: null }
  const m = viewMatrix(view)

  it("looks straight down: the point below it is the screen's centre, north up", () => {
    const [cx, cy] = project(m, 100, 200, 0, 1600, 1000) ?? [0, 0]
    expect(cx).toBeCloseTo(800)
    expect(cy).toBeCloseTo(500)
    const [, north] = project(m, 100, 150, 0, 1600, 1000) ?? [0, 0]
    expect(north).toBeLessThan(500)
  })

  it("shows `half` meters of ground from the centre to the top edge", () => {
    expect(project(m, 100, 140, 0, 1600, 1000)?.[1]).toBeCloseTo(0)
    expect(groundBox(view, 0).maxX - 100).toBeCloseTo(60 * 1.6)
    expect(groundScale(view, 1000)).toBeCloseTo(500 / 60)
  })

  it("leans tall things away from the centre, so walls show towards the edges", () => {
    const [foot] = project(m, 150, 200, 0, 1600, 1000) ?? [0, 0]
    const [roof] = project(m, 150, 200, 12, 1600, 1000) ?? [0, 0]
    expect(roof).toBeGreaterThan(foot + 5)
  })
})

describe("the GTA 2 lens", () => {
  it("leans a 9 m house at the top edge out about 5 m on foot, while a car still fills about a ninth of the screen", () => {
    const foot = { x: 0, y: 0, height: heightFor(12.5), leadX: 0, leadY: 0 }
    const m = viewMatrix({ camera: foot, aspect: 1.6, ortho: null })
    const [, base] = project(m, 0, -12.5, 0, 1600, 1000) ?? [0, 0]
    const [, top] = project(m, 0, -12.5, 9, 1600, 1000) ?? [0, 0]
    // Pixels per ground meter at the edge: 1000 px over 25 m.
    expect((base - top) / 40).toBeGreaterThan(4.5)
    expect((base - top) / 40).toBeLessThan(6)
    const car = { ...foot, height: heightFor(15.6) }
    const mc = viewMatrix({ camera: car, aspect: 1.6, ortho: null })
    const [, nose] = project(mc, 0, -2.25, 1.5, 1600, 1000) ?? [0, 0]
    const [, tail] = project(mc, 0, 2.25, 1.5, 1600, 1000) ?? [0, 0]
    expect((tail - nose) / 1000).toBeGreaterThan(1 / 8)
    expect((tail - nose) / 1000).toBeLessThan(1 / 6)
  })
})

describe("the camera over Geretsried's high-rises", () => {
  const map = Schema.decodeUnknownSync(GameMap)(JSON.parse(readFileSync("public/geretsried.map.json", "utf8")))
  const world = makeWorld(map)
  const towers = towersOf(world)

  it("knows the few towers taller than the walking camera can pass, Maria Hilf's bell tower among them", () => {
    expect(towers.length).toBeGreaterThan(0)
    // LoD2 storeys put 35 blocks over the walking camera (2026-10-27); still a handful of the town's buildings.
    expect(towers.length).toBeLessThan(60)
    expect(Math.max(...towers.map((t) => t.top))).toBeGreaterThanOrEqual(35)
  })

  it("climbs to stay well above the tallest roof in view, and stays low away from them", () => {
    const tallest = towers.reduce((a, b) => (b.top > a.top ? b : a))
    const game = newGame(world, 1)
    Object.assign(game.player, { x: (tallest.box.minX + tallest.box.maxX) / 2, y: tallest.box.maxY + 3, car: null, ride: null })
    const over = startCamera(game)
    for (let i = 0; i < 400; i++) followCamera(over, game, towers)
    expect(over.height).toBeGreaterThan(tallest.top + 10)
    Object.assign(game.player, { x: 100, y: 100 })
    const open = startCamera(game)
    for (let i = 0; i < 400; i++) followCamera(open, game, towers)
    expect(open.height).toBeCloseTo(heightFor(12.5), 0)
  })
})

describe("the compare camera", () => {
  it("is orthographic: a roof lands on its footprint", () => {
    const m = viewMatrix({ camera: { x: 0, y: 0, height: 100, leadX: 0, leadY: 0 }, aspect: 1, ortho: 80 })
    expect(project(m, 40, -40, 0, 1000, 1000)).toEqual(project(m, 40, -40, 30, 1000, 1000))
    expect(project(m, 80, 0, 0, 1000, 1000)?.[0]).toBeCloseTo(1000)
  })
})
