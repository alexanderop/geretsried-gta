/**
 * Pure 2D geometry for building the 3D town: polygon triangulation, half-plane
 * clipping, and the polylines roads, kerbs and lane markings are made of.
 * Points are flat [x0, y0, x1, y1, ...] in map meters, like the map data.
 */

/** A polygon's points without OSM's repeated closing point. */
export const openRing = (pts: ReadonlyArray<number>): Array<number> => {
  const n = pts.length
  const closed = n >= 4 && pts[0] === pts[n - 2] && pts[1] === pts[n - 1]
  return closed ? pts.slice(0, n - 2) : [...pts]
}

/** Signed shoelace area of an open ring: positive when counter-clockwise in a y-up frame. */
export const signedArea = (ring: ReadonlyArray<number>): number => {
  let a = 0
  const n = ring.length / 2
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    a += (ring[i * 2] ?? 0) * (ring[j * 2 + 1] ?? 0) - (ring[j * 2] ?? 0) * (ring[i * 2 + 1] ?? 0)
  }
  return a / 2
}

const cross = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) => (bx - ax) * (cy - ay) - (by - ay) * (cx - ax)

/**
 * Ear clipping: triangles of an open ring as vertex index triples. Works for
 * either winding and any simple polygon; a self-touching ring that runs out
 * of ears is finished as a fan, so every footprint still gets a roof.
 */
export const triangulate = (ring: ReadonlyArray<number>): Array<number> => {
  const n = ring.length / 2
  if (n < 3) return []
  const sign = signedArea(ring) >= 0 ? 1 : -1
  const x = (i: number) => ring[i * 2] ?? 0
  const y = (i: number) => ring[i * 2 + 1] ?? 0
  const left = Array.from({ length: n }, (_, i) => i)
  const out: Array<number> = []
  const isEar = (k: number) => {
    const m = left.length
    const a = left[(k + m - 1) % m] ?? 0
    const b = left[k] ?? 0
    const c = left[(k + 1) % m] ?? 0
    if (cross(x(a), y(a), x(b), y(b), x(c), y(c)) * sign <= 0) return false
    for (const p of left) {
      if (p === a || p === b || p === c) continue
      // A point on the ear's edge counts as inside: clipping there would cross the outline.
      if (
        cross(x(a), y(a), x(b), y(b), x(p), y(p)) * sign >= 0 &&
        cross(x(b), y(b), x(c), y(c), x(p), y(p)) * sign >= 0 &&
        cross(x(c), y(c), x(a), y(a), x(p), y(p)) * sign >= 0
      )
        return false
    }
    return true
  }
  while (left.length > 3) {
    let found = -1
    for (let k = 0; k < left.length; k++) {
      if (isEar(k)) {
        found = k
        break
      }
    }
    if (found < 0) break
    const m = left.length
    out.push(left[(found + m - 1) % m] ?? 0, left[found] ?? 0, left[(found + 1) % m] ?? 0)
    left.splice(found, 1)
  }
  for (let k = 1; k + 1 < left.length; k++) out.push(left[0] ?? 0, left[k] ?? 0, left[k + 1] ?? 0)
  return out
}

/** The part of a convex polygon where nx·x + ny·y ≥ d (Sutherland–Hodgman against one line). */
export const clipHalfPlane = (poly: ReadonlyArray<number>, nx: number, ny: number, d: number): Array<number> => {
  const out: Array<number> = []
  const n = poly.length / 2
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const ax = poly[i * 2] ?? 0
    const ay = poly[i * 2 + 1] ?? 0
    const bx = poly[j * 2] ?? 0
    const by = poly[j * 2 + 1] ?? 0
    const da = nx * ax + ny * ay - d
    const db = nx * bx + ny * by - d
    if (da >= 0) out.push(ax, ay)
    if (da >= 0 !== db >= 0) {
      const t = da / (da - db)
      out.push(ax + (bx - ax) * t, ay + (by - ay) * t)
    }
  }
  return out
}

export const polylineLength = (pts: ReadonlyArray<number>): number => {
  let len = 0
  for (let i = 0; i + 3 < pts.length; i += 2) len += Math.hypot((pts[i + 2] ?? 0) - (pts[i] ?? 0), (pts[i + 3] ?? 0) - (pts[i + 1] ?? 0))
  return len
}

/** The stretch of a polyline between arc lengths `from` and `to`. */
export const subPolyline = (pts: ReadonlyArray<number>, from: number, to: number): Array<number> => {
  const out: Array<number> = []
  let at = 0
  for (let i = 0; i + 3 < pts.length; i += 2) {
    const ax = pts[i] ?? 0
    const ay = pts[i + 1] ?? 0
    const bx = pts[i + 2] ?? 0
    const by = pts[i + 3] ?? 0
    const len = Math.hypot(bx - ax, by - ay)
    const s0 = Math.max(from, at)
    const s1 = Math.min(to, at + len)
    if (s1 > s0 && len > 0) {
      const t0 = (s0 - at) / len
      const t1 = (s1 - at) / len
      if (out.length === 0) out.push(ax + (bx - ax) * t0, ay + (by - ay) * t0)
      out.push(ax + (bx - ax) * t1, ay + (by - ay) * t1)
    }
    at += len
    if (at >= to) break
  }
  return out
}

/** Arc-length intervals [from, to] of `length` that remain after cutting out `cuts`. */
export const keepIntervals = (length: number, cuts: ReadonlyArray<readonly [number, number]>): Array<readonly [number, number]> => {
  const sorted = cuts.toSorted((a, b) => a[0] - b[0])
  const out: Array<readonly [number, number]> = []
  let at = 0
  for (const [a, b] of sorted) {
    if (a > at) out.push([at, Math.min(a, length)])
    at = Math.max(at, b)
  }
  if (at < length) out.push([at, length])
  return out.filter(([a, b]) => b - a > 0.01)
}

/** Dashes `dash` long with `gap` between them, along the interval [from, to] of the polyline. */
export const dashes = (pts: ReadonlyArray<number>, from: number, to: number, dash: number, gap: number): Array<Array<number>> => {
  const out: Array<Array<number>> = []
  // Phase from the polyline's start, so a cut-out stretch does not shift the dashes after it.
  for (let s = Math.ceil(from / (dash + gap)) * (dash + gap); s < to; s += dash + gap) {
    const piece = subPolyline(pts, s, Math.min(to, s + dash))
    if (piece.length >= 4) out.push(piece)
  }
  return out
}

/**
 * Both edges of a band `half` meters either side of a polyline, joined with
 * miters (clamped on sharp bends): left[i] and right[i] belong to point i.
 */
export const band = (pts: ReadonlyArray<number>, half: number): { readonly left: Array<number>; readonly right: Array<number> } => {
  const n = pts.length / 2
  const left: Array<number> = []
  const right: Array<number> = []
  const dir = (i: number): readonly [number, number] => {
    const dx = (pts[i * 2 + 2] ?? 0) - (pts[i * 2] ?? 0)
    const dy = (pts[i * 2 + 3] ?? 0) - (pts[i * 2 + 1] ?? 0)
    const len = Math.hypot(dx, dy) || 1
    return [dx / len, dy / len]
  }
  for (let i = 0; i < n; i++) {
    const [ax, ay] = dir(Math.max(0, i - 1))
    const [bx, by] = dir(Math.min(n - 2, i))
    let mx = -(ay + by)
    let my = ax + bx
    const mlen = Math.hypot(mx, my)
    if (mlen < 1e-6) {
      mx = -ay
      my = ax
    } else {
      mx /= mlen
      my /= mlen
    }
    // Miter length 1/cos(half the bend), at most twice the width.
    const cos = Math.max(0.5, mx * -by + my * bx)
    const x = pts[i * 2] ?? 0
    const y = pts[i * 2 + 1] ?? 0
    left.push(x + (mx * half) / cos, y + (my * half) / cos)
    right.push(x - (mx * half) / cos, y - (my * half) / cos)
  }
  return { left, right }
}
