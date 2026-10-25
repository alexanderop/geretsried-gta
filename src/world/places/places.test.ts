import { readFileSync } from "node:fs"
import { Schema } from "effect"
import { describe, expect, it } from "vitest"
import { GameMap, type Road } from "#/map/types.ts"
import { pointInPolygon } from "../geometry.ts"
import { rectRing, streetFrame, toLocal, toWorld, wallFrame } from "../frame.ts"
import { makeWorld } from "../world.ts"
import { dressMap, resolvePlaces, towerFrame, type PlaceDressing } from "./dressing.ts"
import { PLACES } from "./index.ts"

/** Whether (x, y) lies within 0.3 m of a wall of the ring: the masses' corners are rounded to 0.1 m, so spots there prove nothing. */
const nearWall = (x: number, y: number, ring: ReadonlyArray<number>) => {
  const n = ring.length / 2
  for (let i = 0; i < n; i++) {
    const ax = ring[i * 2] ?? 0
    const ay = ring[i * 2 + 1] ?? 0
    const bx = ring[((i + 1) % n) * 2] ?? 0
    const by = ring[((i + 1) % n) * 2 + 1] ?? 0
    const len2 = (bx - ax) ** 2 + (by - ay) ** 2
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / len2))
    if (Math.hypot(x - ax - t * (bx - ax), y - ay - t * (by - ay)) < 0.3) return true
  }
  return false
}

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
      const place = { dressing, building, frame }
      return dressing.parts.flatMap((part) => {
        if (part.kind === "deck") return wallFrame(pts, part.edge) === null ? [`${dressing.poi}: deck on wall ${part.edge}`] : []
        if (part.kind === "wallSign" || part.kind === "arcade" || part.kind === "balcony" || part.kind === "canopy" || part.kind === "gable" || part.kind === "stairs" || part.kind === "ramp") {
          const wall = wallFrame(pts, part.edge)
          const fits = wall !== null && part.u0 >= 0 && part.u0 < part.u1 && part.u1 <= wall.length + 0.01
          return fits ? [] : [`${dressing.poi}: ${part.kind} on wall ${part.edge}`]
        }
        if (part.kind === "roofSign") {
          const wall = wallFrame(pts, part.edge)
          if (wall === null) return [`${dressing.poi}: roofSign on wall ${part.edge}`]
          const ring = rectRing(wall.frame, [part.u0, part.u1, part.n0, part.n1])
          return [0, 1, 2, 3].filter((k) => !pointInPolygon(ring[k * 2] ?? 0, ring[k * 2 + 1] ?? 0, pts)).map((k) => `${dressing.poi}: roofSign corner ${k} outside`)
        }
        if (part.kind !== "tower") return []
        const f = towerFrame(place, pts, part)
        if (f === null) return [`${dressing.poi}: tower on wall ${part.edge}`]
        const ring = rectRing(f, part.rect)
        return [0, 1, 2, 3].filter((k) => !pointInPolygon(ring[k * 2] ?? 0, ring[k * 2 + 1] ?? 0, pts)).map((k) => `${dressing.poi}: tower corner ${k} outside`)
      })
    })
    expect(wrong).toEqual([])
  })

  it("hangs balconies and door canopies above head height, so people and cars pass under them", () => {
    const low = PLACES.flatMap((d) =>
      d.parts.flatMap((part) => {
        const z = part.kind === "balcony" ? Math.min(...part.z) : part.kind === "canopy" ? part.z - (part.fascia?.h ?? 0) : part.kind === "deck" ? part.z - part.thickness : Infinity
        return z < 2.5 ? [`${d.poi}: ${part.kind} at ${z}`] : []
      }),
    )
    expect(low).toEqual([])
  })

  it("tiles the footprint with its masses: every spot inside it (away from its walls) lies in exactly one, none outside it", () => {
    const wrong = places.flatMap(({ dressing, building }) => {
      const masses = dressing.masses
      if (masses === undefined) return []
      const pts = map.buildings[building]?.pts ?? []
      const xs = pts.filter((_, i) => i % 2 === 0)
      const ys = pts.filter((_, i) => i % 2 === 1)
      const out: Array<string> = []
      for (let x = Math.min(...xs); x <= Math.max(...xs); x += 0.7) {
        for (let y = Math.min(...ys); y <= Math.max(...ys); y += 0.7) {
          if (nearWall(x, y, pts) || masses.some((v) => nearWall(x, y, v.pts))) continue
          const inside = pointInPolygon(x, y, pts) ? 1 : 0
          const hits = masses.filter((v) => pointInPolygon(x, y, v.pts)).length
          if (hits !== inside) out.push(`${dressing.poi}: (${x.toFixed(1)}, ${y.toFixed(1)}) in ${hits} masses, footprint ${inside}`)
        }
      }
      return out.slice(0, 5)
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

  it("dresses the Händelstraße Sparkasse, not the one in the old town, with its four storeys", () => {
    const sparkasse = places.find((p) => p.dressing.osmBuildingId === 128271967)
    expect(map.pois.filter((p) => p.name === "Sparkasse")).toHaveLength(2)
    // The frame's foot on Händelstraße lies opposite the POI at (3550.6, 4719.7), not 2 km away at the other branch.
    expect(Math.hypot((sparkasse?.frame.ox ?? 0) - 3550.6, (sparkasse?.frame.oy ?? 0) - 4719.7)).toBeLessThan(12)
    expect(dressed.buildings[sparkasse?.building ?? -1]?.levels).toBe(4)
  })

  it("dresses the Mühlenbäck at the start with three storeys, not the branch across town", () => {
    const bakery = places.find((p) => p.dressing.osmBuildingId === 127604891)
    // Its frame's foot on Sudetenstraße lies by the POI at (4005.5, 4651.6); "Bäckerei Mühlenbäck" is 2 km away.
    expect(Math.hypot((bakery?.frame.ox ?? 0) - 4005.5, (bakery?.frame.oy ?? 0) - 4651.6)).toBeLessThan(12)
    expect(dressed.buildings[bakery?.building ?? -1]?.levels).toBe(3)
  })

  it("dresses the Post block with three storeys and keeps its letter box and bin on the sidewalk, off the street the van parks on", () => {
    const post = places.find((p) => p.dressing.osmBuildingId === 119921780)
    // The frame's foot on Sudetenstraße lies 10 m from the POI at (4238.7, 4832.4), which the "post" job finds by name.
    expect(Math.hypot((post?.frame.ox ?? 0) - 4238.7, (post?.frame.oy ?? 0) - 4832.4)).toBeLessThan(12)
    expect(dressed.buildings[post?.building ?? -1]?.levels).toBe(3)
    const half = (map.roads.find((r) => r.name === "Sudetenstraße")?.width ?? 0) / 2
    const kerbside = (post?.dressing.parts ?? []).flatMap((p) => (p.kind === "sprite" ? [p.n] : []))
    expect(kerbside.length).toBeGreaterThan(0)
    for (const n of kerbside) expect(n).toBeGreaterThan(half)
  })

  it("dresses Werkstatt Wilhelm as one tall storey with its sign and windows on the NW wall, towards the car park", () => {
    const hall = places.find((p) => p.dressing.osmBuildingId === 128266487)
    // 4.2 m of wall and the 0.6 m parapet: the LoD2 model's 4.8 m.
    expect(dressed.buildings[hall?.building ?? -1]?.levels).toBe(1.4)
    const pts = map.buildings[hall?.building ?? -1]?.pts ?? []
    // Wall 0 faces NW (out of the building towards the service lane, where the spray pad is).
    const nw = wallFrame(pts, 0)?.frame
    expect(Math.atan2(-(nw?.nx ?? 0), nw?.ny ?? 0) * (180 / Math.PI) + 360).toBeCloseTo(322, 0)
    const edges = new Set((hall?.dressing.parts ?? []).flatMap((p) => (p.kind === "wallSign" ? [p.edge] : [])))
    expect([...edges]).toEqual([0])
  })

  it("dresses the Stein Aldi, not the northern one, with its cross gables on the car-park wall, clear of the aisle the VW Bus parks on", () => {
    const aldi = places.find((p) => p.dressing.osmBuildingId === 1385213575)
    // "gartenberg-1" finds the store as the "Aldi Süd" with y > 5000; the other one is 2.9 km north.
    const poi = map.pois.find((p) => p.name === "Aldi Süd" && p.y > 5000)
    expect(Math.hypot((aldi?.frame.ox ?? 0) - (poi?.x ?? 0), (aldi?.frame.oy ?? 0) - (poi?.y ?? 0))).toBeLessThan(50)
    // The LoD2 eaves at 5.6 m.
    expect((dressed.buildings[aldi?.building ?? -1]?.levels ?? 0) * 3).toBeCloseTo(5.6)
    const pts = map.buildings[aldi?.building ?? -1]?.pts ?? []
    const front = wallFrame(pts, 8)?.frame
    // Wall 8 faces ESE, out of the building towards the car park.
    expect((Math.atan2(-(front?.nx ?? 0), front?.ny ?? 0) * (180 / Math.PI) + 360) % 360).toBeCloseTo(124, 0)
    const parts = aldi?.dressing.parts ?? []
    expect(parts.filter((p) => p.kind === "gable" && p.edge === 8)).toHaveLength(2)
    // The service aisle's centre line runs about 7.7 m out from wall 8 and is 4 m wide: the canopies stop short of it.
    const depths = parts.flatMap((p) => (p.kind === "canopy" ? [p.depth] : []))
    expect(depths.length).toBeGreaterThan(0)
    for (const d of depths) expect(d).toBeLessThan(5.7)
  })

  it("dresses the police station as two storeys under a solar canopy over every wall, the entrance on the W side", () => {
    const police = places.find((p) => p.dressing.osmBuildingId === 127717998)
    // "stein-1" finds the drop-off by this exact name; the POI lies inside the footprint.
    const poi = map.pois.find((p) => p.name === "Polizeiinspektion Geretsried")
    const pts = map.buildings[police?.building ?? -1]?.pts ?? []
    expect(police?.dressing.poi).toBe("Polizeiinspektion Geretsried")
    expect(pointInPolygon(poi?.x ?? 0, poi?.y ?? 0, pts)).toBe(true)
    expect(dressed.buildings[police?.building ?? -1]?.levels).toBe(2)
    const parts = police?.dressing.parts ?? []
    // The canopy's rectangle (wall 0's frame) holds every corner of the footprint at least a meter in from its edge.
    const deck = parts.find((p) => p.kind === "deck")
    const f = wallFrame(pts, deck?.kind === "deck" ? deck.edge : -1)?.frame
    expect(deck?.kind === "deck" && f !== undefined).toBe(true)
    if (deck?.kind !== "deck" || f === undefined) return
    const [u0, u1, n0, n1] = deck.rect
    for (let i = 0; i + 1 < pts.length; i += 2) {
      const [u, n] = toLocal(f, pts[i] ?? 0, pts[i + 1] ?? 0)
      expect(Math.min(u - u0, u1 - u, n - n0, n1 - n)).toBeGreaterThan(0.99)
    }
    // Wall 0 faces N (Jeschkenstraße) and carries the sign; wall 4 faces W and has the stairs, the ramp and the door.
    const out = (e: number) => {
      const w = wallFrame(pts, e)?.frame
      return (Math.atan2(-(w?.nx ?? 0), w?.ny ?? 0) * (180 / Math.PI) + 360) % 360
    }
    expect(Math.abs(out(0) - 180)).toBeGreaterThan(170)
    expect(out(4)).toBeCloseTo(269, 0)
    expect(parts.some((p) => p.kind === "wallSign" && p.texture === "polizei-sign" && p.edge === 0)).toBe(true)
    expect(new Set(parts.flatMap((p) => (p.kind === "stairs" || p.kind === "ramp" ? [p.edge] : [])))).toEqual(new Set([4]))
  })

  const at = (id: number) => places.find((p) => p.dressing.osmBuildingId === id)

  it("builds Am Stern from the LoD2 model: tall blocks over low links, PENNY's canopy clear of the aisle, the pylon off Sudetenstraße", () => {
    const west = at(127872184)
    const rossmann = at(293545707)
    const penny = at(822461881)
    const edeka = at(189042651)
    // Rossmann #65 and EDEKA #204, not the namesakes across town: the frames' feet lie by them.
    expect(Math.hypot((rossmann?.frame.ox ?? 0) - 4251.4, (rossmann?.frame.oy ?? 0) - 4773.7)).toBeLessThan(50)
    expect(Math.hypot((edeka?.frame.ox ?? 0) - 4429.1, (edeka?.frame.oy ?? 0) - 4804.1)).toBeLessThan(40)
    expect(Math.hypot((penny?.frame.ox ?? 0) - 4288.8, (penny?.frame.oy ?? 0) - 4804.3)).toBeLessThan(42)
    // Each balcony block over the low part beside it: the west block's Sudetenstraße block 16 m, the link 5.1 m.
    const heights = (p: typeof west) => (p?.dressing.masses ?? []).map((v) => v.levels * 3)
    expect(heights(west)[0]).toBeCloseTo(16)
    expect(heights(west)[1]).toBeLessThan(6)
    expect(Math.max(...heights(penny))).toBeGreaterThan(15)
    expect(Math.min(...heights(penny))).toBeLessThan(7)
    expect(heights(edeka)[0]).toBeCloseTo(8.84)
    // The roof signs: denns, ROSSMANN, PENNY, EDEKA, one each.
    const signs = [west, rossmann, penny, edeka].flatMap((p) => (p?.dressing.parts ?? []).flatMap((x) => (x.kind === "roofSign" ? [x.texture] : [])))
    expect(signs.toSorted()).toEqual(["penny-sign", "roof-denns", "roof-edeka", "roof-rossmann"])
    // The canopy stands on the car-park front and stops short of the aisle 8.5 m out (4 m wide).
    const canopy = (penny?.dressing.parts ?? []).find((x) => x.kind === "canopy")
    expect(canopy?.kind === "canopy" && canopy.edge === 2 && canopy.depth < 6.5).toBe(true)
    // The pylon and the trolleys stand off Sudetenstraße's carriageway and sidewalk, where the Post van parks.
    const half = (map.roads.find((r) => r.name === "Sudetenstraße" && r.kind === "tertiary")?.width ?? 0) / 2
    const free = (penny?.dressing.parts ?? []).flatMap((x) => (x.kind === "pylon" ? [x.n - x.w / 2] : x.kind === "sprite" ? [x.n - x.len / 2] : []))
    expect(free.length).toBeGreaterThan(2)
    for (const n of free) expect(n).toBeGreaterThan(half + 2.6)
  })

  it("gives St. Ursula its four storeys", () => {
    expect(makeWorld(map).map.buildings.find((b) => b.id === 127604847)?.levels).toBe(4)
  })
})
