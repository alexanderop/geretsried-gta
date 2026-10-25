/**
 * Cafe Waldmann as 3D geometry, from the layout in world/cafe.ts: the
 * pavilion's glass front with its dark fascia and the sign on the roof, the
 * optician's shop at its left end under a red and white awning, and inside
 * the cafe a wooden floor, the counter with the cake display, the espresso
 * machine and the woman behind it; through a green-framed doorway the dining
 * room with purple benches along the walls, six dark wooden tables with chairs
 * and the WC; the gold planter by the door. Outside: the
 * terrace under purple umbrellas, its planters and the obelisk.
 *
 * The cafe's roof and sign fade away while you are inside (`Scene.roofAt`),
 * so you see the room from above, GTA 2 style.
 */
import { SHADOW_DIR, SHADOW_PER_M } from "#/map/photo.ts"
import {
  BACK_COUNTER,
  BARISTA,
  BENCH_BACK_Z,
  BENCH_SEAT_Z,
  BENCHES,
  BISTRO,
  CHAIRS,
  COUNTER,
  DOOR,
  HEDGES,
  OBELISK,
  OPTICIAN,
  PATH,
  PAVILION,
  PAVILION_H,
  DOORWAY,
  PARTITION_U,
  TOILET,
  WC,
  WC_DOOR,
  PLANTER,
  ROOM,
  TABLE_Z,
  TABLES,
  TERRACE,
  UMBRELLA_Z,
  UMBRELLAS,
  VITRINES,
  WALL_T,
  WALLS,
  rectRing,
  square,
  toWorld,
  type Frame,
  type Rect,
} from "#/world/cafe.ts"
import { FADES, Material, MeshBuilder, Mode, Sprite, prop, spriteQuad, type PropName, type Rgba, type SpriteBoxes } from "./mesh.ts"

const WHITE: Rgba = [255, 255, 255, 255]
const SHADOW: Rgba = [14, 22, 40, 100]
const Z_SHADOW = 0.1
const Z_PAVING = 0.105
const Z_FLOOR = 0.12

const FASCIA: Rgba = [54, 44, 40, 255]
const FASCIA_RIM: Rgba = [214, 204, 186, 255]
const ROOF: Rgba = [96, 90, 84, 255]
const PLINTH: Rgba = [62, 54, 50, 255]
const MULLION: Rgba = [46, 40, 38, 255]
const GLASS: Rgba = [150, 180, 190, 90]
const PLASTER: Rgba = [238, 234, 226, 255]
const STONE: Rgba = [206, 202, 194, 255]
const STONE_TOP: Rgba = [226, 224, 218, 255]
const GREEN: Rgba = [150, 196, 40, 255]
const TILES: Rgba = [214, 222, 226, 255]
const PURPLE: Rgba = [104, 50, 100, 255]
const PURPLE_TOP: Rgba = [128, 66, 122, 255]
const WALNUT: Rgba = [72, 48, 36, 255]
const GOLD: Rgba = [200, 162, 72, 255]
const HEDGE: Rgba = [66, 116, 52, 255]
const HEDGE_TOP: Rgba = [92, 146, 66, 255]
const OBELISK_STONE: Rgba = [176, 174, 168, 255]
const AWNING_RED: Rgba = [196, 44, 44, 255]
const AWNING_WHITE: Rgba = [240, 236, 228, 255]
const MAT: Rgba = [70, 70, 72, 255]
const TERRACE_TINT: Rgba = [242, 234, 222, 255]
const FLOOR_TINT: Rgba = [240, 228, 214, 255]
/** Meters one tile of the floor texture covers (about eight planks). */
const FLOOR_TILE = 2.4
/** Where the awning hangs from the optician's front, and how far out and down it reaches. */
const AWNING = { z: 2.75, out: 1.6, drop: 0.6, stripe: 0.5 } as const

type Builder = {
  readonly m: MeshBuilder
  readonly f: Frame
  readonly boxes: SpriteBoxes
}

const shade = (c: Rgba, k: number): Rgba => [Math.min(255, c[0] * k), Math.min(255, c[1] * k), Math.min(255, c[2] * k), c[3]]

/** How lit a wall facing (wx, wy) is: walls facing the sun (away from the shadows) are bright. */
const light = (wx: number, wy: number) => 0.62 + 0.38 * Math.max(0, -(wx * SHADOW_DIR[0] + wy * SHADOW_DIR[1]))

const vertex = (b: Builder, u: number, n: number, z: number, c: Rgba, mode: number = Mode.color, layer = 0, tu = 0, tv = 0) => {
  const [x, y] = toWorld(b.f, u, n)
  return b.m.vertex(x, y, z, tu, tv, c, mode, layer)
}

/** A flat rectangle at height z; `uv` maps frame meters to texture coordinates. */
const flat = (b: Builder, r: Rect, z: number, c: Rgba, mode: number = Mode.color, layer = 0, uv: (u: number, n: number) => readonly [number, number] = () => [0, 0]) => {
  const v = (u: number, n: number) => vertex(b, u, n, z, c, mode, layer, ...uv(u, n))
  b.m.quad(v(r[0], r[2]), v(r[1], r[2]), v(r[1], r[3]), v(r[0], r[3]))
}

/** One upright face from (u0, n0) to (u1, n1), lit by which way it faces. */
const face = (b: Builder, u0: number, n0: number, u1: number, n1: number, z0: number, z1: number, c: Rgba, mode: number = Mode.color) => {
  const { f } = b
  // Outward: to the right of the face's direction in the frame (u east-ish, n away from the street).
  const du = u1 - u0
  const dn = n1 - n0
  const len = Math.hypot(du, dn) || 1
  const ou = dn / len
  const on = -du / len
  const lit = c[3] < 255 ? c : shade(c, light(f.ux * ou + f.nx * on, f.uy * ou + f.ny * on))
  b.m.quad(vertex(b, u0, n0, z0, lit, mode), vertex(b, u1, n1, z0, lit, mode), vertex(b, u1, n1, z1, lit, mode), vertex(b, u0, n0, z1, lit, mode))
}

/** A box on the rectangle from z0 to z1: its top in `top`, its four sides shaded by the sun. */
const box = (b: Builder, r: Rect, z0: number, z1: number, top: Rgba, side: Rgba = top, mode: number = Mode.color) => {
  const [u0, u1, n0, n1] = r
  face(b, u0, n1, u0, n0, z0, z1, side, mode)
  face(b, u0, n0, u1, n0, z0, z1, side, mode)
  face(b, u1, n0, u1, n1, z0, z1, side, mode)
  face(b, u1, n1, u0, n1, z0, z1, side, mode)
  flat(b, r, z1, top, mode)
}

/** A sprite lying flat at height z, its long side along frame angle `along` (0 = +u), `length` meters long. */
const sprite = (b: Builder, name: PropName, u: number, n: number, z: number, along: number, length: number, color: Rgba = WHITE, mode: number = Mode.sprite) => {
  const layer = prop(name)
  const bx = b.boxes[layer] ?? [1, 1]
  const [x, y] = toWorld(b.f, u, n)
  const angle = frameAngle(b.f) + along
  spriteQuad(b.m, { x, y, z, angle, length, width: (length * bx[1]) / bx[0] }, layer, bx, color, mode)
  return { x, y, angle, length, width: (length * bx[1]) / bx[0], layer, bx }
}

const frameAngle = (f: Frame) => Math.atan2(f.uy, f.ux)

/** The shadow of an upright box of height h standing on `r`. */
const boxShadow = (b: Builder, r: Rect, h: number) => {
  const { m } = b
  const ring = rectRing(b.f, r)
  const ox = SHADOW_DIR[0] * h * SHADOW_PER_M
  const oy = SHADOW_DIR[1] * h * SHADOW_PER_M
  m.target = "shadow"
  const s = (x: number, y: number) => m.vertex(x, y, Z_SHADOW, 0, 0, SHADOW, Mode.color, 0)
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4
    const ax = ring[i * 2] ?? 0
    const ay = ring[i * 2 + 1] ?? 0
    const bx = ring[j * 2] ?? 0
    const by = ring[j * 2 + 1] ?? 0
    m.quad(s(ax, ay), s(bx, by), s(bx + ox, by + oy), s(ax + ox, ay + oy))
  }
  m.quad(s((ring[0] ?? 0) + ox, (ring[1] ?? 0) + oy), s((ring[2] ?? 0) + ox, (ring[3] ?? 0) + oy), s((ring[4] ?? 0) + ox, (ring[5] ?? 0) + oy), s((ring[6] ?? 0) + ox, (ring[7] ?? 0) + oy))
  m.target = "opaque"
}

/** A shop window wall: a dark plinth, glass between slim dark frames, and the dark fascia over it. */
const glassWall = (b: Builder, r: Rect) => {
  const [u0, u1, n0, n1] = r
  const alongU = u1 - u0 >= n1 - n0
  const len = alongU ? u1 - u0 : n1 - n0
  const glassTop = PAVILION_H - 0.7
  box(b, r, 0, 0.4, PLINTH)
  box(b, r, glassTop, PAVILION_H, FASCIA)
  const mid = alongU ? (n0 + n1) / 2 : (u0 + u1) / 2
  if (alongU) face(b, u0, mid, u1, mid, 0.4, glassTop, GLASS)
  else face(b, mid, n0, mid, n1, 0.4, glassTop, GLASS)
  const panes = Math.max(1, Math.round(len / 2.2))
  for (let i = 0; i <= panes; i++) {
    const t = Math.min(len - 0.06, Math.max(0.06, (i / panes) * len))
    const piece: Rect = alongU ? [u0 + t - 0.06, u0 + t + 0.06, n0, n1] : [u0, u1, n0 + t - 0.06, n0 + t + 0.06]
    box(b, piece, 0.4, glassTop, MULLION)
  }
}

/** A chair: a seat and the backrest behind the sitter, who faces `facing`. */
const chair = (b: Builder, u: number, n: number, facing: number, seat: Rgba, frame: Rgba) => {
  box(b, square(u, n, 0.21), 0, 0.46, seat, frame)
  const bu = u - Math.cos(facing) * 0.19
  const bn = n - Math.sin(facing) * 0.19
  const across = Math.abs(Math.cos(facing)) > 0.5
  box(b, across ? [bu - 0.04, bu + 0.04, bn - 0.21, bn + 0.21] : [bu - 0.21, bu + 0.21, bn - 0.04, bn + 0.04], 0.46, 0.95, frame)
}

/** A tapering stone column with a pyramid tip: the obelisk. */
const obelisk = (b: Builder) => {
  const { u, n, base, top } = OBELISK
  box(b, square(u, n, base), 0, 0.45, OBELISK_STONE)
  const r0 = base * 0.62
  const r1 = base * 0.42
  const shaftTop = top - 0.35
  const corners = (r: number) => [
    [u - r, n - r],
    [u + r, n - r],
    [u + r, n + r],
    [u - r, n + r],
  ] as const
  const lo = corners(r0)
  const hi = corners(r1)
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4
    const a = lo[i] ?? [u, n]
    const c = lo[j] ?? [u, n]
    const lit = shade(OBELISK_STONE, light(...worldDir(b.f, (a[0] + c[0]) / 2 - u, (a[1] + c[1]) / 2 - n)))
    const ha = hi[i] ?? [u, n]
    const hc = hi[j] ?? [u, n]
    b.m.quad(vertex(b, a[0], a[1], 0.45, lit), vertex(b, c[0], c[1], 0.45, lit), vertex(b, hc[0], hc[1], shaftTop, lit), vertex(b, ha[0], ha[1], shaftTop, lit))
    const tip = vertex(b, u, n, top, lit)
    b.m.tri(vertex(b, ha[0], ha[1], shaftTop, lit), vertex(b, hc[0], hc[1], shaftTop, lit), tip)
  }
  boxShadow(b, square(u, n, r1), top)
}

/** A direction in the frame as a world direction. */
const worldDir = (f: Frame, du: number, dn: number): readonly [number, number] => [f.ux * du + f.nx * dn, f.uy * du + f.ny * dn]

/** The optician's awning: red and white stripes sloping out over the sidewalk in front of its window. */
const awning = (b: Builder) => {
  const [u0, u1, n0] = OPTICIAN
  const outN = n0 - AWNING.out
  const zIn = AWNING.z
  const zOut = AWNING.z - AWNING.drop
  const stripes = Math.round((u1 - u0 - 0.2) / AWNING.stripe)
  const w = (u1 - u0 - 0.2) / stripes
  for (let i = 0; i < stripes; i++) {
    const a = u0 + 0.1 + i * w
    const c = i % 2 === 0 ? AWNING_RED : AWNING_WHITE
    b.m.quad(vertex(b, a, n0, zIn, c), vertex(b, a + w, n0, zIn, c), vertex(b, a + w, outN, zOut, shade(c, 0.9)), vertex(b, a, outN, zOut, shade(c, 0.9)))
    // The valance hanging from its front edge.
    face(b, a, outN, a + w, outN, zOut - 0.3, zOut, c)
  }
  boxShadow(b, [u0 + 0.1, u1 - 0.1, outN, n0], zIn)
}

export const cafe = (m: MeshBuilder, boxes: SpriteBoxes, f: Frame) => {
  const b: Builder = { m, f, boxes }

  // Outside: the terrace's paving and the path to the door, the low planters at its edge.
  const paving = (r: Rect) => flat(b, r, Z_PAVING, TERRACE_TINT, Mode.material, Material.paving, (u, n) => [u / 5, n / 5])
  paving(TERRACE)
  paving(PATH)
  for (const h of HEDGES) {
    box(b, h, 0, 0.8, HEDGE_TOP, HEDGE)
    boxShadow(b, h, 0.8)
  }
  for (const t of BISTRO) {
    sprite(b, "cafe-bistro", t.u, t.n, 0.74, 0, 0.8)
    chair(b, t.u, t.n - 0.62, Math.PI / 2, AWNING_WHITE, [215, 215, 210, 255])
    chair(b, t.u, t.n + 0.62, -Math.PI / 2, AWNING_WHITE, [215, 215, 210, 255])
  }
  for (const p of UMBRELLAS) {
    box(b, square(p.u, p.n, 0.04), 0, UMBRELLA_Z, MULLION)
    const s = sprite(b, "cafe-umbrella", p.u, p.n, UMBRELLA_Z, 0, 3, WHITE, Mode.sprite + FADES)
    m.target = "shadow"
    const off = UMBRELLA_Z * SHADOW_PER_M
    spriteQuad(m, { x: s.x + SHADOW_DIR[0] * off, y: s.y + SHADOW_DIR[1] * off, z: Z_SHADOW, angle: s.angle, length: s.length, width: s.width }, s.layer, s.bx, SHADOW, Mode.silhouette)
    m.target = "opaque"
  }
  obelisk(b)

  // The optician: a closed shop window in the same pavilion, plastered sides, a roof that stays.
  const [ou0, ou1, on0, on1] = OPTICIAN
  const shop = (u0: number, n0: number, u1: number, n1: number, layer: Material | null) => {
    if (layer === null) face(b, u0, n0, u1, n1, 0, PAVILION_H, PLASTER)
    else {
      const len = Math.hypot(u1 - u0, n1 - n0)
      const lit = shade(WHITE, light(...worldDir(f, (n1 - n0) / len, (u0 - u1) / len)))
      // The shop front texture's ground floor is its bottom half: v from 1 up to the eaves.
      const v1 = 1 - PAVILION_H / 6
      m.quad(vertex(b, u0, n0, 0, lit, Mode.material, layer, 0, 1), vertex(b, u1, n1, 0, lit, Mode.material, layer, len / 8, 1), vertex(b, u1, n1, PAVILION_H, lit, Mode.material, layer, len / 8, v1), vertex(b, u0, n0, PAVILION_H, lit, Mode.material, layer, 0, v1))
    }
  }
  shop(ou1, on0, ou0, on0, Material.facadeShop)
  shop(ou0, on0, ou0, on1, null)
  shop(ou0, on1, ou1, on1, null)
  awning(b)

  // The cafe's floor, the door mats, its walls: glass to the street and the car park, plaster at the back and next door.
  flat(b, ROOM, Z_FLOOR, FLOOR_TINT, Mode.material, Material.floorWood, (u, n) => [u / FLOOR_TILE, n / FLOOR_TILE])
  flat(b, [DOOR[0], DOOR[1], ROOM[2], ROOM[2] + 0.9], Z_FLOOR + 0.005, MAT)
  flat(b, [DOOR[0], DOOR[1], PAVILION[2] - 0.9, PAVILION[2]], Z_PAVING + 0.005, MAT)
  for (const w of WALLS.front) glassWall(b, w)
  for (const w of WALLS.right) glassWall(b, w)
  for (const w of [...WALLS.back, ...WALLS.left, ...WALLS.inner]) box(b, w, 0, PAVILION_H, FASCIA, PLASTER)
  // The dining room's doorway in its bright green frame, the WC's door frame.
  for (const n of DOORWAY) box(b, [PARTITION_U[0] - 0.05, PARTITION_U[1] + 0.05, n - 0.08, n + 0.08], 0, PAVILION_H, GREEN)
  box(b, [PARTITION_U[0] - 0.05, PARTITION_U[1] + 0.05, DOORWAY[0], DOORWAY[1]], 2.3, PAVILION_H, GREEN)
  flat(b, [WC[0] + 0.15, WC[1] - 0.15, WC[2] + 0.15, WC[3]], Z_FLOOR + 0.005, TILES)
  box(b, [WC_DOOR[0], WC_DOOR[1], WC[2], WC[2] + 0.15], 2.2, PAVILION_H, FASCIA, PLASTER)
  sprite(b, "cafe-toilet", TOILET.u, TOILET.n, 0.45, Math.PI, 0.38)
  box(b, [DOOR[0], DOOR[1], PAVILION[2], PAVILION[2] + WALL_T], PAVILION_H - 0.9, PAVILION_H, FASCIA)
  for (const u of DOOR) box(b, [u - 0.07, u + 0.07, PAVILION[2], PAVILION[2] + WALL_T], 0, PAVILION_H, MULLION)

  // The cake counter with its two displays to the front, the back counter with the espresso machine, the woman between them.
  box(b, COUNTER, 0, 1, STONE_TOP, STONE)
  for (const v of VITRINES) sprite(b, "cafe-cakes", (v[0] + v[1]) / 2, (v[2] + v[3]) / 2, 1.02, 0, v[1] - v[0])
  box(b, BACK_COUNTER, 0, 0.95, STONE_TOP, STONE)
  sprite(b, "cafe-espresso", 8.6, (BACK_COUNTER[2] + BACK_COUNTER[3]) / 2, 0.97, Math.PI, 1.3)
  {
    const layer = Sprite.ped + 2
    const bx = boxes[layer] ?? [1, 1]
    const [x, y] = toWorld(f, BARISTA.u, BARISTA.n)
    spriteQuad(m, { x, y, z: 1.7, angle: frameAngle(f) - Math.PI / 2, length: 1.3, width: (1.3 * bx[1]) / bx[0] }, layer, bx, WHITE, Mode.sprite)
  }

  // Purple benches along the walls, tables with their cups, chairs.
  BENCHES.forEach((r, i) => {
    box(b, r, 0, BENCH_SEAT_Z, PURPLE_TOP, PURPLE)
    const back: Rect = i === 0 ? [r[0], r[1], r[3] - 0.22, r[3]] : [r[0], r[0] + 0.22, r[2], r[3]]
    box(b, back, BENCH_SEAT_Z, BENCH_BACK_Z, PURPLE_TOP, PURPLE)
  })
  for (const t of TABLES) {
    box(b, t, 0, TABLE_Z, WALNUT)
    const alongU = t[1] - t[0] >= t[3] - t[2]
    sprite(b, "cafe-table", (t[0] + t[1]) / 2, (t[2] + t[3]) / 2, TABLE_Z + 0.01, alongU ? 0 : Math.PI / 2, Math.max(t[1] - t[0], t[3] - t[2]))
  }
  for (const c of CHAIRS) chair(b, c.u, c.n, c.facing, PURPLE_TOP, WALNUT)

  // The gold planter with its snake plant.
  box(b, square(PLANTER.u, PLANTER.n, 0.3), 0, 0.95, GOLD)
  sprite(b, "cafe-planter", PLANTER.u, PLANTER.n, 1.25, 0, 1.15)

  // The roof: the optician's stays, the cafe's (with its rim and the sign) fades while you are inside.
  const eave = 0.3
  const roofOf = (r: Rect, fade: number) => flat(b, r, PAVILION_H + 0.02, ROOF, Mode.detail + fade, Material.roofGravel, (u, n) => [u / 6, n / 6])
  const cafeRoof: Rect = [OPTICIAN[1], PAVILION[1] + eave, PAVILION[2] - eave, PAVILION[3] + eave]
  const shopRoof: Rect = [PAVILION[0] - eave, OPTICIAN[1], PAVILION[2] - eave, PAVILION[3] + eave]
  roofOf(cafeRoof, FADES)
  roofOf(shopRoof, 0)
  // The fascia's top seen from above: a dark band with a light rim, all round the pavilion.
  const rim = (r: Rect, fade: number) => {
    const [u0, u1, n0, n1] = r
    const bands: ReadonlyArray<readonly [Rect, Rgba]> = [
      [[u0, u1, n0, n0 + 0.12], FASCIA_RIM],
      [[u0, u1, n1 - 0.12, n1], FASCIA_RIM],
      [[u0, u1, n0 + 0.12, n0 + 0.6], FASCIA],
      [[u0, u1, n1 - 0.6, n1 - 0.12], FASCIA],
    ]
    for (const [band, c] of bands) flat(b, band, PAVILION_H + 0.04, c, Mode.color + fade)
  }
  rim(cafeRoof, FADES)
  rim(shopRoof, 0)
  for (const r of [cafeRoof, shopRoof]) face(b, r[0], r[2], r[1], r[2], PAVILION_H - 0.7, PAVILION_H + 0.04, FASCIA)
  // The sign over the door, read from the street: the board's top away from it. It sits at the top of its 512 px layer.
  const sign: Rect = [0.4, 10.4, PAVILION[2] + 0.35, PAVILION[2] + 2.85]
  flat(b, sign, PAVILION_H + 0.06, WHITE, Mode.material + FADES, Material.cafeSign, (u, n) => [(u - sign[0]) / (sign[1] - sign[0]), ((sign[3] - n) / (sign[3] - sign[2])) * 0.25])
  boxShadow(b, PAVILION, PAVILION_H)
}
