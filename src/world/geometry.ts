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
