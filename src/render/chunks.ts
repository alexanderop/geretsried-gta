import type { AreaKind, Building } from "#/map/types.ts"
import { polygonArea } from "#/map/build.ts"
import type { World } from "#/world/world.ts"
import { boxOf, type Box } from "#/world/geometry.ts"
import { Grid } from "#/world/grid.ts"
import { TEXTURES, silhouette, type Assets, type TextureName } from "./assets.ts"
import { GROUND, ROAD_COLORS } from "./palette.ts"

/** Size of one baked map tile in meters, and its resolution. */
export const CHUNK_M = 128
export const BAKE_PX_PER_M = 6
const CHUNK_PX = CHUNK_M * BAKE_PX_PER_M
const MAX_CHUNKS = 64

const STREETS = new Set(["primary", "secondary", "tertiary", "residential", "living_street"])
const MARKED = new Set(["primary", "secondary", "tertiary"])

/** Which texture an area uses, plus a translucent tint so kinds stay tellable apart. */
const AREA_LOOK: Readonly<Record<AreaKind, readonly [TextureName, string | null]>> = {
  water: ["water", null],
  forest: ["forest", null],
  grass: ["grass", null],
  farmland: ["farmland", null],
  residential: ["grass", "rgba(120,110,90,0.12)"],
  industrial: ["asphalt", "rgba(170,160,140,0.35)"],
  park: ["grass", "rgba(60,140,50,0.15)"],
  pitch: ["grass", "rgba(80,170,70,0.25)"],
  parking: ["asphalt", null],
}

/**
 * Bakes the static map into 128 m canvases on demand and keeps the most recent
 * ones (LRU). Drawing a frame is then a handful of drawImage calls.
 */
export class ChunkCache {
  private readonly cache = new Map<string, HTMLCanvasElement>()
  private readonly areas: Grid
  private readonly roads: Grid
  private readonly buildings: Grid
  private readonly waterways: Grid
  private readonly treeShadows: ReadonlyArray<HTMLCanvasElement>
  private readonly map: World["map"]

  constructor(
    private readonly world: World,
    private readonly assets: Assets,
  ) {
    const map = world.map
    this.map = map
    this.treeShadows = assets.trees.map(silhouette)
    const index = <T extends { readonly pts: ReadonlyArray<number> }>(items: ReadonlyArray<T>, pad: (t: T) => number) => {
      const grid = new Grid(map.width, map.height, CHUNK_M)
      items.forEach((item, i) => grid.insert(i, boxOf(item.pts, pad(item))))
      return grid
    }
    this.areas = index(map.areas, () => 0)
    this.roads = index(map.roads, (r) => r.width + 2)
    this.buildings = index(map.buildings, (b) => b.levels * 1.5)
    this.waterways = index(map.waterways, (w) => w.width)
  }

  /** The baked chunk, or null if `budget` says not to bake more this frame. */
  get(cx: number, cy: number, budget: { left: number }): HTMLCanvasElement | null {
    const key = `${cx},${cy}`
    const hit = this.cache.get(key)
    if (hit !== undefined) {
      this.cache.delete(key)
      this.cache.set(key, hit)
      return hit
    }
    if (budget.left <= 0) return null
    budget.left--
    const canvas = this.bake(cx, cy)
    this.cache.set(key, canvas)
    if (this.cache.size > MAX_CHUNKS) {
      const oldest = this.cache.keys().next().value
      if (oldest !== undefined) this.cache.delete(oldest)
    }
    return canvas
  }

  private bake(cx: number, cy: number): HTMLCanvasElement {
    const canvas = document.createElement("canvas")
    canvas.width = CHUNK_PX
    canvas.height = CHUNK_PX
    const ctx = canvas.getContext("2d")
    if (ctx === null) return canvas
    const box: Box = { minX: cx * CHUNK_M, minY: cy * CHUNK_M, maxX: (cx + 1) * CHUNK_M, maxY: (cy + 1) * CHUNK_M }
    ctx.setTransform(BAKE_PX_PER_M, 0, 0, BAKE_PX_PER_M, -box.minX * BAKE_PX_PER_M, -box.minY * BAKE_PX_PER_M)
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    // Patterns live in map space (meters), so tiles line up across chunk borders.
    const pattern = (name: TextureName, angle = 0) => {
      const img = this.assets.textures[name]
      const p = ctx.createPattern(img, "repeat")
      if (p === null) return GROUND
      p.setTransform(new DOMMatrix().rotate((angle * 180) / Math.PI).scale(TEXTURES[name] / img.width))
      return p
    }

    ctx.fillStyle = pattern("grass")
    ctx.fillRect(box.minX, box.minY, CHUNK_M, CHUNK_M)

    const { map } = this
    const ids = (grid: Grid) => grid.query(box).toSorted((a, b) => a - b)

    for (const i of ids(this.areas)) {
      const area = map.areas[i]
      if (area === undefined) continue
      const [texture, tint] = AREA_LOOK[area.kind]
      ctx.fillStyle = pattern(texture)
      fillPoly(ctx, area.pts)
      if (tint !== null) {
        ctx.fillStyle = tint
        fillPoly(ctx, area.pts)
      }
      if (area.kind === "forest") {
        ctx.strokeStyle = "rgba(20,40,15,0.35)"
        ctx.lineWidth = 1.5
        strokeLine(ctx, [...area.pts, area.pts[0] ?? 0, area.pts[1] ?? 0])
      }
    }

    // Rivers: a darker bank under the water texture.
    const waterIds = ids(this.waterways)
    ctx.strokeStyle = "#6b6650"
    for (const i of waterIds) {
      const w = map.waterways[i]
      if (w === undefined) continue
      ctx.lineWidth = w.width + 3
      strokeLine(ctx, w.pts)
    }
    ctx.strokeStyle = pattern("water")
    for (const i of waterIds) {
      const w = map.waterways[i]
      if (w === undefined) continue
      ctx.lineWidth = w.width
      strokeLine(ctx, w.pts)
    }

    const roadIds = ids(this.roads)
    const road = (i: number) => map.roads[i]
    // Paths and tracks under everything, then curbs, sidewalks, asphalt, markings.
    for (const i of roadIds) {
      const r = road(i)
      if (r === undefined || STREETS.has(r.kind) || r.kind === "service") continue
      ctx.strokeStyle = r.kind === "footway" ? pattern("pavement") : ROAD_COLORS[r.kind]
      ctx.lineWidth = r.width
      strokeLine(ctx, r.pts)
    }
    ctx.strokeStyle = "rgba(40,38,34,0.55)"
    for (const i of roadIds) {
      const r = road(i)
      if (r === undefined || !STREETS.has(r.kind)) continue
      ctx.lineWidth = r.width + 4.6
      strokeLine(ctx, r.pts)
    }
    ctx.strokeStyle = pattern("pavement")
    for (const i of roadIds) {
      const r = road(i)
      if (r === undefined || !STREETS.has(r.kind)) continue
      ctx.lineWidth = r.width + 4
      strokeLine(ctx, r.pts)
    }
    ctx.strokeStyle = "#8d887c"
    for (const i of roadIds) {
      const r = road(i)
      if (r === undefined || !STREETS.has(r.kind)) continue
      ctx.lineWidth = r.width + 0.5
      strokeLine(ctx, r.pts)
    }
    ctx.strokeStyle = pattern("asphalt")
    for (const i of roadIds) {
      const r = road(i)
      if (r === undefined || !(STREETS.has(r.kind) || r.kind === "service")) continue
      ctx.lineWidth = r.width
      strokeLine(ctx, r.pts)
    }
    ctx.strokeStyle = "rgba(240,236,220,0.85)"
    ctx.lineWidth = 0.18
    ctx.setLineDash([3, 5])
    for (const i of roadIds) {
      const r = road(i)
      if (r === undefined || !MARKED.has(r.kind) || r.oneway) continue
      strokeLine(ctx, r.pts)
    }
    ctx.setLineDash([])

    const buildingIds = ids(this.buildings)
    // Fake height: a soft shadow pushed south-east by the number of floors.
    ctx.fillStyle = "rgba(10,15,5,0.38)"
    for (const i of buildingIds) {
      const b = map.buildings[i]
      if (b === undefined) continue
      const off = Math.min(10, 0.6 + b.levels * 0.9)
      ctx.save()
      ctx.translate(off, off)
      fillPoly(ctx, b.pts)
      ctx.restore()
    }
    for (const i of buildingIds) {
      const b = map.buildings[i]
      if (b !== undefined) this.drawRoof(ctx, b, pattern)
    }
    this.drawTrees(ctx, box)
    return canvas
  }

  /**
   * Pitched roofs: tiles run along the longest wall, the ridge splits the roof
   * into a lit and a shaded half (light from the top-left). Big or tall blocks get flat roofs.
   */
  private drawRoof(ctx: CanvasRenderingContext2D, b: Building, pattern: (name: TextureName, angle?: number) => CanvasPattern | string) {
    const angle = longestEdgeAngle(b.pts)
    const area = polygonArea(b.pts)
    const hash = Math.abs(Math.imul(b.id, 2654435761)) / 2 ** 32
    const flat = area > 900 || b.levels >= 5
    const material: TextureName = flat
      ? b.levels >= 5
        ? "roofGrey"
        : "roofFlat"
      : hash < 0.4
        ? "roofBrown"
        : hash < 0.7
          ? "roofAnthracite"
          : "roofOrange"
    ctx.fillStyle = pattern(material, angle)
    fillPoly(ctx, b.pts)
    ctx.save()
    ctx.clip()
    // Small per-building brightness change so neighbours differ.
    ctx.fillStyle = hash < 0.5 ? `rgba(0,0,0,${hash * 0.2})` : `rgba(255,250,240,${(hash - 0.5) * 0.12})`
    ctx.fill()
    if (!flat) {
      const [cx, cy] = centroid(b.pts)
      const dx = Math.cos(angle)
      const dy = Math.sin(angle)
      const nx = -dy
      const ny = dx
      const far = 400
      // The half whose outward normal faces the light (-1, -1) is lit.
      const litSide = nx * -1 + ny * -1 > 0 ? 1 : -1
      const half = (side: number) => {
        ctx.beginPath()
        ctx.moveTo(cx - dx * far, cy - dy * far)
        ctx.lineTo(cx + dx * far, cy + dy * far)
        ctx.lineTo(cx + dx * far + nx * far * side, cy + dy * far + ny * far * side)
        ctx.lineTo(cx - dx * far + nx * far * side, cy - dy * far + ny * far * side)
        ctx.closePath()
        ctx.fill()
      }
      ctx.fillStyle = "rgba(0,0,0,0.3)"
      half(-litSide)
      ctx.fillStyle = "rgba(255,245,225,0.1)"
      half(litSide)
      ctx.lineCap = "butt"
      ctx.strokeStyle = "rgba(30,25,20,0.55)"
      ctx.lineWidth = 0.35
      ctx.beginPath()
      ctx.moveTo(cx - dx * far, cy - dy * far)
      ctx.lineTo(cx + dx * far, cy + dy * far)
      ctx.stroke()
    } else {
      // Parapet: a light inner rim.
      ctx.strokeStyle = "rgba(255,255,255,0.35)"
      ctx.lineWidth = 1
      tracePath(ctx, b.pts)
      ctx.closePath()
      ctx.stroke()
    }
    ctx.restore()
    ctx.strokeStyle = "rgba(25,20,15,0.75)"
    ctx.lineWidth = 0.3
    tracePath(ctx, b.pts)
    ctx.closePath()
    ctx.stroke()
  }

  /**
   * Trees on a fixed 7 m jittered grid in map space, so neighbouring chunks
   * agree on every tree that crosses their border.
   */
  private drawTrees(ctx: CanvasRenderingContext2D, box: Box) {
    const { world, assets } = this
    const STEP = 7
    const trees: Array<{ x: number; y: number; size: number; sprite: number; turn: number }> = []
    for (let gy = Math.floor((box.minY - 10) / STEP); gy * STEP < box.maxY + 10; gy++) {
      for (let gx = Math.floor((box.minX - 10) / STEP); gx * STEP < box.maxX + 10; gx++) {
        const h1 = hash2(gx, gy, 1)
        const x = (gx + hash2(gx, gy, 2)) * STEP
        const y = (gy + hash2(gx, gy, 3)) * STEP
        const kind = world.areaAt(x, y)
        const density = TREE_DENSITY[kind ?? "none"]
        if (h1 > density) continue
        const forest = kind === "forest"
        const pool = forest ? FOREST_TREES : GARDEN_TREES
        const sprite = pool[Math.floor(hash2(gx, gy, 4) * pool.length)] ?? 0
        const bush = sprite === 4 || sprite === 5 || sprite === 7
        const size = bush ? 2.5 + hash2(gx, gy, 5) * 1.5 : (forest ? 9 : 6) + hash2(gx, gy, 5) * 7
        const r = size / 2
        if (world.roadAt(x, y, r * 0.6 + 1) !== null) continue
        if (world.isWater(x, y) || world.isSolid(x, y)) continue
        if (world.isSolid(x + r * 0.7, y) || world.isSolid(x - r * 0.7, y) || world.isSolid(x, y + r * 0.7) || world.isSolid(x, y - r * 0.7)) continue
        trees.push({ x, y, size, sprite, turn: hash2(gx, gy, 6) * Math.PI * 2 })
      }
    }
    const draw = (img: CanvasImageSource, t: (typeof trees)[number], offset: number) => {
      ctx.save()
      ctx.translate(t.x + offset, t.y + offset)
      ctx.rotate(t.turn)
      ctx.drawImage(img, -t.size / 2, -t.size / 2, t.size, t.size)
      ctx.restore()
    }
    ctx.globalAlpha = 0.38
    for (const t of trees) {
      const shadow = this.treeShadows[t.sprite]
      if (shadow !== undefined) draw(shadow, t, t.size * 0.18)
    }
    ctx.globalAlpha = 1
    for (const t of trees) {
      const img = assets.trees[t.sprite]
      if (img !== undefined) draw(img, t, 0)
    }
  }
}

/** Sprite indices in trees.png: 0 beech, 1 spruce, 2 birch, 3 apple, 4 bush, 5 thuja, 6 maple, 7 shrub. */
const FOREST_TREES = [0, 1, 1, 1, 6]
const GARDEN_TREES = [0, 1, 2, 3, 4, 4, 5, 5, 6, 7, 7]
const TREE_DENSITY: Readonly<Record<AreaKind | "none", number>> = {
  forest: 0.85,
  park: 0.55,
  residential: 0.5,
  none: 0.45,
  grass: 0.3,
  industrial: 0.06,
  farmland: 0.01,
  pitch: 0,
  parking: 0.03,
  water: 0,
}

/** Deterministic 0..1 hash of a grid cell. */
const hash2 = (x: number, y: number, salt: number) => {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(salt, 2246822519)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

const centroid = (pts: ReadonlyArray<number>): readonly [number, number] => {
  let x = 0
  let y = 0
  const n = pts.length / 2
  for (let i = 0; i < pts.length; i += 2) {
    x += pts[i] ?? 0
    y += pts[i + 1] ?? 0
  }
  return [x / n, y / n]
}

const longestEdgeAngle = (pts: ReadonlyArray<number>) => {
  let best = 0
  let angle = 0
  for (let i = 0; i + 3 < pts.length; i += 2) {
    const dx = (pts[i + 2] ?? 0) - (pts[i] ?? 0)
    const dy = (pts[i + 3] ?? 0) - (pts[i + 1] ?? 0)
    const len = dx * dx + dy * dy
    if (len > best) {
      best = len
      angle = Math.atan2(dy, dx)
    }
  }
  return angle
}


const tracePath = (ctx: CanvasRenderingContext2D, pts: ReadonlyArray<number>) => {
  ctx.beginPath()
  ctx.moveTo(pts[0] ?? 0, pts[1] ?? 0)
  for (let i = 2; i + 1 < pts.length; i += 2) ctx.lineTo(pts[i] ?? 0, pts[i + 1] ?? 0)
}

export const fillPoly = (ctx: CanvasRenderingContext2D, pts: ReadonlyArray<number>) => {
  tracePath(ctx, pts)
  ctx.closePath()
  ctx.fill()
}

export const strokeLine = (ctx: CanvasRenderingContext2D, pts: ReadonlyArray<number>) => {
  tracePath(ctx, pts)
  ctx.stroke()
}

