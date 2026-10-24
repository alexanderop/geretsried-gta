import type { AreaKind, Building } from "#/map/types.ts"
import { polygonArea } from "#/map/build.ts"
import type { World } from "#/world/world.ts"
import { boxOf, centroid, distToSegmentSq, longestEdgeAngle, pointInPolygon, type Box } from "#/world/geometry.ts"
import { nearestWall } from "#/map/roof.ts"
import { Grid } from "#/world/grid.ts"
import { TEXTURES, TREE_TONES, silhouette, type Assets, type RoofTexture, type TextureName } from "./assets.ts"
import { GROUND, ROAD_COLORS } from "./palette.ts"
import { GROUND_M_PER_PX } from "#/map/types.ts"
import { SHADOW_DIR, SHADOW_PER_M, buildingHeight } from "#/map/photo.ts"

/** Size of one baked map tile in meters, and its resolution. */
export const CHUNK_M = 128
export const BAKE_PX_PER_M = 6
const CHUNK_PX = CHUNK_M * BAKE_PX_PER_M
const MAX_CHUNKS = 64

/** Both sidewalks together, in meters: pedestrians walk 1 m outside the asphalt. */
const SIDEWALKS = 2.6

const STREETS = new Set(["primary", "secondary", "tertiary", "residential", "living_street"])
const MARKED = new Set(["primary", "secondary", "tertiary"])

/** Which texture an area uses, plus a translucent tint so kinds stay tellable apart. */
const AREA_LOOK: Readonly<Record<AreaKind, readonly [TextureName, string | null]>> = {
  water: ["water", null],
  forest: ["forest", null],
  grass: ["grass", null],
  farmland: ["farmland", null],
  residential: ["grass", null],
  industrial: ["asphalt", "rgba(170,160,140,0.35)"],
  park: ["grass", "rgba(90,130,60,0.1)"],
  pitch: ["grass", "rgba(100,150,70,0.2)"],
  parking: ["asphalt", null],
}

/**
 * The drawn map, the fallback wherever no aerial photo tile loads: bakes it
 * into 128 m canvases on demand and keeps the most recent ones (LRU).
 */
export class ChunkCache {
  private readonly cache = new Map<string, HTMLCanvasElement>()
  private readonly areas: Grid
  private readonly roads: Grid
  private readonly buildings: Grid
  private readonly waterways: Grid
  private readonly treeShadows: ReadonlyArray<HTMLCanvasElement>
  private readonly map: World["map"]
  /** Photo tree crowns by the chunk(s) they touch. */
  private readonly crowns = new Map<string, Array<number>>()
  /** Scratch layer for masked and see-through passes, reused by every bake. */
  private readonly layer = document.createElement("canvas")
  /** Photo roof planes of the chunk being baked, see `paintPlanes`. */
  private readonly planes = document.createElement("canvas")
  /** The chunk's paved-ground mask at MASK_PX_PER_M, see `drawPaved`. */
  private readonly mask = document.createElement("canvas")

  constructor(
    private readonly world: World,
    private readonly assets: Assets,
  ) {
    const map = world.map
    this.map = map
    this.treeShadows = assets.trees.map((img) => silhouette(img))
    const index = <T extends { readonly pts: ReadonlyArray<number> }>(items: ReadonlyArray<T>, pad: (t: T) => number) => {
      const grid = new Grid(map.width, map.height, CHUNK_M)
      items.forEach((item, i) => grid.insert(i, boxOf(item.pts, pad(item))))
      return grid
    }
    this.areas = index(map.areas, () => 0)
    this.roads = index(map.roads, (r) => r.width + 2)
    this.buildings = index(map.buildings, (b) => buildingHeight(b.levels) * SHADOW_PER_M)
    this.waterways = index(map.waterways, (w) => w.width)
    this.layer.width = CHUNK_PX
    this.layer.height = CHUNK_PX
    this.mask.width = CHUNK_M * MASK_PX_PER_M
    this.mask.height = CHUNK_M * MASK_PX_PER_M
    this.planes.width = CHUNK_M * ROOF_PX_PER_M
    this.planes.height = CHUNK_M * ROOF_PX_PER_M
    const { xs, ys, rs } = assets.crowns
    for (let i = 0; i < rs.length; i++) {
      bucket(this.crowns, i, (xs[i] ?? 0) / 10, (ys[i] ?? 0) / 10, (rs[i] ?? 0) / 10 + CROWN_SHADOW_M)
    }
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

    this.drawPaved(ctx, box, pattern)

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
      ctx.lineWidth = r.width + SIDEWALKS + 0.5
      strokeLine(ctx, r.pts)
    }
    ctx.strokeStyle = pattern("pavement")
    for (const i of roadIds) {
      const r = road(i)
      if (r === undefined || !STREETS.has(r.kind)) continue
      ctx.lineWidth = r.width + SIDEWALKS
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
    this.drawShadows(ctx, box, buildingIds)
    this.paintPlanes(box, buildingIds)
    for (const i of buildingIds) {
      const b = map.buildings[i]
      if (b !== undefined) this.drawRoof(ctx, box, b, pattern)
    }
    this.drawForest(ctx, box)
    this.drawCrowns(ctx, cx, cy)
    return canvas
  }

  /** A fresh scratch layer with the chunk's map transform. */
  private scratch(box: Box): CanvasRenderingContext2D | null {
    const ctx = this.layer.getContext("2d")
    if (ctx === null) return null
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalCompositeOperation = "source-over"
    ctx.clearRect(0, 0, CHUNK_PX, CHUNK_PX)
    ctx.setTransform(BAKE_PX_PER_M, 0, 0, BAKE_PX_PER_M, -box.minX * BAKE_PX_PER_M, -box.minY * BAKE_PX_PER_M)
    return ctx
  }

  /** Copy the scratch layer onto the chunk. */
  private flush(ctx: CanvasRenderingContext2D, box: Box, alpha: number) {
    ctx.globalAlpha = alpha
    ctx.drawImage(this.layer, box.minX, box.minY, CHUNK_M, CHUNK_M)
    ctx.globalAlpha = 1
  }

  /**
   * Yards, driveways and parking lots: pavement wherever the aerial photo shows
   * paved ground, through the ground mask (scaled up smoothly, so edges stay soft).
   */
  private drawPaved(ctx: CanvasRenderingContext2D, box: Box, pattern: (name: TextureName) => CanvasPattern | string) {
    const maskCtx = this.mask.getContext("2d", { willReadFrequently: true })
    const layer = this.scratch(box)
    if (layer === null || maskCtx === null) return
    // Upscale the 2 m mask smoothly to 0.5 m, then steepen alpha into a hard edge;
    // the final upscale to the bake resolution only softens it by a pixel or two.
    const side = this.mask.width
    const px = CHUNK_M / GROUND_M_PER_PX
    maskCtx.clearRect(0, 0, side, side)
    maskCtx.drawImage(this.assets.ground, box.minX / GROUND_M_PER_PX, box.minY / GROUND_M_PER_PX, px, px, 0, 0, side, side)
    const mask = maskCtx.getImageData(0, 0, side, side)
    const alpha = mask.data
    for (let i = 3; i < alpha.length; i += 4) alpha[i] = ((alpha[i] ?? 0) - 110) * 4
    maskCtx.putImageData(mask, 0, 0)
    layer.fillStyle = pattern("pavement")
    layer.fillRect(box.minX, box.minY, CHUNK_M, CHUNK_M)
    layer.globalCompositeOperation = "destination-in"
    layer.drawImage(this.mask, box.minX, box.minY, CHUNK_M, CHUNK_M)
    this.flush(ctx, box, 1)
  }

  /**
   * Each building casts its footprint swept away from the sun, as long as the
   * building is tall: the sides of the swept shape plus the moved footprint.
   * Drawn opaque on a layer first so overlapping shadows do not stack.
   */
  private drawShadows(ctx: CanvasRenderingContext2D, box: Box, buildingIds: ReadonlyArray<number>) {
    const layer = this.scratch(box)
    if (layer === null) return
    layer.fillStyle = SHADOW_COLOR
    for (const i of buildingIds) {
      const b = this.map.buildings[i]
      if (b === undefined) continue
      const len = buildingHeight(b.levels) * SHADOW_PER_M
      const ox = SHADOW_DIR[0] * len
      const oy = SHADOW_DIR[1] * len
      const { pts } = b
      for (let k = 0; k + 3 < pts.length; k += 2) {
        const ax = pts[k] ?? 0
        const ay = pts[k + 1] ?? 0
        const bx = pts[k + 2] ?? 0
        const by = pts[k + 3] ?? 0
        layer.beginPath()
        layer.moveTo(ax, ay)
        layer.lineTo(bx, by)
        layer.lineTo(bx + ox, by + oy)
        layer.lineTo(ax + ox, ay + oy)
        layer.closePath()
        layer.fill()
      }
      layer.save()
      layer.translate(ox, oy)
      fillPoly(layer, pts)
      layer.restore()
    }
    this.flush(ctx, box, SHADOW_ALPHA)
  }

  /**
   * Roof planes with colours from the aerial photo, painted pixel by pixel
   * (ROOF_PX_PER_M) into the `planes` layer: each point takes the colour of
   * its nearest eave (src/map/roof.ts), so L and T blocks get a ridge per wing.
   * A thin fringe outside each footprint keeps the clipped edges solid.
   */
  private paintPlanes(box: Box, buildingIds: ReadonlyArray<number>) {
    const ctx = this.planes.getContext("2d")
    if (ctx === null) return
    const side = CHUNK_M * ROOF_PX_PER_M
    const image = ctx.createImageData(side, side)
    const px = image.data
    const fringeSq = (1.5 / ROOF_PX_PER_M) ** 2
    for (const fringe of [false, true]) {
      for (const id of buildingIds) {
        const b = this.map.buildings[id]
        const colors = b?.roof?.colors
        if (b === undefined || colors === undefined) continue
        const rgb = colors.map((c) => (c === null ? null : parseHex(c)))
        const flat = rgb.length === 1 ? rgb[0] : undefined
        const bb = boxOf(b.pts, 1)
        const x0 = Math.max(0, Math.floor((bb.minX - box.minX) * ROOF_PX_PER_M))
        const x1 = Math.min(side, Math.ceil((bb.maxX - box.minX) * ROOF_PX_PER_M))
        const y0 = Math.max(0, Math.floor((bb.minY - box.minY) * ROOF_PX_PER_M))
        const y1 = Math.min(side, Math.ceil((bb.maxY - box.minY) * ROOF_PX_PER_M))
        for (let py = y0; py < y1; py++) {
          for (let qx = x0; qx < x1; qx++) {
            const at = (py * side + qx) * 4
            if (fringe && px[at + 3] !== 0) continue
            const x = box.minX + (qx + 0.5) / ROOF_PX_PER_M
            const y = box.minY + (py + 0.5) / ROOF_PX_PER_M
            if (fringe ? nearestWallDistSq(x, y, b.pts) > fringeSq : !pointInPolygon(x, y, b.pts)) continue
            const c = flat ?? rgb[nearestWall(x, y, b.pts, (w) => rgb[w] !== null)]
            if (c === undefined || c === null) continue
            px[at] = c[0]
            px[at + 1] = c[1]
            px[at + 2] = c[2]
            px[at + 3] = 255
          }
        }
      }
    }
    ctx.putImageData(image, 0, 0)
  }

  /**
   * Roofs. With colours from the aerial photo: the painted planes, which
   * already carry the photo's lit and shaded sides, plus tile detail from a
   * texture. Without: a texture picked by hash and fake lighting.
   */
  private drawRoof(ctx: CanvasRenderingContext2D, box: Box, b: Building, pattern: (name: TextureName, angle?: number) => CanvasPattern | string) {
    const angle = longestEdgeAngle(b.pts)
    const [cx, cy] = centroid(b.pts)
    const dx = Math.cos(angle)
    const dy = Math.sin(angle)
    const nx = -dy
    const ny = dx
    const far = 400
    // The half of the roof on `side` (+1: along the normal (nx, ny)) of the ridge.
    const half = (side: number) => {
      ctx.beginPath()
      ctx.moveTo(cx - dx * far, cy - dy * far)
      ctx.lineTo(cx + dx * far, cy + dy * far)
      ctx.lineTo(cx + dx * far + nx * far * side, cy + dy * far + ny * far * side)
      ctx.lineTo(cx - dx * far + nx * far * side, cy - dy * far + ny * far * side)
      ctx.closePath()
      ctx.fill()
    }
    const ridge = (color: string, width: number) => {
      ctx.lineCap = "butt"
      ctx.strokeStyle = color
      ctx.lineWidth = width
      ctx.beginPath()
      ctx.moveTo(cx - dx * far, cy - dy * far)
      ctx.lineTo(cx + dx * far, cy + dy * far)
      ctx.stroke()
    }
    const rim = (color: string) => {
      ctx.strokeStyle = color
      ctx.lineWidth = 1
      tracePath(ctx, b.pts)
      ctx.closePath()
      ctx.stroke()
    }

    ctx.save()
    tracePath(ctx, b.pts)
    ctx.closePath()
    ctx.clip()
    const roof = b.roof
    if (roof !== undefined) {
      ctx.drawImage(this.planes, box.minX, box.minY, CHUNK_M, CHUNK_M)
      const texture: RoofTexture = roof.pitched ? "roofOrange" : "roofFlat"
      ctx.globalCompositeOperation = "overlay"
      ctx.fillStyle = this.detailPattern(ctx, texture, angle)
      ctx.fillRect(cx - far, cy - far, far * 2, far * 2)
      ctx.globalCompositeOperation = "source-over"
      if (!roof.pitched) rim("rgba(255,255,255,0.3)")
    } else {
      const area = polygonArea(b.pts)
      const hash = Math.abs(Math.imul(b.id, 2654435761)) / 2 ** 32
      const flat = area > 900 || b.levels >= 5
      const material: TextureName = flat ? (b.levels >= 5 ? "roofGrey" : "roofFlat") : hash < 0.4 ? "roofBrown" : hash < 0.7 ? "roofAnthracite" : "roofOrange"
      ctx.fillStyle = pattern(material, angle)
      ctx.fillRect(cx - far, cy - far, far * 2, far * 2)
      if (flat) rim("rgba(255,255,255,0.35)")
      else {
        // The half whose outward normal faces away from the shadows is lit.
        const litSide = nx * SHADOW_DIR[0] + ny * SHADOW_DIR[1] < 0 ? 1 : -1
        ctx.fillStyle = "rgba(0,0,0,0.35)"
        half(-litSide)
        ctx.fillStyle = "rgba(255,245,225,0.1)"
        half(litSide)
        ridge("rgba(30,25,20,0.55)", 0.35)
      }
    }
    ctx.restore()
    ctx.strokeStyle = "rgba(25,20,15,0.75)"
    ctx.lineWidth = 0.3
    tracePath(ctx, b.pts)
    ctx.closePath()
    ctx.stroke()
  }

  private detailPattern(ctx: CanvasRenderingContext2D, name: RoofTexture, angle: number): CanvasPattern | string {
    const img = this.assets.roofDetail[name]
    const p = ctx.createPattern(img, "repeat")
    if (p === null) return "#808080"
    p.setTransform(new DOMMatrix().rotate((angle * 180) / Math.PI).scale(TEXTURES[name] / img.width))
    return p
  }

  /** Forest trees on a fixed 7 m jittered grid in map space, so neighbouring chunks agree on border trees. */
  private drawForest(ctx: CanvasRenderingContext2D, box: Box) {
    const { world } = this
    const STEP = 7
    const trees: Array<Tree> = []
    for (let gy = Math.floor((box.minY - 10) / STEP); gy * STEP < box.maxY + 10; gy++) {
      for (let gx = Math.floor((box.minX - 10) / STEP); gx * STEP < box.maxX + 10; gx++) {
        if (hash2(gx, gy, 1) > 0.85) continue
        const x = (gx + hash2(gx, gy, 2)) * STEP
        const y = (gy + hash2(gx, gy, 3)) * STEP
        if (world.areaAt(x, y) !== "forest") continue
        const size = 9 + hash2(gx, gy, 5) * 7
        if (world.roadAt(x, y, size * 0.3 + 1) !== null || world.isWater(x, y) || world.isSolid(x, y)) continue
        const sprite = tinted(FOREST_TREES[Math.floor(hash2(gx, gy, 4) * FOREST_TREES.length)] ?? 0, hash2(gx, gy, 7))
        trees.push({ x, y, size, sprite, turn: hash2(gx, gy, 6) * Math.PI * 2 })
      }
    }
    this.drawTrees(ctx, trees)
  }

  /** The tree crowns the importer found in the aerial photo, at their real place and size. */
  private drawCrowns(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    const { xs, ys, rs } = this.assets.crowns
    const trees: Array<Tree> = []
    for (const i of this.crowns.get(`${cx},${cy}`) ?? []) {
      const r = (rs[i] ?? 0) / 10
      const h = hash2(i, 0, 7)
      const pool = r < 3.6 ? SMALL_CROWNS : CROWNS
      trees.push({
        x: (xs[i] ?? 0) / 10,
        y: (ys[i] ?? 0) / 10,
        // Sprites have a soft rim; the photo measures the dense part of the crown.
        size: r * 2 * 1.2,
        sprite: tinted(pool[Math.floor(h * pool.length)] ?? 0, hash2(i, 0, 9)),
        turn: hash2(i, 0, 8) * Math.PI * 2,
      })
    }
    this.drawTrees(ctx, trees)
  }

  private drawTrees(ctx: CanvasRenderingContext2D, trees: ReadonlyArray<Tree>) {
    const draw = (img: CanvasImageSource, t: Tree, offset: number) => {
      ctx.save()
      ctx.translate(t.x + SHADOW_DIR[0] * offset, t.y + SHADOW_DIR[1] * offset)
      ctx.rotate(t.turn)
      ctx.drawImage(img, -t.size / 2, -t.size / 2, t.size, t.size)
      ctx.restore()
    }
    ctx.globalAlpha = SHADOW_ALPHA
    for (const t of trees) {
      const shadow = this.treeShadows[t.sprite]
      if (shadow !== undefined) draw(shadow, t, t.size * 0.45)
    }
    ctx.globalAlpha = 1
    for (const t of trees) {
      const img = this.assets.trees[t.sprite]
      if (img !== undefined) draw(img, t, 0)
    }
  }
}

type Tree = { readonly x: number; readonly y: number; readonly size: number; readonly sprite: number; readonly turn: number }

/** Index into `assets.trees` of sprite `sprite` in a tone picked by `h` (0..1). */
const tinted = (sprite: number, h: number) => sprite * TREE_TONES.length + Math.floor(h * TREE_TONES.length)

/** Sprite indices in trees.png: 0 beech, 1 spruce, 2 birch, 3 apple, 4 bush, 5 thuja, 6 maple, 7 shrub. */
const FOREST_TREES = [0, 1, 1, 1, 6]
/** Town trees are mostly broad-leaved; small crowns are bushes and hedges. */
const CROWNS = [0, 0, 0, 1, 2, 3, 6, 6]
const SMALL_CROWNS = [0, 4, 5, 5]
/** How far a crown's shadow can reach past its radius, in meters. */
const CROWN_SHADOW_M = 8

/** Add item `i` at (x, y) to the list of every chunk within `reach` meters. */
const bucket = (chunks: Map<string, Array<number>>, i: number, x: number, y: number, reach: number) => {
  for (let cy = Math.floor((y - reach) / CHUNK_M); cy <= Math.floor((y + reach) / CHUNK_M); cy++) {
    for (let cx = Math.floor((x - reach) / CHUNK_M); cx <= Math.floor((x + reach) / CHUNK_M); cx++) {
      const key = `${cx},${cy}`
      const list = chunks.get(key)
      if (list === undefined) chunks.set(key, [i])
      else list.push(i)
    }
  }
}

/** Resolution of the roof plane layer; the bake scales it up smoothly. */
const ROOF_PX_PER_M = 2
/** Resolution at which the paved mask gets its hard edge. */
const MASK_PX_PER_M = 2

const parseHex = (hex: string): readonly [number, number, number] => {
  const n = Number.parseInt(hex.slice(1), 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}

const nearestWallDistSq = (x: number, y: number, pts: ReadonlyArray<number>) => {
  let best = Infinity
  for (let i = 0; i + 3 < pts.length; i += 2) {
    best = Math.min(best, distToSegmentSq(x, y, pts[i] ?? 0, pts[i + 1] ?? 0, pts[i + 2] ?? 0, pts[i + 3] ?? 0))
  }
  return best
}

/** Building and tree shadows: a cool dark, about as deep as in the photo. */
const SHADOW_COLOR = "rgb(14,22,40)"
const SHADOW_ALPHA = 0.5

/** Deterministic 0..1 hash of a grid cell. */
const hash2 = (x: number, y: number, salt: number) => {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(salt, 2246822519)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
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

