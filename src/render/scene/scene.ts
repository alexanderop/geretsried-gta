/**
 * The town as 3D geometry, built per 128 m chunk into static vertex buffers:
 * ground (lawn and paving by the photo's paved mask, land use, water),
 * streets with sidewalks, kerbs and lane markings, buildings extruded from
 * their OSM footprints with facades and photo-coloured roofs, tree crowns at
 * the places the photo shows them, and the shadows of all of it.
 *
 * Every item belongs to exactly one chunk (by its middle) and is not clipped
 * to it, so a chunk's bounds are the union of its items' boxes; the ground
 * layers sit a few centimetres apart, so the depth test layers them in any
 * order.
 */
import type { AreaKind, Building, Road } from "#/map/types.ts"
import type { Crowns } from "#/map/crowns.ts"
import { SHADOW_DIR, SHADOW_PER_M } from "#/map/photo.ts"
import type { World } from "#/world/world.ts"
import { boxOf, centroid, longestEdgeAngle, type Box } from "#/world/geometry.ts"
import { Grid } from "#/world/grid.ts"
import { facadeFor, type Facade } from "./facade.ts"
import { band, clipHalfPlane, dashes, keepIntervals, openRing, polylineLength, signedArea, subPolyline, triangulate } from "./geometry.ts"
import { Material, MeshBuilder, Mode, Sprite, spriteQuad, type Mesh, type Rgba, type SpriteBoxes } from "./mesh.ts"

export const CHUNK_M = 128
export const STOREY_M = 3
export const wallHeight = (levels: number) => levels * STOREY_M

/** Height of each ground layer: a few centimetres apart, invisible from 100 m up but enough for the depth test. */
const Z = { area: 0.02, water: 0.03, track: 0.035, footway: 0.04, sidewalk: 0.05, kerb: 0.06, road: 0.07, marking: 0.08, shadow: 0.1 } as const

/** Meters one texture tile covers. */
const TILE = { road: 10, sidewalk: 4, paving: 8, water: 24, forest: 40, farmland: 40, lawn: 16, roof: 5, gravel: 12 } as const
/** Width of a facade tile in meters, and its height: two storeys. */
const FACADE_W: Readonly<Record<Facade, number>> = { block: 6.4, house: 6.4, shop: 8, industrial: 6 }
const FACADE_H = 2 * STOREY_M
const FACADE_LAYER: Readonly<Record<Facade, Material>> = {
  block: Material.facadeBlock,
  house: Material.facadeHouse,
  shop: Material.facadeShop,
  industrial: Material.facadeIndustrial,
}

const STREETS: ReadonlySet<string> = new Set(["primary", "secondary", "tertiary", "residential", "living_street"])
const MARKED: ReadonlySet<string> = new Set(["primary", "secondary", "tertiary"])
/** Sidewalk width on each side of a street. */
const SIDEWALK_M = 2.6
const KERB_M = 0.3
const LINE_HALF = 0.08
/** Line pieces are cut this short, so one never stretches a chunk's bounds far. */
const PIECE_M = 32

const WHITE: Rgba = [255, 255, 255, 255]
const KERB: Rgba = [196, 192, 182, 255]
const LINE: Rgba = [236, 234, 222, 255]
const SHADOW: Rgba = [14, 22, 40, 125]
/** Tree tones: the crowns vary like real ones. */
const TREE_TINTS: ReadonlyArray<Rgba> = [
  [235, 245, 225, 255],
  [205, 225, 190, 255],
  [190, 215, 205, 255],
]

const AREA_LOOK: Partial<Record<AreaKind, readonly [Material, number, Rgba, number]>> = {
  farmland: [Material.farmland, TILE.farmland, [235, 230, 215, 255], 0],
  forest: [Material.forest, TILE.forest, WHITE, 0.005],
  pitch: [Material.lawn, TILE.lawn, [175, 215, 160, 255], 0.01],
  parking: [Material.paving, TILE.paving, WHITE, 0.015],
  water: [Material.water, TILE.water, [150, 175, 200, 255], Z.water - Z.area],
}

/** Sprite indices in the tree sheet: 0 beech, 1 spruce, 2 birch, 3 apple, 4 bush, 5 thuja, 6 maple, 7 shrub. */
const FOREST_TREES = [0, 1, 1, 1, 6]
const CROWNS = [0, 0, 0, 1, 2, 3, 6, 6]
const SMALL_CROWNS = [0, 4, 5, 5]

/** A stretch of lane marking: a polyline drawn `half` meters either side. */
type Line = { readonly pts: ReadonlyArray<number> }

type Chunk = {
  readonly buildings: Array<number>
  readonly areas: Array<number>
  /** [road, first point index] of each road segment starting here. */
  readonly segments: Array<readonly [number, number]>
  readonly rivers: Array<readonly [number, number]>
  readonly lines: Array<number>
  readonly crowns: Array<number>
  bounds: Box
}

/** Deterministic 0..1 hash. */
export const hash2 = (x: number, y: number, salt: number) => {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(salt, 2246822519)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

const parseHex = (hex: string): Rgba => {
  const n = Number.parseInt(hex.slice(1), 16)
  const c = [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
  // The photo's colours are hazy; GTA 2 is not.
  const mean = ((c[0] ?? 0) + (c[1] ?? 0) + (c[2] ?? 0)) / 3
  const vivid = (v: number) => Math.max(0, Math.min(255, mean + (v - mean) * 1.3))
  return [vivid(c[0] ?? 0), vivid(c[1] ?? 0), vivid(c[2] ?? 0), 255]
}

const scale = (c: Rgba, k: number): Rgba => [Math.min(255, c[0] * k), Math.min(255, c[1] * k), Math.min(255, c[2] * k), c[3]]

/** Roof colours for buildings the photo has none for (hidden under trees, or outside it). */
const FALLBACK_ROOFS: ReadonlyArray<Rgba> = [
  [176, 92, 62, 255],
  [120, 84, 70, 255],
  [92, 92, 96, 255],
]

/** The two roof colours either side of the ridge (equal for a flat roof), and whether it is pitched. */
export const roofColors = (b: Building, nx: number, ny: number, d: number): { readonly sides: readonly [Rgba, Rgba]; readonly pitched: boolean } => {
  const roof = b.roof
  if (roof === undefined) {
    const c = FALLBACK_ROOFS[Math.floor(hash2(b.id, 0, 3) * FALLBACK_ROOFS.length)] ?? WHITE
    return { sides: [c, scale(c, 0.75)], pitched: b.levels < 3 }
  }
  const colors = roof.colors
  const first = colors.find((c) => c !== null)
  const base = first == null ? WHITE : parseHex(first)
  if (!roof.pitched || colors.length === 1) return { sides: [base, base], pitched: roof.pitched }
  // Per side of the ridge: the plane over the longest wall there.
  const best: [Rgba | null, Rgba | null] = [null, null]
  const bestLen = [0, 0]
  const { pts } = b
  colors.forEach((c, i) => {
    if (c === null) return
    const ax = pts[i * 2] ?? 0
    const ay = pts[i * 2 + 1] ?? 0
    const bx = pts[i * 2 + 2] ?? 0
    const by = pts[i * 2 + 3] ?? 0
    const side = nx * (ax + bx) * 0.5 + ny * (ay + by) * 0.5 >= d ? 0 : 1
    const len = Math.hypot(bx - ax, by - ay)
    if (len > (bestLen[side] ?? 0)) {
      bestLen[side] = len
      best[side] = parseHex(c)
    }
  })
  return { sides: [best[0] ?? best[1] ?? base, best[1] ?? best[0] ?? base], pitched: true }
}

export class Scene {
  readonly cols: number
  readonly rows: number
  private readonly chunks: Array<Chunk>
  private readonly lines: Array<Line> = []
  private readonly facades: Array<Facade>
  /** Chunk keys by their bounds, for the view query. */
  private readonly grid: Grid
  private readonly builder = new MeshBuilder()

  constructor(
    private readonly world: World,
    private readonly crowns: Crowns,
    private readonly sprites: SpriteBoxes,
  ) {
    const { map } = world
    this.cols = Math.ceil(map.width / CHUNK_M)
    this.rows = Math.ceil(map.height / CHUNK_M)
    this.chunks = Array.from({ length: this.cols * this.rows }, (_, key) => {
      const x = (key % this.cols) * CHUNK_M
      const y = Math.floor(key / this.cols) * CHUNK_M
      return { buildings: [], areas: [], segments: [], rivers: [], lines: [], crowns: [], bounds: { minX: x, minY: y, maxX: x + CHUNK_M, maxY: y + CHUNK_M } }
    })
    const own = (x: number, y: number, box: Box): Chunk | undefined => {
      const cx = Math.min(this.cols - 1, Math.max(0, Math.floor(x / CHUNK_M)))
      const cy = Math.min(this.rows - 1, Math.max(0, Math.floor(y / CHUNK_M)))
      const chunk = this.chunks[cy * this.cols + cx]
      if (chunk === undefined) return undefined
      const b = chunk.bounds
      chunk.bounds = { minX: Math.min(b.minX, box.minX), minY: Math.min(b.minY, box.minY), maxX: Math.max(b.maxX, box.maxX), maxY: Math.max(b.maxY, box.maxY) }
      return chunk
    }

    const poiGrid = new Grid(map.width, map.height, 64)
    map.pois.forEach((p, i) => poiGrid.insert(i, { minX: p.x, minY: p.y, maxX: p.x, maxY: p.y }))
    this.facades = map.buildings.map((b) => {
      const near = poiGrid.query(boxOf(b.pts, 4)).flatMap((i) => map.pois[i] ?? [])
      return facadeFor(b, near)
    })
    map.buildings.forEach((b, i) => {
      const box = boxOf(b.pts, wallHeight(b.levels) * SHADOW_PER_M)
      own((box.minX + box.maxX) / 2, (box.minY + box.maxY) / 2, box)?.buildings.push(i)
    })
    map.areas.forEach((a, i) => {
      if (AREA_LOOK[a.kind] === undefined) return
      const box = boxOf(a.pts)
      own((box.minX + box.maxX) / 2, (box.minY + box.maxY) / 2, box)?.areas.push(i)
    })
    const segments = (pts: ReadonlyArray<number>, pad: number, add: (chunk: Chunk, k: number) => void) => {
      for (let k = 0; k + 3 < pts.length; k += 2) {
        const seg = [pts[k] ?? 0, pts[k + 1] ?? 0, pts[k + 2] ?? 0, pts[k + 3] ?? 0]
        const chunk = own(((seg[0] ?? 0) + (seg[2] ?? 0)) / 2, ((seg[1] ?? 0) + (seg[3] ?? 0)) / 2, boxOf(seg, pad))
        if (chunk !== undefined) add(chunk, k)
      }
    }
    map.roads.forEach((r, i) => segments(r.pts, r.width / 2 + SIDEWALK_M + 1, (chunk, k) => chunk.segments.push([i, k])))
    map.waterways.forEach((w, i) => segments(w.pts, w.width / 2 + 1, (chunk, k) => chunk.rivers.push([i, k])))
    map.roads.forEach((r, i) => {
      for (const pts of this.markings(r, i)) {
        for (let s = 0; s < polylineLength(pts); s += PIECE_M) {
          const piece = subPolyline(pts, s, s + PIECE_M)
          if (piece.length < 4) continue
          const box = boxOf(piece, 1)
          own(piece[0] ?? 0, piece[1] ?? 0, box)?.lines.push(this.lines.length)
          this.lines.push({ pts: piece })
        }
      }
    })
    for (let i = 0; i < crowns.rs.length; i++) {
      const x = (crowns.xs[i] ?? 0) / 10
      const y = (crowns.ys[i] ?? 0) / 10
      const r = (crowns.rs[i] ?? 0) / 10
      // Streets stay readable: no crown over the asphalt.
      const road = world.roadAt(x, y, 1)
      if (road !== null && road.road.kind !== "footway" && road.road.kind !== "track") continue
      const reach = r * 1.2 + crownHeight(r) * SHADOW_PER_M
      own(x, y, { minX: x - reach, minY: y - reach, maxX: x + reach, maxY: y + reach })?.crowns.push(i)
    }
    this.grid = new Grid(map.width, map.height, CHUNK_M)
    this.chunks.forEach((c, key) => this.grid.insert(key, c.bounds))
  }

  /** Keys of the chunks that may draw something inside `view`. */
  keysIn(view: Box): Array<number> {
    return this.grid.query(view).filter((key) => {
      const b = this.chunks[key]?.bounds
      return b !== undefined && b.minX <= view.maxX && b.maxX >= view.minX && b.minY <= view.maxY && b.maxY >= view.minY
    })
  }

  /** Every vertex and triangle of chunk `key`. */
  build(key: number): Mesh {
    const m = this.builder
    m.reset()
    const chunk = this.chunks[key]
    if (chunk === undefined) return m.finish()
    const cx = key % this.cols
    const cy = Math.floor(key / this.cols)
    const { map } = this.world
    this.ground(m, cx, cy)
    for (const i of chunk.areas) {
      const a = map.areas[i]
      const look = a === undefined ? undefined : AREA_LOOK[a.kind]
      if (a === undefined || look === undefined) continue
      const [material, tile, tint, lift] = look
      polygon(m, openRing(a.pts), Z.area + lift, (x, y) => [x / tile, y / tile], tint, Mode.material, material)
    }
    for (const [i, k] of chunk.rivers) {
      const w = map.waterways[i]
      if (w !== undefined) this.segment(m, w.pts, k, w.width / 2, Z.water, Material.water, TILE.water, false, [150, 175, 200, 255])
    }
    for (const [i, k] of chunk.segments) {
      const r = map.roads[i]
      if (r !== undefined) this.road(m, r, k)
    }
    for (const i of chunk.lines) {
      const line = this.lines[i]
      if (line !== undefined) strip(m, line.pts, LINE_HALF, Z.marking, LINE)
    }
    for (const i of chunk.buildings) {
      const b = map.buildings[i]
      if (b !== undefined) this.building(m, b, this.facades[i] ?? "house")
    }
    this.forest(m, cx, cy)
    for (const i of chunk.crowns) {
      const r = (this.crowns.rs[i] ?? 0) / 10
      const pool = r < 3.6 ? SMALL_CROWNS : CROWNS
      const sprite = pool[Math.floor(hash2(i, 0, 7) * pool.length)] ?? 0
      this.tree(m, (this.crowns.xs[i] ?? 0) / 10, (this.crowns.ys[i] ?? 0) / 10, r * 2 * 1.2, crownHeight(r) + hash2(i, 0, 5) * 0.5, sprite, i)
    }
    return m.finish()
  }

  /** The chunk's square of lawn and paving; the shader picks which by the paved mask. */
  private ground(m: MeshBuilder, cx: number, cy: number) {
    const x0 = cx * CHUNK_M
    const y0 = cy * CHUNK_M
    const v = (x: number, y: number) => m.vertex(x, y, 0, 0, 0, WHITE, Mode.ground, 0)
    m.quad(v(x0, y0), v(x0 + CHUNK_M, y0), v(x0 + CHUNK_M, y0 + CHUNK_M), v(x0, y0 + CHUNK_M))
  }

  /** One segment of a street (k: index of its first x in `pts`): sidewalks, kerbs, asphalt. */
  private road(m: MeshBuilder, r: Road, k: number) {
    const half = r.width / 2
    if (STREETS.has(r.kind)) {
      this.segment(m, r.pts, k, half + SIDEWALK_M, Z.sidewalk, Material.sidewalk, TILE.sidewalk, true, WHITE)
      this.segment(m, r.pts, k, half + KERB_M, Z.kerb, -1, 1, false, KERB)
      this.segment(m, r.pts, k, half, Z.road, Material.road, TILE.road, false, WHITE)
    } else if (r.kind === "service") this.segment(m, r.pts, k, half, Z.road, Material.road, TILE.road, false, [235, 240, 240, 255])
    else if (r.kind === "footway") this.segment(m, r.pts, k, half, Z.footway, Material.sidewalk, TILE.sidewalk, true, [235, 225, 210, 255])
    else this.segment(m, r.pts, k, half, Z.track, Material.paving, TILE.paving, false, [200, 170, 125, 255])
  }

  /**
   * A band `half` meters either side of segment k of a polyline, with a round
   * joint at its start (and its end, for the last one), so bends and
   * junctions close. Texture in world space, or along the segment (`along`)
   * for slabs that follow the street. Material -1: plain colour.
   */
  private segment(m: MeshBuilder, pts: ReadonlyArray<number>, k: number, half: number, z: number, material: number, tile: number, along: boolean, color: Rgba) {
    const ax = pts[k] ?? 0
    const ay = pts[k + 1] ?? 0
    const bx = pts[k + 2] ?? 0
    const by = pts[k + 3] ?? 0
    const len = Math.hypot(bx - ax, by - ay)
    if (len < 1e-3) return
    const dx = (bx - ax) / len
    const dy = (by - ay) / len
    const mode = material < 0 ? Mode.color : Mode.material
    const layer = Math.max(0, material)
    // Slabs keep their grid along the street; the offset to each segment's start makes them meet on bends.
    const uv = (x: number, y: number): readonly [number, number] =>
      along ? [((x - ax) * dx + (y - ay) * dy + ax * 0.37) / tile, ((x - ax) * -dy + (y - ay) * dx) / tile] : [x / tile, y / tile]
    const v = (x: number, y: number) => {
      const [u, w] = uv(x, y)
      return m.vertex(x, y, z, u, w, color, mode, layer)
    }
    m.quad(v(ax - dy * half, ay + dx * half), v(bx - dy * half, by + dx * half), v(bx + dy * half, by - dx * half), v(ax + dy * half, ay - dx * half))
    disc(m, ax, ay, half, v)
    if (k + 4 >= pts.length - 1) disc(m, bx, by, half, v)
  }

  /**
   * Lane markings of one road as polylines: a dashed centre line on two-way
   * main roads and solid edge lines on wide ones, cut out where other streets join.
   */
  private markings(r: Road, index: number): Array<Array<number>> {
    if (!MARKED.has(r.kind)) return []
    const { map, junctions } = this.world
    const cuts: Array<readonly [number, number]> = []
    let at = 0
    for (let v = 0; v < r.nodes.length; v++) {
      if (v > 0) at += Math.hypot((r.pts[v * 2] ?? 0) - (r.pts[v * 2 - 2] ?? 0), (r.pts[v * 2 + 1] ?? 0) - (r.pts[v * 2 - 1] ?? 0))
      const meet = junctions.get(r.nodes[v] ?? -1) ?? []
      // Ends meeting here: 2 for a road passing through, 1 for one ending. Three or more is a junction.
      const ends = meet.reduce((n, j) => {
        const last = (map.roads[j.road]?.nodes.length ?? 1) - 1
        return n + (j.vertex === 0 || j.vertex === last ? 1 : 2)
      }, 0)
      if (ends < 3) continue
      const reach = Math.max(...meet.filter((j) => j.road !== index).map((j) => (map.roads[j.road]?.width ?? 0) / 2), r.width / 2) + 2
      cuts.push([at - reach, at + reach])
    }
    const length = polylineLength(r.pts)
    const keep = keepIntervals(length, cuts)
    const out: Array<Array<number>> = []
    if (!r.oneway) for (const [a, b] of keep) out.push(...dashes(r.pts, a, b, 3, 6))
    if (r.width >= 7) {
      const inset = r.width / 2 - 0.45
      for (const [a, b] of keep) {
        const piece = subPolyline(r.pts, a, b)
        if (piece.length < 4) continue
        const { left, right } = band(piece, inset)
        out.push(left, right)
      }
    }
    return out
  }

  /**
   * Walls from the ground to the eaves with the building's facade (in meters,
   * so windows keep their real size), lit by which way they face; the roof
   * split along the ridge in the two plane colours from the photo; and the
   * shadow the block casts.
   */
  private building(m: MeshBuilder, b: Building, facade: Facade) {
    const ring = openRing(b.pts)
    const n = ring.length / 2
    if (n < 3) return
    const h = wallHeight(b.levels)
    const orient = signedArea(ring) >= 0 ? 1 : -1
    const tint = 0.9 + hash2(b.id, 0, 1) * 0.15
    let u = hash2(b.id, 0, 2) * FACADE_W[facade]
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      const ax = ring[i * 2] ?? 0
      const ay = ring[i * 2 + 1] ?? 0
      const bx = ring[j * 2] ?? 0
      const by = ring[j * 2 + 1] ?? 0
      const len = Math.hypot(bx - ax, by - ay)
      if (len < 1e-3) continue
      // Outward normal; walls facing the sun (away from the shadows) are lit.
      const nx = (orient * (by - ay)) / len
      const ny = (orient * -(bx - ax)) / len
      const light = 0.62 + 0.38 * Math.max(0, -(nx * SHADOW_DIR[0] + ny * SHADOW_DIR[1]))
      const c = scale(WHITE, tint * light)
      const wall = (z0: number, z1: number, layer: Material, v0: number, v1: number) => {
        const u0 = u / FACADE_W[facade]
        const u1 = (u + len) / FACADE_W[facade]
        m.quad(m.vertex(ax, ay, z0, u0, v0, c, Mode.material, layer), m.vertex(bx, by, z0, u1, v0, c, Mode.material, layer), m.vertex(bx, by, z1, u1, v1, c, Mode.material, layer), m.vertex(ax, ay, z1, u0, v1, c, Mode.material, layer))
      }
      // The texture's bottom row is the ground floor; image rows run down, so v falls as z rises.
      if (facade === "industrial") wall(0, h, FACADE_LAYER.industrial, 1, 0)
      else if (facade === "shop" && h > FACADE_H) {
        wall(0, FACADE_H, FACADE_LAYER.shop, 1, 0)
        wall(FACADE_H, h, FACADE_LAYER.block, 1, 1 - (h - FACADE_H) / FACADE_H)
      } else wall(0, h, FACADE_LAYER[facade], 1, 1 - h / FACADE_H)
      u += len
    }

    const tris = triangulate(ring)
    const angle = longestEdgeAngle(b.pts)
    const [mx, my] = centroid(ring)
    const rx = Math.cos(angle)
    const ry = Math.sin(angle)
    const nx = -ry
    const ny = rx
    const d = nx * mx + ny * my
    const { sides, pitched } = roofColors(b, nx, ny, d)
    const tile = pitched ? TILE.roof : TILE.gravel
    const layer = pitched ? Material.roofTiles : Material.roofGravel
    const vertex = (x: number, y: number, z: number, c: Rgba, mode: Mode) => m.vertex(x, y, z, (x * rx + y * ry) / tile, (x * nx + y * ny) / tile, c, mode, layer)
    for (let t = 0; t + 2 < tris.length; t += 3) {
      const tri = [tris[t], tris[t + 1], tris[t + 2]].flatMap((i) => [ring[(i ?? 0) * 2] ?? 0, ring[(i ?? 0) * 2 + 1] ?? 0])
      if (sides[0] === sides[1]) {
        fan(m, tri, (x, y) => vertex(x, y, h, sides[0], Mode.detail))
        continue
      }
      fan(m, clipHalfPlane(tri, nx, ny, d), (x, y) => vertex(x, y, h, sides[0], Mode.detail))
      fan(m, clipHalfPlane(tri, -nx, -ny, -d), (x, y) => vertex(x, y, h, sides[1], Mode.detail))
    }
    // A light parapet round a flat roof, a dark eave line round a pitched one: GTA 2's crisp roof edges.
    strip(m, [...ring, ring[0] ?? 0, ring[1] ?? 0], pitched ? 0.14 : 0.3, h + 0.02, pitched ? scale(sides[0], 0.55) : scale(sides[0], 1.2))

    m.target = "shadow"
    const ox = SHADOW_DIR[0] * h * SHADOW_PER_M
    const oy = SHADOW_DIR[1] * h * SHADOW_PER_M
    const s = (x: number, y: number) => m.vertex(x, y, Z.shadow, 0, 0, SHADOW, Mode.color, 0)
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      const ax = ring[i * 2] ?? 0
      const ay = ring[i * 2 + 1] ?? 0
      const bx = ring[j * 2] ?? 0
      const by = ring[j * 2 + 1] ?? 0
      m.quad(s(ax, ay), s(bx, by), s(bx + ox, by + oy), s(ax + ox, ay + oy))
    }
    for (let t = 0; t + 2 < tris.length; t += 3) {
      const [a, bb, c] = [tris[t] ?? 0, tris[t + 1] ?? 0, tris[t + 2] ?? 0].map((i) => s((ring[i * 2] ?? 0) + ox, (ring[i * 2 + 1] ?? 0) + oy))
      m.tri(a ?? 0, bb ?? 0, c ?? 0)
    }
    m.target = "opaque"
  }

  /** A crown seen from above at its height, and its shadow on the ground. */
  private tree(m: MeshBuilder, x: number, y: number, size: number, z: number, sprite: number, seed: number) {
    const layer = Sprite.tree + sprite
    const box = this.sprites[layer] ?? [1, 1]
    const angle = hash2(seed, 0, 8) * Math.PI * 2
    const tint = TREE_TINTS[Math.floor(hash2(seed, 0, 9) * TREE_TINTS.length)] ?? WHITE
    const width = (size * box[1]) / box[0]
    spriteQuad(m, { x, y, z, angle, length: size, width }, layer, box, tint, Mode.sprite)
    m.target = "shadow"
    const off = z * SHADOW_PER_M * 0.5
    spriteQuad(m, { x: x + SHADOW_DIR[0] * off, y: y + SHADOW_DIR[1] * off, z: Z.shadow, angle, length: size, width }, layer, box, SHADOW, Mode.silhouette)
    m.target = "opaque"
  }

  /** Forest trees on a fixed 7 m jittered grid in map space, so every chunk agrees on its own. */
  private forest(m: MeshBuilder, cx: number, cy: number) {
    const STEP = 7
    const { world } = this
    const n = CHUNK_M / STEP
    for (let gy = Math.ceil((cy * CHUNK_M) / STEP); gy < Math.ceil((cy * CHUNK_M) / STEP) + n; gy++) {
      for (let gx = Math.ceil((cx * CHUNK_M) / STEP); gx < Math.ceil((cx * CHUNK_M) / STEP) + n; gx++) {
        if (hash2(gx, gy, 1) > 0.85) continue
        const x = (gx + hash2(gx, gy, 2)) * STEP
        const y = (gy + hash2(gx, gy, 3)) * STEP
        if (world.areaAt(x, y) !== "forest") continue
        const size = 9 + hash2(gx, gy, 5) * 7
        if (world.roadAt(x, y, size * 0.3 + 1) !== null || world.isWater(x, y) || world.isSolid(x, y)) continue
        const sprite = FOREST_TREES[Math.floor(hash2(gx, gy, 4) * FOREST_TREES.length)] ?? 0
        this.tree(m, x, y, size, size * 0.9 + hash2(gx, gy, 6), sprite, gx * 7919 + gy)
      }
    }
  }
}

/** How high a crown of radius r stands: bushes low, big trees up to 14 m. */
const crownHeight = (r: number) => Math.min(14, Math.max(2.5, r * 2.2))

const DISC_STEPS = 12

/** A filled circle as a fan from its centre. */
const disc = (m: MeshBuilder, x: number, y: number, r: number, v: (x: number, y: number) => number) => {
  const c = v(x, y)
  const ring = Array.from({ length: DISC_STEPS }, (_, i) => v(x + Math.cos((i / DISC_STEPS) * Math.PI * 2) * r, y + Math.sin((i / DISC_STEPS) * Math.PI * 2) * r))
  ring.forEach((p, i) => m.tri(c, p, ring[(i + 1) % DISC_STEPS] ?? p))
}

/** A convex polygon as a fan. */
const fan = (m: MeshBuilder, poly: ReadonlyArray<number>, v: (x: number, y: number) => number) => {
  if (poly.length < 6) return
  const ids = Array.from({ length: poly.length / 2 }, (_, i) => v(poly[i * 2] ?? 0, poly[i * 2 + 1] ?? 0))
  for (let i = 1; i + 1 < ids.length; i++) m.tri(ids[0] ?? 0, ids[i] ?? 0, ids[i + 1] ?? 0)
}

/** Any simple polygon, triangulated, at height z. */
const polygon = (m: MeshBuilder, ring: ReadonlyArray<number>, z: number, uv: (x: number, y: number) => readonly [number, number], color: Rgba, mode: Mode, layer: number) => {
  const ids = Array.from({ length: ring.length / 2 }, (_, i) => {
    const x = ring[i * 2] ?? 0
    const y = ring[i * 2 + 1] ?? 0
    const [u, v] = uv(x, y)
    return m.vertex(x, y, z, u, v, color, mode, layer)
  })
  const tris = triangulate(ring)
  for (let t = 0; t + 2 < tris.length; t += 3) m.tri(ids[tris[t] ?? 0] ?? 0, ids[tris[t + 1] ?? 0] ?? 0, ids[tris[t + 2] ?? 0] ?? 0)
}

/** A plain-coloured band along a polyline (lane markings, roof edges). */
const strip = (m: MeshBuilder, pts: ReadonlyArray<number>, half: number, z: number, color: Rgba) => {
  const { left, right } = band(pts, half)
  let prev: readonly [number, number] | null = null
  for (let i = 0; i < pts.length / 2; i++) {
    const l = m.vertex(left[i * 2] ?? 0, left[i * 2 + 1] ?? 0, z, 0, 0, color, Mode.color, 0)
    const r = m.vertex(right[i * 2] ?? 0, right[i * 2 + 1] ?? 0, z, 0, 0, color, Mode.color, 0)
    if (prev !== null) m.quad(prev[0], l, r, prev[1])
    prev = [l, r]
  }
}
