/**
 * Reading the aerial photo at import time: roof colours, tree crowns and paved
 * ground, measured inside the OSM geometry. Pure functions over a raster, so
 * they run in tests on synthetic images.
 */
import type { GameMap } from "./types.ts"
import { GROUND_M_PER_PX } from "./types.ts"
import { polygonArea } from "./build.ts"
import { boxOf, distToSegmentSq, pointInPolygon } from "#/world/geometry.ts"
import { eaves, nearestWall, wallCount } from "./roof.ts"
import { aisleBays, carCorners, lotBays, type Bay } from "./parking.ts"

import { PHOTO_PX_PER_M, type Raster } from "./raster.ts"

export { PHOTO_PX_PER_M, type Raster }

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

/** A roof as the photo shows it. */
export type RoofSample = {
  /**
   * Colour of the roof plane over each wall (see `nearestWall` in roof.ts);
   * null for a gable end, which has no plane. One entry when the roof is flat.
   */
  readonly planes: ReadonlyArray<Rgb | null>
  readonly pitched: boolean
}

const MIN_PLANE_PX = 3

/**
 * Median roof colour of each roof plane. Samples stay a meter inside the
 * footprint (the photo leans and walls blur), falling back to the whole
 * footprint for small sheds. Null when the roof is too small to read or only
 * shows green (a tree over it, or a footprint off the photo).
 */
export const sampleRoof = (raster: Raster, pts: ReadonlyArray<number>): RoofSample | null => {
  if (wallCount(pts) < 3) return null
  const all = polygonPixels(raster, pts, 0)
  const centre = (i: number): readonly [number, number] => [
    ((i % raster.width) + 0.5) / PHOTO_PX_PER_M,
    (Math.floor(i / raster.width) + 0.5) / PHOTO_PX_PER_M,
  ]
  let deepest = 0
  for (const i of all) {
    const [x, y] = centre(i)
    const wall = nearestWall(x, y, pts, () => true)
    const d = distToSegmentSq(x, y, pts[wall * 2] ?? 0, pts[wall * 2 + 1] ?? 0, pts[wall * 2 + 2] ?? 0, pts[wall * 2 + 3] ?? 0)
    deepest = Math.max(deepest, Math.sqrt(d))
  }
  const isEave = eaves(pts, deepest * 2 + 1 / PHOTO_PX_PER_M)
  for (const inset of [1, 0.4, 0]) {
    const pixels = inset === 0 ? all : polygonPixels(raster, pts, inset)
    if (pixels.length < MIN_PLANE_PX * 2) continue
    const whole = medianRgb(raster, pixels)
    if (isGreen(whole)) return null
    const groups = isEave.map((): Array<number> => [])
    for (const i of pixels) {
      const [x, y] = centre(i)
      groups[nearestWall(x, y, pts, (w) => isEave[w] === true)]?.push(i)
    }
    const planes = groups.map((group, w) => {
      if (isEave[w] !== true) return null
      if (group.length < MIN_PLANE_PX) return whole
      const color = medianRgb(raster, group)
      return isGreen(color) ? whole : color
    })
    return isPitched(planes, whole, polygonArea(pts)) ? { planes, pitched: true } : { planes: [whole], pitched: false }
  }
  return null
}

/**
 * A pitched roof shows lit and shaded planes; tiles are warm (orange, red,
 * brown). Flat roofs are even and grey. A grey pitched roof whose ridge runs
 * along the sun reads flat, which only costs it its planes.
 */
export const isPitched = (planes: ReadonlyArray<Rgb | null>, whole: Rgb, area: number): boolean => {
  const [r, g, b] = whole
  if (r > g + 12 && r > b + 25) return true
  // On a big footprint, uneven planes are more likely different roofs.
  if (area > BIG_ROOF_M2) return false
  const lumas = planes.flatMap((p) => (p === null ? [] : [luma(p)]))
  const max = Math.max(...lumas)
  return max - Math.min(...lumas) > 0.12 * max
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
    // Crowns overlap a little, like real canopies; centres keep well apart.
    const keep = r * 1.4
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

/** Binary box dilation (`grow`) or erosion of a 0/1 mask by `r` pixels, with summed-area counts. */
const morph = (mask: Uint8Array, width: number, height: number, r: number, grow: boolean): Uint8Array => {
  const sum = new Int32Array((width + 1) * (height + 1))
  for (let y = 0; y < height; y++) {
    let row = 0
    for (let x = 0; x < width; x++) {
      row += mask[y * width + x] ?? 0
      sum[(y + 1) * (width + 1) + x + 1] = (sum[y * (width + 1) + x + 1] ?? 0) + row
    }
  }
  const out = new Uint8Array(width * height)
  for (let y = 0; y < height; y++) {
    const y0 = Math.max(0, y - r)
    const y1 = Math.min(height, y + r + 1)
    for (let x = 0; x < width; x++) {
      const x0 = Math.max(0, x - r)
      const x1 = Math.min(width, x + r + 1)
      const n =
        (sum[y1 * (width + 1) + x1] ?? 0) - (sum[y0 * (width + 1) + x1] ?? 0) - (sum[y1 * (width + 1) + x0] ?? 0) + (sum[y0 * (width + 1) + x0] ?? 0)
      out[y * width + x] = grow ? (n > 0 ? 1 : 0) : n === (x1 - x0) * (y1 - y0) ? 1 : 0
    }
  }
  return out
}

/**
 * Paved ground as clean shapes: yards and lots are uniform and end at hard
 * edges, while pixel classes are speckled (cars, weeds, shade). Closing fills
 * the cars and cracks, opening drops paved specks in lawns. `parking` pixels
 * (OSM lots) are paved whatever the photo says. Buildings count as paved so
 * yards run up to the walls.
 */
export const cleanPaved = (ground: Uint8Array, width: number, height: number, parking: Uint8Array): Uint8Array => {
  const paved = new Uint8Array(width * height)
  for (let i = 0; i < paved.length; i++) {
    const g = ground[i]
    paved[i] = g === Ground.paved || g === Ground.building || parking[i] === 1 ? 1 : 0
  }
  const closed = morph(morph(paved, width, height, 1, true), width, height, 1, false)
  const opened = morph(morph(closed, width, height, 2, false), width, height, 2, true)
  const out = new Uint8Array(ground)
  for (let i = 0; i < out.length; i++) {
    const g = out[i]
    if (g === Ground.building || g === Ground.forest) continue
    if (opened[i] === 1 || parking[i] === 1) out[i] = Ground.paved
    else if (g === Ground.paved) out[i] = Ground.lawn
  }
  return out
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
    return roof === null ? b : { ...b, roof: { colors: roof.planes.map((p) => (p === null ? null : hex(p))), pitched: roof.pitched } }
  })
  const skip = new Uint8Array(width * height)
  for (const area of map.areas) {
    if (area.kind === "forest" || area.kind === "water" || area.kind === "farmland") for (const i of polygonPixels(raster, area.pts)) skip[i] = 1
  }
  const parking = new Uint8Array(width * height)
  for (const area of map.areas) {
    if (area.kind === "parking") for (const i of polygonPixels(raster, area.pts)) parking[i] = 1
  }
  const ground = classifyGround(raster, { ...buildingMasks(width, height, map.buildings), skip })
  const paved = pavedMask(cleanPaved(ground, width, height, parking), width, height, GROUND_M_PER_PX * PHOTO_PX_PER_M)
  const parked = findParkedCars(map, raster, ground).flatMap((b) => [round1(b.x), round1(b.y), Math.round(b.heading * 100) / 100])
  return { map: { ...map, buildings, parked }, crowns: findCrowns(ground, width, height), paved }
}

const round1 = (n: number) => Math.round(n * 10) / 10

/**
 * Share of bays with a car. At 1 m per pixel a car is a handful of pixels,
 * too few to tell from a shadow or an oil stain, so occupancy is a fixed
 * share, picked per bay by a hash of its position.
 */
const OCCUPANCY = 0.7

const occupied = (b: Bay) => {
  let h = Math.imul(Math.round(b.x * 10), 374761393) ^ Math.imul(Math.round(b.y * 10), 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296 < OCCUPANCY
}

/**
 * Cars in parking lots: bays along every parking aisle and rows in lots
 * without mapped aisles. Bays the photo shows as a building or lawn, or that
 * reach onto a street or an earlier bay, are dropped.
 */
export const findParkedCars = (map: GameMap, raster: Raster, ground: Uint8Array): Array<Bay> => {
  const { width, height } = raster
  const blocked = new Uint8Array(width * height)
  for (const r of map.roads) {
    if (r.aisle === true || r.kind === "footway" || r.kind === "track") continue
    paintStroke(blocked, width, height, r.pts, r.width / 2 + 0.5)
  }
  const aisles = map.roads.filter((r) => r.aisle === true)
  const lots = map.areas.filter((a) => a.kind === "parking")
  const candidates = [
    ...aisles.flatMap((r) => aisleBays(r.pts)),
    ...lots.filter((lot) => !aisles.some((r) => r.pts.length >= 2 && pointInPolygon(r.pts[0] ?? 0, r.pts[1] ?? 0, lot.pts))).flatMap((lot) => lotBays(lot.pts)),
  ]
  const px = (x: number, y: number) => {
    const ix = Math.floor(x * PHOTO_PX_PER_M)
    const iy = Math.floor(y * PHOTO_PX_PER_M)
    return ix >= 0 && iy >= 0 && ix < width && iy < height ? iy * width + ix : -1
  }
  const cars: Array<Bay> = []
  for (const bay of candidates) {
    const centre = px(bay.x, bay.y)
    if (centre < 0 || blocked[centre] === 1) continue
    const corners = carCorners(bay, 1.8, 4.4).map(([x, y]) => px(x, y))
    if (corners.some((i) => i < 0 || blocked[i] === 1 || ground[i] === Ground.building)) continue
    if (corners.filter((i) => ground[i] === Ground.lawn).length > 1) continue
    if (!occupied(bay)) continue
    cars.push(bay)
    const hx = Math.cos(bay.heading) * 1.8
    const hy = Math.sin(bay.heading) * 1.8
    paintStroke(blocked, width, height, [bay.x - hx, bay.y - hy, bay.x + hx, bay.y + hy], 0.9)
  }
  return cars
}

/** Set every pixel within `radius` meters of the polyline. */
const paintStroke = (mask: Uint8Array, width: number, height: number, pts: ReadonlyArray<number>, radius: number) => {
  const rSq = (radius * PHOTO_PX_PER_M) ** 2
  for (let i = 0; i + 3 < pts.length; i += 2) {
    const ax = (pts[i] ?? 0) * PHOTO_PX_PER_M
    const ay = (pts[i + 1] ?? 0) * PHOTO_PX_PER_M
    const bx = (pts[i + 2] ?? 0) * PHOTO_PX_PER_M
    const by = (pts[i + 3] ?? 0) * PHOTO_PX_PER_M
    const pad = radius * PHOTO_PX_PER_M
    for (let y = Math.max(0, Math.floor(Math.min(ay, by) - pad)); y <= Math.min(height - 1, Math.ceil(Math.max(ay, by) + pad)); y++) {
      for (let x = Math.max(0, Math.floor(Math.min(ax, bx) - pad)); x <= Math.min(width - 1, Math.ceil(Math.max(ax, bx) + pad)); x++) {
        if (distToSegmentSq(x + 0.5, y + 0.5, ax, ay, bx, by) <= rSq) mask[y * width + x] = 1
      }
    }
  }
}
