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
