/**
 * Reading the aerial photo at import time: roof colours, tree crowns and paved
 * ground, measured inside the OSM geometry. Pure functions over a raster, so
 * they run in tests on synthetic images.
 */
import type { GameMap } from "./types.ts"
import { GROUND_M_PER_PX } from "./types.ts"
import { polygonArea } from "./build.ts"
import { boxOf, centroid, distToSegmentSq, longestEdgeAngle, pointInPolygon } from "#/world/geometry.ts"

/** Pixels per meter of the aerial photo raster the importer works on. */
export const PHOTO_PX_PER_M = 1

/** An RGBA image in map space: pixel (x, y) covers meters [x, x+1) × [y, y+1). */
export type Raster = { readonly width: number; readonly height: number; readonly rgba: Uint8Array }

export type Rgb = readonly [number, number, number]

/**
 * Where shadows fall in the DOP40 flight over Geretsried (unit vector, map
 * space, y south) and how long they are per meter of height. Measured from the
 * photo itself: the ground next to buildings is darkest 30–40° north of east,
 * and a 3-storey block's shadow ends about 13 m out.
 */
export const SHADOW_DIR: readonly [number, number] = [Math.cos(-0.61), Math.sin(-0.61)]
export const SHADOW_PER_M = 1

/** Rough height of a building in meters: storeys plus the roof. */
export const buildingHeight = (levels: number) => levels * 3 + 3

const luma = ([r, g, b]: Rgb) => 0.3 * r + 0.59 * g + 0.11 * b

const rgbAt = (raster: Raster, i: number): Rgb => [raster.rgba[i * 4] ?? 0, raster.rgba[i * 4 + 1] ?? 0, raster.rgba[i * 4 + 2] ?? 0]

/**
 * Indices (y * width + x) of the pixels whose centres lie inside the polygon
 * and at least `inset` meters from its outline.
 */
export const polygonPixels = (raster: Raster, pts: ReadonlyArray<number>, inset = 0): Array<number> => {
  const box = boxOf(pts)
  const out: Array<number> = []
  const insetSq = inset * inset
  for (let py = Math.max(0, Math.floor(box.minY * PHOTO_PX_PER_M)); py < Math.min(raster.height, box.maxY * PHOTO_PX_PER_M); py++) {
    for (let px = Math.max(0, Math.floor(box.minX * PHOTO_PX_PER_M)); px < Math.min(raster.width, box.maxX * PHOTO_PX_PER_M); px++) {
      const x = (px + 0.5) / PHOTO_PX_PER_M
      const y = (py + 0.5) / PHOTO_PX_PER_M
      if (!pointInPolygon(x, y, pts)) continue
      if (inset === 0 || !nearEdge(x, y, pts, insetSq)) out.push(py * raster.width + px)
    }
  }
  return out
}

const nearEdge = (x: number, y: number, pts: ReadonlyArray<number>, distSq: number) => {
  const n = pts.length / 2
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    if (distToSegmentSq(x, y, pts[i * 2] ?? 0, pts[i * 2 + 1] ?? 0, pts[j * 2] ?? 0, pts[j * 2 + 1] ?? 0) < distSq) return true
  }
  return false
}

const median = (values: Array<number>) => {
  values.sort((a, b) => a - b)
  return values[values.length >> 1] ?? 0
}

const medianRgb = (raster: Raster, pixels: ReadonlyArray<number>): Rgb => [
  median(pixels.map((i) => raster.rgba[i * 4] ?? 0)),
  median(pixels.map((i) => raster.rgba[i * 4 + 1] ?? 0)),
  median(pixels.map((i) => raster.rgba[i * 4 + 2] ?? 0)),
]

/** A roof as the photo shows it: the colour on either side of the ridge, and whether it is pitched. */
export type RoofSample = {
  /** Halves left and right of the ridge (the longest wall through the centroid), see `ridgeSide`. */
  readonly halves: readonly [Rgb, Rgb]
  readonly pitched: boolean
}

/**
 * Which half of the roof a point is on: 0 when it lies on the side of the
 * ridge that the ridge direction's left-hand normal (-dy, dx) points away from.
 */
export const ridgeSide = (x: number, y: number, cx: number, cy: number, angle: number): 0 | 1 =>
  (x - cx) * -Math.sin(angle) + (y - cy) * Math.cos(angle) > 0 ? 1 : 0

const MIN_HALF_PX = 3

/**
 * Median roof colour on both sides of the ridge. Samples stay a meter inside
 * the footprint (the photo leans and walls blur), falling back to the whole
 * footprint for small sheds. Null when the roof is too small to read.
 */
export const sampleRoof = (raster: Raster, pts: ReadonlyArray<number>): RoofSample | null => {
  const angle = longestEdgeAngle(pts)
  const [cx, cy] = centroid(pts)
  for (const inset of [1, 0.4, 0]) {
    const halves: [Array<number>, Array<number>] = [[], []]
    for (const i of polygonPixels(raster, pts, inset)) {
      const x = ((i % raster.width) + 0.5) / PHOTO_PX_PER_M
      const y = (Math.floor(i / raster.width) + 0.5) / PHOTO_PX_PER_M
      halves[ridgeSide(x, y, cx, cy, angle)].push(i)
    }
    if (halves[0].length < MIN_HALF_PX || halves[1].length < MIN_HALF_PX) continue
    const a = medianRgb(raster, halves[0])
    const b = medianRgb(raster, halves[1])
    // Green is a tree over the roof or a footprint off the photo: not a roof colour.
    if (isGreen(a) && isGreen(b)) return null
    const [ra, rb] = isGreen(a) ? [b, b] : isGreen(b) ? [a, a] : [a, b]
    return { halves: [ra, rb], pitched: isPitched(ra, rb, polygonArea(pts)) }
  }
  return null
}

/**
 * A pitched roof shows one lit and one shaded half; tiles are warm (orange,
 * red, brown). Flat roofs are even and grey. A grey pitched roof whose ridge
 * runs along the sun reads flat, which only costs it the ridge line.
 */
export const isPitched = (a: Rgb, b: Rgb, area: number): boolean => {
  const [r, g, bl] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]
  if (r > g + 12 && r > bl + 25) return true
  // On a big footprint, uneven halves are more likely two different roofs.
  if (area > BIG_ROOF_M2) return false
  const la = luma(a)
  const lb = luma(b)
  return Math.abs(la - lb) > 0.12 * Math.max(la, lb)
}

const BIG_ROOF_M2 = 900

const isGreen = ([r, g, b]: Rgb) => g > r + 3 && g > b + 12

/** Ground classes the importer tells apart. */
export const Ground = { lawn: 0, tree: 1, paved: 2, building: 3, forest: 4 } as const

/** Paint every building footprint (3) and its cast shadow (1) into a mask. */
export const buildingMasks = (
  width: number,
  height: number,
  buildings: ReadonlyArray<{ readonly levels: number; readonly pts: ReadonlyArray<number> }>,
): { readonly footprint: Uint8Array; readonly shadow: Uint8Array } => {
  const raster = { width, height, rgba: new Uint8Array() }
  const footprint = new Uint8Array(width * height)
  const shadow = new Uint8Array(width * height)
  for (const b of buildings) {
    const pixels = polygonPixels(raster, b.pts)
    for (const i of pixels) footprint[i] = 1
    const reach = buildingHeight(b.levels) * SHADOW_PER_M * PHOTO_PX_PER_M
    for (let d = 1; d <= reach; d++) {
      const ox = Math.round(SHADOW_DIR[0] * d)
      const oy = Math.round(SHADOW_DIR[1] * d)
      for (const i of pixels) {
        const x = (i % width) + ox
        const y = Math.floor(i / width) + oy
        if (x >= 0 && y >= 0 && x < width && y < height) shadow[y * width + x] = 1
      }
    }
  }
  return { footprint, shadow }
}

/**
 * One ground class per pixel. Green and dark (or green and rough) is a tree
 * crown, green and bright is lawn, grey is paved. In a building's shadow
 * everything is dark, so there green means lawn and the rest paved.
 * `skip` marks pixels left as they are (forests, water), with class `forest`.
 */
export const classifyGround = (
  raster: Raster,
  masks: { readonly footprint: Uint8Array; readonly shadow: Uint8Array; readonly skip: Uint8Array },
): Uint8Array => {
  const { width, height } = raster
  const out = new Uint8Array(width * height)
  const lumAt = (i: number) => luma(rgbAt(raster, i))
  for (let i = 0; i < out.length; i++) {
    if (masks.footprint[i] === 1) {
      out[i] = Ground.building
      continue
    }
    if (masks.skip[i] === 1) {
      out[i] = Ground.forest
      continue
    }
    const [r, g, b] = rgbAt(raster, i)
    const lum = luma([r, g, b])
    const green = 2 * g - r - b
    const veg = green > 10 || (g > r && g > b + 15)
    if (masks.shadow[i] === 1) {
      out[i] = veg ? Ground.lawn : Ground.paved
      continue
    }
    const x = i % width
    const y = Math.floor(i / width)
    let rough = 0
    if (x > 0 && y > 0 && x < width - 1 && y < height - 1) {
      rough = Math.abs(lum - lumAt(i - 1)) + Math.abs(lum - lumAt(i + 1)) + Math.abs(lum - lumAt(i - width)) + Math.abs(lum - lumAt(i + width))
    }
    if (veg) out[i] = lum < TREE_LUMA || (lum < TREE_LUMA + 25 && rough > 40) ? Ground.tree : Ground.lawn
    else if (lum < 55 && g >= r) out[i] = Ground.tree
    else out[i] = Ground.paved
  }
  return out
}

/** Below this luma a green pixel is a tree crown, not sunlit lawn. */
const TREE_LUMA = 100

/** A tree crown: center and radius in meters. */
export type Crown = readonly [number, number, number]

const MIN_CROWN_R = 2
const MAX_CROWN_R = 7

/**
 * Cover the tree pixels with round crowns: the distance from each tree pixel
 * to open ground is its crown radius, and the biggest crowns go first.
 */
export const findCrowns = (ground: Uint8Array, width: number, height: number): Array<Crown> => {
  const dist = distanceToOther(ground, width, height, Ground.tree)
  const candidates: Array<number> = []
  for (let i = 0; i < dist.length; i++) if ((dist[i] ?? 0) >= MIN_CROWN_R * PHOTO_PX_PER_M) candidates.push(i)
  candidates.sort((a, b) => (dist[b] ?? 0) - (dist[a] ?? 0) || a - b)
  const taken = new Uint8Array(width * height)
  const crowns: Array<Crown> = []
  for (const i of candidates) {
    if (taken[i] === 1) continue
    const x = i % width
    const y = Math.floor(i / width)
    const r = Math.min(MAX_CROWN_R * PHOTO_PX_PER_M, (dist[i] ?? 0) + 1)
    crowns.push([(x + 0.5) / PHOTO_PX_PER_M, (y + 0.5) / PHOTO_PX_PER_M, r / PHOTO_PX_PER_M])
    // Crowns may overlap a little, like real canopies; centres keep apart.
    const keep = r * 1.1
    for (let dy = -Math.ceil(keep); dy <= keep; dy++) {
      for (let dx = -Math.ceil(keep); dx <= keep; dx++) {
        const tx = x + dx
        const ty = y + dy
        if (dx * dx + dy * dy <= keep * keep && tx >= 0 && ty >= 0 && tx < width && ty < height) taken[ty * width + tx] = 1
      }
    }
  }
  return crowns
}

/** Chamfer (3-4) distance in pixels from each `cls` pixel to the nearest other pixel. */
const distanceToOther = (ground: Uint8Array, width: number, height: number, cls: number): Float32Array => {
  const d = new Float32Array(width * height)
  const far = width + height
  for (let i = 0; i < d.length; i++) d[i] = ground[i] === cls ? far : 0
  const relax = (i: number, j: number, cost: number) => {
    const v = (d[j] ?? 0) + cost
    if (v < (d[i] ?? 0)) d[i] = v
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      if (d[i] === 0) continue
      if (x > 0) relax(i, i - 1, 1)
      if (y > 0) {
        relax(i, i - width, 1)
        if (x > 0) relax(i, i - width - 1, 1.4)
        if (x < width - 1) relax(i, i - width + 1, 1.4)
      }
    }
  }
  for (let y = height - 1; y >= 0; y--) {
    for (let x = width - 1; x >= 0; x--) {
      const i = y * width + x
      if (d[i] === 0) continue
      if (x < width - 1) relax(i, i + 1, 1)
      if (y < height - 1) {
        relax(i, i + width, 1)
        if (x < width - 1) relax(i, i + width + 1, 1.4)
        if (x > 0) relax(i, i + width - 1, 1.4)
      }
    }
  }
  return d
}

/**
 * Share of paved pixels in each `cell`×`cell` block, 0..255, as the alpha of
 * an RGBA image the renderer uses as a mask. Building pixels do not count
 * either way: roofs cover them.
 */
export const pavedMask = (ground: Uint8Array, width: number, height: number, cell: number) => {
  const w = Math.ceil(width / cell)
  const h = Math.ceil(height / cell)
  const rgba = new Uint8Array(w * h * 4)
  for (let cy = 0; cy < h; cy++) {
    for (let cx = 0; cx < w; cx++) {
      let paved = 0
      let total = 0
      for (let y = cy * cell; y < Math.min(height, (cy + 1) * cell); y++) {
        for (let x = cx * cell; x < Math.min(width, (cx + 1) * cell); x++) {
          const g = ground[y * width + x]
          if (g === Ground.building) continue
          total++
          if (g === Ground.paved) paved++
        }
      }
      rgba[(cy * w + cx) * 4 + 3] = total === 0 ? 0 : Math.round((paved / total) * 255)
    }
  }
  return { width: w, height: h, rgba }
}

const hex = ([r, g, b]: Rgb) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`

/**
 * Everything the importer reads from the photo: each building's roof colours,
 * the tree crowns outside forests and fields, and the paved-ground mask (an
 * RGBA image, `GROUND_M_PER_PX` meters per pixel, paved share in alpha).
 */
export const readPhoto = (
  map: GameMap,
  raster: Raster,
): { readonly map: GameMap; readonly crowns: ReadonlyArray<Crown>; readonly paved: Raster } => {
  const { width, height } = raster
  const buildings = map.buildings.map((b) => {
    const roof = sampleRoof(raster, b.pts)
    return roof === null ? b : { ...b, roof: { colors: [hex(roof.halves[0]), hex(roof.halves[1])] as const, pitched: roof.pitched } }
  })
  const skip = new Uint8Array(width * height)
  for (const area of map.areas) {
    if (area.kind === "forest" || area.kind === "water" || area.kind === "farmland") for (const i of polygonPixels(raster, area.pts)) skip[i] = 1
  }
  const ground = classifyGround(raster, { ...buildingMasks(width, height, map.buildings), skip })
  return { map: { ...map, buildings }, crowns: findCrowns(ground, width, height), paved: pavedMask(ground, width, height, GROUND_M_PER_PX * PHOTO_PX_PER_M) }
}
