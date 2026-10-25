import { readFileSync } from "node:fs"
import { Schema } from "effect"
import { describe, expect, it } from "vitest"
import { GameMap, type Road } from "#/map/types.ts"
import { pointInPolygon } from "../geometry.ts"
import { rectRing, streetFrame, toLocal, toWorld, wallFrame } from "../frame.ts"
import { makeWorld } from "../world.ts"
import { dressMap, resolvePlaces, towerFrame, type Part, type PlaceDressing } from "./dressing.ts"
import { PLACES } from "./index.ts"
import { BISTRO_MALOR, KIND, UNITS as UNITS_10 } from "./sudetenstrasse-10.ts"
import { DOLCE_GELATO, STROBLUME, UNITS, VR_BANK } from "./sudetenstrasse-11-15.ts"

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

/** The rise per meter of a roof plane at `deg` degrees. */
const slope = (deg: number) => Math.tan((deg * Math.PI) / 180)
/** The parts hung on a wall (signs and awnings). */
const onWall = (ps: ReadonlyArray<Part>) => ps.flatMap((p) => (p.kind === "wallSign" || p.kind === "canopy" ? [p] : []))

/** The bands that do not lie on a wall `top` meters high. */
const outside = (bands: ReadonlyArray<{ z0: number; z1: number }>, top: number) => bands.filter((b) => !(b.z0 >= 0 && b.z0 < b.z1 && b.z1 <= top + 1e-9))

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
      // With masses the walls are theirs: the place's bands reach the tallest, each mass's own bands its own top.
      const masses = dressing.masses ?? []
      const top = (masses.length > 0 ? Math.max(...masses.map((m) => m.levels)) : (dressed.buildings[building]?.levels ?? 0)) * 3 + 0.6
      return [
        ...outside(dressing.bands ?? [], top).map((b) => `${dressing.poi}: band ${b.z0}..${b.z1}`),
        ...masses.flatMap((m, i) => outside(m.bands ?? [], m.levels * 3 + 0.6).map((b) => `${dressing.poi}: mass ${i} band ${b.z0}..${b.z1}`)),
      ]
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

  it("hangs Angel Nails' pink box sign and pillar on the Mühlenbäck front, against wall 0 and clear of the street", () => {
    const bakery = places.find((p) => p.dressing.osmBuildingId === 127604891)
    const parts = bakery?.dressing.parts ?? []
    const sign = parts.find((p) => p.kind === "wallSign" && p.texture === "angel-nails-sign")
    expect(parts.some((p) => p.kind === "wallSign" && p.texture === "angel-nails-front" && p.edge === 0)).toBe(true)
    const wall = wallFrame(map.buildings[bakery?.building ?? -1]?.pts ?? [], 0)?.frame
    const frame = bakery?.frame
    const boxes = parts.flatMap((p) => (p.kind === "pylon" ? [p] : []))
    expect(boxes).toHaveLength(2)
    if (wall === undefined || frame === undefined || sign?.kind !== "wallSign") return
    for (const b of boxes) {
      // The box's back face lies on wall 0 (within 2 cm), its front at most 0.3 m out, over the sidewalk.
      const [x, y] = toWorld(frame, b.u, b.n)
      const [u, n] = toLocal(wall, x, y)
      expect(Math.abs(n + b.d / 2)).toBeLessThan(0.02)
      expect(b.d).toBeLessThanOrEqual(0.3)
      expect(u).toBeGreaterThan(13)
      expect(u).toBeLessThan(18.6)
    }
    // The box sign under the lettering: same stretch and heights, the lettering on its front.
    const box = boxes.find((b) => b.base !== undefined)
    const [x, y] = toWorld(frame, box?.u ?? 0, box?.n ?? 0)
    const [u] = toLocal(wall, x, y)
    expect(u).toBeCloseTo((sign.u0 + sign.u1) / 2, 1)
    expect(box?.w).toBeCloseTo(sign.u1 - sign.u0)
    expect([box?.base, box?.h]).toEqual([sign.z0, sign.z1])
    expect(sign.out).toBeGreaterThan(box?.d ?? 0)
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

  it("dresses EDEKA's SW front with the yellow band, the logo and the boards, its pylon and canopy off the car park", () => {
    const edeka = at(189042651)
    const pts = map.buildings[edeka?.building ?? -1]?.pts ?? []
    const parts = edeka?.dressing.parts ?? []
    const signs = (edge: number) => parts.flatMap((p) => (p.kind === "wallSign" && p.edge === edge ? [p.texture] : []))
    // Wall 1 is the shop front facing SW (bearing about 230°) on the car park.
    const w1 = wallFrame(pts, 1)?.frame
    expect(w1).toBeDefined()
    if (w1 === undefined) return
    expect(Math.abs(((Math.atan2(-w1.nx, w1.ny) * 180) / Math.PI + 360) % 360 - 230)).toBeLessThan(10)
    for (const t of ["edeka-band", "edeka-logo", "edeka-boards", "edeka-panels", "shop-front"] as const) expect(signs(1)).toContain(t)
    // The band and the logo sit over the canopy, which stays under head height's clearance and short of the car park.
    const canopy = parts.find((p) => p.kind === "canopy")
    const band = parts.find((p) => p.kind === "wallSign" && p.texture === "edeka-band")
    expect(canopy?.kind === "canopy" && band?.kind === "wallSign" && band.z0 > canopy.z).toBe(true)
    const park = map.areas.find((a) => a.kind === "parking" && pointInPolygon(4400, 4840, a.pts))?.pts ?? []
    expect(park.length).toBeGreaterThan(6)
    if (canopy?.kind !== "canopy") return
    for (const u of [canopy.u0, (canopy.u0 + canopy.u1) / 2, canopy.u1]) expect(pointInPolygon(...toWorld(w1, u, -canopy.depth), park)).toBe(false)
    // The pylon stands outside the hall, in front of the corner, not on the car park.
    const pylon = parts.find((p) => p.kind === "pylon")
    expect(pylon?.kind === "pylon" && pylon.texture === "edeka-pylon").toBe(true)
    if (pylon?.kind !== "pylon" || edeka === undefined) return
    const [x, y] = toWorld(edeka.frame, pylon.u, pylon.n)
    const [u, n] = toLocal(w1, x, y)
    expect(u).toBeGreaterThan(3)
    expect(u).toBeLessThan(9)
    expect(n).toBeLessThan(-2)
    expect(pointInPolygon(x, y, pts)).toBe(false)
    expect(pointInPolygon(x, y, park)).toBe(false)
  })

  it("dresses denns BioMarkt at the NW end of the west block's Sudetenstraße front, under the balconies", () => {
    const west = at(127872184)
    const pts = map.buildings[west?.building ?? -1]?.pts ?? []
    const parts = west?.dressing.parts ?? []
    // Wall 0 is the Sudetenstraße front, facing SW (bearing about 213°), u 0 at its NW end.
    const w0 = wallFrame(pts, 0)
    expect(w0).toBeDefined()
    if (w0 === undefined || w0 === null) return
    expect(Math.abs(((Math.atan2(-w0.frame.nx, w0.frame.ny) * 180) / Math.PI + 360) % 360 - 213)).toBeLessThan(10)
    const on0 = (t: string) => parts.flatMap((p) => (p.kind === "wallSign" && p.edge === 0 && p.texture === t ? [p] : []))
    const letters = on0("denns-letters")[0]
    expect(letters).toBeDefined()
    if (letters === undefined) return
    // The letters over the glazing, in the NW half of the front (Takko and Orterer follow SE), under the lowest balcony.
    const glass = on0("denns-front")
    expect(glass.length).toBeGreaterThan(0)
    expect(Math.max(...glass.map((g) => g.z1))).toBeLessThan(letters.z0)
    expect(letters.u1).toBeLessThan(w0.length / 2)
    expect(Math.min(...glass.map((g) => g.u0))).toBeGreaterThan(Math.max(...on0("denns-cladding").map((c) => c.u1)) - 0.01)
    const lowest = Math.min(...parts.flatMap((p) => (p.kind === "balcony" && p.edge === 0 ? p.z : [])))
    expect(letters.z1).toBeLessThan(lowest)
  })

  it("dresses Takko between denns and Orterer's corner on the west block's Sudetenstraße front, under the balconies", () => {
    const west = at(127872184)
    const pts = map.buildings[west?.building ?? -1]?.pts ?? []
    const parts = west?.dressing.parts ?? []
    const w0 = wallFrame(pts, 0)
    expect(w0).toBeDefined()
    if (w0 === undefined || w0 === null) return
    const on0 = (t: string) => parts.flatMap((p) => (p.kind === "wallSign" && p.edge === 0 && p.texture === t ? [p] : []))
    const sign = on0("takko-sign")[0]
    const glass = on0("takko-front")
    expect(sign).toBeDefined()
    if (sign === undefined) return
    expect(glass.length).toBeGreaterThan(0)
    // Its glazing starts where denns' ends and stops short of the S corner (Orterer's pier and arcade, B3-5).
    const start = Math.min(...glass.map((g) => g.u0))
    const end = Math.max(...glass.map((g) => g.u1))
    expect(Math.abs(start - Math.max(...on0("denns-front").map((g) => g.u1)))).toBeLessThan(0.01)
    expect(end).toBeLessThan(w0.length - 8)
    // The panel over the glazing, on the white band under the lowest balcony, just proud of the band's face.
    expect(sign.u0).toBeGreaterThan(start)
    expect(sign.u1).toBeLessThan(end)
    expect(sign.z0).toBeGreaterThan(Math.max(...glass.map((g) => g.z1)))
    const lowest = Math.min(...parts.flatMap((p) => (p.kind === "balcony" && p.edge === 0 ? p.z : [])))
    expect(sign.z1).toBeLessThan(lowest)
    const band = parts.find((p) => p.kind === "canopy" && p.edge === 0 && p.fascia !== undefined)
    expect(band?.kind === "canopy" && band.u1 >= end).toBe(true)
    expect(sign.out ?? 0).toBeGreaterThan(band?.kind === "canopy" ? band.depth : Infinity)
  })

  it("dresses Orterer's S corner: the board on the pier after Takko, the open arcade round the corner, the passage left clear", () => {
    const west = at(127872184)
    const pts = map.buildings[west?.building ?? -1]?.pts ?? []
    const parts = west?.dressing.parts ?? []
    const w0 = wallFrame(pts, 0)
    const w1 = wallFrame(pts, 1)
    expect(w0 && w1).toBeTruthy()
    if (!w0 || !w1 || west === undefined) return
    const signs = (edge: number, t: string) => parts.flatMap((p) => (p.kind === "wallSign" && p.edge === edge && p.texture === t ? [p] : []))
    // The pier starts where Takko's glazing ends; the board sits on it, over the glazing's height and under the balconies.
    const pier = signs(0, "orterer-pier")[0]
    const logo = signs(0, "orterer-logo")[0]
    expect(pier && logo).toBeTruthy()
    if (!pier || !logo) return
    expect(Math.abs(pier.u0 - Math.max(...signs(0, "takko-front").map((g) => g.u1)))).toBeLessThan(0.01)
    expect(logo.u0).toBeGreaterThan(pier.u0)
    expect(logo.u1).toBeLessThan(pier.u1)
    const lowest = Math.min(...parts.flatMap((p) => (p.kind === "balcony" && p.edge === 0 ? p.z : [])))
    expect(logo.z1).toBeLessThan(lowest)
    // The open corner runs from the pier to the S corner, on grey pillars; the arcade turns it onto wall 1.
    const arcade0 = signs(0, "orterer-arcade")
    expect(Math.min(...arcade0.map((a) => a.u0))).toBeCloseTo(pier.u1, 2)
    expect(Math.max(...arcade0.map((a) => a.u1))).toBeGreaterThan(w0.length - 0.2)
    const canopies = (edge: number) => parts.flatMap((p) => (p.kind === "canopy" && p.edge === edge && p.posts !== undefined ? [p] : []))
    expect(canopies(0).length).toBe(1)
    const beam = canopies(1)[0]
    expect(beam?.u0).toBe(0)
    expect(signs(1, "orterer-arcade").length).toBeGreaterThan(2)
    // The passage stays as it was: the beam's pillars stay off the synthetic building -156 beside wall 1, and nothing new is solid
    // (posts and sprites never are), so building -156 and the pavement round it are untouched.
    const box = map.buildings.find((b) => b.id === -156)?.pts ?? []
    expect(box.length).toBeGreaterThan(0)
    const nearest = Math.min(...box.flatMap((_, i) => (i % 2 === 0 ? [-toLocal(w1.frame, box[i] ?? 0, box[i + 1] ?? 0)[1]] : [])))
    expect(beam?.depth ?? Infinity).toBeLessThan(nearest)
    // The crate rows stand in the corner opening, off Sudetenstraße's carriageway and sidewalk.
    const half = (map.roads.find((r) => r.name === "Sudetenstraße" && r.kind === "tertiary")?.width ?? 0) / 2
    const crates = parts.flatMap((p) => (p.kind === "sprite" && p.name === "crate-stack" ? [p] : []))
    expect(crates.length).toBe(2)
    for (const c of crates) {
      expect(c.n - c.len / 2).toBeGreaterThan(half + 2.6)
      const [x, y] = toWorld(west.frame, c.u, c.n)
      const [u, out] = toLocal(w0.frame, x, y)
      expect(u).toBeGreaterThan(pier.u1)
      expect(u).toBeLessThan(w0.length)
      expect(-out).toBeLessThan(2.5)
    }
  })

  it("dresses GG Radsport on the west block's Marienburgweg face: the shared steel canopy, the red fascia on its front, bikes off the road", () => {
    const west = at(127872184)
    const pts = map.buildings[west?.building ?? -1]?.pts ?? []
    const parts = west?.dressing.parts ?? []
    const w5 = wallFrame(pts, 5)
    expect(w5).toBeTruthy()
    if (!w5 || west === undefined) return
    // Wall 5 faces Marienburgweg (NW, bearing about 304°), from the N corner to the W corner.
    expect(Math.abs(((Math.atan2(-w5.frame.nx, w5.frame.ny) * 180) / Math.PI + 360) % 360 - 304)).toBeLessThan(10)
    // One steel canopy without posts from GG's glazing over the link to the Sudetenstraße block's end (u 37.5), for B4-5 and B4-6 too.
    const canopies = parts.flatMap((p) => (p.kind === "canopy" && p.edge === 5 ? [p] : []))
    expect(canopies).toHaveLength(1)
    const canopy = canopies[0]
    if (!canopy) return
    expect(canopy.posts).toBeUndefined()
    expect(canopy.u1).toBeGreaterThan(45)
    const signs = (t: string) => parts.flatMap((p) => (p.kind === "wallSign" && p.edge === 5 && p.texture === t ? [p] : []))
    const glass = [...signs("gg-glass"), ...signs("gg-door")]
    const fascia = signs("gg-fascia")[0]
    expect(glass).toHaveLength(4)
    expect(fascia).toBeDefined()
    if (!fascia) return
    // The POI (u 11.6) lies in the unit; the fascia spans its glazing and hangs on the canopy's front, over head height.
    const [poiU] = toLocal(w5.frame, 4174.6, 4715.9)
    expect(poiU).toBeGreaterThan(Math.min(...glass.map((g) => g.u0)))
    expect(poiU).toBeLessThan(Math.max(...glass.map((g) => g.u1)))
    expect(fascia.u0).toBeLessThanOrEqual(Math.min(...glass.map((g) => g.u0)))
    expect(fascia.u1).toBeGreaterThanOrEqual(Math.max(...glass.map((g) => g.u1)))
    expect(fascia.out ?? 0).toBeGreaterThan(canopy.depth)
    expect(fascia.z1).toBeLessThanOrEqual(canopy.z)
    expect(fascia.z0).toBeGreaterThan(2.5)
    for (const g of glass) expect(g.z1).toBeLessThanOrEqual(fascia.z0)
    // The bikes and the A-board stand in front of the unit, between the wall and Marienburgweg's carriageway.
    const lane = map.roads.find((r) => r.name === "Marienburgweg")
    const half = (lane?.width ?? 0) / 2
    const props = parts.flatMap((p) => (p.kind === "sprite" && (p.name === "bike-rack" || p.name === "gg-aboard") ? [p] : []))
    expect(props).toHaveLength(2)
    for (const s of props) {
      const [x, y] = toWorld(west.frame, s.u, s.n)
      const [u, n] = toLocal(w5.frame, x, y)
      expect(u).toBeGreaterThan(5)
      expect(u).toBeLessThan(15)
      expect(-n).toBeGreaterThan(1)
      const rp = lane?.pts ?? []
      const gap = Math.min(...rp.flatMap((_, i) => {
        if (i % 2 !== 0 || i + 3 >= rp.length) return []
        const [ax, ay, bx, by] = [rp[i] ?? 0, rp[i + 1] ?? 0, rp[i + 2] ?? 0, rp[i + 3] ?? 0]
        const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2 || 1)))
        return [Math.hypot(x - ax - t * (bx - ax), y - ay - t * (by - ay))]
      }))
      expect(gap - s.len / 2).toBeGreaterThan(half + 1)
    }
  })

  it("dresses Aphrodite Aesthetic next to GG Radsport under the shared canopy: glazing round the POI, the gold fascia on the canopy's front, hedge off the road", () => {
    const west = at(127872184)
    const pts = map.buildings[west?.building ?? -1]?.pts ?? []
    const parts = west?.dressing.parts ?? []
    const w5 = wallFrame(pts, 5)
    if (!w5 || west === undefined) throw new Error("no wall 5")
    const canopy = parts.find((p) => p.kind === "canopy" && p.edge === 5)
    if (canopy?.kind !== "canopy") throw new Error("no canopy")
    const signs = (t: string) => parts.flatMap((p) => (p.kind === "wallSign" && p.edge === 5 && p.texture === t ? [p] : []))
    const glass = [...signs("aphrodite-glass"), ...signs("aphrodite-door")]
    const fascia = signs("aphrodite-fascia")
    expect(glass).toHaveLength(5)
    expect(fascia).toHaveLength(1)
    expect(signs("mb-house-door")).toHaveLength(1)
    const f = fascia[0]
    if (!f) return
    const lo = Math.min(...glass.map((g) => g.u0))
    const hi = Math.max(...glass.map((g) => g.u1))
    // The POI (u 23.2) lies in the glazing, which starts N of GG's and ends inside the canopy, clear of GG's unit and steps.
    const [poiU] = toLocal(w5.frame, 4170, 4726.8)
    expect(poiU).toBeGreaterThan(lo)
    expect(poiU).toBeLessThan(hi)
    const gg = [...signs("gg-glass"), ...signs("gg-door"), ...signs("mb-house-door")]
    expect(lo).toBeGreaterThanOrEqual(Math.max(...gg.map((g) => g.u1)))
    expect(hi).toBeLessThan(canopy.u1)
    // The fascia spans the glazing on the canopy's front over head height; the glazing stays under it.
    expect(f.u0).toBeLessThanOrEqual(lo)
    expect(f.u1).toBeGreaterThanOrEqual(hi)
    expect(f.out ?? 0).toBeGreaterThan(canopy.depth)
    expect(f.z1).toBeLessThanOrEqual(canopy.z)
    expect(f.z0).toBeGreaterThan(2.5)
    for (const g of glass) expect(g.z1).toBeLessThanOrEqual(f.z0)
    // The railing and the hedge run along the unit between the wall and Marienburgweg's carriageway, along wall 5.
    const lane = map.roads.find((r) => r.name === "Marienburgweg")
    const half = (lane?.width ?? 0) / 2
    const boxes = parts.flatMap((p) => (p.kind === "pylon" && p.texture === undefined ? [p] : []))
    for (const b of boxes) {
      const [x, y] = toWorld(west.frame, b.u, b.n)
      const [u, n] = toLocal(w5.frame, x, y)
      if (u < 17 || u > 29) continue
      // `h` is the box's top, over `base` when it floats (the rail).
      expect(b.h).toBeGreaterThan(b.base ?? 0)
      expect(-n).toBeGreaterThan(1.6)
      expect(-n + b.d / 2).toBeLessThan(3)
      // A box runs along (cos, -sin) of its angle in the street frame (places.ts).
      const [ex, ey] = toWorld(west.frame, b.u + (Math.cos(b.angle) * b.w) / 2, b.n - (Math.sin(b.angle) * b.w) / 2)
      const [eu, en] = toLocal(w5.frame, ex, ey)
      expect(Math.abs(eu - u)).toBeCloseTo(b.w / 2, 1)
      expect(Math.abs(en - n)).toBeLessThan(0.1)
      const rp = lane?.pts ?? []
      const gap = Math.min(...rp.flatMap((_, i) => {
        if (i % 2 !== 0 || i + 3 >= rp.length) return []
        const [ax, ay, bx, by] = [rp[i] ?? 0, rp[i + 1] ?? 0, rp[i + 2] ?? 0, rp[i + 3] ?? 0]
        const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2 || 1)))
        return [Math.hypot(x - ax - t * (bx - ax), y - ay - t * (by - ay))]
      }))
      expect(gap - b.d).toBeGreaterThan(half + 1)
    }
    expect(boxes.filter((b) => b.w > 10)).toHaveLength(2)
  })

  it("dresses Nexial S of Aphrodite: the insurance glazing and its slate fascia on the canopy's front, the nexial panel on the wall over the canopy, hedge off the road", () => {
    const west = at(127872184)
    const pts = map.buildings[west?.building ?? -1]?.pts ?? []
    const parts = west?.dressing.parts ?? []
    const w5 = wallFrame(pts, 5)
    if (!w5 || west === undefined) throw new Error("no wall 5")
    const canopy = parts.find((p) => p.kind === "canopy" && p.edge === 5)
    if (canopy?.kind !== "canopy") throw new Error("no canopy")
    const signs = (t: string) => parts.flatMap((p) => (p.kind === "wallSign" && p.edge === 5 && p.texture === t ? [p] : []))
    const door = signs("wv-door")
    expect(door).toHaveLength(1)
    const glass = [...signs("wv-glass").filter((g) => g.z0 < 1), ...door]
    expect(glass).toHaveLength(6)
    const [fascia] = signs("wv-fascia")
    const [panel] = signs("nexial-panel")
    if (!fascia || !panel) throw new Error("no signs")
    const lo = Math.min(...glass.map((g) => g.u0))
    const hi = Math.max(...glass.map((g) => g.u1))
    // S of Aphrodite's glazing, inside the canopy's run and the wall; the POI lies further S in the same face.
    const aph = [...signs("aphrodite-glass"), ...signs("aphrodite-door")]
    expect(lo).toBeGreaterThan(Math.max(...aph.map((g) => g.u1)))
    expect(hi).toBeLessThan(canopy.u1)
    const [poiU, poiN] = toLocal(w5.frame, 4159, 4743.5)
    expect(poiU).toBeGreaterThan(hi)
    expect(poiU).toBeLessThan(w5.length)
    expect(Math.abs(poiN)).toBeLessThan(8)
    // The fascia spans the glazing on the canopy's front over head height; the glazing stays under it.
    expect(fascia.u0).toBeLessThanOrEqual(lo)
    expect(fascia.u1).toBeGreaterThanOrEqual(hi)
    expect(fascia.out ?? 0).toBeGreaterThan(canopy.depth)
    expect(fascia.z1).toBeLessThanOrEqual(canopy.z)
    expect(fascia.z0).toBeGreaterThan(2.5)
    for (const g of glass) expect(g.z1).toBeLessThanOrEqual(fascia.z0)
    // The panel sits on the wall above the canopy, over the glazing, under the link's 5.7 m roof.
    expect(panel.z0).toBeGreaterThan(canopy.z)
    expect(panel.z1).toBeLessThan(5.7)
    expect(panel.u0).toBeGreaterThanOrEqual(lo)
    expect(panel.u1).toBeLessThanOrEqual(hi)
    // The hedge and rail run on along the glazing, off Marienburgweg's carriageway.
    const lane = map.roads.find((r) => r.name === "Marienburgweg")
    const half = (lane?.width ?? 0) / 2
    const rp = lane?.pts ?? []
    const boxes = parts.flatMap((p) => (p.kind === "pylon" && p.texture === undefined ? [p] : []))
    let along = 0
    for (const b of boxes) {
      const [x, y] = toWorld(west.frame, b.u, b.n)
      const [u, n] = toLocal(w5.frame, x, y)
      if (u < 29 || u > 42) continue
      along++
      expect(b.h).toBeGreaterThan(b.base ?? 0)
      expect(-n).toBeGreaterThan(1.6)
      expect(-n + b.d / 2).toBeLessThan(3)
      const gap = Math.min(...rp.flatMap((_, i) => {
        if (i % 2 !== 0 || i + 3 >= rp.length) return []
        const [ax, ay, bx, by] = [rp[i] ?? 0, rp[i + 1] ?? 0, rp[i + 2] ?? 0, rp[i + 3] ?? 0]
        const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2 || 1)))
        return [Math.hypot(x - ax - t * (bx - ax), y - ay - t * (by - ay))]
      }))
      expect(gap - b.d).toBeGreaterThan(half + 1)
    }
    expect(along).toBeGreaterThanOrEqual(5)
  })

  it("dresses the Ahorn Apotheke's W corner: letters on the car-park band, glass on both faces, the red A held out by the corner", () => {
    const penny = at(822461881)
    const pts = map.buildings[penny?.building ?? -1]?.pts ?? []
    const parts = penny?.dressing.parts ?? []
    const w0 = wallFrame(pts, 0)
    const w1 = wallFrame(pts, 1)
    expect(w0 && w1).toBeTruthy()
    if (!w0 || !w1 || penny === undefined) return
    // Wall 0 is the end wall facing Sudetenstraße (bearing about 213°), wall 1 the car-park front (about 303°); they meet
    // at the W corner, u 0 of wall 0 and the far end of wall 1.
    const bearing = (f: typeof w0.frame) => ((Math.atan2(-f.nx, f.ny) * 180) / Math.PI + 360) % 360
    expect(Math.abs(bearing(w0.frame) - 213)).toBeLessThan(10)
    expect(Math.abs(bearing(w1.frame) - 303)).toBeLessThan(10)
    const signs = (edge: number, t: string) => parts.flatMap((p) => (p.kind === "wallSign" && p.edge === edge && p.texture === t ? [p] : []))
    // Glass on both faces: wall 1 up to the corner, wall 0 from it.
    expect(Math.max(...signs(1, "ahorn-front").map((g) => g.u1))).toBeGreaterThan(w1.length - 1)
    expect(Math.min(...signs(0, "ahorn-front").map((g) => g.u0))).toBeLessThan(1)
    // The letters on the white band over the glass, flush with the balconies' fronts and under the lowest balcony.
    const letters = signs(1, "ahorn-letters")[0]
    const band = parts.find((p) => p.kind === "canopy" && p.edge === 1)
    expect(letters && band?.kind === "canopy").toBeTruthy()
    if (!letters || band?.kind !== "canopy") return
    const balcony = parts.find((p) => p.kind === "balcony" && p.edge === 1)
    expect(balcony?.kind === "balcony" && band.depth >= balcony.depth && letters.z1 < Math.min(...balcony.z)).toBe(true)
    expect(letters.out ?? 0).toBeGreaterThan(band.depth)
    expect(letters.z0).toBeGreaterThan(Math.max(...signs(1, "ahorn-front").map((g) => g.z1)))
    expect(band.u1).toBeCloseTo(w1.length, 1)
    // The end wall's light box and PENNY.'s board stand apart, the light box nearer the corner.
    const board = signs(0, "ahorn-board")[0]
    const penny0 = signs(0, "penny-sign")[0]
    expect(board && penny0).toBeTruthy()
    if (!board || !penny0) return
    expect(board.u1).toBeLessThan(penny0.u0)
    // The red A: a raised box (not on the ground) just out from the end wall within 2 m of the corner, off Sudetenstraße.
    const a = parts.find((p) => p.kind === "pylon" && p.texture === "ahorn-a")
    expect(a?.kind).toBe("pylon")
    if (a?.kind !== "pylon") return
    expect(a.base ?? 0).toBeGreaterThan(3.5)
    const [u, n] = toLocal(w0.frame, ...toWorld(penny.frame, a.u, a.n))
    expect(u).toBeGreaterThan(0)
    expect(u).toBeLessThan(2)
    expect(-n - a.w / 2).toBeGreaterThan(0)
    expect(-n + a.w / 2).toBeLessThan(1.5)
  })

  it("dresses da Daniele between PENNY and Ahorn: the crimson board under the script on the flush band, the barrier off the aisle", () => {
    const penny = at(822461881)
    const pts = map.buildings[penny?.building ?? -1]?.pts ?? []
    const parts = penny?.dressing.parts ?? []
    const w2 = wallFrame(pts, 2)
    expect(w2).toBeTruthy()
    if (!w2 || penny === undefined) return
    const sign = (t: string) => parts.find((p) => p.kind === "wallSign" && p.edge === 2 && p.texture === t)
    const board = sign("daniele-fascia")
    const script = sign("daniele-script")
    // Wall 2's canopies: PENNY's free-standing one first, then the band from its end to the bend.
    const [canopy, band] = parts.filter((p) => p.kind === "canopy" && p.edge === 2)
    expect(board?.kind === "wallSign" && script?.kind === "wallSign" && band?.kind === "canopy" && canopy?.kind === "canopy").toBe(true)
    if (board?.kind !== "wallSign" || script?.kind !== "wallSign" || band?.kind !== "canopy" || canopy?.kind !== "canopy") return
    // Past PENNY's canopy, on the stretch up to the bend; the band reaches the bend and stands out as far as the balconies.
    expect(band.u0).toBeGreaterThan(canopy.u1)
    expect(band.u1).toBeCloseTo(w2.length, 1)
    expect(board.u0).toBeGreaterThan(band.u0)
    expect(board.u1).toBeLessThan(w2.length)
    const balcony = parts.find((p) => p.kind === "balcony" && p.edge === 2)
    expect(balcony?.kind === "balcony" && band.depth >= balcony.depth && script.z1 < Math.min(...balcony.z)).toBe(true)
    // On the band's face: the board at its foot, the script over the board.
    expect(board.out ?? 0).toBeGreaterThan(band.depth)
    expect(board.z0).toBeCloseTo(band.z - (band.fascia?.h ?? 0))
    expect(script.z0).toBeGreaterThan(board.z1)
    // The barrier and its sign: outside the building, clear of every car-park lane (4 m wide) and of Sudetenstraße.
    const barrier = parts.flatMap((p) => (p.kind === "pylon" && (p.texture === undefined || p.texture === "daniele-parking") ? [toWorld(penny.frame, p.u, p.n)] : []))
    expect(barrier.length).toBeGreaterThan(3)
    const lanes = map.roads.filter((r) => r.pts.some((v, i) => i % 2 === 0 && Math.hypot(v - 4270, (r.pts[i + 1] ?? 0) - 4817) < 40))
    const dist = (x: number, y: number, r: (typeof lanes)[number]) => {
      let d = Infinity
      for (let i = 0; i + 3 < r.pts.length; i += 2) {
        const [ax, ay, bx, by] = [r.pts[i] ?? 0, r.pts[i + 1] ?? 0, r.pts[i + 2] ?? 0, r.pts[i + 3] ?? 0]
        const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2)))
        d = Math.min(d, Math.hypot(x - ax - t * (bx - ax), y - ay - t * (by - ay)))
      }
      return d
    }
    for (const [x, y] of barrier) {
      expect(pointInPolygon(x, y, pts)).toBe(false)
      for (const r of lanes) expect(dist(x, y, r)).toBeGreaterThan(r.width / 2 + 0.5)
    }
  })

  it("dresses Rossmann's car-park front: letters over the glazing by the bend, under the balconies, chimneys on the roof", () => {
    const rossmann = at(293545707)
    const pts = map.buildings[rossmann?.building ?? -1]?.pts ?? []
    const parts = rossmann?.dressing.parts ?? []
    // Walls 3 and 4 are the car-park front, facing SW (bearing about 213°), their shared corner the bend by the POI.
    for (const edge of [3, 4]) {
      const w = wallFrame(pts, edge)
      expect(w).toBeDefined()
      if (w === undefined || w === null) return
      expect(Math.abs(((Math.atan2(-w.frame.nx, w.frame.ny) * 180) / Math.PI + 360) % 360 - 213)).toBeLessThan(10)
    }
    const letters = parts.find((p) => p.kind === "wallSign" && p.texture === "rossmann-letters")
    const glass = parts.flatMap((p) => (p.kind === "wallSign" && p.texture === "rossmann-front" ? [p] : []))
    expect(letters?.kind).toBe("wallSign")
    if (letters?.kind !== "wallSign") return
    // The letters over glazing on the same wall, under the lowest balcony, within 10 m of the bend.
    expect(glass.some((g) => g.edge === letters.edge && g.u0 <= letters.u0 + 0.5 && g.z1 < letters.z0)).toBe(true)
    const lowest = Math.min(...parts.flatMap((p) => (p.kind === "balcony" ? p.z : [])))
    expect(letters.z1).toBeLessThan(lowest)
    expect(letters.edge === 4 ? letters.u0 : (wallFrame(pts, 3)?.length ?? 0) - letters.u1).toBeLessThan(10)
    // The chimneys rise over the block's 15 m ridge.
    const chimneys = parts.flatMap((p) => (p.kind === "tower" ? [p] : []))
    expect(chimneys.length).toBe(8)
    for (const c of chimneys) expect(c.h).toBeGreaterThan(15)
  })

  it("dresses TEDi's Sudetenstraße front: two blue boxes on the canopy under the stair strip, racks on the pavement", () => {
    const tedi = at(120402837)
    const pts = map.buildings[tedi?.building ?? -1]?.pts ?? []
    const parts = tedi?.dressing.parts ?? []
    expect(tedi).toBeDefined()
    if (tedi === undefined) return
    // Walls 6 and 7 face Sudetenstraße (NE, bearing about 33°).
    for (const edge of [6, 7]) {
      const w = wallFrame(pts, edge)
      expect(w).toBeTruthy()
      if (!w) return
      expect(Math.abs(((Math.atan2(-w.frame.nx, w.frame.ny) * 180) / Math.PI + 360) % 360 - 33)).toBeLessThan(10)
    }
    // The white block at the NW end stands over the peach TEDi block, the hall low behind it (LoD2).
    const [nw, block, hall] = tedi.dressing.masses ?? []
    expect(nw && block && hall && nw.levels > block.levels && block.levels > hall.levels * 2).toBe(true)
    // The two boxes on the canopy's front, side by side under the stairwell strip, above head height.
    const boxes = parts.flatMap((p) => (p.kind === "wallSign" && p.texture === "tedi-sign" ? [p] : []))
    const strip = parts.find((p) => p.kind === "wallSign" && p.texture === "tedi-stair")
    const canopy = parts.find((p) => p.kind === "canopy" && p.edge === 6)
    expect(boxes).toHaveLength(2)
    expect(strip?.kind === "wallSign" && canopy?.kind === "canopy").toBe(true)
    if (strip?.kind !== "wallSign" || canopy?.kind !== "canopy") return
    for (const b of boxes) {
      expect(b.edge).toBe(6)
      expect(b.out ?? 0).toBeGreaterThan(canopy.depth)
      expect(b.z0).toBeGreaterThan(2.5)
      expect(b.z1).toBeLessThanOrEqual(strip.z0 + 0.6)
      expect(b.u0).toBeGreaterThanOrEqual(strip.u0 - 0.6)
      expect(b.u1).toBeLessThanOrEqual(strip.u1 + 0.6)
    }
    // The racks stand outside the building, on the pavement off Sudetenstraße's carriageway.
    const racks = parts.flatMap((p) => (p.kind === "sprite" && p.name === "goods-rack" ? [p] : []))
    expect(racks.length).toBeGreaterThan(2)
    for (const r of racks) {
      const [x, y] = toWorld(tedi.frame, r.u, r.n)
      expect(pointInPolygon(x, y, pts)).toBe(false)
      expect(r.n).toBeGreaterThan(4 + 2)
    }
  })

  it("dresses Sun Style and Kafka on the white block: fascia under and panel over the glass canopy's front, the porch and its board by the seam", () => {
    const tedi = at(120402837)
    const pts = map.buildings[tedi?.building ?? -1]?.pts ?? []
    const parts = tedi?.dressing.parts ?? []
    const w7 = wallFrame(pts, 7)
    if (!w7 || tedi === undefined) throw new Error("no wall 7")
    const sign = (t: string) => parts.find((p) => p.kind === "wallSign" && p.texture === t)
    const canopies = parts.flatMap((p) => (p.kind === "canopy" && p.edge === 7 ? [p] : []))
    const glass = canopies.find((c) => c.texture === "canopy-glass")
    const fascia = sign("sunstyle-fascia")
    const kafka = sign("kafka-sign")
    const board = sign("sunstyle-board")
    if (!glass || fascia?.kind !== "wallSign" || kafka?.kind !== "wallSign" || board?.kind !== "wallSign") throw new Error("missing parts")
    // The glass canopy runs along the white block's ground floor NW of the seam (u 9.37), within wall 7.
    expect(glass.u0).toBeGreaterThan(9.37)
    expect(glass.u1).toBeLessThan(w7.length)
    // Sun Style's fascia hangs from the canopy's front edge, SE of Kafka's panel standing on it; both over head height.
    expect(fascia.out ?? 0).toBeGreaterThan(glass.depth)
    expect(kafka.out ?? 0).toBeGreaterThan(glass.depth)
    expect(fascia.z1).toBeCloseTo(glass.z)
    expect(fascia.z0).toBeGreaterThanOrEqual(2.5)
    expect(kafka.z0).toBeCloseTo(glass.z)
    expect(fascia.u1).toBeLessThan(kafka.u0)
    expect(fascia.u0).toBeGreaterThanOrEqual(glass.u0)
    expect(kafka.u1).toBeLessThanOrEqual(glass.u1)
    // The glazing under the canopy stays under the fascia; one door in each unit.
    const bays = parts.flatMap((p) => (p.kind === "wallSign" && p.edge === 7 && (p.texture === "sunstyle-glass" || p.texture === "sunstyle-door") ? [p] : []))
    expect(bays.filter((b) => b.texture === "sunstyle-door")).toHaveLength(2)
    for (const b of bays) {
      expect(b.z1).toBeLessThanOrEqual(fascia.z0)
      expect(b.u0).toBeGreaterThanOrEqual(glass.u0)
      expect(b.u1).toBeLessThanOrEqual(glass.u1)
    }
    // The porch over the seam (LoD2 105018834, u 6.1–9.3) sits lower than both canopies and clear of TEDi's; the board on
    // its front, the pier under its SE front corner outside the footprint.
    const porch = canopies.find((c) => c.u0 > 5.5 && c.u1 < 9.37)
    const tediCanopy = canopies.find((c) => c.u0 === 0)
    if (!porch || !tediCanopy) throw new Error("no porch")
    expect(porch.z).toBeLessThan(tediCanopy.z)
    expect(porch.u0).toBeGreaterThanOrEqual(tediCanopy.u1)
    expect(board.out ?? 0).toBeGreaterThan(porch.depth)
    expect(board.u0).toBeGreaterThanOrEqual(porch.u0)
    expect(board.u1).toBeLessThanOrEqual(porch.u1)
    expect(board.z1).toBeLessThanOrEqual(porch.z - (porch.fascia?.h ?? 0))
    const pier = parts.find((p) => p.kind === "pylon" && p.texture === undefined)
    if (pier?.kind !== "pylon") throw new Error("no pier")
    const [px, py] = toWorld(tedi.frame, pier.u, pier.n)
    expect(pointInPolygon(px, py, pts)).toBe(false)
    const [pu, pn] = toLocal(w7.frame, px, py)
    expect(pu).toBeGreaterThan(porch.u0)
    expect(pu).toBeLessThan(porch.u0 + 1)
    expect(-pn).toBeGreaterThan(1.5)
    expect(-pn).toBeLessThan(porch.depth)
    expect(pier.h).toBeLessThanOrEqual(porch.z)
  })

  it("dresses Woolworth's car-park front: red letters on the white band over the glazing, the LoD2 flat roof", () => {
    const woolworth = at(1385222318)
    const pts = map.buildings[woolworth?.building ?? -1]?.pts ?? []
    const parts = woolworth?.dressing.parts ?? []
    expect(woolworth).toBeDefined()
    // Wall 2 faces the car park and Sudetenstraße (SW, bearing about 213°).
    const w = wallFrame(pts, 2)
    expect(w).toBeTruthy()
    if (!w) return
    expect(Math.abs(((Math.atan2(-w.frame.nx, w.frame.ny) * 180) / Math.PI + 360) % 360 - 213)).toBeLessThan(10)
    // One storey at the model's 4.46 m (with the parapet).
    expect((woolworth?.dressing.levels ?? 0) * 3 + 0.6).toBeCloseTo(4.46, 2)
    // The letters on the band, in its E half, over the glazing and under the roof's edge.
    const letters = parts.find((p) => p.kind === "wallSign" && p.texture === "woolworth-letters")
    const glass = parts.flatMap((p) => (p.kind === "wallSign" && p.texture === "woolworth-front" ? [p] : []))
    expect(letters?.kind).toBe("wallSign")
    if (letters?.kind !== "wallSign") return
    expect(letters.edge).toBe(2)
    expect(letters.u0).toBeGreaterThan(w.length / 2)
    expect(letters.u1).toBeLessThan(w.length)
    expect(letters.z1).toBeLessThanOrEqual(4.46)
    expect(glass.length).toBeGreaterThan(5)
    for (const g of glass) expect(g.z1).toBeLessThanOrEqual(letters.z0)
  })

  it("dresses B&L Hairstyling's street front: the black board over its door in the cream NW house, the white SE houses", () => {
    const bl = at(119921782)
    const pts = map.buildings[bl?.building ?? -1]?.pts ?? []
    const dressing = bl?.dressing
    expect(dressing).toBeDefined()
    if (!dressing) return
    // Wall 3 faces Sudetenstraße (NE, bearing about 33°).
    const w = wallFrame(pts, 3)
    expect(w).toBeTruthy()
    if (!w) return
    expect(Math.abs(((Math.atan2(-w.frame.nx, w.frame.ny) * 180) / Math.PI + 360) % 360 - 33)).toBeLessThan(10)
    // Two masses at the LoD2 eaves (9.8 m): the white SE houses and the cream NW house.
    expect(dressing.masses?.map((m) => m.levels * 3)).toEqual([9.8, 9.8])
    expect(dressing.masses?.[0]?.wallColour).not.toEqual(dressing.masses?.[1]?.wallColour)
    // The board over the shop door in the NW house, above every bay of glazing and under the first-floor windows.
    const board = dressing.parts.find((p) => p.kind === "wallSign" && p.texture === "bl-board")
    const door = dressing.parts.find((p) => p.kind === "wallSign" && p.texture === "shop-front" && p.u0 > 45)
    expect(board?.kind).toBe("wallSign")
    expect(door?.kind).toBe("wallSign")
    if (board?.kind !== "wallSign" || door?.kind !== "wallSign") return
    expect(board.edge).toBe(3)
    expect(board.u0).toBeGreaterThan(35.2)
    expect(board.u0).toBeLessThan(door.u0)
    expect(board.u1).toBeGreaterThan(door.u1)
    expect(board.z1).toBeLessThan(4.5)
    const glazing = dressing.parts.flatMap((p) => (p.kind === "wallSign" && p.texture !== "bl-board" && p.texture !== "georgiadis-board" ? [p.z1] : []))
    expect(Math.max(...glazing)).toBeLessThanOrEqual(board.z0)
    expect(dressing.parts.filter((p) => p.kind === "wallSign" && p.texture === "bl-window")).toHaveLength(2)
  })

  it("dresses Spielwaren Krömer: the sign on the glass canopy's front edge over the door by the POI, toys out past the canopy", () => {
    const kroemer = at(120402849)
    const pts = map.buildings[kroemer?.building ?? -1]?.pts ?? []
    const parts = kroemer?.dressing.parts ?? []
    const w4 = wallFrame(pts, 4)
    if (!w4 || kroemer === undefined) throw new Error("no wall 4")
    // Wall 4 faces Sudetenstraße (NE).
    expect(Math.abs(((Math.atan2(-w4.frame.nx, w4.frame.ny) * 180) / Math.PI + 360) % 360 - 34)).toBeLessThan(10)
    // Two masses at the LoD2 eaves: the main block and the short SE block.
    expect(kroemer.dressing.masses?.map((m) => Math.round(m.levels * 30) / 10)).toEqual([12.4, 12.2])
    const sign = parts.find((p) => p.kind === "wallSign" && p.texture === "kroemer-sign")
    const door = parts.find((p) => p.kind === "wallSign" && p.texture === "kroemer-door")
    const canopy = parts.find((p) => p.kind === "canopy" && p.edge === 4)
    if (sign?.kind !== "wallSign" || door?.kind !== "wallSign" || canopy?.kind !== "canopy") throw new Error("missing parts")
    // The sign hangs on the canopy's front edge, over head height, across the door; the POI stands by the door.
    expect(sign.edge).toBe(4)
    expect(sign.out ?? 0).toBeGreaterThan(canopy.depth)
    expect(sign.z0).toBeGreaterThanOrEqual(2.5)
    expect(sign.z0).toBeLessThan(canopy.z)
    expect(sign.z1).toBeGreaterThan(canopy.z)
    expect(sign.u0).toBeLessThan(door.u0)
    expect(sign.u1).toBeGreaterThan(door.u1)
    const poi = map.pois.find((p) => p.name === "Spielwaren Krömer")
    if (!poi) throw new Error("no POI")
    const [pu] = toLocal(w4.frame, poi.x, poi.y)
    expect(Math.abs(pu - (door.u0 + door.u1) / 2)).toBeLessThan(3)
    // The shop's glazing stays under the canopy; the upper windows stay off the stairwell strips.
    const glazing = parts.flatMap((p) => (p.kind === "wallSign" && (p.texture === "kroemer-glass" || p.texture === "kroemer-door") ? [p.z1] : []))
    expect(Math.max(...glazing)).toBeLessThan(canopy.z)
    const strips = parts.flatMap((p) => (p.kind === "wallSign" && p.texture === "kroemer-stripe" ? [p] : []))
    const windows = parts.flatMap((p) => (p.kind === "wallSign" && p.texture === "kroemer-window" ? [p] : []))
    expect(strips.length).toBeGreaterThan(0)
    expect(windows.length).toBeGreaterThan(30)
    expect(strips.flatMap((s) => windows.filter((w) => w.edge === s.edge && w.u1 > s.u0 && w.u0 < s.u1))).toEqual([])
    // The toy racks stand on the pavement outside the footprint, past the canopy's front edge.
    const racks = parts.flatMap((p) => (p.kind === "sprite" && p.name === "goods-rack" ? [p] : []))
    expect(racks.length).toBeGreaterThan(0)
    for (const r of racks) {
      const [x, y] = toWorld(kroemer.frame, r.u, r.n)
      expect(pointInPolygon(x, y, pts)).toBe(false)
      expect(-toLocal(w4.frame, x, y)[1]).toBeGreaterThan(canopy.depth + 0.3)
    }
  })

  it("dresses Gasthof Geiger: a hipped roof at the LoD2 heights, the name over the door on the W front, the bracket sign out of the wall", () => {
    const geiger = at(122032724)
    if (geiger === undefined) throw new Error("no Gasthof Geiger")
    const pts = map.buildings[geiger.building]?.pts ?? []
    const parts = geiger.dressing.parts
    // Walls 3 and 4 are the W front on the B11, on one line, u 0 at their N end.
    for (const e of [3, 4]) {
      const w = wallFrame(pts, e)?.frame
      if (!w) throw new Error(`no wall ${e}`)
      expect(Math.abs(((Math.atan2(-w.nx, w.ny) * 180) / Math.PI + 360) % 360 - 254)).toBeLessThan(10)
      expect(w.uy).toBeGreaterThan(0.9)
    }
    expect((geiger.dressing.levels ?? 0) * 3).toBeCloseTo(7.13, 2)
    expect(makeWorld(map).map.buildings.find((b) => b.id === 122032724)?.levels).toBeCloseTo(7.13 / 3, 5)
    expect(geiger.dressing.roof?.hip).toBeGreaterThan(40)
    const signs = parts.flatMap((p) => (p.kind === "wallSign" ? [p] : []))
    const door = signs.find((p) => p.texture === "geiger-door")
    const name = signs.find((p) => p.texture === "geiger-sign")
    if (door === undefined || name === undefined) throw new Error("missing door or name")
    // The name hangs over the door, centred on it, under the upper floor's windows.
    expect(name.edge).toBe(door.edge)
    expect(name.z0).toBeGreaterThan(door.z1)
    expect(Math.abs((name.u0 + name.u1) / 2 - (door.u0 + door.u1) / 2)).toBeLessThan(0.01)
    const windows = signs.filter((p) => p.texture === "geiger-window")
    expect(windows.length).toBeGreaterThanOrEqual(14)
    expect(new Set(signs.map((s) => s.edge))).toEqual(new Set([3, 4]))
    // No two wall signs overlap (they would flicker), and none runs past its wall.
    for (const [i, a] of signs.entries()) {
      expect(a.u0).toBeGreaterThanOrEqual(0)
      expect(a.u1).toBeLessThanOrEqual(wallFrame(pts, a.edge)?.length ?? 0)
      for (const b of signs.slice(i + 1)) expect(a.edge === b.edge && a.u0 < b.u1 && b.u0 < a.u1 && a.z0 < b.z1 && b.z0 < a.z1).toBe(false)
    }
    // The bracket sign stands out of the wall, over head height.
    const pylons = parts.flatMap((p) => (p.kind === "pylon" ? [p] : []))
    expect(pylons).toHaveLength(3)
    for (const p of pylons) {
      expect(p.base ?? 0).toBeGreaterThan(2.5)
      expect(pointInPolygon(...toWorld(geiger.frame, p.u, p.n), pts)).toBe(false)
    }
  })

  it("dresses the Petruskirche as a steep gabled tent at the LoD2 heights, its free-standing tower to the model's 29 m with louvre and clock", () => {
    const church = at(121436739)
    const tower = at(188048958)
    if (church === undefined || tower === undefined) throw new Error("no Petruskirche or its tower")
    const world = makeWorld(map)
    // The outlines stay OSM's (they are the solids); only the storeys change.
    for (const id of [121436739, 188048958]) expect(world.map.buildings.find((b) => b.id === id)?.pts).toEqual(map.buildings.find((b) => b.id === id)?.pts)
    // The church: eaves at 4.2 m, the ridge over OSM's 14.4 m width between the model's 12.5 m (NW) and 15.4 m (SE) ends.
    const cPts = map.buildings[church.building]?.pts ?? []
    const width = wallFrame(cPts, 0)?.length ?? 0
    const ridge = (church.dressing.levels ?? 0) * 3 + (width / 2) * slope(church.dressing.roof?.hip ?? 0)
    expect((church.dressing.levels ?? 0) * 3).toBeCloseTo(4.2, 2)
    expect(ridge).toBeGreaterThan(12.5)
    expect(ridge).toBeLessThan(15.4)
    expect(church.dressing.roof?.gables).toEqual([0, 2])
    // The glass strips stand in both gable walls under the rake (the walls are square to the eaves walls).
    const signs = church.dressing.parts.flatMap((p) => (p.kind === "wallSign" ? [p] : []))
    const glass = signs.filter((s) => s.texture === "petrus-glass")
    expect(new Set(glass.map((s) => s.edge))).toEqual(new Set([0, 2]))
    for (const s of glass) {
      const len = wallFrame(cPts, s.edge)?.length ?? 0
      expect(s.z1).toBeLessThan(4.2 + Math.min(s.u0, len - s.u1) * slope(church.dressing.roof?.hip ?? 0))
    }
    expect(signs.some((s) => s.texture === "petrus-emblem" && s.edge === 1)).toBe(true)
    // The tower: 21 m N of the church, eaves at the model's 27.67 m, its cap to 29.36 m over OSM's 4.4 m gable walls.
    const tPts = map.buildings[tower.building]?.pts ?? []
    const tLevels = tower.dressing.levels ?? 0
    expect(world.map.buildings.find((b) => b.id === 188048958)?.levels).toBeCloseTo(tLevels, 5)
    expect(tLevels * 3).toBeCloseTo(27.67, 2)
    expect(tLevels * 3 + ((wallFrame(tPts, 0)?.length ?? 0) / 2) * slope(tower.dressing.roof?.hip ?? 0)).toBeCloseTo(29.36, 0)
    const tSigns = tower.dressing.parts.flatMap((p) => (p.kind === "wallSign" ? [p] : []))
    for (const e of [0, 2]) for (const t of ["petrus-louvre", "petrus-clock"]) expect(tSigns.some((s) => s.edge === e && s.texture === t)).toBe(true)
    // No two wall signs overlap, and none runs past its wall or over the eaves on a side wall.
    for (const [pts, list] of [[cPts, signs], [tPts, tSigns]] as const) {
      for (const [i, a] of list.entries()) {
        expect(a.u1).toBeLessThanOrEqual(wallFrame(pts, a.edge)?.length ?? 0)
        for (const b of list.slice(i + 1)) expect(a.edge === b.edge && a.u0 < b.u1 && b.u0 < a.u1 && a.z0 < b.z1 && b.z0 < a.z1).toBe(false)
      }
    }
    expect(tSigns.every((s) => s.z1 <= tLevels * 3)).toBe(true)
    // The cross stands on the ridge, over the tower's middle.
    for (const p of tower.dressing.parts.flatMap((q) => (q.kind === "pylon" ? [q] : []))) {
      expect(pointInPolygon(...toWorld(tower.frame, p.u, p.n), tPts)).toBe(true)
      expect(p.base ?? 0).toBeGreaterThan(29)
    }
  })

  it("dresses Metzgerei Länger: the LoD2 block over the low shop house and wing, the cow, crest and awning on the NW shop front", () => {
    const metz = at(858188287)
    if (metz === undefined) throw new Error("no Metzgerei Länger")
    const pts = map.buildings[metz.building]?.pts ?? []
    const parts = metz.dressing.parts
    // The weisswurst pickup is the POI itself: it stays where it was, inside the footprint, and the footprint keeps its storeys.
    const poi = map.pois.find((p) => p.name === "Metzgerei Länger")
    expect(poi).toMatchObject({ x: 2659, y: 2499.5 })
    expect(pointInPolygon(poi?.x ?? 0, poi?.y ?? 0, pts)).toBe(true)
    expect(metz.dressing.levels).toBeUndefined()
    // The hipped block at the model's eaves stands over the shop house and the wing.
    const heights = (metz.dressing.masses ?? []).map((m) => m.levels * 3)
    expect(heights[1]).toBeCloseTo(8.36, 2)
    expect(Math.max(...heights)).toBe(heights[1])
    expect(Math.min(...heights)).toBeLessThan(3.5)
    // Wall 2 faces NW onto the forecourt and carries the shop front; nothing on it overlaps (it would flicker).
    const w2 = wallFrame(pts, 2)
    if (w2 === null) throw new Error("no wall 2")
    expect(Math.abs(((Math.atan2(-w2.frame.nx, w2.frame.ny) * 180) / Math.PI + 360) % 360 - 303)).toBeLessThan(5)
    const signs = parts.flatMap((p) => (p.kind === "wallSign" && p.edge === 2 ? [p] : []))
    for (const t of ["metz-cow", "metz-crest", "metz-window", "metz-door", "metz-boards"] as const) expect(signs.map((s) => s.texture)).toContain(t)
    for (const [i, a] of signs.entries()) {
      expect(a.z1).toBeLessThanOrEqual(5.4)
      for (const b of signs.slice(i + 1)) expect(a.u0 < b.u1 && b.u0 < a.u1 && a.z0 < b.z1 && b.z0 < a.z1).toBe(false)
    }
    expect(parts.some((p) => p.kind === "canopy" && p.edge === 2 && p.texture === "metz-awning")).toBe(true)
    // The benches stand out on the forecourt, off the footprint; the name lies on the wing's roof.
    const pylons = parts.flatMap((p) => (p.kind === "pylon" ? [p] : []))
    expect(pylons.length).toBeGreaterThan(0)
    for (const p of pylons) expect(pointInPolygon(...toWorld(metz.frame, p.u, p.n), pts)).toBe(false)
    expect(parts.filter((p) => p.kind === "roofSign").map((p) => (p.kind === "roofSign" ? p.texture : ""))).toEqual(["metz-board"])
  })

  it("dresses Orterer Nord: the LoD2 hipped hall with solar on the SE plane, the front on the car park, the arched sign by the street", () => {
    const orterer = at(187819175)
    if (orterer === undefined) throw new Error("no Orterer Nord")
    const pts = map.buildings[orterer.building]?.pts ?? []
    const parts = orterer.dressing.parts
    // The gelting-1 pickup is the POI itself: it stays where it was, and the footprint keeps its storeys (drawn as a mass).
    const poi = map.pois.find((p) => p.name === "Orterer Getränkemarkt" && p.y < 3000)
    expect(poi).toMatchObject({ x: 2306.5, y: 2063.1 })
    expect(orterer.dressing.levels).toBeUndefined()
    expect(makeWorld(map).map.buildings.find((b) => b.id === 187819175)?.levels).toBe(2)
    const mass = orterer.dressing.masses?.[0]
    expect(orterer.dressing.masses).toHaveLength(1)
    expect((mass?.levels ?? 0) * 3).toBeCloseTo(6.78, 2)
    // The hip at its pitch over half the 27.9 m depth gives the model's 11.03 m ridge.
    expect((mass?.levels ?? 0) * 3 + 13.97 * slope(mass?.roof?.hip ?? 0)).toBeCloseTo(11.03, 1)
    // Wall 2 faces SE onto the car park and Banater Straße and carries the front; nothing on it overlaps.
    const w2 = wallFrame(pts, 2)
    if (w2 === null) throw new Error("no wall 2")
    expect(Math.abs(((Math.atan2(-w2.frame.nx, w2.frame.ny) * 180) / Math.PI + 360) % 360 - 134)).toBeLessThan(5)
    const signs = parts.flatMap((p) => (p.kind === "wallSign" && p.edge === 2 ? [p] : []))
    for (const t of ["orterer-window", "orterer-arcade", "orterer-logo"] as const) expect(signs.map((s) => s.texture)).toContain(t)
    for (const [i, a] of signs.entries()) for (const b of signs.slice(i + 1)) expect(a.u0 < b.u1 && b.u0 < a.u1 && a.z0 < b.z1 && b.z0 < a.z1).toBe(false)
    expect(parts.some((p) => p.kind === "canopy" && p.edge === 2 && p.texture === "canopy-glass")).toBe(true)
    // The solar field lies on the SE plane only, at its height over the eaves.
    const solar = parts.flatMap((p) => (p.kind === "roofSign" ? [p] : []))
    expect(solar.length).toBeGreaterThan(5)
    for (const s of solar) {
      expect(s.edge).toBe(2)
      expect(s.texture).toBe("solar-field")
      expect(s.z1 - s.z0).toBeCloseTo((s.n1 - s.n0) * slope(mass?.roof?.hip ?? 0), 3)
      expect(s.u0).toBeGreaterThan(s.n1)
      expect(s.u1).toBeLessThan(w2.length - s.n1)
    }
    // The arched sign and barriers stand between the street and the hall, off the footprint and off Banater Straße.
    const pylons = parts.flatMap((p) => (p.kind === "pylon" ? [p] : []))
    expect(pylons.some((p) => p.texture === "orterer-logo")).toBe(true)
    for (const p of pylons) {
      expect(pointInPolygon(...toWorld(orterer.frame, p.u, p.n), pts)).toBe(false)
      expect(p.n).toBeGreaterThan(5)
    }
  })

  it("dresses Kaufland: the LoD2 gable roofs as masses, the K band on the hall's SW eave and the car park, the solar roofs", () => {
    const kaufland = at(121822645)
    if (kaufland === undefined) throw new Error("no Kaufland")
    const pts = map.buildings[kaufland.building]?.pts ?? []
    const parts = kaufland.dressing.parts
    // The BMW job reads the POI and the footprint: both stay as they were (one level, drawn as masses).
    expect(map.pois.find((p) => p.name === "Kaufland")).toMatchObject({ x: 2244.3, y: 1880.5 })
    expect(kaufland.dressing.levels).toBeUndefined()
    expect(makeWorld(map).map.buildings.find((b) => b.id === 121822645)?.levels).toBe(1)
    // Thirteen volumes; the hall's three gables at the model's 8.1 m eaves, their ridges near its 10.83 m.
    const masses = kaufland.dressing.masses ?? []
    expect(masses).toHaveLength(13)
    const hall = masses.slice(7, 10)
    for (const m of hall) {
      expect(m.levels * 3).toBeCloseTo(8.1, 2)
      expect(m.roof?.gables).toHaveLength(2)
    }
    expect(hall[0] === undefined ? 0 : hall[0].levels * 3 + 8.4 * slope(hall[0].roof?.hip ?? 0)).toBeCloseTo(10.83, 1)
    // The tallest part is the mall shops' ridge, about the model's 11.84 m.
    const nw = masses[0]
    expect(nw === undefined ? 0 : nw.levels * 3 + 8.55 * slope(nw.roof?.hip ?? 0)).toBeCloseTo(11.98, 1)
    // The K band faces SW (wall 7) and NE onto the car park (wall 12), on the wall and under the eaves.
    const bands = parts.flatMap((p) => (p.kind === "wallSign" && p.texture === "kaufland-band" ? [p] : []))
    expect(bands.map((b) => b.edge)).toEqual([7, 12])
    for (const b of bands) {
      const w = wallFrame(pts, b.edge)
      expect(b.u0).toBeGreaterThan(0)
      expect(b.u1).toBeLessThan(w?.length ?? 0)
      expect(b.z1).toBeLessThan(8.1)
    }
    const facing = (e: number) => {
      const w = wallFrame(pts, e)
      return w === null ? -1 : (((Math.atan2(-w.frame.nx, w.frame.ny) * 180) / Math.PI + 360) % 360)
    }
    expect(Math.abs(facing(7) - 228)).toBeLessThan(5)
    expect(Math.abs(facing(12) - 48)).toBeLessThan(5)
    // The solar field and the roof board lie on the roofs, not below their eaves.
    const roof = parts.flatMap((p) => (p.kind === "roofSign" ? [p] : []))
    expect(roof.filter((p) => p.texture === "solar-field").length).toBeGreaterThan(20)
    for (const s of roof.filter((p) => p.texture === "solar-field")) expect(Math.min(s.z0, s.z1)).toBeGreaterThan(8.1)
    expect(roof.filter((p) => p.texture === "kaufland-band")).toHaveLength(1)
    // No free-standing parts: nothing new stands on the car park.
    expect(parts.some((p) => p.kind === "pylon" || p.kind === "sprite" || p.kind === "canopy")).toBe(false)
  })

  it("dresses Sudetenstraße 11–15 at the LoD2 heights, Dolce Gelato's plate box, awning and terrace at the SE end of wall 4", () => {
    const row = at(127604887)
    if (row === undefined) throw new Error("no Sudetenstraße 11–15")
    const pts = map.buildings[row.building]?.pts ?? []
    const parts = row.dressing.parts
    // Four houses at the model's eaves; the shop row's ridge (16° over half of OSM's 13.1 m depth) at the model's 11.2 m.
    const masses = row.dressing.masses ?? []
    expect(masses).toHaveLength(4)
    for (const m of masses) expect(m.levels * 3).toBeCloseTo(9.35, 2)
    expect(9.35 + 6.55 * slope(16)).toBeCloseTo(11.2, 1)
    // Wall 4 is the street front, the Mühlenbäck front's line: its SE end is that row's NW corner, its frame faces the street.
    const wall = wallFrame(pts, 4)
    if (wall === null) throw new Error("no wall 4")
    expect(wall.length).toBeCloseTo(36.33, 1)
    expect(toWorld(wall.frame, wall.length, 0).map((v) => Math.round(v * 10) / 10)).toEqual([3985.8, 4641.5])
    // The unit's parts lie on wall 4 within Dolce Gelato's stretch and the passage, the POI in front of it.
    const poi = map.pois.find((p) => p.name === "Dolce Gelato")
    const [poiU] = toLocal(wall.frame, poi?.x ?? 0, poi?.y ?? 0)
    expect(poiU).toBeGreaterThan(27)
    expect(poiU).toBeLessThan(33.5)
    for (const p of onWall(parts)) expect([4, 5]).toContain(p.edge)
    for (const p of onWall(DOLCE_GELATO)) expect(p.u0).toBeGreaterThanOrEqual(27)
    // The plate's box: back on the wall, the lettering on its front, the same 2.85 m bottom as the Mühlenbäck row's signs.
    const sign = parts.find((p) => p.kind === "wallSign" && p.texture === "dolce-gelato-sign")
    const box = DOLCE_GELATO.find((p) => p.kind === "pylon")
    if (sign?.kind !== "wallSign" || box?.kind !== "pylon") throw new Error("no sign box")
    const [u, n] = toLocal(wall.frame, ...toWorld(row.frame, box.u, box.n))
    expect(Math.abs(n + box.d / 2)).toBeLessThan(0.02)
    expect(u).toBeCloseTo((sign.u0 + sign.u1) / 2, 1)
    expect([box.base, box.h]).toEqual([2.85, sign.z1])
    expect(sign.z0).toBe(2.85)
    expect(sign.out).toBeGreaterThan(box.d)
    // The terrace stands at the awning's edge, off the footprint, at least 0.9 m of pavement left before the kerb (n 4).
    const awning = parts.find((p) => p.kind === "canopy" && p.texture === "awning")
    const tables = parts.flatMap((p) => (p.kind === "sprite" && p.name === "gelato-terrace" ? [p] : []))
    expect(tables).toHaveLength(2)
    for (const t of tables) {
      const [x, y] = toWorld(row.frame, t.u, t.n)
      expect(pointInPolygon(x, y, pts)).toBe(false)
      const [, tn] = toLocal(wall.frame, x, y)
      expect(-tn - 0.35).toBeLessThan(awning?.kind === "canopy" ? awning.depth : 0)
      expect(t.n - 0.35 - 4).toBeGreaterThan(0.9)
    }
  })

  it("hangs Stroblume's red awning, script box and plant tables on its stretch of Sudetenstraße 11–15's wall 4", () => {
    const row = at(127604887)
    if (row === undefined) throw new Error("no Sudetenstraße 11–15")
    expect(row.dressing.parts).toEqual(expect.arrayContaining([...STROBLUME]))
    const pts = map.buildings[row.building]?.pts ?? []
    const wall = wallFrame(pts, 4)
    if (wall === null) throw new Error("no wall 4")
    // The POI stands in front of the unit, and every wall part stays on its stretch, clear of Dolce Gelato's.
    const poi = map.pois.find((p) => p.name === "Stroblume")
    const [poiU] = toLocal(wall.frame, poi?.x ?? 0, poi?.y ?? 0)
    expect(poiU).toBeGreaterThan(UNITS.stroblume[0])
    expect(poiU).toBeLessThan(UNITS.stroblume[1])
    for (const p of onWall(STROBLUME)) {
      expect(p.edge).toBe(4)
      expect(p.u0).toBeGreaterThanOrEqual(UNITS.stroblume[0])
      expect(p.u1).toBeLessThanOrEqual(UNITS.stroblume[1])
    }
    // The red box: back on the wall, from the row's 2.85 m, the script on its front; the awning at the row's 2.55 m.
    const sign = STROBLUME.find((p) => p.kind === "wallSign" && p.texture === "stroblume-sign")
    const box = STROBLUME.find((p) => p.kind === "pylon")
    const awning = STROBLUME.find((p) => p.kind === "canopy")
    if (sign?.kind !== "wallSign" || box?.kind !== "pylon" || awning?.kind !== "canopy") throw new Error("no sign box or awning")
    const [u, n] = toLocal(wall.frame, ...toWorld(row.frame, box.u, box.n))
    expect(Math.abs(n + box.d / 2)).toBeLessThan(0.02)
    expect(u - box.w / 2).toBeCloseTo(sign.u0, 1)
    expect(u + box.w / 2).toBeCloseTo(sign.u1, 1)
    expect([box.base, box.h, sign.z0, sign.z1]).toEqual([2.85, sign.z1, 2.85, box.h])
    expect(sign.out).toBeGreaterThan(box.d)
    expect(awning.z).toBe(2.55)
    // The plant tables and the heart sign stand past the awning's edge (so the play camera sees them), off the footprint, before the kerb (n 4).
    const props = STROBLUME.flatMap((p) => (p.kind === "sprite" ? [p] : []))
    expect(props.map((p) => p.name).toSorted()).toEqual(["stroblume-heart", "stroblume-plants", "stroblume-plants"])
    for (const t of props) {
      const [x, y] = toWorld(row.frame, t.u, t.n)
      expect(pointInPolygon(x, y, pts)).toBe(false)
      const [tu, tn] = toLocal(wall.frame, x, y)
      expect(-tn).toBeGreaterThan(awning.depth)
      expect(tu).toBeGreaterThan(UNITS.stroblume[0])
      expect(tu).toBeLessThan(UNITS.stroblume[1])
      expect(t.n - 0.45 - 4).toBeGreaterThan(0.5)
    }
  })

  it("gives the VR Bank its orange ground floor, grey canopy and blue letter box on walls 5 and 4 of Sudetenstraße 11–15, clear of Bodystreet", () => {
    const row = at(127604887)
    if (row === undefined) throw new Error("no Sudetenstraße 11–15")
    expect(row.dressing.parts).toEqual(expect.arrayContaining([...VR_BANK]))
    const pts = map.buildings[row.building]?.pts ?? []
    const w4 = wallFrame(pts, 4)
    const w5 = wallFrame(pts, 5)
    if (w4 === null || w5 === null) throw new Error("no walls 4 and 5")
    // Wall 5 runs on into wall 4's NW end: together the bank's front, the POI in front of it.
    expect(toWorld(w5.frame, w5.length, 0).map((v) => v.toFixed(1))).toEqual(toWorld(w4.frame, 0, 0).map((v) => v.toFixed(1)))
    const poi = map.pois.find((p) => p.name === "VR-Bank")
    const [poiU] = toLocal(w4.frame, poi?.x ?? 0, poi?.y ?? 0)
    expect(poiU).toBeGreaterThan(UNITS.vrBank[0])
    expect(poiU).toBeLessThan(UNITS.vrBank[1])
    // The orange fronts and the canopy stay on the bank's stretch (all of wall 5, wall 4 up to the Bodystreet cut).
    const wallParts = onWall(VR_BANK)
    expect(wallParts.filter((p) => p.kind === "wallSign").map((p) => p.texture).toSorted()).toEqual(["vr-bank-door", "vr-bank-front", "vr-bank-logo", "vr-bank-sign"])
    for (const p of wallParts) {
      expect([4, 5]).toContain(p.edge)
      expect(p.u0).toBeGreaterThanOrEqual(0)
      expect(p.u1).toBeLessThanOrEqual(p.edge === 4 ? UNITS.vrBank[1] : w5.length + 0.01)
    }
    // The letter box: from the row's 2.85 m on the canopy, its back on wall 4's line, within the bank's 10.2 m front,
    // the lettering on its front in two halves that meet at the corner of walls 5 and 4.
    const box = VR_BANK.find((p) => p.kind === "pylon")
    const canopy = VR_BANK.find((p) => p.kind === "canopy")
    const logo = VR_BANK.find((p) => p.kind === "wallSign" && p.texture === "vr-bank-logo")
    const words = VR_BANK.find((p) => p.kind === "wallSign" && p.texture === "vr-bank-sign")
    if (box?.kind !== "pylon" || canopy?.kind !== "canopy" || logo?.kind !== "wallSign" || words?.kind !== "wallSign") throw new Error("no letter box, canopy or lettering")
    expect([box.base, box.h]).toEqual([2.85, 3.75])
    for (const s of [logo, words]) {
      expect([s.z0, s.z1]).toEqual([box.base, box.h])
      expect(s.out).toBeGreaterThan(box.d)
    }
    expect([logo.edge, logo.u1, words.edge, words.u0]).toEqual([5, 2.97, 4, 0])
    expect(canopy.z).toBe(2.85)
    expect(canopy.depth).toBeGreaterThan(box.d)
    const [u, n] = toLocal(w4.frame, ...toWorld(row.frame, box.u, box.n))
    expect(Math.abs(n + box.d / 2)).toBeLessThan(0.02)
    expect(u - box.w / 2).toBeCloseTo(logo.u0 - 2.97, 1)
    expect(u + box.w / 2).toBeCloseTo(words.u1, 1)
    expect(words.u1).toBeLessThan(UNITS.vrBank[1])
  })

  it("wraps a blue KIND box round the Kirchweg corner of Sudetenstraße 10 (walls 1 and 2), the A-board on the pavement", () => {
    const row = places.find((p) => p.dressing.osmBuildingId === 538512734)
    if (row === undefined) throw new Error("no Sudetenstraße 10")
    expect(row.dressing.parts).toEqual(expect.arrayContaining([...KIND]))
    expect(dressed.buildings[row.building]?.levels).toBe(4)
    expect(row.dressing.masses?.map((m) => m.levels * 3)).toEqual([12.1, 12.1].map((z) => expect.closeTo(z, 5)))
    const pts = map.buildings[row.building]?.pts ?? []
    const w1 = wallFrame(pts, 1)
    const w2 = wallFrame(pts, 2)
    if (w1 === null || w2 === null) throw new Error("no walls 1 and 2")
    // Wall 1 starts where wall 2 ends: the corner.
    expect(toWorld(w1.frame, 0, 0).map((v) => v.toFixed(1))).toEqual(toWorld(w2.frame, w2.length, 0).map((v) => v.toFixed(1)))
    const walls = { 1: w1, 2: w2 } as const
    const boxes = KIND.flatMap((p) => (p.kind === "pylon" ? [p] : []))
    const boards = KIND.flatMap((p) => (p.kind === "wallSign" && p.texture === "kind-sign" ? [p] : []))
    expect(boards.map((b) => b.edge)).toEqual([1, 1, 2])
    expect(boxes).toHaveLength(2)
    const spans = boxes.map((box, i) => {
      const w = walls[i === 0 ? 1 : 2]
      const [u, n] = toLocal(w.frame, ...toWorld(row.frame, box.u, box.n))
      // Back on the wall, from the row's 2.85 m to 3.75 m.
      expect(Math.abs(n + box.d / 2)).toBeLessThan(0.02)
      expect([box.base, box.h]).toEqual([2.85, 3.75])
      return [u - box.w / 2, u + box.w / 2] as const
    })
    const [front, side] = spans
    if (front === undefined || side === undefined) throw new Error("no spans")
    // The front box runs on past the corner over the side box's end; the side box ends at the corner.
    expect(front[0]).toBeCloseTo(-0.3, 1)
    expect(side[1]).toBeCloseTo(w2.length, 1)
    for (const b of boards) {
      const [u0, u1] = b.edge === 1 ? front : side
      expect(b.u0).toBeGreaterThanOrEqual(u0)
      expect(b.u1).toBeLessThanOrEqual(u1)
      expect([b.z0, b.z1]).toEqual([2.85, 3.75])
      expect(b.out).toBeGreaterThanOrEqual(0.3 + 0.05)
    }
    // Clear of Bistro Malor's stretch (B6a-7): KIND's parts on wall 1 end at its unit's end.
    expect(Math.max(...onWall(KIND).flatMap((p) => (p.edge === 1 ? [p.u1] : [])))).toBeLessThanOrEqual(UNITS_10.kind[1][1])
    expect(front[1]).toBeLessThanOrEqual(UNITS_10.bistroMalor[1][0] + 1e-9)
    // The A-board: off the footprint, in front of the shop, short of the kerb (n 4).
    const board = KIND.find((p) => p.kind === "sprite")
    if (board?.kind !== "sprite") throw new Error("no A-board")
    const [x, y] = toWorld(row.frame, board.u, board.n)
    expect(pointInPolygon(x, y, pts)).toBe(false)
    const [bu] = toLocal(w1.frame, x, y)
    expect(bu).toBeGreaterThan(UNITS_10.kind[1][0])
    expect(bu).toBeLessThan(UNITS_10.kind[1][1])
    expect(board.n - 4).toBeGreaterThan(1)
  })

  it("puts no sign on Bistro Malor and its terrace on the pavement NW of the KIND corner", () => {
    const row = places.find((p) => p.dressing.osmBuildingId === 538512734)
    if (row === undefined) throw new Error("no Sudetenstraße 10")
    expect(row.dressing.parts).toEqual(expect.arrayContaining([...KIND, ...BISTRO_MALOR]))
    const pts = map.buildings[row.building]?.pts ?? []
    const w1 = wallFrame(pts, 1)
    if (w1 === null) throw new Error("no wall 1")
    const [m0, m1] = UNITS_10.bistroMalor[1]
    // Every wall part on the street front in Bistro Malor's stretch, past KIND's.
    for (const p of onWall(BISTRO_MALOR)) {
      expect(p.edge).toBe(1)
      expect(p.u0).toBeGreaterThanOrEqual(m0)
      expect(p.u1).toBeLessThanOrEqual(m1)
    }
    expect(BISTRO_MALOR.some((p) => p.kind === "wallSign" && p.texture !== "malor-front")).toBe(false)
    // The terrace: off the footprint, beside the KIND corner, short of the kerb (n 4) with a walkable pavement left.
    const props = BISTRO_MALOR.flatMap((p) => (p.kind === "sprite" ? [p] : []))
    expect(props.filter((p) => p.name === "malor-terrace")).toHaveLength(6)
    for (const p of props) {
      const [x, y] = toWorld(row.frame, p.u, p.n)
      expect(pointInPolygon(x, y, pts)).toBe(false)
      const [u, n] = toLocal(w1.frame, x, y)
      expect(u).toBeGreaterThan(UNITS_10.kind[1][1])
      expect(u).toBeLessThan(m1)
      expect(-n).toBeLessThan(5.1)
      expect(p.n - 4).toBeGreaterThan(3)
    }
  })

  it("fronts Autohaus Billion with its plate, VW pylon, flags and forecourt cars clear of the pavement", () => {
    const billion = places.find((p) => p.dressing.osmBuildingId === 120402846)
    if (billion === undefined) throw new Error("no Autohaus Billion")
    // The POI keeps OSM's brand list; the name goes on the plate.
    expect(billion.dressing.poi).toBe("Audi;Seat;Škoda;Volkswagen")
    const parts = billion.dressing.parts
    const plate = parts.find((p) => p.kind === "wallSign" && p.texture === "billion-plate")
    if (plate?.kind !== "wallSign") throw new Error("no plate")
    expect(plate.edge).toBe(12)
    // The block's eaves (8.1 m) and ridge (10.2 m) from the LoD2 model, over OSM's 15.35 m depth.
    const block = billion.dressing.masses?.[0]
    expect((block?.levels ?? 0) * 3).toBeCloseTo(8.1)
    expect(8.1 + (15.35 / 2) * slope(block?.roof?.hip ?? 0)).toBeCloseTo(10.2, 1)
    const pts = map.buildings[billion.building]?.pts ?? []
    const free = parts.flatMap((p) => (p.kind === "sprite" || p.kind === "pylon" ? [p] : []))
    expect(free.filter((p) => p.kind === "sprite" && p.name.startsWith("billion-car-"))).toHaveLength(5)
    expect(free.filter((p) => p.kind === "sprite" && p.name === "vw-flag")).toHaveLength(3)
    expect(free.some((p) => p.kind === "pylon" && p.texture === "vw-pylon")).toBe(true)
    // Off the footprint (the plate's box only just), and short of the pavement's back (kerb n 4 + 2.6 m): a car's half width is 1.25 m.
    for (const p of free) {
      const [x, y] = toWorld(billion.frame, p.u, p.n)
      if (p.kind === "pylon" && p.base !== undefined) continue
      expect(pointInPolygon(x, y, pts)).toBe(false)
      const half = p.kind === "sprite" && p.name.startsWith("billion-car-") ? 1.25 : p.kind === "pylon" ? p.d / 2 : 0.1
      expect(p.n - half).toBeGreaterThan(6.6)
    }
  })

  it("fronts the Gaststätte Isarwinkel on Richard-Wagner-Straße: LoD2 gable, name box over the awnings, garden and pole off the pavement", () => {
    const inn = places.find((p) => p.dressing.osmBuildingId === 119894071)
    if (inn === undefined) throw new Error("no Gaststätte Isarwinkel")
    expect(inn.dressing.street).toBe("Richard-Wagner-Straße")
    const pts = map.buildings[inn.building]?.pts ?? []
    // Wall 5 is the W front on the street, 17.2 m, u 0 at its N end.
    const front = wallFrame(pts, 5)
    expect(front?.length).toBeCloseTo(17.19, 1)
    expect(front?.frame.ny).toBeLessThan(-0.3)
    expect(front?.frame.uy).toBeGreaterThan(0.9)
    // The house's eaves (10.8 m) and ridge (12.71 m) from the LoD2 model, over OSM's 11 m depth.
    const house = inn.dressing.masses?.[0]
    expect((house?.levels ?? 0) * 3).toBeCloseTo(10.8)
    expect(10.8 + 5.5 * slope(house?.roof?.hip ?? 0)).toBeCloseTo(12.71, 1)
    const parts = inn.dressing.parts
    const name = parts.find((p) => p.kind === "wallSign" && p.texture === "isarwinkel-sign")
    const box = parts.find((p) => p.kind === "pylon" && p.base !== undefined && p.texture === undefined)
    if (name?.kind !== "wallSign" || box?.kind !== "pylon") throw new Error("no name box")
    // The letters stand at least 5 cm in front of the box, and the box sits on the awnings' tops.
    expect(name.out ?? 0).toBeGreaterThanOrEqual(box.d + 0.05)
    const awnings = parts.flatMap((p) => (p.kind === "canopy" ? [p] : []))
    expect(awnings).toHaveLength(3)
    for (const a of awnings) {
      expect(a.edge).toBe(5)
      expect(a.z - (a.fascia?.h ?? 0)).toBeGreaterThan(2.5)
    }
    expect(name.z0).toBeGreaterThanOrEqual(Math.max(...awnings.map((a) => a.z)))
    expect(parts.some((p) => p.kind === "roofSign" && p.texture === "isarwinkel-sign")).toBe(true)
    // Awnings, hedge, pots and the pole stay off the footprint and behind the pavement's back (kerb n 4 + 2.6 m).
    for (const a of awnings) {
      for (const u of [a.u0, a.u1]) {
        const [x, y] = toWorld(front?.frame ?? inn.frame, u, -a.depth)
        expect(toLocal(inn.frame, x, y)[1]).toBeGreaterThan(6.6)
      }
    }
    for (const p of parts) {
      if (p.kind !== "sprite" && !(p.kind === "pylon" && p.base === undefined)) continue
      const [x, y] = toWorld(inn.frame, p.u, p.n)
      expect(pointInPolygon(x, y, pts)).toBe(false)
      const half = p.kind === "sprite" ? (p.name === "malor-hedge" ? 0.3 : p.len / 2) : p.d / 2
      expect(p.n - half).toBeGreaterThan(6.6)
    }
    // The synthetic building -159 over the front garden keeps its outline (the solid) and becomes a low walled terrace;
    // the hedge and pots stand on it, above its wall.
    const terrace = places.find((p) => p.dressing.osmBuildingId === -159)
    if (terrace === undefined) throw new Error("no terrace")
    const slab = dressed.buildings[terrace.building]
    expect(slab?.pts).toEqual(map.buildings[terrace.building]?.pts)
    expect((slab?.levels ?? 1) * 3 + 0.6).toBeLessThan(1)
    for (const p of parts.flatMap((q) => (q.kind === "sprite" ? [q] : []))) {
      expect(pointInPolygon(...toWorld(inn.frame, p.u, p.n), slab?.pts ?? [])).toBe(true)
      expect(p.z).toBeGreaterThan((slab?.levels ?? 1) * 3 + 0.6)
    }
  })

  it("gives St. Ursula its four storeys", () => {
    expect(makeWorld(map).map.buildings.find((b) => b.id === 127604847)?.levels).toBe(4)
  })
})
