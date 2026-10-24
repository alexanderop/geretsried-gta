/**
 * Geometry for shots: rays against walls, people (circles) and cars
 * (rotated boxes), and how an explosion's damage falls off. Pure.
 */

/** Distance along the unit ray (dx, dy) from (ox, oy) to where it enters the circle, or null if it misses. 0 if it starts inside. */
export const rayCircle = (ox: number, oy: number, dx: number, dy: number, cx: number, cy: number, r: number): number | null => {
  const fx = ox - cx
  const fy = oy - cy
  const c = fx * fx + fy * fy - r * r
  if (c <= 0) return 0
  const b = fx * dx + fy * dy
  const disc = b * b - c
  if (b > 0 || disc < 0) return null
  return -b - Math.sqrt(disc)
}

export type Box = { readonly x: number; readonly y: number; readonly angle: number; readonly hl: number; readonly hw: number }

/** Same as rayCircle for a box `hl` long and `hw` wide (half sizes) turned by `angle`, by slabs in the box's frame. */
export const rayBox = (ox: number, oy: number, dx: number, dy: number, box: Box): number | null => {
  const c = Math.cos(box.angle)
  const s = Math.sin(box.angle)
  const px = (ox - box.x) * c + (oy - box.y) * s
  const py = -(ox - box.x) * s + (oy - box.y) * c
  const vx = dx * c + dy * s
  const vy = -dx * s + dy * c
  let near = 0
  let far = Infinity
  for (const [p, v, h] of [
    [px, vx, box.hl],
    [py, vy, box.hw],
  ] as const) {
    if (Math.abs(v) < 1e-9) {
      if (Math.abs(p) > h) return null
      continue
    }
    const t1 = (-h - p) / v
    const t2 = (h - p) / v
    near = Math.max(near, Math.min(t1, t2))
    far = Math.min(far, Math.max(t1, t2))
  }
  return near <= far ? near : null
}

/** Is (x, y) inside the box? */
export const inBox = (x: number, y: number, box: Box) => {
  const c = Math.cos(box.angle)
  const s = Math.sin(box.angle)
  const px = (x - box.x) * c + (y - box.y) * s
  const py = -(x - box.x) * s + (y - box.y) * c
  return Math.abs(px) <= box.hl && Math.abs(py) <= box.hw
}

/** Meters along the ray before a wall, sampled every `step` m (walls are at least a few meters thick), or `range` if none. */
export const rayWall = (isSolid: (x: number, y: number) => boolean, ox: number, oy: number, dx: number, dy: number, range: number, step = 0.25): number => {
  for (let t = step; t < range; t += step) if (isSolid(ox + dx * t, oy + dy * t)) return t - step / 2
  return range
}

/** Damage `dist` meters from an explosion: all of `max` at the centre, falling linearly to nothing at `radius`. */
export const blast = (dist: number, radius: number, max: number): number => (dist >= radius ? 0 : max * (1 - Math.max(0, dist) / radius))

/** Is (x, y) inside the cone of `range` meters and `half` radians either side of `angle` from (ox, oy)? */
export const inCone = (ox: number, oy: number, angle: number, range: number, half: number, x: number, y: number) => {
  const dx = x - ox
  const dy = y - oy
  const d = Math.hypot(dx, dy)
  if (d > range) return false
  if (d < 0.6) return true
  const off = Math.atan2(Math.sin(Math.atan2(dy, dx) - angle), Math.cos(Math.atan2(dy, dx) - angle))
  return Math.abs(off) <= half
}
