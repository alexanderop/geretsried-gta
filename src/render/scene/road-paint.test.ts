import { readFileSync } from "node:fs"
import { Schema } from "effect"
import { describe, expect, it } from "vitest"
import { GameMap, type Road } from "#/map/types.ts"
import { makeWorld } from "#/world/world.ts"
import { makeSignals } from "#/sim/signals.ts"
import { MATERIAL_FILES } from "./mesh.ts"
import { ROAD_WORDS, overheadLines, roadWords, wordLayer } from "./road-paint.ts"
import { Scene } from "./scene.ts"
import { signalHead, streetProps } from "./street.ts"

const map = Schema.decodeUnknownSync(GameMap)(JSON.parse(readFileSync("public/geretsried.map.json", "utf8")))
const world = makeWorld(map)
const signals = makeSignals(world)
const furniture = [...signals.stops.map((st) => signalHead(st).pole), ...signals.zebras]
const props = streetProps(world, furniture)
const busStops = props.flatMap((p) => (p.kind === "shelter" ? [{ ...p.pole, angle: p.angle }] : p.kind === "pole" ? [p] : []))
const words = roadWords(world, signals.stops, signals.zebras, busStops)
const count = (word: string) => words.filter((w) => w.word === word).length
const road = (kind: Road["kind"], nodes: Array<number>, pts: Array<number>): Road => ({ kind, name: "", width: 6, oneway: false, pts, nodes })

describe("words on the lanes", () => {
  it("are each a layer after the texture files", () => {
    expect(ROAD_WORDS.map(wordLayer)).toEqual(ROAD_WORDS.map((_, i) => MATERIAL_FILES.length + i))
  })

  it("say STOP before the lights at every signalled junction, on the lane coming in, short of the line", () => {
    // (A light for a footpath crossing alone has no stop lines.)
    const junctions = signals.lights.filter((light) => signals.stops.some((st) => st.light === light))
    expect(junctions.length).toBeGreaterThan(10)
    for (const light of junctions) {
      const lines = signals.stops.filter((st) => st.light === light)
      expect(words.some((w) => w.word === "STOP" && lines.some((st) => Math.hypot(w.x - st.x, w.y - st.y) < 10))).toBe(true)
    }
    for (const w of words.filter((o) => o.word === "STOP")) {
      const st = signals.stops.find((s) => Math.hypot(w.x - s.x, w.y - s.y) < 10 && Math.cos(s.heading - w.heading) > 0.99)
      if (st === undefined) throw new Error("a STOP far from any stop line")
      // Behind the line, as seen by the traffic arriving.
      expect((st.x - w.x) * Math.cos(st.heading) + (st.y - w.y) * Math.sin(st.heading)).toBeGreaterThan(1.5)
    }
  })

  it("say BUS at the stops, 30 into the Wohngebiete and LANGSAM by the schools", () => {
    expect(count("BUS")).toBeGreaterThan(busStops.length * 0.6)
    expect(count("30")).toBeGreaterThan(20)
    expect(count("LANGSAM")).toBeGreaterThan(4)
  })

  it("never lie on a zebra or on each other, nor in a wall", () => {
    for (const w of words) {
      for (const z of signals.zebras) expect(Math.hypot(w.x - z.x, w.y - z.y)).toBeGreaterThan(w.along / 2 + 2)
      expect(Math.min(...words.filter((o) => o !== w).map((o) => Math.hypot(w.x - o.x, w.y - o.y)))).toBeGreaterThan(1)
      expect(world.isSolid(w.x, w.y)).toBe(false)
    }
  })
})

describe("overhead lines", () => {
  const { poles, wires } = overheadLines(world, furniture)

  it("run on poles along the residential streets and across their junctions, high over the street", () => {
    expect(poles.length).toBeGreaterThan(500)
    expect(wires.length).toBeGreaterThan(poles.length)
    expect(wires.filter((w) => w.a.road !== w.b.road).length).toBeGreaterThan(50)
    for (const w of wires) {
      expect(w.z - w.sag).toBeGreaterThan(7)
      expect(w.z).toBeLessThan(9)
    }
  })

  it("stand clear of the houses and never pass over one", () => {
    for (const p of poles) expect(world.isSolid(p.x, p.y)).toBe(false)
    for (const { a, b } of wires.filter((_, i) => i % 7 === 0)) {
      for (let t = 0.1; t < 1; t += 0.1) expect(world.isSolid(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)).toBe(false)
    }
  })
})

describe("edge lines", () => {
  const small: GameMap = {
    width: 256,
    height: 256,
    bbox: { south: 0, west: 0, north: 1, east: 1 },
    roads: [road("residential", [1, 2], [0, 40, 120, 40]), road("service", [3, 4], [0, 90, 120, 90])],
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
  const noCrowns = { xs: new Uint16Array(0), ys: new Uint16Array(0), rs: new Uint8Array(0) }
  const mesh = new Scene(makeWorld(small), noCrowns, []).build(0)
  const view = new DataView(mesh.vertices.buffer, mesh.vertices.byteOffset)
  const marks = Array.from({ length: mesh.vertices.length / 28 }, (_, i) => ({ y: view.getFloat32(i * 28 + 4, true), z: view.getFloat32(i * 28 + 8, true) })).filter((v) => v.z > 0.079 && v.z < 0.081)

  it("line a residential street along both kerbs, not a drive", () => {
    expect(marks.some((v) => Math.abs(v.y - (40 - 2.55)) < 0.2)).toBe(true)
    expect(marks.some((v) => Math.abs(v.y - (40 + 2.55)) < 0.2)).toBe(true)
    expect(marks.some((v) => Math.abs(v.y - 90) < 4)).toBe(false)
  })
})
