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
import { boxOf, centroid, longestEdgeAngle, pointInPolygon, type Box } from "#/world/geometry.ts"
import { Grid } from "#/world/grid.ts"
import { facadeFor, type Facade } from "./facade.ts"
import { roofTone } from "./roof-tone.ts"
import { band, clipHalfPlane, dashes, keepIntervals, openRing, polylineLength, signedArea, subPolyline, triangulate } from "./geometry.ts"
import { makeSignals, ZEBRA_M, type StopLine, type Zebra } from "#/sim/signals.ts"
import { CANOPY_Z, planStations, pillarsOf as canopyPillars } from "#/sim/stations.ts"
import { canopy, STATION_BANDS, type Canopy } from "./canopy.ts"
import { cafe as cafeMesh } from "./cafe.ts"
import { OBELISK, PAVILION, PAVILION_H, ROOM, TERRACE, inRect, rectRing, toLocal, type Rect } from "#/world/cafe.ts"
import { signalHead, stopLine, streetLamp, streetLamps, streetProp, streetProps, zebra, type StreetLamp, type StreetProp } from "./street.ts"
import { FADES, Material, MeshBuilder, Mode, Sprite, spriteQuad, type Mesh, type Rgba, type SpriteBoxes } from "./mesh.ts"
import type { Place, PlaceDressing } from "#/world/places/dressing.ts"
import { placeBox, placeParts } from "./places.ts"

export const CHUNK_M = 128
export const STOREY_M = 3
export const wallHeight = (levels: number) => levels * STOREY_M

/** Height of each ground layer: a few centimetres apart, invisible from 100 m up but enough for the depth test. */
const Z = { area: 0.02, water: 0.03, track: 0.035, footway: 0.04, sidewalk: 0.05, kerb: 0.06, road: 0.07, marking: 0.08, shadow: 0.1 } as const

/** Meters one texture tile covers: at the close camera a ground meter is about 70 screen pixels, so 512 px tiles must not cover much more than 6 m. */
const TILE = { road: 6, sidewalk: 4, paving: 5, water: 12, forest: 20, farmland: 30, lawn: 6, roof: 5, gravel: 6 } as const
/** Width of a facade tile in meters, and its height: two storeys. */
const FACADE_W: Readonly<Record<Facade, number>> = { block: 6.4, house: 6.4, shop: 8, industrial: 6, ursula: 12.8, render: 6.4 }
const FACADE_H = 2 * STOREY_M
const FACADE_LAYER: Readonly<Record<Facade, Material>> = {
  block: Material.facadeBlock,
  house: Material.facadeHouse,
  shop: Material.facadeShop,
  industrial: Material.facadeIndustrial,
  ursula: Material.facadeUrsula,
  render: Material.facadeRender,
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
const SHADOW: Rgba = [14, 22, 40, 100]
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
  readonly street: Array<number>
  readonly canopies: Array<number>
  /** Cafe Waldmann's pavilion and terrace are drawn with this chunk. */
  cafe: boolean
  bounds: Box
}

/**
 * A roof that fades away while you are under it, as a rectangle in its own
 * frame (origin, axis u; n is u turned a quarter clockwise, see world/cafe.ts),
 * and how far it fades: canopies to a third, the cafe's roof all the way.
 */
export type RoofOver = { readonly frame: readonly [number, number, number, number]; readonly rect: Rect; readonly floor: number }

/** A piece of street furniture, drawn by street.ts. */
type StreetItem =
  | { readonly kind: "stop"; readonly stop: StopLine }
  | { readonly kind: "zebra"; readonly zebra: Zebra }
  | { readonly kind: "lamp"; readonly lamp: StreetLamp }
  | { readonly kind: "prop"; readonly prop: StreetProp }

/** Deterministic 0..1 hash. */
export const hash2 = (x: number, y: number, salt: number) => {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(salt, 2246822519)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

const parseHex = (hex: string): readonly [number, number, number] => {
  const n = Number.parseInt(hex.slice(1), 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}

const scale = (c: Rgba, k: number): Rgba => [Math.min(255, c[0] * k), Math.min(255, c[1] * k), Math.min(255, c[2] * k), c[3]]

const GRAVEL: Rgba = [150, 150, 146, 255]

/** Roof colours for buildings the photo has none for (hidden under trees, or outside it). */
const FALLBACK_ROOFS: ReadonlyArray<Rgba> = [
  [178, 64, 34, 255],
  [112, 56, 38, 255],
  [66, 68, 74, 255],
]

/** The two roof colours either side of the ridge (equal for a flat roof), and whether it is pitched. */
export const roofColors = (b: Building, nx: number, ny: number, d: number): { readonly sides: readonly [Rgba, Rgba]; readonly pitched: boolean } => {
  const roof = b.roof
  if (roof === undefined) {
    const c = FALLBACK_ROOFS[Math.floor(hash2(b.id, 0, 3) * FALLBACK_ROOFS.length)] ?? WHITE
    return b.levels < 3 ? { sides: [c, scale(c, 0.75)], pitched: true } : { sides: [GRAVEL, GRAVEL], pitched: false }
  }
  const colors = roof.colors
  const first = colors.find((c) => c !== null)
  const tone = (hex: string) => roofTone(parseHex(hex), roof.pitched)
  const base = first == null ? GRAVEL : tone(first)
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
      best[side] = tone(c)
    }
  })
  return { sides: [best[0] ?? best[1] ?? base, best[1] ?? best[0] ?? base], pitched: true }
}

/** A place dressing's roof: one colour on both planes (the second in shade), pitched or flat as it says. */
const dressedRoof = (roof: { readonly sides: readonly [Rgba, Rgba]; readonly pitched: boolean }, dress: PlaceDressing | undefined) => {
  const over = dress?.roof
  if (over === undefined) return roof
  const pitched = over.pitched ?? roof.pitched
  const c = over.colour
  return { sides: c === undefined ? roof.sides : ([c, pitched ? scale(c, 0.8) : c] as const), pitched }
}

/**
 * The wall from the ground to `top` as pieces of facade texture, bottom up:
 * up to `z1`, `layer`, its bottom row at height `base` and `span` meters of
 * wall per texture height. A shop front gets the block above its two storeys;
 * metal halls stretch one tile over the whole wall.
 */
const wallPieces = (facade: Facade, top: number): ReadonlyArray<{ readonly z1: number; readonly layer: Material; readonly base: number; readonly span: number }> => {
  if (facade === "industrial") return [{ z1: top, layer: FACADE_LAYER.industrial, base: 0, span: top }]
  if (facade === "shop" && top > FACADE_H)
    return [
      { z1: FACADE_H, layer: FACADE_LAYER.shop, base: 0, span: FACADE_H },
      { z1: top, layer: FACADE_LAYER.block, base: FACADE_H, span: FACADE_H },
    ]
  return [{ z1: top, layer: FACADE_LAYER[facade], base: 0, span: FACADE_H }]
}

export class Scene {
  readonly cols: number
  readonly rows: number
  private readonly chunks: Array<Chunk>
  private readonly lines: Array<Line> = []
  private readonly street: Array<StreetItem> = []
  /** Petrol station canopies, and the other roofs on pillars OSM maps (carports, shelters). */
  private readonly canopies: Array<Canopy> = []
  private readonly facades: Array<Facade>
  /** The dressed places (world/places), by the index of their footprint. */
  private readonly places: ReadonlyMap<number, Place>
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
      return { buildings: [], areas: [], segments: [], rivers: [], lines: [], crowns: [], street: [], canopies: [], cafe: false, bounds: { minX: x, minY: y, maxX: x + CHUNK_M, maxY: y + CHUNK_M } }
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
    this.places = new Map(world.places.map((p) => [p.building, p]))
    this.facades = map.buildings.map((b, i) => {
      const near = poiGrid.query(boxOf(b.pts, 4)).flatMap((k) => map.pois[k] ?? [])
      return this.places.get(i)?.dressing.facade ?? facadeFor(b, near)
    })
    const stations = planStations(world)
    for (const st of stations) if (st.kiosk >= 0) this.facades[st.kiosk] = "shop"
    const stationRoofs = new Set(stations.filter((st) => st.mapped).map((st) => st.canopy.join(",")))
    this.canopies.push(...stations.map((st): Canopy => ({ ring: st.canopy, angle: st.angle, pillars: st.pillars, band: STATION_BANDS[st.band % STATION_BANDS.length] ?? KERB, pylon: st.pylon, air: st.air })))
    map.buildings.forEach((b) => {
      if (b.canopy !== true) return
      const ring = openRing(b.pts)
      if (stationRoofs.has(ring.join(","))) return
      const angle = longestEdgeAngle(b.pts)
      this.canopies.push({ ring, angle, pillars: canopyPillars(ring, angle), band: KERB, pylon: null, air: null })
    })
    this.canopies.forEach((c, i) => {
      const box = boxOf(c.ring, CANOPY_Z * SHADOW_PER_M + 4)
      own((box.minX + box.maxX) / 2, (box.minY + box.maxY) / 2, box)?.canopies.push(i)
    })
    const cafe = world.cafe
    if (cafe !== null) {
      const box = boxOf([...rectRing(cafe.frame, PAVILION), ...rectRing(cafe.frame, TERRACE), ...rectRing(cafe.frame, [OBELISK.u, OBELISK.u, OBELISK.n, OBELISK.n])], PAVILION_H * SHADOW_PER_M + 2)
      const chunk = own((box.minX + box.maxX) / 2, (box.minY + box.maxY) / 2, box)
      if (chunk !== undefined) chunk.cafe = true
    }
    map.buildings.forEach((b, i) => {
      if (b.canopy === true) return
      const walls = boxOf(b.pts, wallHeight(b.levels) * SHADOW_PER_M)
      const place = this.places.get(i)
      const parts = place === undefined ? null : placeBox(place, b.pts)
      const box = parts === null ? walls : { minX: Math.min(walls.minX, parts.minX), minY: Math.min(walls.minY, parts.minY), maxX: Math.max(walls.maxX, parts.maxX), maxY: Math.max(walls.maxY, parts.maxY) }
      // Owned by the chunk of the walls' middle, as without parts.
      own((walls.minX + walls.maxX) / 2, (walls.minY + walls.maxY) / 2, box)?.buildings.push(i)
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
      // Nor over the cafe and its terrace: you look in from above.
      if (cafe !== null) {
        const [u, n] = toLocal(cafe.frame, x, y)
        if (inRect(PAVILION, u, n, 1) || inRect(TERRACE, u, n, 0.5)) continue
      }
      const reach = r * 1.2 + crownHeight(r) * SHADOW_PER_M
      own(x, y, { minX: x - reach, minY: y - reach, maxX: x + reach, maxY: y + reach })?.crowns.push(i)
    }
    const signals = makeSignals(world)
    const items: Array<StreetItem> = [
      ...signals.stops.map((stop): StreetItem => ({ kind: "stop", stop })),
      ...signals.zebras.map((z): StreetItem => ({ kind: "zebra", zebra: z })),
    ]
    const furniture = [...signals.stops.map((st) => signalHead(st).pole), ...signals.zebras]
    items.push(...streetLamps(world, furniture).map((lamp): StreetItem => ({ kind: "lamp", lamp })))
    items.push(...streetProps(world, furniture).map((p): StreetItem => ({ kind: "prop", prop: p })))
    for (const item of items) {
      const at = item.kind === "stop" ? item.stop : item.kind === "zebra" ? item.zebra : item.kind === "lamp" ? item.lamp : item.prop
      // Room for an arm over the road and a shadow 7 m long.
      const reach = 14
      own(at.x, at.y, { minX: at.x - reach, minY: at.y - reach, maxX: at.x + reach, maxY: at.y + reach })?.street.push(this.street.length)
      this.street.push(item)
    }
    this.grid = new Grid(map.width, map.height, CHUNK_M)
    this.chunks.forEach((c, key) => this.grid.insert(key, c.bounds))
  }

  /** The roof over (x, y) that fades while you are under it: a petrol station canopy (padded by its fascia), the cafe's; or null in the open. */
  roofAt(x: number, y: number): RoofOver | null {
    const cafe = this.world.cafe
    if (cafe !== null) {
      const [u, n] = toLocal(cafe.frame, x, y)
      if (inRect(ROOM, u, n)) {
        const f = cafe.frame
        return { frame: [f.ox, f.oy, f.ux, f.uy], rect: [ROOM[0] - 1, PAVILION[1] + 1, PAVILION[2] - 1, PAVILION[3] + 1], floor: 0 }
      }
    }
    for (const c of this.canopies) {
      if (!pointInPolygon(x, y, c.ring)) continue
      const b = boxOf(c.ring, 1)
      // Frame u = +x, so n = -y.
      return { frame: [0, 0, 1, 0], rect: [b.minX, b.maxX, -b.maxY, -b.minY], floor: 0.3 }
    }
    return null
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
      if (b === undefined) continue
      const place = this.places.get(i)
      this.building(m, b, this.facades[i] ?? "house", place?.dressing)
      if (place !== undefined) placeParts(m, this.sprites, place, b.pts)
    }
    for (const i of chunk.canopies) {
      const c = this.canopies[i]
      if (c !== undefined) canopy(m, this.sprites, c)
    }
    if (chunk.cafe && this.world.cafe !== null) cafeMesh(m, this.sprites, this.world.cafe.frame)
    for (const i of chunk.street) {
      const item = this.street[i]
      if (item?.kind === "stop") stopLine(m, this.sprites, item.stop)
      else if (item?.kind === "zebra") zebra(m, this.sprites, item.zebra, ZEBRA_M)
      else if (item?.kind === "lamp") streetLamp(m, this.sprites, item.lamp)
      else if (item?.kind === "prop") streetProp(m, this.sprites, item.prop)
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
   * shadow the block casts. A place dressing's wall colour, bands and roof
   * override them.
   */
  private building(m: MeshBuilder, b: Building, facade: Facade, dress?: PlaceDressing) {
    const ring = openRing(b.pts)
    const n = ring.length / 2
    if (n < 3) return
    const h = wallHeight(b.levels)
    const orient = signedArea(ring) >= 0 ? 1 : -1
    const angle = longestEdgeAngle(b.pts)
    const [mx, my] = centroid(ring)
    const rx = Math.cos(angle)
    const ry = Math.sin(angle)
    const nx = -ry
    const ny = rx
    const d = nx * mx + ny * my
    const { sides, pitched } = dressedRoof(roofColors(b, nx, ny, d), dress)
    // Flat roofs sit inside a parapet: the walls run on past the roof.
    const top = pitched ? h : h + PARAPET_M
    const tint = 0.9 + hash2(b.id, 0, 1) * 0.15
    const pieces = wallPieces(facade, top)
    // Where the wall changes texture or band: the pieces' ends, cut at the bands'.
    const bands = dress?.bands ?? []
    const cuts = [...new Set([0, ...pieces.map((p) => p.z1), ...bands.flatMap((bd) => [bd.z0, bd.z1]).filter((z) => z > 0 && z < top)])].toSorted((a, z) => a - z)
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
      const wx = (orient * (by - ay)) / len
      const wy = (orient * -(bx - ax)) / len
      const light = 0.62 + 0.38 * Math.max(0, -(wx * SHADOW_DIR[0] + wy * SHADOW_DIR[1]))
      const c = dress?.wallColour === undefined ? scale(WHITE, tint * light) : scale(dress.wallColour, light)
      const u0 = u / FACADE_W[facade]
      const u1 = (u + len) / FACADE_W[facade]
      for (let k = 0; k + 1 < cuts.length; k++) {
        const z0 = cuts[k] ?? 0
        const z1 = cuts[k + 1] ?? top
        const mid = (z0 + z1) / 2
        const piece = pieces.find((p) => mid < p.z1) ?? pieces[pieces.length - 1]
        const over = bands.findLast((bd) => mid > bd.z0 && mid < bd.z1)
        if (piece === undefined) continue
        if (over?.plain === true) {
          const f = scale(over.colour, light)
          m.quad(m.vertex(ax, ay, z0, 0, 0, f, Mode.color, 0), m.vertex(bx, by, z0, 0, 0, f, Mode.color, 0), m.vertex(bx, by, z1, 0, 0, f, Mode.color, 0), m.vertex(ax, ay, z1, 0, 0, f, Mode.color, 0))
          continue
        }
        const col = over === undefined ? c : scale(over.colour, light)
        // The texture's bottom row is the ground floor; image rows run down, so v falls as z rises.
        const v0 = 1 - (z0 - piece.base) / piece.span
        const v1 = 1 - (z1 - piece.base) / piece.span
        m.quad(m.vertex(ax, ay, z0, u0, v0, col, Mode.material, piece.layer), m.vertex(bx, by, z0, u1, v0, col, Mode.material, piece.layer), m.vertex(bx, by, z1, u1, v1, col, Mode.material, piece.layer), m.vertex(ax, ay, z1, u0, v1, col, Mode.material, piece.layer))
      }
      u += len
    }

    const tris = triangulate(ring)
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
    const closed = [...ring, ring[0] ?? 0, ring[1] ?? 0]
    // GTA 2's crisp roof edges: a dark eave line round a pitched roof, a parapet with a light coping round a flat one.
    if (pitched) strip(m, closed, 0.14, h + 0.02, scale(sides[0], 0.55))
    else {
      parapet(m, closed, orient, h, top)
      vents(m, b, ring, h)
    }

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
    spriteQuad(m, { x, y, z, angle, length: size, width }, layer, box, tint, Mode.sprite + FADES)
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

/** Height of the low wall round a flat roof, and its thickness. */
const PARAPET_M = 0.6
const COPING_M = 0.35
const COPING: Rgba = [205, 202, 194, 255]
const PARAPET_INSIDE: Rgba = [128, 126, 120, 255]

/** The parapet's top (coping) and inner face, from the outline in towards the roof. */
const parapet = (m: MeshBuilder, closed: ReadonlyArray<number>, orient: number, h: number, top: number) => {
  const { left, right } = band(closed, COPING_M)
  // The left of each wall is inside when the ring winds positively.
  const inner = orient > 0 ? left : right
  let prev: readonly [number, number, number, number] | null = null
  for (let i = 0; i < closed.length / 2; i++) {
    const x = closed[i * 2] ?? 0
    const y = closed[i * 2 + 1] ?? 0
    const ix = inner[i * 2] ?? x
    const iy = inner[i * 2 + 1] ?? y
    const outerTop = m.vertex(x, y, top, 0, 0, COPING, Mode.color, 0)
    const innerTop = m.vertex(ix, iy, top, 0, 0, COPING, Mode.color, 0)
    const innerLow = m.vertex(ix, iy, top, 0, 0, PARAPET_INSIDE, Mode.color, 0)
    const innerFoot = m.vertex(ix, iy, h, 0, 0, PARAPET_INSIDE, Mode.color, 0)
    if (prev !== null) {
      m.quad(prev[0], outerTop, innerTop, prev[1])
      m.quad(prev[2], innerLow, innerFoot, prev[3])
    }
    prev = [outerTop, innerTop, innerLow, innerFoot]
  }
}

const VENT_TOP: Rgba = [186, 188, 190, 255]
const VENT_SIDE: Rgba = [118, 120, 124, 255]
const VENT_DARK: Rgba = [90, 92, 96, 255]

/** A few vents and air-conditioning boxes on a flat roof, where they fit clear of the parapet. */
const vents = (m: MeshBuilder, b: Building, ring: ReadonlyArray<number>, h: number) => {
  const area = Math.abs(signedArea(ring))
  if (area < 60) return
  const box = boxOf(ring)
  const want = Math.min(6, Math.max(1, Math.round(area / 180)))
  let placed = 0
  for (let k = 0; k < want * 6 && placed < want; k++) {
    const size = 1 + hash2(b.id, k, 11) * 1.4
    const x = box.minX + hash2(b.id, k, 12) * (box.maxX - box.minX)
    const y = box.minY + hash2(b.id, k, 13) * (box.maxY - box.minY)
    const r = size / 2 + COPING_M + 0.4
    const corners = [x - r, y - r, x + r, y - r, x + r, y + r, x - r, y + r]
    if (![0, 1, 2, 3].every((c) => pointInPolygon(corners[c * 2] ?? 0, corners[c * 2 + 1] ?? 0, ring))) continue
    block(m, x, y, size / 2, h, h + 0.5 + hash2(b.id, k, 14) * 0.7)
    placed++
  }
}

/** An axis-aligned box from z0 to z1: a light top, sides shaded by the sun. */
const block = (m: MeshBuilder, x: number, y: number, r: number, z0: number, z1: number) => {
  const v = (px: number, py: number, z: number, c: Rgba) => m.vertex(px, py, z, 0, 0, c, Mode.color, 0)
  m.quad(v(x - r, y - r, z1, VENT_TOP), v(x + r, y - r, z1, VENT_TOP), v(x + r, y + r, z1, VENT_TOP), v(x - r, y + r, z1, VENT_TOP))
  const side = (ax: number, ay: number, bx: number, by: number, c: Rgba) => m.quad(v(ax, ay, z0, c), v(bx, by, z0, c), v(bx, by, z1, c), v(ax, ay, z1, c))
  side(x - r, y - r, x + r, y - r, VENT_SIDE)
  side(x + r, y - r, x + r, y + r, VENT_SIDE)
  side(x + r, y + r, x - r, y + r, VENT_DARK)
  side(x - r, y + r, x - r, y - r, VENT_DARK)
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
