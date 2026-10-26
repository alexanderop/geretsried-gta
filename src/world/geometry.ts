/** Axis-aligned box of a flat [x, y, ...] point list. */
export type Box = { minX: number; minY: number; maxX: number; maxY: number }

export const boxOf = (pts: ReadonlyArray<number>, pad = 0): Box => {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (let i = 0; i < pts.length; i += 2) {
    const x = pts[i] ?? 0
    const y = pts[i + 1] ?? 0
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
  return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad }
}

/** Even-odd ray cast. */
export const pointInPolygon = (x: number, y: number, pts: ReadonlyArray<number>): boolean => {
  let inside = false
  const n = pts.length / 2
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = pts[i * 2] ?? 0
    const yi = pts[i * 2 + 1] ?? 0
    const xj = pts[j * 2] ?? 0
    const yj = pts[j * 2 + 1] ?? 0
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/** Inside a building's footprint and not in one of its courtyards (`holes`). */
export const inFootprint = (x: number, y: number, b: { readonly pts: ReadonlyArray<number>; readonly holes?: ReadonlyArray<ReadonlyArray<number>> }): boolean =>
  pointInPolygon(x, y, b.pts) && !(b.holes ?? []).some((h) => pointInPolygon(x, y, h))

/** Squared distance from a point to segment ab. */
export const distToSegmentSq = (px: number, py: number, ax: number, ay: number, bx: number, by: number): number => {
  const dx = bx - ax
  const dy = by - ay
  const lenSq = dx * dx + dy * dy
  const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq))
  const cx = ax + t * dx - px
  const cy = ay + t * dy - py
  return cx * cx + cy * cy
}

/** The segment of polyline `pts` nearest (px, py): its index, how far along it the nearest point lies (0 to 1), and its length. */
export const nearestSegment = (pts: ReadonlyArray<number>, px: number, py: number): { readonly seg: number; readonly t: number; readonly len: number } => {
  let best = { seg: 0, t: 0, len: 0 }
  let bestD = Infinity
  for (let i = 0; i + 3 < pts.length; i += 2) {
    const ax = pts[i] ?? 0
    const ay = pts[i + 1] ?? 0
    const dx = (pts[i + 2] ?? 0) - ax
    const dy = (pts[i + 3] ?? 0) - ay
    const d = distToSegmentSq(px, py, ax, ay, ax + dx, ay + dy)
    if (d >= bestD) continue
    const lenSq = dx * dx + dy * dy
    bestD = d
    best = { seg: i / 2, t: lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq)), len: Math.sqrt(lenSq) }
  }
  return best
}

/** Average of a polygon's vertices. */
export const centroid = (pts: ReadonlyArray<number>): readonly [number, number] => {
  let x = 0
  let y = 0
  const n = pts.length / 2
  for (let i = 0; i < pts.length; i += 2) {
    x += pts[i] ?? 0
    y += pts[i + 1] ?? 0
  }
  return [x / n, y / n]
}

/** Direction (radians) of a polygon's longest edge: where a pitched roof's ridge runs. */
export const longestEdgeAngle = (pts: ReadonlyArray<number>) => {
  let best = 0
  let angle = 0
  for (let i = 0; i + 3 < pts.length; i += 2) {
    const dx = (pts[i + 2] ?? 0) - (pts[i] ?? 0)
    const dy = (pts[i + 3] ?? 0) - (pts[i + 1] ?? 0)
    const len = dx * dx + dy * dy
    if (len > best) {
      best = len
      angle = Math.atan2(dy, dx)
    }
  }
  return angle
}
