import { readFileSync } from "node:fs"
import { Schema } from "effect"
import { describe, expect, it } from "vitest"
import { GameMap } from "./types.ts"
import { lod2Levels, lod2Tiles, mainEave, matchLod2, parseCityGml, type Lod2Building } from "./lod2.ts"
import { fromUtm32, toUtm32 } from "./utm.ts"

describe("toUtm32 / fromUtm32", () => {
  it("puts the central meridian at 500 km east and turns meters back into the same lat/lon", () => {
    expect(toUtm32({ lat: 47.86, lon: 9 })[0]).toBeCloseTo(500_000, 3)
    const [e, n] = toUtm32({ lat: 47.8579, lon: 11.4786 })
    const back = fromUtm32(e, n)
    expect(back.lat).toBeCloseTo(47.8579, 8)
    expect(back.lon).toBeCloseTo(11.4786, 8)
    // Neuer Platz lies in tile 684_5302 (the B1-4 tile: Maria Hilf is 400 m west of it).
    expect(Math.floor(e / 2000) * 2).toBe(684)
    expect(Math.floor(n / 2000) * 2).toBe(5302)
  })

  it("lists the 2 km tiles over the map's box", () => {
    const tiles = lod2Tiles({ south: 47.845, west: 11.43, north: 47.9, east: 11.505 })
    expect(tiles).toHaveLength(20)
    expect(tiles).toContainEqual([684, 5302])
    expect(tiles).toContainEqual([684, 5304])
  })
})

/** A CityGML polygon from x y z triples (closed for it). */
const poly = (pts: ReadonlyArray<readonly [number, number, number]>) =>
  `<gml:Polygon><gml:exterior><gml:LinearRing><gml:posList>${[...pts, pts[0] ?? [0, 0, 0]].flat().join(" ")}</gml:posList></gml:LinearRing></gml:exterior></gml:Polygon>`
const surface = (kind: string, pts: ReadonlyArray<readonly [number, number, number]>) =>
  `<bldg:boundedBy><bldg:${kind} gml:id="s"><bldg:lod2MultiSurface><gml:MultiSurface><gml:surfaceMember>${poly(pts)}</gml:surfaceMember></gml:MultiSurface></bldg:lod2MultiSurface></bldg:${kind}></bldg:boundedBy>`
const building = (id: string, roofType: string, measured: number, parts: ReadonlyArray<string>) =>
  `<cityObjectMember><bldg:Building gml:id="${id}"><bldg:roofType>${roofType}</bldg:roofType><bldg:measuredHeight uom="m">${measured}</bldg:measuredHeight>${parts.join("")}</bldg:Building></cityObjectMember>`

// A 10 × 8 m gabled house, ground 600 m, eaves 606 m, ridge 609 m, with a 4 × 3 m flat garage (603 m) on its side.
const HOUSE = building("house", "3100", 9, [
  surface("GroundSurface", [[0, 0, 600], [10, 0, 600], [10, 8, 600], [0, 8, 600]]),
  surface("RoofSurface", [[0, 0, 606], [10, 0, 606], [10, 4, 609], [0, 4, 609]]),
  surface("RoofSurface", [[0, 4, 609], [10, 4, 609], [10, 8, 606], [0, 8, 606]]),
  surface("GroundSurface", [[10, 0, 600], [14, 0, 600], [14, 3, 600], [10, 3, 600]]),
  surface("RoofSurface", [[10, 0, 603], [14, 0, 603], [14, 3, 603], [10, 3, 603]]),
])
// A 20 × 20 m flat block, roof 612.6 m, with a 3 × 3 m stair tower to 615 m.
const BLOCK = building("block", "1000", 15, [
  surface("GroundSurface", [[100, 0, 600], [120, 0, 600], [120, 20, 600], [100, 20, 600]]),
  surface("RoofSurface", [[100, 0, 612.6], [120, 0, 612.6], [120, 20, 612.6], [100, 20, 612.6]]),
  surface("RoofSurface", [[100, 0, 615], [103, 0, 615], [103, 3, 615], [100, 3, 615]]),
])

describe("parseCityGml", () => {
  it("reads the outline, the main eave over the ground and the storeys under it", () => {
    const [house, block] = parseCityGml(`<CityModel>${HOUSE}${BLOCK}</CityModel>`)
    expect(house).toMatchObject({ id: "house", roofType: "3100", height: 9, eave: 6, flat: false, lowest: 3, area: 92 })
    expect(house?.rings[0]).toEqual([0, 0, 10, 0, 10, 8, 0, 8])
    // The garage's eave is the lowest, but the house's roof is most of it.
    expect(lod2Levels(house ?? { eave: 0, flat: false })).toBe(2)
    // The stair tower does not count; the parapet comes off: (12.6 - 0.6) / 3.
    expect(block).toMatchObject({ eave: 12.6, flat: true, height: 15 })
    expect(lod2Levels(block ?? { eave: 0, flat: false })).toBe(4)
  })

  it("weighs the roof surfaces by their area", () => {
    expect(mainEave([[0, 0, 10, 3, 1], [0, 0, 30, 9, 0]])).toEqual({ eave: 9, flat: false })
    expect(mainEave([])).toBeNull()
    expect(lod2Levels({ eave: 1, flat: false })).toBe(1)
  })
})

const lod2 = (rings: Array<Array<number>>, roofs: Lod2Building["roofs"], eave: number): Lod2Building => ({
  id: "b",
  rings,
  area: 200,
  roofs,
  eave,
  flat: false,
  lowest: eave,
  height: eave + 3,
  roofType: "3100",
})

describe("matchLod2", () => {
  // A 20 × 10 m LoD2 block: a 12 m eave over its west half, 6 m over its east half.
  const block = lod2([[0, 0, 20, 0, 20, 10, 0, 10]], [[5, 5, 100, 12, 0], [15, 5, 100, 6, 0]], 6)

  it("matches by overlap, else by centroid, else not at all", () => {
    const [same, shifted, inside, away] = matchLod2(
      [{ pts: [0, 0, 20, 0, 20, 10, 0, 10] }, { pts: [3, 1, 23, 1, 23, 11, 3, 11] }, { pts: [8, 4, 12, 4, 12, 6, 8, 6] }, { pts: [40, 0, 50, 0, 50, 10, 40, 10] }],
      [block],
    )
    expect(same).toMatchObject({ index: 0, by: "overlap" })
    expect(same?.iou).toBeCloseTo(1, 1)
    expect(shifted).toMatchObject({ index: 0, by: "overlap" })
    expect(inside).toMatchObject({ index: 0, by: "centroid", roofs: "building", eave: 6 })
    expect(away).toBeNull()
  })

  it("gives each OSM half of a block LoD2 keeps whole the eave of its own roofs", () => {
    const [west, east] = matchLod2([{ pts: [0, 0, 10, 0, 10, 10, 0, 10] }, { pts: [10, 0, 20, 0, 20, 10, 10, 10] }], [block])
    expect(west).toMatchObject({ index: 0, roofs: "footprint", eave: 12 })
    expect(east).toMatchObject({ index: 0, roofs: "footprint", eave: 6 })
  })

  it("takes one OSM outline over several LoD2 buildings from the roofs in it", () => {
    // A U over three LoD2 buildings (both arms and half its bottom): no overlap reaches a half, and its centroid
    // (15, 9) lies in the uncovered half of the bottom.
    const left = lod2([[0, 0, 10, 0, 10, 20, 0, 20]], [[5, 10, 200, 9, 0]], 9)
    const right = lod2([[20, 0, 30, 0, 30, 20, 20, 20]], [[25, 10, 200, 9, 0]], 9)
    const bottom = lod2([[10, 0, 20, 0, 20, 5, 10, 5]], [[15, 2.5, 50, 3, 1]], 3)
    const [u] = matchLod2([{ pts: [0, 0, 30, 0, 30, 20, 20, 20, 20, 10, 10, 10, 10, 20, 0, 20] }], [bottom, left, right])
    expect(u).toMatchObject({ index: 1, by: "roofs", roofs: "footprint", eave: 9 })
  })
})

describe("the LoD2 storeys on the real map", () => {
  const map = Schema.decodeUnknownSync(GameMap)(JSON.parse(readFileSync("public/geretsried.map.json", "utf8")))
  const levels = (id: number) => map.buildings.find((b) => b.id === id)?.levels

  it("raises the blocks and keeps a place's own storeys", () => {
    // Königsberger Weg: the high-rise keeps its place's 25 m eaves, the gabled blocks round it (LoD2 eaves 8.3 m) get 3.
    expect(levels(127872287)).toBeCloseTo(25 / 3)
    for (const id of [127872211, 127872221, 127872235]) expect(levels(id)).toBe(3)
    // Karl-Lederer-Platz: the Sparkassengebäude (OSM 5 storeys, LoD2 27.5 m roof) and way 833483720 (2 before).
    expect(levels(980958027)).toBe(9)
    expect(levels(833483720)).toBe(8)
  })
})
