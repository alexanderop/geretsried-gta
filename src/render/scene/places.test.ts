import { describe, expect, it } from "vitest"
import type { GameMap, Road } from "#/map/types.ts"
import { makeWorld } from "#/world/world.ts"
import type { PlaceDressing } from "#/world/places/dressing.ts"
import { Mode, STRIDE, material, prop, type Mesh } from "./mesh.ts"
import { Scene } from "./scene.ts"

const road = (name: string, pts: Array<number>): Road => ({ kind: "residential", name, width: 6, oneway: false, pts, nodes: [1, 2] })

// Two buildings in different chunks (128 m): the shop at the top left, the hall at the bottom right, both south of Main.
const map: GameMap = {
  width: 256,
  height: 256,
  bbox: { south: 0, west: 0, north: 1, east: 1 },
  roads: [road("Main", [0, 40, 250, 40])],
  buildings: [
    { id: 1, levels: 2, pts: [20, 60, 50, 60, 50, 75, 20, 75, 20, 60], roof: { colors: ["#aa5533", null, "#884422", null], pitched: true } },
    { id: 2, levels: 2, pts: [150, 150, 180, 150, 180, 170, 150, 170, 150, 150], roof: { colors: ["#aa5533", null, "#884422", null], pitched: true } },
  ],
  areas: [], waterways: [], pois: [],
  signals: [], crossings: [], props: [], districts: [], covered: [], buses: [],
}

// The hall's frame: no POI, so it hangs on its middle (165, 160): origin (165, 40) on Main, n south (+y), u west (-x).
// Its wall 0 runs along y = 150, seen from the north: left end (180, 150), u west.
const hall: PlaceDressing = {
  poi: "Hall",
  street: "Main",
  osmBuildingId: 2,
  levels: 4,
  wallColour: [169, 179, 196, 255],
  bands: [{ z0: 0, z1: 3, colour: [192, 188, 181, 255] }],
  roof: { colour: [147, 84, 52, 255] },
  parts: [
    { kind: "wallSign", texture: "cafe-sign", edge: 0, u0: 2, u1: 12, z0: 4, z1: 5 },
    { kind: "arcade", edge: 0, u0: 14, u1: 28, arches: 4, h: 3, depth: 0.4, pillar: [232, 222, 210, 255], glazing: [110, 108, 104, 255] },
    { kind: "tower", rect: [-3, 3, 112, 118], h: 16, roofH: 5, colours: { wall: [233, 222, 205, 255], roof: [90, 80, 65, 255], trim: [219, 178, 103, 255], finial: [60, 60, 60, 255] } },
    { kind: "sprite", name: "prop-church", u: 0, n: 100, z: 2.5, angle: 0, len: 1.2, pole: [200, 40, 40, 255] },
    // Wall 2 runs along y = 170, seen from the south: left end (150, 170), u east, out south (+y).
    { kind: "balcony", edge: 2, u0: 5, u1: 10, z: [3, 6], depth: 1.2, colour: [82, 100, 113, 255] },
  ],
}

const noCrowns = { xs: new Uint16Array(0), ys: new Uint16Array(0), rs: new Uint8Array(0) }
const plain = new Scene(makeWorld(map, []), noCrowns, [])
const dressed = new Scene(makeWorld(map, [hall]), noCrowns, [])

const bytes = (m: Mesh) => [...m.vertices, ...new Uint8Array(m.indices.buffer)].join(",")
const vertices = (mesh: Mesh) => {
  const view = new DataView(mesh.vertices.buffer, mesh.vertices.byteOffset)
  return Array.from({ length: mesh.vertices.length / STRIDE }, (_, i) => ({
    x: view.getFloat32(i * STRIDE, true),
    y: view.getFloat32(i * STRIDE + 4, true),
    z: view.getFloat32(i * STRIDE + 8, true),
    mode: view.getUint8(i * STRIDE + 24),
    layer: view.getUint8(i * STRIDE + 25),
  }))
}
const near = (a: number, b: number) => Math.abs(a - b) < 1e-3

describe("a dressed place", () => {
  const vs = vertices(dressed.build(3))

  it("changes only the chunk of its building", () => {
    for (const key of [0, 1, 2]) expect(bytes(dressed.build(key)), `chunk ${key}`).toBe(bytes(plain.build(key)))
    expect(bytes(dressed.build(3))).not.toBe(bytes(plain.build(3)))
  })

  it("raises the footprint to its storeys", () => {
    expect(vs.some((v) => v.mode === Mode.material && v.z === 12 && v.x === 150 && v.y === 150)).toBe(true)
    expect(vertices(plain.build(3)).some((v) => v.mode === Mode.material && v.z === 12)).toBe(false)
  })

  it("hangs the sign on its wall, from its left end seen from outside, just proud of it", () => {
    const sign = vs.filter((v) => v.mode === Mode.material && v.layer === material("cafe-sign"))
    expect(sign).toHaveLength(4)
    for (const v of sign) {
      expect(near(v.y, 150 - 0.04)).toBe(true)
      expect(near(v.x, 178) || near(v.x, 168)).toBe(true)
      expect(v.z === 4 || v.z === 5).toBe(true)
    }
  })

  it("stands the arcade's pillars and band in front of the wall, along its stretch", () => {
    const band = vs.filter((v) => near(v.z, 3.45) && v.y < 150 - 0.3)
    expect(band.length).toBeGreaterThan(0)
    for (const v of band) {
      expect(near(v.y, 149.6)).toBe(true)
      expect(v.x >= 180 - 28 - 1e-3 && v.x <= 180 - 14 + 1e-3).toBe(true)
    }
  })

  it("puts the tower's roof tip over its middle and the finial on it", () => {
    expect(vs.some((v) => near(v.x, 165) && near(v.y, 155) && near(v.z, 21))).toBe(true)
    expect(Math.max(...vs.map((v) => v.z))).toBeCloseTo(22.4)
  })

  it("stands a balcony out from its wall at each floor, its parapet a meter over the slab", () => {
    const front = vs.filter((v) => near(v.y, 171.2))
    expect(front.length).toBeGreaterThan(0)
    for (const v of front) expect(v.x >= 155 - 1e-3 && v.x <= 160 + 1e-3).toBe(true)
    expect([...new Set(front.map((v) => Math.round(v.z * 100) / 100))].toSorted((a, b) => a - b)).toEqual([2.82, 3, 4, 5.82, 6, 7])
  })

  it("lays the sprite flat at its spot in the street frame, on its pole", () => {
    const sprite = vs.filter((v) => v.mode === Mode.sprite && v.layer === prop("prop-church"))
    expect(sprite).toHaveLength(4)
    for (const v of sprite) {
      expect(v.z).toBe(2.5)
      expect(Math.hypot(v.x - 165, v.y - 140)).toBeLessThan(1)
    }
  })
})

describe("a hipped roof and a tower on a wall", () => {
  // The shop (30 by 15 m, chunk 0) hipped at 45°: its ridge 7.5 m over the 6 m eaves. A tower stands square to its
  // wall 2 (along y = 75, seen from the south: left end (20, 75), u east, n north into the building).
  const shop: PlaceDressing = {
    poi: "Shop",
    street: "Main",
    osmBuildingId: 1,
    roof: { hip: 45 },
    parts: [{ kind: "tower", edge: 2, rect: [10, 14, 1, 5], h: 16, roofH: 4, colours: { wall: [233, 222, 205, 255], roof: [90, 80, 65, 255] } }],
  }
  const hipped = new Scene(makeWorld(map, [shop]), noCrowns, [])
  const vs = vertices(hipped.build(0))
  const roof = vs.filter((v) => v.mode === Mode.detail)

  it("raises the roof from the eaves to the ridge over the footprint, and changes no other chunk", () => {
    expect(Math.min(...roof.map((v) => v.z))).toBeCloseTo(6)
    expect(Math.max(...roof.map((v) => v.z))).toBeCloseTo(13.5)
    for (const v of roof) expect(v.x >= 20 - 1e-3 && v.x <= 50 + 1e-3 && v.y >= 60 - 1e-3 && v.y <= 75 + 1e-3).toBe(true)
    // The ridge runs along the middle, y = 67.5, between the hips 7.5 m in from the ends.
    for (const v of roof.filter((r) => near(r.z, 13.5))) {
      expect(near(v.y, 67.5)).toBe(true)
      expect(v.x >= 27.5 - 1e-3 && v.x <= 42.5 + 1e-3).toBe(true)
    }
    for (const key of [1, 2, 3]) expect(bytes(hipped.build(key)), `chunk ${key}`).toBe(bytes(plain.build(key)))
  })

  it("stands the tower in its wall's frame: its tip over (32, 72)", () => {
    expect(vs.some((v) => near(v.x, 32) && near(v.y, 72) && near(v.z, 20))).toBe(true)
  })
})

describe("walls under a roof with eaves of their own, a gable and a door canopy", () => {
  // The shop (30 by 15 m, 6 m eaves) at 45°: its east end (wall 1, x = 50) a gable, its north wall (wall 2, y = 75)
  // with its eaves at 4 m, so the ridge runs where both long planes are equally high: y = 66.5, 12.5 m up.
  const shop: PlaceDressing = {
    poi: "Shop",
    street: "Main",
    osmBuildingId: 1,
    roof: { hip: 45, eaves: [{ edges: [2], z: 4 }], gables: [1] },
    // Wall 0 runs along y = 60, seen from the north: left end (50, 60), u west, out north (-y).
    parts: [{ kind: "canopy", edge: 0, u0: 10, u1: 14, z: 3.2, depth: 1.5, colour: [52, 62, 57, 255] }],
  }
  const scene = new Scene(makeWorld(map, [shop]), noCrowns, [])
  const vs = vertices(scene.build(0))
  const walls = vs.filter((v) => v.mode === Mode.material && v.layer !== material("roof-tiles"))

  it("raises the gable wall to the ridge and keeps the low wall at its eave", () => {
    expect(walls.some((v) => near(v.x, 50) && near(v.y, 66.5) && near(v.z, 12.5))).toBe(true)
    expect(Math.max(...walls.filter((v) => near(v.y, 75)).map((v) => v.z))).toBeCloseTo(4)
    expect(Math.max(...walls.filter((v) => near(v.y, 60)).map((v) => v.z))).toBeCloseTo(6)
  })

  it("hangs the canopy off the wall with its top at 3.2 m, and changes no other chunk", () => {
    expect(vs.some((v) => near(v.y, 58.5) && near(v.z, 3.2) && near(v.x, 40))).toBe(true)
    for (const key of [1, 2, 3]) expect(bytes(scene.build(key)), `chunk ${key}`).toBe(bytes(plain.build(key)))
  })

  it("lays an awning's fabric over the canopy's top only, in the same slab", () => {
    const awning: PlaceDressing = { ...shop, parts: [{ kind: "canopy", edge: 0, u0: 10, u1: 14, z: 3.2, depth: 1.5, colour: [52, 62, 57, 255], texture: "awning" }] }
    const tvs = vertices(new Scene(makeWorld(map, [awning]), noCrowns, []).build(0))
    const top = tvs.filter((v) => v.mode === Mode.material && v.layer === material("awning"))
    expect(top).toHaveLength(4)
    expect(top.every((v) => near(v.z, 3.2) && v.x >= 36 - 1e-3 && v.x <= 40 + 1e-3)).toBe(true)
    expect(tvs).toHaveLength(vs.length)
  })
})

describe("a cross gable on a wall", () => {
  // The shop's wall 0 runs along y = 60, seen from the north: left end (50, 60), u west, out north (-y). A gable on
  // u 10..20 (x 40..30) with its eaves at 6 m and 45°: the ridge 5 m higher over x = 35, running 6 m into the shop.
  const shop: PlaceDressing = {
    poi: "Shop",
    street: "Main",
    osmBuildingId: 1,
    parts: [{ kind: "gable", edge: 0, u0: 10, u1: 20, z0: 4, z: 6, pitch: 45, depth: 6, colours: { wall: [240, 240, 238, 255], gable: [166, 169, 161, 255], roof: [124, 122, 130, 255] } }],
  }
  const scene = new Scene(makeWorld(map, [shop]), noCrowns, [])
  const vs = vertices(scene.build(0))
  // Its roof's tiles, not the shop's own roof at the 6 m eaves.
  const roof = vs.filter((v) => v.mode === Mode.detail && v.layer === material("roof-tiles") && !near(v.z, 6))

  it("ends in a gable just proud of the wall, its tip over the stretch's middle", () => {
    expect(vs.some((v) => near(v.x, 35) && near(v.y, 59.96) && near(v.z, 11))).toBe(true)
    expect(vs.some((v) => near(v.x, 40) && near(v.y, 59.96) && near(v.z, 4))).toBe(true)
  })

  it("runs its ridge into the building and its eaves past the gable, and changes no other chunk", () => {
    const ridge = roof.filter((v) => near(v.z, 11))
    expect(ridge.length).toBeGreaterThan(0)
    for (const v of ridge) expect(near(v.x, 35)).toBe(true)
    expect(Math.max(...ridge.map((v) => v.y))).toBeCloseTo(66)
    expect(Math.min(...roof.map((v) => v.y))).toBeCloseTo(60 - 0.04 - 0.35)
    // The eaves overhang 0.35 m either side, continuing the slope down.
    expect(Math.min(...roof.map((v) => v.x))).toBeCloseTo(30 - 0.35)
    expect(Math.max(...roof.map((v) => v.x))).toBeCloseTo(40 + 0.35)
    expect(Math.min(...roof.map((v) => v.z))).toBeCloseTo(6 - 0.35)
    for (const key of [1, 2, 3]) expect(bytes(scene.build(key)), `chunk ${key}`).toBe(bytes(plain.build(key)))
  })
})

describe("a roof deck on posts, stairs and a ramp", () => {
  // The shop's wall 0 runs along y = 60, seen from the north: left end (50, 60), u west, n into the shop (+y). The deck
  // overhangs every wall by a meter (x 19..51, y 59..76) with its top at 9 m; the walls are 6 m high.
  const steel = [96, 100, 108, 255] as const
  const shop: PlaceDressing = {
    poi: "Shop",
    street: "Main",
    osmBuildingId: 1,
    parts: [
      { kind: "deck", edge: 0, rect: [-1, 31, -1, 16], z: 9, thickness: 0.3, colour: [62, 64, 70, 255], texture: "solar-field", repeat: [2, 1], posts: { z0: 6, every: 10, colour: steel } },
      { kind: "stairs", edge: 0, u0: 10, u1: 14, depth: 2, h: 1, steps: 4, colour: [196, 194, 188, 255] },
      { kind: "ramp", edge: 0, u0: 16, u1: 22, depth: 1.4, h: 0.9, low: "u0", colour: [196, 194, 188, 255], rail: steel },
    ],
  }
  const scene = new Scene(makeWorld(map, [shop]), noCrowns, [])
  const vs = vertices(scene.build(0))

  it("lays the deck's textured top over the whole rectangle at 9 m, its posts standing from the walls' top", () => {
    const top = vs.filter((v) => v.mode === Mode.material && v.layer === material("solar-field"))
    expect(top).toHaveLength(4)
    expect(top.every((v) => near(v.z, 9))).toBe(true)
    expect(Math.min(...top.map((v) => v.x))).toBeCloseTo(19)
    expect(Math.max(...top.map((v) => v.x))).toBeCloseTo(51)
    expect(Math.min(...top.map((v) => v.y))).toBeCloseTo(59)
    expect(Math.max(...top.map((v) => v.y))).toBeCloseTo(76)
    expect(vs.some((v) => near(v.z, 6) && Math.abs(v.y - 60.15) < 0.1)).toBe(true)
    expect(vs.some((v) => near(v.z, 8.7) && Math.abs(v.y - 60.15) < 0.1)).toBe(true)
  })

  it("steps the stairs up to the wall and slopes the ramp from the ground at u0 to its height at u1, and changes no other chunk", () => {
    // The stairs' last step (u 10..14 = x 40..36) at 1 m against the wall, the first one 0.25 m high 2 m out.
    expect(vs.some((v) => near(v.x, 40) && near(v.y, 60) && near(v.z, 1))).toBe(true)
    expect(vs.some((v) => near(v.x, 36) && near(v.y, 58) && near(v.z, 0.25))).toBe(true)
    // The ramp (u 16..22 = x 34..28) at the ground at x 34 and 0.9 m at x 28, 1.4 m out; its rail 0.95 m over it.
    expect(vs.some((v) => near(v.x, 34) && near(v.y, 58.6) && near(v.z, 0))).toBe(true)
    expect(vs.some((v) => near(v.x, 28) && near(v.y, 58.6) && near(v.z, 0.9))).toBe(true)
    expect(vs.some((v) => near(v.x, 28) && near(v.z, 1.85))).toBe(true)
    for (const key of [1, 2, 3]) expect(bytes(scene.build(key)), `chunk ${key}`).toBe(bytes(plain.build(key)))
  })
})
