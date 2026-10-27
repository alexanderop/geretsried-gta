/**
 * Reading the aerial photo at import time: roof colours, tree crowns and paved
 * ground, measured inside the OSM geometry. Pure functions over a raster, so
 * they run in tests on synthetic images.
 */
import type { Building, Covered, GameMap, Road, RoadKind } from "./types.ts"
import { GROUND_M_PER_PX } from "./types.ts"
import { polygonArea } from "./build.ts"
import { boxOf, distToSegmentSq, pointInPolygon } from "#/world/geometry.ts"
import { eaves, nearestWall, wallCount } from "./roof.ts"
import { components, inRect, orientedRect, rectCorners, rim } from "./shapes.ts"
import type { GroundFix } from "./ground-fixes.ts"

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

/** A footprint's pixels (as polygonPixels) without its courtyards. */
const roofPixels = (raster: Raster, pts: ReadonlyArray<number>, holes: ReadonlyArray<ReadonlyArray<number>>, inset: number): Array<number> => {
  const all = polygonPixels(raster, pts, inset)
  if (holes.length === 0) return all
  const open = new Set(holes.flatMap((h) => polygonPixels(raster, h)))
  return all.filter((i) => !open.has(i))
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
export const sampleRoof = (raster: Raster, pts: ReadonlyArray<number>, holes: ReadonlyArray<ReadonlyArray<number>> = []): RoofSample | null => {
  if (wallCount(pts) < 3) return null
  const all = roofPixels(raster, pts, holes, 0)
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
    const inside = inset === 0 ? all : roofPixels(raster, pts, holes, inset)
    // Leaves over the roof are not roof: read only the rest, if enough is left.
    const pixels = inside.filter((i) => !isLeaf(rgbAt(raster, i)))
    if (inside.length < MIN_PLANE_PX * 2) continue
    if (pixels.length < Math.max(MIN_PLANE_PX * 2, inside.length * 0.4)) return null
    const whole = medianRgb(raster, pixels)
    const tones = twoTones(raster, pixels)
    const groups = isEave.map((): Array<number> => [])
    for (const i of inside) {
      const [x, y] = centre(i)
      groups[nearestWall(x, y, pts, (w) => isEave[w] === true)]?.push(i)
    }
    const planes = groups.map((group, w) => {
      if (isEave[w] !== true) return null
      const roof = group.filter((i) => !isLeaf(rgbAt(raster, i)))
      // A plane mostly under a tree borrows the colour of the whole roof.
      if (roof.length < MIN_PLANE_PX || roof.length < group.length * 0.6) return whole
      if (tones === null) return medianRgb(raster, roof)
      // The photo leans, so a plane's footprint also catches part of its
      // neighbour: give it the tone it holds more of than the roof as a whole.
      const dark = roof.filter((i) => luma(rgbAt(raster, i)) < tones.split).length / roof.length
      if (dark > tones.darkShare + 0.15 && dark >= 0.3) return tones.dark
      if (dark < tones.darkShare - 0.15 && dark <= 0.7) return tones.light
      return medianRgb(raster, roof)
    })
    return isPitched(planes, whole, polygonArea(pts)) ? { planes, pitched: true } : { planes: [whole], pitched: false }
  }
  return null
}

/** Green enough to be a leaf rather than a roof tile (same test as lawn and trees). */
const isLeaf = ([r, g, b]: Rgb) => 2 * g - r - b > 15

/**
 * The roof's two tones (lit and shaded planes) by 2-means on luma, with the
 * luma between them and the share of dark pixels. Null when the roof is one tone.
 */
const twoTones = (raster: Raster, pixels: ReadonlyArray<number>) => {
  const lumas = pixels.map((i) => luma(rgbAt(raster, i)))
  let lo = Math.min(...lumas)
  let hi = Math.max(...lumas)
  for (let k = 0; k < 8; k++) {
    const split = (lo + hi) / 2
    const dark = lumas.filter((l) => l < split)
    const light = lumas.filter((l) => l >= split)
    if (dark.length === 0 || light.length === 0) return null
    lo = dark.reduce((a, l) => a + l, 0) / dark.length
    hi = light.reduce((a, l) => a + l, 0) / light.length
  }
  if (hi - lo < TWO_TONE_GAP) return null
  const split = (lo + hi) / 2
  const dark = pixels.filter((_, k) => (lumas[k] ?? 0) < split)
  const light = pixels.filter((_, k) => (lumas[k] ?? 0) >= split)
  if (dark.length < MIN_PLANE_PX || light.length < MIN_PLANE_PX) return null
  return { split, darkShare: dark.length / pixels.length, dark: medianRgb(raster, dark), light: medianRgb(raster, light) }
}

/** Luma gap between a lit and a shaded roof plane; less is one tone with some texture. */
const TWO_TONE_GAP = 40

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


/** Ground classes the importer tells apart. */
export const Ground = { lawn: 0, tree: 1, paved: 2, building: 3, forest: 4 } as const

/** Paint every building footprint (3) and its cast shadow (1) into a mask. */
export const buildingMasks = (
  width: number,
  height: number,
  buildings: ReadonlyArray<{ readonly levels: number; readonly pts: ReadonlyArray<number>; readonly holes?: ReadonlyArray<ReadonlyArray<number>> }>,
): { readonly footprint: Uint8Array; readonly shadow: Uint8Array } => {
  const raster = { width, height, rgba: new Uint8Array() }
  const footprint = new Uint8Array(width * height)
  const shadow = new Uint8Array(width * height)
  for (const b of buildings) {
    const pixels = roofPixels(raster, b.pts, b.holes ?? [], 0)
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
    if (opened[i] === 1 || (parking[i] === 1 && g === Ground.paved)) out[i] = Ground.paved
    else if (g === Ground.paved) out[i] = Ground.lawn
  }
  tidyIslands(out, width, height)
  return out
}

/** Planting islands larger than this (m²) are gardens or parks, left alone. */
const MAX_ISLAND_M2 = 300
/** Islands smaller than this (m²) are weeds and stains: paved over. */
const MIN_ISLAND_M2 = 12

/**
 * Green islands enclosed by pavement (the planting between parking rows) are
 * straight-edged in reality: tiny ones are paved over, the rest become their
 * oriented rectangle.
 */
const tidyIslands = (ground: Uint8Array, width: number, height: number) => {
  const area = PHOTO_PX_PER_M * PHOTO_PX_PER_M
  const green = (i: number) => ground[i] === Ground.lawn || ground[i] === Ground.tree
  for (const island of components(width, height, green, MAX_ISLAND_M2 * area)) {
    const edge = rim(width, height, island)
    if (edge.some((i) => ground[i] !== Ground.paved && ground[i] !== Ground.building)) continue
    if (island.length < MIN_ISLAND_M2 * area) {
      for (const i of island) ground[i] = Ground.paved
      continue
    }
    const rect = orientedRect(width, island)
    if (rect.fill < 0.45) continue
    const kind = ground[island[0] ?? 0] ?? Ground.lawn
    for (const i of island) ground[i] = Ground.paved
    const pad = Math.ceil(Math.max(rect.length, rect.width) / 2) + 1
    for (let y = Math.max(0, Math.floor(rect.cy - pad)); y < Math.min(height, rect.cy + pad); y++) {
      for (let x = Math.max(0, Math.floor(rect.cx - pad)); x < Math.min(width, rect.cx + pad); x++) {
        if (ground[y * width + x] === Ground.paved && inRect(rect, x + 0.5, y + 0.5)) ground[y * width + x] = kind === Ground.tree ? Ground.lawn : kind
      }
    }
  }
}

const hex = ([r, g, b]: Rgb) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`

/**
 * The lightest ground the game draws, as luma: paved ground (pavement.webp's mean #989188 times the ground shader's
 * (1, 0.98, 0.95)). A ground colour read from the photo is darkened to it at most: the dark GTA palette (BACKLOG, V-items).
 */
export const GROUND_MAX_LUMA = 143

/**
 * The ground colour of an area as the photo shows it: the median of its pixels, `holes` left out (a running track's
 * infield). The whole area, not one pixel at its centre: a centre can fall on a crown, a shadow or a ring's infield.
 * `photo` is that colour, `tint` the same darkened to GROUND_MAX_LUMA at most; null without a pixel inside.
 */
export const groundTint = (raster: Raster, pts: ReadonlyArray<number>, holes: ReadonlyArray<ReadonlyArray<number>> = []): { readonly photo: string; readonly tint: string } | null => {
  const pixels = roofPixels(raster, pts, holes, 0)
  if (pixels.length === 0) return null
  const rgb = medianRgb(raster, pixels)
  const scale = Math.min(1, GROUND_MAX_LUMA / Math.max(1, luma(rgb)))
  return { photo: hex(rgb), tint: hex([rgb[0] * scale, rgb[1] * scale, rgb[2] * scale]) }
}

/**
 * Everything the importer reads from the photo: each building's roof colours,
 * the tree crowns outside forests and fields, and the paved-ground mask (an
 * RGBA image, `GROUND_M_PER_PX` meters per pixel, paved share in alpha). `fixes` overrule the photo's ground where it
 * reads wrong (ground-fixes.ts).
 */
export const readPhoto = (
  map: GameMap,
  raster: Raster,
  fixes: ReadonlyArray<GroundFix> = [],
): { readonly map: GameMap; readonly crowns: ReadonlyArray<Crown>; readonly paved: Raster } => {
  const { width, height } = raster
  const buildings = map.buildings.map((b) => {
    const roof = sampleRoof(raster, b.pts, b.holes)
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
  const masks = buildingMasks(width, height, map.buildings)
  const ground = classifyGround(raster, { ...masks, skip })
  // Before the crowns and sheds are read, and again after the cleanup, which paves every parking area over.
  const fix = (classes: Uint8Array) => {
    for (const f of fixes) for (const i of polygonPixels(raster, f.pts)) if (classes[i] !== Ground.building) classes[i] = Ground[f.ground]
    return classes
  }
  fix(ground)
  // Clay courts and running tracks are tile-coloured too.
  const noSheds = new Uint8Array(skip)
  for (const area of map.areas) if (area.kind === "pitch") for (const i of polygonPixels(raster, area.pts)) noSheds[i] = 1
  const inFix = (b: Building) => {
    const [x, y] = b.pts.reduce<[number, number]>(([sx, sy], v, i) => (i % 2 === 0 ? [sx + v, sy] : [sx, sy + v]), [0, 0]).map((v) => v / (b.pts.length / 2))
    return fixes.some((f) => pointInPolygon(x ?? 0, y ?? 0, f.pts))
  }
  const extra = findMissingBuildings(raster, masks.footprint, roadMask(map, width, height), noSheds).filter((b) => !inFix(b))
  const paved = pavedMask(fix(cleanPaved(ground, width, height, parking)), width, height, GROUND_M_PER_PX * PHOTO_PX_PER_M)
  return { map: { ...map, buildings: [...buildings, ...extra], covered: findCoveredRoads(map.roads, raster, masks.shadow) }, crowns: findCrowns(ground, width, height), paved }
}

/** Paved roads: where tree crowns hide one in the photo, the game draws it in. Tracks are left as the photo shows them (gravel or grass). */
const DRIVABLE: ReadonlySet<RoadKind> = new Set(["primary", "secondary", "tertiary", "residential", "living_street", "service"])

/** Stretches shorter than this stay as the photo shows them: one crown over a road does not hide where it goes. */
const MIN_COVERED_M = 15
/** Gaps in the canopy up to this long still count as covered, so a stretch does not flicker on and off. */
const CANOPY_GAP_M = 3
/** How far a stretch reaches past the last covered sample, so it fades in under the crown's edge. */
const COVERED_REACH_M = 2

/**
 * A green pixel too dark for sunlit lawn: tree canopy. Pixels in a building's
 * cast shadow do not count: shaded asphalt in this photo is greenish too.
 */
const canopyAt = (raster: Raster, shadow: Uint8Array, x: number, y: number) => {
  const ix = Math.floor(x * PHOTO_PX_PER_M)
  const iy = Math.floor(y * PHOTO_PX_PER_M)
  if (ix < 0 || iy < 0 || ix >= raster.width || iy >= raster.height || shadow[iy * raster.width + ix] === 1) return false
  const [r, g, b] = rgbAt(raster, iy * raster.width + ix)
  return (2 * g - r - b > 10 || (g > r && g > b + 15)) && luma([r, g, b]) < TREE_LUMA + 10
}

/**
 * Stretches of drivable road the photo shows as tree canopy: every meter
 * along the centre line, the centre and both quarter lines must all be
 * canopy. Short gaps are closed, short stretches dropped.
 */
export const findCoveredRoads = (roads: ReadonlyArray<Road>, raster: Raster, shadow: Uint8Array): Array<Covered> => {
  const canopy = (x: number, y: number) => canopyAt(raster, shadow, x, y)
  const out: Array<Covered> = []
  for (const road of roads) {
    if (!DRIVABLE.has(road.kind)) continue
    const samples: Array<readonly [number, number, boolean]> = []
    for (let i = 0; i + 3 < road.pts.length; i += 2) {
      const ax = road.pts[i] ?? 0
      const ay = road.pts[i + 1] ?? 0
      const dx = (road.pts[i + 2] ?? 0) - ax
      const dy = (road.pts[i + 3] ?? 0) - ay
      const len = Math.hypot(dx, dy)
      if (len === 0) continue
      const nx = (-dy / len) * (road.width / 4)
      const ny = (dx / len) * (road.width / 4)
      for (let t = 0; t < len; t++) {
        const x = ax + (dx * t) / len
        const y = ay + (dy * t) / len
        samples.push([x, y, canopy(x, y) && canopy(x + nx, y + ny) && canopy(x - nx, y - ny)])
      }
    }
    const covered = samples.map((s) => s[2])
    for (let i = 0; i < covered.length; i++) {
      if (covered[i] !== true) continue
      const next = covered.indexOf(true, i + 1)
      if (next > i + 1 && next - i - 1 <= CANOPY_GAP_M) covered.fill(true, i + 1, next)
    }
    for (let i = 0; i < covered.length; ) {
      if (covered[i] !== true) {
        i++
        continue
      }
      let end = i
      while (covered[end + 1] === true) end++
      if (end - i + 1 >= MIN_COVERED_M) {
        const run = samples.slice(Math.max(0, i - COVERED_REACH_M), Math.min(samples.length, end + 1 + COVERED_REACH_M))
        const pts = run.filter((_, k) => k % 2 === 0 || k === run.length - 1).flatMap(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10])
        out.push({ width: road.width, pts })
      }
      i = end + 1
    }
  }
  return out
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

/** Pixels of every street and service road (not aisles or paths), plus half a meter. */
const roadMask = (map: GameMap, width: number, height: number): Uint8Array => {
  const mask = new Uint8Array(width * height)
  for (const r of map.roads) {
    if (r.aisle === true || r.kind === "footway" || r.kind === "track") continue
    paintStroke(mask, width, height, r.pts, r.width / 2 + 0.5)
  }
  return mask
}

/** Sheds, garages and annexes OSM lacks: area limits in m². */
const MIN_SHED_M2 = 12
const MAX_SHED_M2 = 600

/**
 * Roofs the photo shows where OSM has no building: compact, nearly
 * rectangular patches of roof tile (orange to red) away from streets and
 * mapped buildings. Each becomes a one-storey building with a flat roof in
 * its measured colour. White flat roofs are left out: at 1 m they cannot be
 * told from vans, trailers and bright paving (most bright finds were those).
 */
export const findMissingBuildings = (raster: Raster, footprint: Uint8Array, roads: Uint8Array, skip: Uint8Array): Array<Building> => {
  const { width, height } = raster
  const near = morph(footprint, width, height, 1, true)
  const roofish = (i: number) => {
    if (near[i] === 1 || roads[i] === 1 || skip[i] === 1) return false
    const [r, g, b] = rgbAt(raster, i)
    return r - g > 30 && r - b > 55 && r > 120
  }
  const area = PHOTO_PX_PER_M * PHOTO_PX_PER_M
  const out: Array<Building> = []
  for (const patch of components(width, height, roofish, MAX_SHED_M2 * area)) {
    if (patch.length < MIN_SHED_M2 * area) continue
    const rect = orientedRect(width, patch)
    if (rect.fill < 0.7 || Math.min(rect.length, rect.width) < 2.5 * PHOTO_PX_PER_M || rect.length > rect.width * 4) continue
    out.push({
      id: -(out.length + 1),
      levels: 1,
      pts: rectCorners(rect).map((v) => Math.round((v / PHOTO_PX_PER_M) * 10) / 10),
      roof: { colors: [hex(medianRgb(raster, patch))], pitched: false },
    })
  }
  return out
}
