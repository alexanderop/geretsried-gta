import { describe, expect, it } from "vitest"
import { buildingMasks, classifyGround, cleanPaved, findCrowns, Ground, pavedMask, sampleRoof, type Raster, type Rgb } from "./photo.ts"
import { eaves } from "./roof.ts"
import { aisleBays, lotBays } from "./parking.ts"
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

  it("calls an even grey roof flat", () => {
    const roof = sampleRoof(raster(40, 30, () => [150, 150, 148]), house)
    expect(roof?.pitched).toBe(false)
    expect(roof?.planes).toEqual([[150, 150, 148]])
  })

  it("ignores a footprint that only shows trees", () => {
    expect(sampleRoof(raster(40, 30, () => TREE), house)).toBeNull()
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

describe("parking bays", () => {
  it("lines both sides of an aisle with 2.5 m bays, cars pointing at the aisle", () => {
    const bays = aisleBays([0, 0, 10, 0])
    expect(bays).toHaveLength(8)
    expect(new Set(bays.map((b) => Math.abs(b.y)))).toEqual(new Set([5.5]))
    expect(Math.abs(Math.sin(bays[0]?.heading ?? 0))).toBeCloseTo(1)
  })

  it("fills a lot with rows that stay inside it", () => {
    const lot = [0, 0, 30, 0, 30, 16, 0, 16, 0, 0]
    const bays = lotBays(lot)
    // Two rows back to back along the long side, then a 6 m aisle: 2 × 12 bays.
    expect(bays).toHaveLength(24)
    expect(bays.every((b) => b.x > 0 && b.x < 30 && b.y > 0 && b.y < 16)).toBe(true)
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
  it("fills cars in a lot, drops paved specks in a lawn and paves OSM parking", () => {
    const w = 30
    const ground = new Uint8Array(w * w).fill(Ground.lawn)
    for (let y = 0; y < w; y++) for (let x = 15; x < w; x++) ground[y * w + x] = Ground.paved
    ground[10 * w + 20] = Ground.tree // a dark car in the lot
    ground[5 * w + 5] = Ground.paved // a stray paved pixel in the lawn
    const parking = new Uint8Array(w * w)
    parking[25 * w + 2] = 1
    const clean = cleanPaved(ground, w, w, parking)
    expect(clean[10 * w + 20]).toBe(Ground.paved)
    expect(clean[5 * w + 5]).toBe(Ground.lawn)
    expect(clean[25 * w + 2]).toBe(Ground.paved)
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
