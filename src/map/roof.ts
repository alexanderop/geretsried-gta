/**
 * Roof planes from a footprint alone. Every eave (a wall a roof plane rises
 * from) owns the part of the roof nearer to it than to any other eave, which
 * is what a hipped or gabled roof looks like from above: on a long block the
 * two long walls split the roof along the ridge, and each wing of an L or T
 * gets its own ridge. Short walls at a wing's end are gables and own nothing.
 */
import { distToSegmentSq } from "#/world/geometry.ts"

/** Number of walls of a closed footprint (OSM repeats the first point at the end). */
export const wallCount = (pts: ReadonlyArray<number>) => pts.length / 2 - 1

/** Index of the nearest wall whose `has(i)` is true, or -1. */
export const nearestWall = (x: number, y: number, pts: ReadonlyArray<number>, has: (i: number) => boolean): number => {
  let best = -1
  let bestD = Infinity
  for (let i = 0; i < wallCount(pts); i++) {
    if (!has(i)) continue
    const d = distToSegmentSq(x, y, pts[i * 2] ?? 0, pts[i * 2 + 1] ?? 0, pts[i * 2 + 2] ?? 0, pts[i * 2 + 3] ?? 0)
    if (d < bestD) {
      bestD = d
      best = i
    }
  }
  return best
}

/**
 * Which walls are eaves. A wall is a gable when both its corners point out
 * (the end of a wing) and it is no longer than the wing is wide (`width`).
 * A footprint with fewer than two eaves left (a square house) is hipped: all walls are eaves.
 */
export const eaves = (pts: ReadonlyArray<number>, width: number): Array<boolean> => {
  const n = wallCount(pts)
  const at = (i: number): readonly [number, number] => {
    const k = ((i % n) + n) % n
    return [pts[k * 2] ?? 0, pts[k * 2 + 1] ?? 0]
  }
  let area = 0
  for (let i = 0; i < n; i++) area += at(i)[0] * at(i + 1)[1] - at(i + 1)[0] * at(i)[1]
  const convex = (i: number) => {
    const [ax, ay] = at(i - 1)
    const [bx, by] = at(i)
    const [cx, cy] = at(i + 1)
    return ((bx - ax) * (cy - by) - (by - ay) * (cx - bx)) * area > 0
  }
  const flags = Array.from({ length: n }, (_, i) => {
    const [ax, ay] = at(i)
    const [bx, by] = at(i + 1)
    return !(convex(i) && convex(i + 1) && Math.hypot(bx - ax, by - ay) <= width * 1.2)
  })
  return flags.filter(Boolean).length < 2 ? flags.map(() => true) : flags
}
