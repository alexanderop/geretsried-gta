import { readFileSync } from "node:fs"
import { Schema } from "effect"
import { describe, expect, it } from "vitest"
import { GameMap, type Road } from "#/map/types.ts"
import { pointInPolygon } from "../geometry.ts"
import { rectRing, streetFrame, toLocal, toWorld, wallFrame } from "../frame.ts"
import { makeWorld } from "../world.ts"
import { dressMap, resolvePlaces, type PlaceDressing } from "./dressing.ts"
import { PLACES } from "./index.ts"

const road = (name: string, pts: Array<number>): Road => ({ kind: "residential", name, width: 6, oneway: false, pts, nodes: pts.filter((_, i) => i % 2 === 0).map((_, i) => i + 1) })
const tiny: GameMap = {
  width: 256,
  height: 256,
  bbox: { south: 0, west: 0, north: 1, east: 1 },
  roads: [road("Main", [0, 40, 200, 40])],
  buildings: [
    { id: 1, levels: 2, pts: [20, 60, 50, 60, 50, 75, 20, 75, 20, 60] },
    { id: 2, levels: 2, pts: [80, 60, 100, 60, 100, 80, 80, 80, 80, 60] },
  ],
  areas: [], waterways: [], pois: [{ name: "Shop", kind: "shop", x: 35, y: 62 }],
  signals: [], crossings: [], props: [], districts: [], covered: [], buses: [],
}
const shop: PlaceDressing = { poi: "Shop", street: "Main", osmBuildingId: 1, levels: 3, parts: [] }

describe("the street frame", () => {
  // Main runs east along y = 40; the map's y points south, so the shop at y = 62 lies south of it.
  const f = streetFrame(tiny, "Main", 35, 62)

  it("starts at the place's foot on the centre line, n towards the place, u to its right seen from the street", () => {
    expect(f).toMatchObject({ ox: 35, oy: 40, nx: 0, ny: 1, ux: -1 })
    if (f === null) return
    expect(toWorld(f, 5, 22)).toEqual([30, 62])
    const [u, n] = toLocal(f, 30, 62)
    expect(u).toBeCloseTo(5)
    expect(n).toBeCloseTo(22)
  })

  it("is null for a street the map lacks", () => {
    expect(streetFrame(tiny, "Nowhere", 35, 62)).toBeNull()
  })
})

describe("a wall frame", () => {
  // The square 0..10 either way round: wall 0 of the first runs along y = 0, on its north side.
  const ccw = [0, 0, 10, 0, 10, 10, 0, 10, 0, 0]
  const cw = [0, 0, 0, 10, 10, 10, 10, 0, 0, 0]

  it("starts at the wall's left end seen from outside, n into the building", () => {
    const w = wallFrame(ccw, 0)
    expect(w?.length).toBe(10)
    if (w === null) return
    // From the north, looking south (+y), your right is west: the left end is (10, 0).
    expect(toWorld(w.frame, 0, 0)).toEqual([10, 0])
    expect(toWorld(w.frame, 2, -0.04)).toEqual([8, -0.04])
    const [, inside] = toWorld(w.frame, 5, 1)
    expect(inside).toBeGreaterThan(0)
  })

  it("is the same frame whichever way the outline winds", () => {
    // In the clockwise outline the same wall is the last one, from (10, 0) back to (0, 0).
    expect(wallFrame(cw, 3)).toEqual(wallFrame(ccw, 0))
  })

  it("is null for a wall the footprint does not have", () => {
    expect(wallFrame(ccw, 4)).toBeNull()
    expect(wallFrame(ccw, -1)).toBeNull()
  })
})

describe("dressing a map", () => {
  it("sets the storeys of the dressed footprint only", () => {
    const dressed = dressMap(tiny, [shop])
    expect(dressed.buildings.map((b) => b.levels)).toEqual([3, 2])
    expect(dressed.buildings[1]).toBe(tiny.buildings[1])
  })

  it("leaves the map as it is without a change", () => {
    expect(dressMap(tiny, [])).toBe(tiny)
    expect(dressMap(tiny, [{ ...shop, levels: 2 }])).toBe(tiny)
  })

  it("finds the place by its POI and hangs its frame on the street; drops what is not on the map", () => {
    const places = resolvePlaces(tiny, [shop, { ...shop, osmBuildingId: 99 }, { ...shop, street: "Nowhere" }])
    expect(places).toHaveLength(1)
    expect(places[0]?.building).toBe(0)
    expect(places[0]?.frame).toMatchObject({ ox: 35, oy: 40 })
  })

  it("anchors on the footprint's middle when no POI has the name", () => {
    expect(resolvePlaces(tiny, [{ ...shop, poi: "Unmapped", osmBuildingId: 2 }])[0]?.frame).toMatchObject({ ox: 90, oy: 40 })
  })

  it("gives the world the dressed storeys", () => {
    expect(makeWorld(tiny, [shop]).map.buildings[0]?.levels).toBe(3)
  })
})

describe("the registry on the real map", () => {
  const map = Schema.decodeUnknownSync(GameMap)(JSON.parse(readFileSync("public/geretsried.map.json", "utf8")))
  const dressed = dressMap(map, PLACES)
  const places = resolvePlaces(dressed, PLACES)

  it("has one entry per footprint, and finds every one with its street", () => {
    expect(new Set(PLACES.map((p) => p.osmBuildingId)).size).toBe(PLACES.length)
    expect(places.map((p) => p.dressing.poi)).toEqual(PLACES.map((p) => p.poi))
  })

  it("puts wall parts on walls the footprint has, towers inside it (the footprint is the solid)", () => {
    const wrong = places.flatMap(({ dressing, building, frame }) => {
      const pts = map.buildings[building]?.pts ?? []
      return dressing.parts.flatMap((part) => {
        if (part.kind === "wallSign" || part.kind === "arcade") {
          const wall = wallFrame(pts, part.edge)
          const fits = wall !== null && part.u0 >= 0 && part.u0 < part.u1 && part.u1 <= wall.length + 0.01
          return fits ? [] : [`${dressing.poi}: ${part.kind} on wall ${part.edge}`]
        }
        if (part.kind !== "tower") return []
        const ring = rectRing(frame, part.rect)
        return [0, 1, 2, 3].filter((k) => !pointInPolygon(ring[k * 2] ?? 0, ring[k * 2 + 1] ?? 0, pts)).map((k) => `${dressing.poi}: tower corner ${k} outside`)
      })
    })
    expect(wrong).toEqual([])
  })

  it("keeps bands within the walls", () => {
    const wrong = places.flatMap(({ dressing, building }) => {
      const top = (dressed.buildings[building]?.levels ?? 0) * 3 + 0.6
      return (dressing.bands ?? []).filter((b) => !(b.z0 >= 0 && b.z0 < b.z1 && b.z1 <= top)).map((b) => `${dressing.poi}: band ${b.z0}..${b.z1}`)
    })
    expect(wrong).toEqual([])
  })

  it("gives St. Ursula its four storeys", () => {
    expect(makeWorld(map).map.buildings.find((b) => b.id === 127604847)?.levels).toBe(4)
  })
})
