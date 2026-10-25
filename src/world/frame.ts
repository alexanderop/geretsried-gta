/**
 * Local frames for laying places out in meters: a street frame (u along the
 * street, n from its centre line towards the place) and a wall frame (u along
 * one wall of a footprint, n into the building). In both, standing outside
 * and looking along +n, u runs to your right, so text laid out along +u reads
 * the right way round from outside.
 */
import type { GameMap } from "#/map/types.ts"

export type Frame = { readonly ox: number; readonly oy: number; readonly ux: number; readonly uy: number; readonly nx: number; readonly ny: number }
/** A rectangle in the frame: u0..u1 along the street, n0..n1 away from it. */
export type Rect = readonly [u0: number, u1: number, n0: number, n1: number]

export const toWorld = (f: Frame, u: number, n: number): readonly [number, number] => [f.ox + f.ux * u + f.nx * n, f.oy + f.uy * u + f.ny * n]
export const toLocal = (f: Frame, x: number, y: number): readonly [number, number] => [(x - f.ox) * f.ux + (y - f.oy) * f.uy, (x - f.ox) * f.nx + (y - f.oy) * f.ny]
export const inRect = (r: Rect, u: number, n: number, pad = 0) => u >= r[0] - pad && u <= r[1] + pad && n >= r[2] - pad && n <= r[3] + pad
/** The rectangle's corners in the world, as a flat ring. */
export const rectRing = (f: Frame, r: Rect): Array<number> => [...toWorld(f, r[0], r[2]), ...toWorld(f, r[1], r[2]), ...toWorld(f, r[1], r[3]), ...toWorld(f, r[0], r[3])]

/** A square of half-width r round (u, n). */
export const square = (u: number, n: number, r: number): Rect => [u - r, u + r, n - r, n + r]

/** A frame with n along (nx, ny) at (ox, oy): u is n turned a quarter clockwise on the map (y down). */
const frameOf = (ox: number, oy: number, nx: number, ny: number): Frame => ({ ox, oy, ux: -ny, uy: nx, nx, ny })

/**
 * The frame on the closest segment of the street named `street` to (x, y):
 * origin at the point's foot on the centre line, n towards the point. Null
 * when the map has no such street or the point lies on its centre line.
 */
export const streetFrame = (map: GameMap, street: string, x: number, y: number): Frame | null => {
  let best: { d: number; fx: number; fy: number } | null = null
  for (const r of map.roads) {
    if (r.name !== street) continue
    for (let k = 0; k + 3 < r.pts.length; k += 2) {
      const ax = r.pts[k] ?? 0
      const ay = r.pts[k + 1] ?? 0
      const dx = (r.pts[k + 2] ?? 0) - ax
      const dy = (r.pts[k + 3] ?? 0) - ay
      const len2 = dx * dx + dy * dy
      if (len2 < 1e-6) continue
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / len2))
      const fx = ax + dx * t
      const fy = ay + dy * t
      const d = Math.hypot(x - fx, y - fy)
      if (best === null || d < best.d) best = { d, fx, fy }
    }
  }
  if (best === null || best.d < 1) return null
  return frameOf(best.fx, best.fy, (x - best.fx) / best.d, (y - best.fy) / best.d)
}

/**
 * The frame of wall `edge` of a footprint (`pts` flat, closed or open; wall i
 * runs from point i to point i + 1): origin at the wall's left end as you
 * face it from outside, u along it, n into the building. Null for a wall
 * that does not exist or has no length.
 */
export const wallFrame = (pts: ReadonlyArray<number>, edge: number): { readonly frame: Frame; readonly length: number } | null => {
  const closed = pts.length >= 4 && pts[0] === pts[pts.length - 2] && pts[1] === pts[pts.length - 1]
  const n = (closed ? pts.length - 2 : pts.length) / 2
  if (!Number.isInteger(edge) || edge < 0 || edge >= n || n < 3) return null
  let area = 0
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += (pts[i * 2] ?? 0) * (pts[j * 2 + 1] ?? 0) - (pts[j * 2] ?? 0) * (pts[i * 2 + 1] ?? 0)
  }
  const j = (edge + 1) % n
  const ax = pts[edge * 2] ?? 0
  const ay = pts[edge * 2 + 1] ?? 0
  const bx = pts[j * 2] ?? 0
  const by = pts[j * 2 + 1] ?? 0
  const length = Math.hypot(bx - ax, by - ay)
  if (length < 1e-3) return null
  // On a ring of positive shoelace area the inside lies at (-dy, dx) of a->b, so the left end seen from outside is b.
  const [sx, sy, ex, ey] = area >= 0 ? [bx, by, ax, ay] : [ax, ay, bx, by]
  const ux = (ex - sx) / length
  const uy = (ey - sy) / length
  return { frame: { ox: sx, oy: sy, ux, uy, nx: uy, ny: -ux }, length }
}
