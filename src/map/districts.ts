import type { District } from "./types.ts"

/** The part of town (x, y) is in: the nearest named place, so the map splits between them. */
export const districtAt = (districts: ReadonlyArray<District>, x: number, y: number): District | null => {
  let best: District | null = null
  for (const d of districts) if (best === null || Math.hypot(d.x - x, d.y - y) < Math.hypot(best.x - x, best.y - y)) best = d
  return best
}
