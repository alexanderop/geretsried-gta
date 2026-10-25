/**
 * Geometry laid out in a local frame (world/frame.ts: u along a street or a
 * wall, n away from it, meters): flat rectangles, upright faces and boxes lit
 * by which way they face, sprites lying flat, and box shadows. Cafe Waldmann
 * and the place dressings (places.ts) are built from these.
 */
import { SHADOW_DIR, SHADOW_PER_M } from "#/map/photo.ts"
import { rectRing, toWorld, type Frame, type Rect } from "#/world/frame.ts"
import { Mode, prop, spriteQuad, type MeshBuilder, type PropName, type Rgba, type SpriteBoxes } from "./mesh.ts"

export const WHITE: Rgba = [255, 255, 255, 255]
export const SHADOW: Rgba = [14, 22, 40, 100]
export const Z_SHADOW = 0.1

export type Builder = {
  readonly m: MeshBuilder
  readonly f: Frame
  readonly boxes: SpriteBoxes
}

export const shade = (c: Rgba, k: number): Rgba => [Math.min(255, c[0] * k), Math.min(255, c[1] * k), Math.min(255, c[2] * k), c[3]]

/** How lit a wall facing (wx, wy) is: walls facing the sun (away from the shadows) are bright. */
export const light = (wx: number, wy: number) => 0.62 + 0.38 * Math.max(0, -(wx * SHADOW_DIR[0] + wy * SHADOW_DIR[1]))

export const vertex = (b: Builder, u: number, n: number, z: number, c: Rgba, mode: number = Mode.color, layer = 0, tu = 0, tv = 0) => {
  const [x, y] = toWorld(b.f, u, n)
  return b.m.vertex(x, y, z, tu, tv, c, mode, layer)
}

/** A flat rectangle at height z; `uv` maps frame meters to texture coordinates. */
export const flat = (b: Builder, r: Rect, z: number, c: Rgba, mode: number = Mode.color, layer = 0, uv: (u: number, n: number) => readonly [number, number] = () => [0, 0]) => {
  const v = (u: number, n: number) => vertex(b, u, n, z, c, mode, layer, ...uv(u, n))
  b.m.quad(v(r[0], r[2]), v(r[1], r[2]), v(r[1], r[3]), v(r[0], r[3]))
}

/** One upright face from (u0, n0) to (u1, n1), lit by which way it faces. */
export const face = (b: Builder, u0: number, n0: number, u1: number, n1: number, z0: number, z1: number, c: Rgba, mode: number = Mode.color) => {
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
export const box = (b: Builder, r: Rect, z0: number, z1: number, top: Rgba, side: Rgba = top, mode: number = Mode.color) => {
  const [u0, u1, n0, n1] = r
  face(b, u0, n1, u0, n0, z0, z1, side, mode)
  face(b, u0, n0, u1, n0, z0, z1, side, mode)
  face(b, u1, n0, u1, n1, z0, z1, side, mode)
  face(b, u1, n1, u0, n1, z0, z1, side, mode)
  flat(b, r, z1, top, mode)
}

/** A sprite lying flat at height z, its long side along frame angle `along` (0 = +u), `length` meters long. */
export const sprite = (b: Builder, name: PropName, u: number, n: number, z: number, along: number, length: number, color: Rgba = WHITE, mode: number = Mode.sprite) => {
  const layer = prop(name)
  const bx = b.boxes[layer] ?? [1, 1]
  const [x, y] = toWorld(b.f, u, n)
  const angle = frameAngle(b.f) + along
  spriteQuad(b.m, { x, y, z, angle, length, width: (length * bx[1]) / bx[0] }, layer, bx, color, mode)
  return { x, y, angle, length, width: (length * bx[1]) / bx[0], layer, bx }
}

export const frameAngle = (f: Frame) => Math.atan2(f.uy, f.ux)

/** The shadow of an upright box of height h standing on `r`. */
export const boxShadow = (b: Builder, r: Rect, h: number) => {
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

/** A direction in the frame as a world direction. */
export const worldDir = (f: Frame, du: number, dn: number): readonly [number, number] => [f.ux * du + f.nx * dn, f.uy * du + f.ny * dn]
