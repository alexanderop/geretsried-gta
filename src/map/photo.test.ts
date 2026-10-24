import { describe, expect, it } from "vitest"
import { buildingMasks, classifyGround, cleanPaved, findCoveredRoads, findCrowns, findMissingBuildings, Ground, pavedMask, sampleRoof, type Raster, type Rgb } from "./photo.ts"
import { eaves } from "./roof.ts"
import { decodePng, encodePng } from "./png.ts"
import { decodeCrowns, encodeCrowns } from "./crowns.ts"

/** A synthetic photo, 1 px per meter, painted by `color(x, y)`. */
const raster = (width: number, height: number, color: (x: number, y: number) => Rgb): Raster => {
  const rgba = new Uint8Array(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      rgba.set([...color(x, y), 255], (y * width + x) * 4)
    }
  }
  return { width, height, rgba }
}

const LAWN: Rgb = [128, 140, 92]
const TREE: Rgb = [55, 72, 45]
const PAVED: Rgb = [205, 196, 182]
const LIT_TILES: Rgb = [215, 120, 80]
const SHADED_TILES: Rgb = [130, 70, 50]

// A 20 × 8 m house, ridge running east-west at y = 14; walls: north, east, south, west.
const house = [10, 10, 30, 10, 30, 18, 10, 18, 10, 10]

describe("sampleRoof", () => {
  it("reads the colour of each roof plane and calls a two-tone roof pitched", () => {
    const photo = raster(40, 30, (_, y) => (y < 14 ? LIT_TILES : SHADED_TILES))
    const roof = sampleRoof(photo, house)
    expect(roof?.pitched).toBe(true)
    // The long walls carry the planes; the short gable ends carry none.
    expect(roof?.planes).toEqual([LIT_TILES, null, SHADED_TILES, null])
  })

  it("keeps the shaded tone on a plane that the photo's lean mostly fills with the lit one", () => {
    // The ridge shows at y = 16 instead of 14: two thirds of the south plane look lit.
    const photo = raster(40, 30, (_, y) => (y < 16 ? LIT_TILES : SHADED_TILES))
    expect(sampleRoof(photo, house)?.planes).toEqual([LIT_TILES, null, SHADED_TILES, null])
  })

  it("lets a plane under a tree borrow the roof's colour", () => {
    const photo = raster(40, 30, (x, y) => (y >= 14 && x < 28 ? TREE : LIT_TILES))
    const planes = sampleRoof(photo, house)?.planes
    expect(planes?.[2]).toEqual(LIT_TILES)
  })

  it("calls an even grey roof flat", () => {
    const roof = sampleRoof(raster(40, 30, () => [150, 150, 148]), house)
    expect(roof?.pitched).toBe(false)
    expect(roof?.planes).toEqual([[150, 150, 148]])
  })

  it("ignores a footprint that only shows trees", () => {
    expect(sampleRoof(raster(40, 30, () => TREE), house)).toBeNull()
  })
})

/** [minX, minY, maxX, maxY) */
const inBox = (x: number, y: number, [x0, y0, x1, y1]: readonly [number, number, number, number]) => x >= x0 && x < x1 && y >= y0 && y < y1
const SHED = [5, 5, 11, 9] as const
const RED_CAR = [20, 5, 22, 10] as const
const MAPPED = [5, 20, 15, 28] as const

describe("findMissingBuildings", () => {
  it("adds a tiled shed OSM lacks, but not a red car or a mapped house", () => {
    const photo = raster(40, 40, (x, y) => (inBox(x, y, SHED) || inBox(x, y, RED_CAR) || inBox(x, y, MAPPED) ? LIT_TILES : LAWN))
    const { footprint } = buildingMasks(40, 40, [{ levels: 2, pts: [5, 20, 15, 20, 15, 28, 5, 28, 5, 20] }])
    const none = new Uint8Array(40 * 40)
    const found = findMissingBuildings(photo, footprint, none, none)
    expect(found).toHaveLength(1)
    expect(found[0]?.levels).toBe(1)
    const xs = (found[0]?.pts ?? []).filter((_, i) => i % 2 === 0)
    expect(Math.min(...xs)).toBeCloseTo(5, 0)
    expect(Math.max(...xs)).toBeCloseTo(11, 0)
  })
})

describe("eaves", () => {
  it("gives each wing of an L its own planes and leaves the wing ends as gables", () => {
    // Wing A runs east (0..20 × 0..10), wing B runs south (0..10 × 0..25).
    const l = [0, 0, 20, 0, 20, 10, 10, 10, 10, 25, 0, 25, 0, 0]
    expect(eaves(l, 10)).toEqual([true, false, true, true, false, true])
  })

  it("makes a square house hipped: every wall is an eave", () => {
    expect(eaves([0, 0, 10, 0, 10, 10, 0, 10, 0, 0], 10)).toEqual([true, true, true, true])
  })
})

describe("classifyGround and findCrowns", () => {
  // Lawn on the left, a paved yard on the right, one round tree of radius 5 m at (15, 20).
  const photo = raster(60, 40, (x, y) => ((x - 15) ** 2 + (y - 20) ** 2 < 25 ? TREE : x < 35 ? LAWN : PAVED))
  const none = new Uint8Array(60 * 40)
  const ground = classifyGround(photo, { footprint: none, shadow: none, skip: none })

  it("tells lawn, tree crowns and paved ground apart", () => {
    expect(ground[20 * 60 + 5]).toBe(Ground.lawn)
    expect(ground[20 * 60 + 15]).toBe(Ground.tree)
    expect(ground[20 * 60 + 50]).toBe(Ground.paved)
  })

  it("finds the tree as one crown of about its size", () => {
    const crowns = findCrowns(ground, 60, 40)
    expect(crowns).toHaveLength(1)
    const [x, y, r] = crowns[0] ?? [0, 0, 0]
    expect(Math.hypot(x - 15, y - 20)).toBeLessThan(1)
    expect(r).toBeGreaterThan(3.5)
    expect(r).toBeLessThan(6.5)
  })

  it("reads green in a building's shadow as lawn, not as a tree", () => {
    const dark = raster(60, 40, (x) => (x < 30 ? [70, 82, 62] : [95, 92, 88]))
    const shadow = new Uint8Array(60 * 40).fill(1)
    const shaded = classifyGround(dark, { footprint: none, shadow, skip: none })
    expect(shaded[20 * 60 + 10]).toBe(Ground.lawn)
    expect(shaded[20 * 60 + 50]).toBe(Ground.paved)
  })

  it("masks the paved share per cell, leaving buildings out of the count", () => {
    const { footprint } = buildingMasks(60, 40, [{ levels: 2, pts: [45, 0, 60, 0, 60, 10, 45, 10] }])
    const withHouse = classifyGround(photo, { footprint, shadow: none, skip: none })
    const mask = pavedMask(withHouse, 60, 40, 10)
    const alphaAt = (cx: number, cy: number) => mask.rgba[(cy * mask.width + cx) * 4 + 3]
    expect([mask.width, mask.height]).toEqual([6, 4])
    expect(alphaAt(0, 0)).toBe(0)
    expect(alphaAt(5, 3)).toBe(255)
    // Half the cell is roof, the rest paved: still fully paved.
    expect(alphaAt(4, 0)).toBe(255)
    // All roof: nothing to pave.
    expect(alphaAt(5, 0)).toBe(0)
  })
})

describe("cleanPaved", () => {
  const w = 40
  // Lawn on the left, a paved lot on the right (x >= 15).
  const lot = () => {
    const ground = new Uint8Array(w * w).fill(Ground.lawn)
    for (let y = 0; y < w; y++) for (let x = 15; x < w; x++) ground[y * w + x] = Ground.paved
    return ground
  }
  const none = new Uint8Array(w * w)

  it("fills cars in a lot and drops paved specks in a lawn", () => {
    const ground = lot()
    ground[10 * w + 20] = Ground.tree // a dark car
    ground[5 * w + 5] = Ground.paved // a stray paved pixel in the lawn
    const clean = cleanPaved(ground, w, w, none)
    expect(clean[10 * w + 20]).toBe(Ground.paved)
    expect(clean[5 * w + 5]).toBe(Ground.lawn)
  })

  it("keeps a thin paved strip inside an OSM parking lot", () => {
    const ground = lot()
    const parking = new Uint8Array(w * w)
    for (let y = 0; y < w; y++) {
      ground[y * w + 5] = Ground.paved
      parking[y * w + 5] = 1
    }
    expect(cleanPaved(ground, w, w, parking)[20 * w + 5]).toBe(Ground.paved)
  })

  it("squares a ragged planting island between parking rows into a straight strip", () => {
    const ground = lot()
    // A 16 × 3 m hedge along x = 20..35, y = 19..21, with a ragged edge.
    for (let x = 20; x < 36; x++) for (let y = 19; y < 22; y++) ground[y * w + x] = Ground.lawn
    ground[18 * w + 25] = Ground.lawn
    ground[21 * w + 30] = Ground.paved
    const clean = cleanPaved(ground, w, w, none)
    expect(clean[18 * w + 25]).toBe(Ground.paved)
    expect(clean[21 * w + 30]).toBe(Ground.lawn)
    expect(clean[20 * w + 27]).toBe(Ground.lawn)
  })
})

describe("PNG and crown files", () => {
  it("round-trips an RGBA image", () => {
    const image = raster(7, 5, (x, y) => [x * 30, y * 50, (x * y) % 255])
    const back = decodePng(encodePng(image))
    expect([back.width, back.height]).toEqual([7, 5])
    expect(back.rgba).toEqual(image.rgba)
  })

  it("round-trips crowns to the decimeter", () => {
    const crowns = decodeCrowns(encodeCrowns([[12.34, 5000.06, 3.25], [0, 1, 25.6]]).slice().buffer)
    expect(Array.from(crowns.xs)).toEqual([123, 0])
    expect(Array.from(crowns.ys)).toEqual([50001, 10])
    expect(Array.from(crowns.rs)).toEqual([33, 255])
  })
})

const road = (kind: "residential" | "footway") => ({ kind, name: "", width: 6, oneway: false, pts: [0, 10, 60, 10], nodes: [] })

describe("findCoveredRoads", () => {
  it("finds the stretch of street under a tree crown, a little past its edges", () => {
    const photo = raster(60, 20, (x) => (x >= 20 && x < 40 ? TREE : PAVED))
    const covered = findCoveredRoads([road("residential")], photo, new Uint8Array(60 * 20))
    expect(covered).toHaveLength(1)
    const xs = (covered[0]?.pts ?? []).filter((_, i) => i % 2 === 0)
    expect(Math.min(...xs)).toBe(18)
    expect(Math.max(...xs)).toBe(41)
    expect(covered[0]?.width).toBe(6)
  })

  it("leaves single crowns, open roads, footpaths and building shadows alone", () => {
    const photo = raster(60, 20, (x) => (x >= 20 && x < 30 ? TREE : x >= 40 ? TREE : PAVED))
    expect(findCoveredRoads([road("residential")], raster(60, 20, () => PAVED), new Uint8Array(60 * 20))).toEqual([])
    expect(findCoveredRoads([road("footway")], photo, new Uint8Array(60 * 20))).toEqual([])
    expect(findCoveredRoads([road("residential")], photo, new Uint8Array(60 * 20))).toHaveLength(1)
    const shade = raster(60, 20, () => TREE)
    expect(findCoveredRoads([road("residential")], shade, new Uint8Array(60 * 20).fill(1))).toEqual([])
  })
})
