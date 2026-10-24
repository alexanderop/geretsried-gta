import type { GameMap } from "#/map/types.ts"
import { boxOf, type Box } from "#/world/geometry.ts"
import { Grid } from "#/world/grid.ts"
import { AREA_COLORS, GROUND, ROAD_COLORS, SIDEWALK, WATERWAY, roofColor } from "./palette.ts"

/** Size of one baked map tile in meters, and its resolution. */
export const CHUNK_M = 128
export const BAKE_PX_PER_M = 6
const CHUNK_PX = CHUNK_M * BAKE_PX_PER_M
const MAX_CHUNKS = 64

const STREETS = new Set(["primary", "secondary", "tertiary", "residential", "living_street"])
const MARKED = new Set(["primary", "secondary", "tertiary"])

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

  constructor(private readonly map: GameMap) {
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
    ctx.fillStyle = GROUND
    ctx.fillRect(0, 0, CHUNK_PX, CHUNK_PX)
    ctx.setTransform(BAKE_PX_PER_M, 0, 0, BAKE_PX_PER_M, -box.minX * BAKE_PX_PER_M, -box.minY * BAKE_PX_PER_M)
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    const { map } = this
    // query() returns indices in insertion order per cell; sort so paint order matches the map.
    const ids = (grid: Grid) => grid.query(box).toSorted((a, b) => a - b)

    for (const i of ids(this.areas)) {
      const area = map.areas[i]
      if (area === undefined) continue
      ctx.fillStyle = AREA_COLORS[area.kind]
      fillPoly(ctx, area.pts)
    }

    ctx.strokeStyle = WATERWAY
    for (const i of ids(this.waterways)) {
      const w = map.waterways[i]
      if (w === undefined) continue
      ctx.lineWidth = w.width
      strokeLine(ctx, w.pts)
    }

    const roadIds = ids(this.roads)
    // Paths and tracks under everything, then sidewalks, then asphalt, then markings.
    for (const i of roadIds) {
      const r = map.roads[i]
      if (r === undefined || STREETS.has(r.kind) || r.kind === "service") continue
      ctx.strokeStyle = ROAD_COLORS[r.kind]
      ctx.lineWidth = r.width
      strokeLine(ctx, r.pts)
    }
    ctx.strokeStyle = SIDEWALK
    for (const i of roadIds) {
      const r = map.roads[i]
      if (r === undefined || !STREETS.has(r.kind)) continue
      ctx.lineWidth = r.width + 4
      strokeLine(ctx, r.pts)
    }
    for (const i of roadIds) {
      const r = map.roads[i]
      if (r === undefined || !(STREETS.has(r.kind) || r.kind === "service")) continue
      ctx.strokeStyle = ROAD_COLORS[r.kind]
      ctx.lineWidth = r.width
      strokeLine(ctx, r.pts)
    }
    ctx.strokeStyle = "#e8e2c8"
    ctx.lineWidth = 0.25
    ctx.setLineDash([3, 4])
    for (const i of roadIds) {
      const r = map.roads[i]
      if (r === undefined || !MARKED.has(r.kind) || r.oneway) continue
      strokeLine(ctx, r.pts)
    }
    ctx.setLineDash([])

    const buildingIds = ids(this.buildings)
    // Fake height: a shadow pushed south-east by the number of floors.
    ctx.fillStyle = "rgba(0,0,0,0.32)"
    for (const i of buildingIds) {
      const b = map.buildings[i]
      if (b === undefined) continue
      const off = Math.min(12, b.levels * 1.1)
      ctx.save()
      ctx.translate(off, off)
      fillPoly(ctx, b.pts)
      ctx.restore()
    }
    ctx.lineWidth = 0.5
    for (const i of buildingIds) {
      const b = map.buildings[i]
      if (b === undefined) continue
      ctx.fillStyle = roofColor(b.id)
      ctx.strokeStyle = "rgba(0,0,0,0.45)"
      fillPoly(ctx, b.pts)
      ctx.stroke()
    }
    return canvas
  }
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
