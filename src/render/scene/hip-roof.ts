/**
 * A hipped roof over any footprint: every wall is an eave, and its roof plane
 * rises from it at the same pitch, so the roof over a point is the plane of
 * the nearest wall that can reach it (a straight-skeleton roof: hips at the
 * outer corners, valleys at the inner ones, a ridge along each wing).
 *
 * A wall reaches the points on the inner side of its line and within its
 * wedge, between the bisectors at its two corners: at an outer corner the
 * points nearer to it than to the neighbour, at an inner corner the points
 * farther (that corner's bisector is a valley running away from the wall).
 * The footprint is cut into convex pieces along every line where two walls
 * are equally far or one is zero away, so a single wall owns each piece and
 * the piece is one flat plane of the roof.
 */
import { clipHalfPlane, signedArea, triangulate } from "./geometry.ts"

/** A plane of the roof: a convex piece of the footprint and each corner's distance from the wall it rises from. */
export type HipFace = {
  readonly poly: ReadonlyArray<number>
  readonly rise: ReadonlyArray<number>
  /** That wall's outward normal: which way the plane faces. */
  readonly out: readonly [number, number]
}

const EPS = 1e-6
/** A corner turning less than this (the sine of its angle) is no corner: the walls either side are one eave. */
const STRAIGHT = 0.02

/** Whether a point d from a wall is on its side of the bisector with a neighbour `other` away, at a corner turning `t`. */
const inWedge = (d: number, other: number, t: number) => (t > STRAIGHT ? d <= other + EPS : t < -STRAIGHT ? d >= other - EPS : true)

/** One wall's line: d(x, y) = nx·x + ny·y − c is the distance from it, positive inside. */
type Line = { readonly nx: number; readonly ny: number; readonly c: number }

const area = (poly: ReadonlyArray<number>) => Math.abs(signedArea(poly))

/** The roof planes of an open ring (either winding): pieces that together cover it. */
export const hipFaces = (ring: ReadonlyArray<number>): Array<HipFace> => {
  const sign = signedArea(ring) >= 0 ? 1 : -1
  const count = ring.length / 2
  const walls: Array<Line> = []
  for (let i = 0; i < count; i++) {
    const j = (i + 1) % count
    const ax = ring[i * 2] ?? 0
    const ay = ring[i * 2 + 1] ?? 0
    const dx = (ring[j * 2] ?? 0) - ax
    const dy = (ring[j * 2 + 1] ?? 0) - ay
    const len = Math.hypot(dx, dy)
    if (len < 1e-3) continue
    // On a ring of positive shoelace area the inside lies at (−dy, dx) of a→b.
    const nx = (-dy * sign) / len
    const ny = (dx * sign) / len
    walls.push({ nx, ny, c: nx * ax + ny * ay })
  }
  const n = walls.length
  if (n < 3) return []
  // How each corner turns, the one where wall k starts: > 0 outer, < 0 inner, about 0 straight on.
  const turn = walls.map((w, k) => {
    const p = walls[(k + n - 1) % n] ?? w
    return sign * (p.nx * w.ny - p.ny * w.nx)
  })
  const dist = (k: number, x: number, y: number) => {
    const w = walls[k] ?? walls[0]
    return w === undefined ? 0 : w.nx * x + w.ny * y - w.c
  }
  /** The wall whose plane covers (x, y): the nearest that reaches it. */
  const owner = (x: number, y: number) => {
    let best = -1
    let bestD = Infinity
    for (let k = 0; k < n; k++) {
      const d = dist(k, x, y)
      if (d < -EPS || d >= bestD) continue
      if (!inWedge(d, dist((k + n - 1) % n, x, y), turn[k] ?? 0) || !inWedge(d, dist((k + 1) % n, x, y), turn[(k + 1) % n] ?? 0)) continue
      best = k
      bestD = d
    }
    return best
  }

  // Every line where two walls are equally far (bisectors, ridges, valleys) or a wall's own line.
  const cuts: Array<Line> = walls.map((w) => w)
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = walls[i]
      const b = walls[j]
      if (a === undefined || b === undefined) continue
      const nx = a.nx - b.nx
      const ny = a.ny - b.ny
      const len = Math.hypot(nx, ny)
      // Two walls on one line are equally far everywhere: no line between them.
      if (len < 1e-6) continue
      cuts.push({ nx: nx / len, ny: ny / len, c: (a.c - b.c) / len })
    }
  }
  const tris = triangulate(ring)
  let pieces: Array<Array<number>> = []
  for (let t = 0; t + 2 < tris.length; t += 3) pieces.push([tris[t], tris[t + 1], tris[t + 2]].flatMap((i) => [ring[(i ?? 0) * 2] ?? 0, ring[(i ?? 0) * 2 + 1] ?? 0]))
  for (const cut of cuts) {
    pieces = pieces.flatMap((p) => {
      const a = clipHalfPlane(p, cut.nx, cut.ny, cut.c)
      const b = clipHalfPlane(p, -cut.nx, -cut.ny, -cut.c)
      return a.length < 6 || b.length < 6 || area(a) < EPS || area(b) < EPS ? [p] : [a, b]
    })
  }
  return pieces.flatMap((poly) => {
    const k = poly.length / 2
    let cx = 0
    let cy = 0
    for (let i = 0; i < k; i++) {
      cx += (poly[i * 2] ?? 0) / k
      cy += (poly[i * 2 + 1] ?? 0) / k
    }
    const wall = owner(cx, cy)
    const w = walls[wall]
    if (w === undefined) return []
    const rise = Array.from({ length: k }, (_, i) => Math.max(0, dist(wall, poly[i * 2] ?? 0, poly[i * 2 + 1] ?? 0)))
    return [{ poly, rise, out: [-w.nx, -w.ny] as const }]
  })
}
