/**
 * GTA 2's dirty streets: oil stains where cars stand and drip in the middle
 * of the lanes, dark patches of worn asphalt at junctions, and cracks along
 * the kerbs. Darker only, never lighter, and sparse: the town keeps its look
 * (the frame's lightness moves well under 3 %). Drawn with the ground before the
 * shadows, which fall over it as over the asphalt. Pure: the same
 * every game.
 */
import type { World } from "#/world/world.ts"
import { DRIVABLE } from "#/world/world.ts"
import { MeshBuilder, Mode, type Rgba } from "./mesh.ts"

export type Grime =
  /** A blotchy stain of radius `r`, its outline wobbling by `seed`; `dark` 0..255 is how much it darkens. */
  | { readonly kind: "stain"; readonly x: number; readonly y: number; readonly r: number; readonly seed: number; readonly dark: number }
  /** A crack: a jagged line `length` long from (x, y) along `angle`. */
  | { readonly kind: "crack"; readonly x: number; readonly y: number; readonly angle: number; readonly length: number; readonly seed: number }

/** Deterministic 0..1 hash (the same as scene.ts hash2). */
const hash = (x: number, y: number, salt: number) => {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(salt, 2246822519)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/** Meters between chances of a stain or a crack along a street. */
const STEP_M = 9
const OIL = 0.32
const CRACK = 0.22
const Z_GRIME = 0.1

/** The grime of the whole town: stains in the lanes, cracks at the kerbs, worn patches in the junctions. */
export const grimeOf = (world: World): Array<Grime> => {
  const { map, junctions } = world
  const out: Array<Grime> = []
  map.roads.forEach((r, ri) => {
    if (!DRIVABLE.has(r.kind)) return
    let k = 0
    for (let i = 0; i + 3 < r.pts.length; i += 2) {
      const ax = r.pts[i] ?? 0
      const ay = r.pts[i + 1] ?? 0
      const bx = r.pts[i + 2] ?? 0
      const by = r.pts[i + 3] ?? 0
      const len = Math.hypot(bx - ax, by - ay)
      if (len < 1e-3) continue
      const dx = (bx - ax) / len
      const dy = (by - ay) / len
      for (let s = STEP_M / 2; s < len; s += STEP_M, k++) {
        const x = ax + dx * s
        const y = ay + dy * s
        const h = hash(ri, k, 1)
        // Oil drips in the middle of a lane, where the engines stand.
        if (h < OIL) {
          const lane = (r.oneway ? 0 : r.width / 4) * (hash(ri, k, 2) < 0.5 ? 1 : -1)
          const jitter = (hash(ri, k, 3) - 0.5) * 0.8
          out.push({ kind: "stain", x: x - dy * (lane + jitter), y: y + dx * (lane + jitter), r: 0.35 + hash(ri, k, 4) * 0.55, seed: ri * 1000 + k, dark: 70 + Math.floor(hash(ri, k, 5) * 40) })
        }
        // Cracks along the kerb, running with the street.
        if (hash(ri, k, 6) < CRACK) {
          const side = hash(ri, k, 7) < 0.5 ? 1 : -1
          const off = (r.width / 2 - 0.5) * side
          const length = 1.5 + hash(ri, k, 8) * 2.5
          out.push({ kind: "crack", x: x - dy * off, y: y + dx * off, angle: Math.atan2(dy, dx) + (hash(ri, k, 9) - 0.5) * 0.5, length, seed: ri * 1000 + k })
        }
      }
    }
  })
  // Worn, darker asphalt where the cars turn and brake: a patch in each junction of three ends or more.
  for (const [node, meet] of junctions) {
    const ends = meet.reduce((n, j) => n + (j.vertex === 0 || j.vertex === (map.roads[j.road]?.nodes.length ?? 1) - 1 ? 1 : 2), 0)
    if (ends < 3) continue
    const j = meet[0]
    const road = j === undefined ? undefined : map.roads[j.road]
    if (j === undefined || road === undefined) continue
    const x = road.pts[j.vertex * 2] ?? 0
    const y = road.pts[j.vertex * 2 + 1] ?? 0
    const n = 1 + Math.floor(hash(node % 100000, 0, 10) * 2)
    for (let i = 0; i < n; i++) {
      const a = hash(node % 100000, i, 11) * Math.PI * 2
      const d = hash(node % 100000, i, 12) * road.width * 0.3
      out.push({ kind: "stain", x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, r: 1.6 + hash(node % 100000, i, 13) * 1.6, seed: node % 100000 + i, dark: 64 })
    }
  }
  // Not where a wall stands close to the street, nor on the water under a bridge.
  return out.filter((g) => !world.isSolid(g.x, g.y) && !world.isWater(g.x, g.y))
}

const CRACK_HALF = 0.035

/** One piece of grime, with the opaque ground: its alpha is coverage (alpha-to-coverage), so it dithers in, and the shadows fall over it. */
export const grime = (m: MeshBuilder, g: Grime) => {
  if (g.kind === "stain") {
    const color: Rgba = [10, 10, 12, g.dark]
    const v = (x: number, y: number) => m.vertex(x, y, Z_GRIME, 0, 0, color, Mode.color, 0)
    const sides = 9
    const c = v(g.x, g.y)
    const ring = Array.from({ length: sides }, (_, i) => {
      const a = (i / sides) * Math.PI * 2
      const r = g.r * (0.6 + hash(g.seed, i, 20) * 0.55)
      return v(g.x + Math.cos(a) * r, g.y + Math.sin(a) * r)
    })
    for (let i = 0; i < sides; i++) m.tri(c, ring[i] ?? c, ring[(i + 1) % sides] ?? c)
  } else {
    const color: Rgba = [8, 8, 10, 120]
    const v = (x: number, y: number) => m.vertex(x, y, Z_GRIME, 0, 0, color, Mode.color, 0)
    const steps = 4
    let x = g.x
    let y = g.y
    for (let i = 0; i < steps; i++) {
      const a = g.angle + (hash(g.seed, i, 21) - 0.5) * 1.1
      const l = g.length / steps
      const nx = x + Math.cos(a) * l
      const ny = y + Math.sin(a) * l
      const px = -Math.sin(a) * CRACK_HALF
      const py = Math.cos(a) * CRACK_HALF
      m.quad(v(x + px, y + py), v(nx + px, ny + py), v(nx - px, ny - py), v(x - px, y - py))
      x = nx
      y = ny
    }
  }
}
