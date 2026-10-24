import { describe, expect, it } from "vitest"
import type { GameMap, Road } from "#/map/types.ts"
import { makeWorld } from "#/world/world.ts"
import { Mode, STRIDE, type Mesh } from "./mesh.ts"
import { CHUNK_M, Scene, wallHeight } from "./scene.ts"

const road = (name: string, nodes: Array<number>, pts: Array<number>): Road => ({ kind: "primary", name, width: 10, oneway: false, pts, nodes })

const map: GameMap = {
  width: 256,
  height: 256,
  bbox: { south: 0, west: 0, north: 1, east: 1 },
  // A main road west to east with a side road joining at x = 60.
  roads: [road("Main", [1, 2, 3], [0, 40, 60, 40, 120, 40]), road("Side", [2, 4], [60, 40, 60, 100])],
  buildings: [{ id: 7, levels: 4, pts: [20, 60, 50, 60, 50, 75, 20, 75, 20, 60], roof: { colors: ["#aa5533", null, "#884422", null], pitched: true } }],
  areas: [],
  waterways: [],
  pois: [],
  signals: [],
  covered: [],
}

const noCrowns = { xs: new Uint16Array(0), ys: new Uint16Array(0), rs: new Uint8Array(0) }
const scene = new Scene(makeWorld(map), noCrowns, [])

/** Every vertex of a mesh: position, colour and mode. */
const vertices = (mesh: Mesh) => {
  const view = new DataView(mesh.vertices.buffer, mesh.vertices.byteOffset)
  return Array.from({ length: mesh.vertices.length / STRIDE }, (_, i) => ({
    x: view.getFloat32(i * STRIDE, true),
    y: view.getFloat32(i * STRIDE + 4, true),
    z: view.getFloat32(i * STRIDE + 8, true),
    mode: view.getUint8(i * STRIDE + 24),
  }))
}

describe("a chunk of the 3D town", () => {
  const mesh = scene.build(0)
  const vs = vertices(mesh)

  it("extrudes the building to its storeys and puts its roof on top", () => {
    const h = wallHeight(4)
    expect(h).toBe(12)
    expect(vs.filter((v) => v.mode === Mode.material && v.z === h).length).toBeGreaterThanOrEqual(8)
    expect(vs.filter((v) => v.mode === Mode.detail && v.z === h).length).toBeGreaterThanOrEqual(6)
  })

  it("lays the ground first, under every street layer", () => {
    expect(vs.some((v) => v.mode === Mode.ground && v.z === 0 && v.x === CHUNK_M && v.y === CHUNK_M)).toBe(true)
  })

  it("has opaque surfaces and shadows in separate index ranges", () => {
    expect(mesh.opaque % 3).toBe(0)
    expect(mesh.shadow).toBeGreaterThan(0)
    expect(mesh.indices.length).toBe(mesh.opaque + mesh.shadow)
  })

  it("paints lane markings but leaves the junction clear", () => {
    const markings = vs.filter((v) => v.mode === Mode.color && v.z > 0.07 && v.z < 0.09)
    expect(markings.length).toBeGreaterThan(0)
    // The side road is 10 m wide: nothing within its half width plus 2 m of the junction centre.
    expect(markings.some((v) => Math.hypot(v.x - 60, v.y - 40) < 6.5)).toBe(false)
  })

  it("lists the chunk for a view over it, and none for a view far away", () => {
    expect(scene.keysIn({ minX: 10, minY: 10, maxX: 20, maxY: 20 })).toContain(0)
    expect(scene.keysIn({ minX: 200, minY: 200, maxX: 210, maxY: 210 })).not.toContain(0)
  })
})
