/**
 * Parking bays from the OSM layout: along parking aisles, and in rows filling
 * lots that have no mapped aisles.
 */
import { longestEdgeAngle, pointInPolygon } from "#/world/geometry.ts"

/** One parking space: its centre and the direction a car in it points. */
export type Bay = { readonly x: number; readonly y: number; readonly heading: number }

/** A standard bay: 2.5 m wide, 5 m deep; a car is about 1.8 × 4.4 m. */
export const BAY_W = 2.5
export const BAY_D = 5
const AISLE_W = 6

/** Perpendicular bays on both sides of a parking aisle, every 2.5 m along it. */
export const aisleBays = (pts: ReadonlyArray<number>): Array<Bay> => {
  const bays: Array<Bay> = []
  const offset = AISLE_W / 2 + BAY_D / 2
  for (let i = 0; i + 3 < pts.length; i += 2) {
    const ax = pts[i] ?? 0
    const ay = pts[i + 1] ?? 0
    const dx = (pts[i + 2] ?? 0) - ax
    const dy = (pts[i + 3] ?? 0) - ay
    const len = Math.hypot(dx, dy)
    if (len < BAY_W) continue
    const ux = dx / len
    const uy = dy / len
    const heading = Math.atan2(dy, dx) + Math.PI / 2
    for (let t = BAY_W / 2; t + BAY_W / 2 <= len; t += BAY_W) {
      for (const side of [-1, 1]) {
        bays.push({ x: ax + ux * t - uy * offset * side, y: ay + uy * t + ux * offset * side, heading })
      }
    }
  }
  return bays
}

/**
 * Bays filling a lot that has no mapped aisles: rows along its longest wall,
 * back to back in pairs with a 6 m aisle between pairs. A lot too narrow for
 * a row gets cars parked lengthwise.
 */
export const lotBays = (pts: ReadonlyArray<number>): Array<Bay> => {
  const angle = longestEdgeAngle(pts)
  const ux = Math.cos(angle)
  const uy = Math.sin(angle)
  const along = (x: number, y: number) => x * ux + y * uy
  const across = (x: number, y: number) => -x * uy + y * ux
  let uMin = Infinity
  let uMax = -Infinity
  let vMin = Infinity
  let vMax = -Infinity
  for (let i = 0; i + 1 < pts.length; i += 2) {
    const u = along(pts[i] ?? 0, pts[i + 1] ?? 0)
    const v = across(pts[i] ?? 0, pts[i + 1] ?? 0)
    uMin = Math.min(uMin, u)
    uMax = Math.max(uMax, u)
    vMin = Math.min(vMin, v)
    vMax = Math.max(vMax, v)
  }
  const at = (u: number, v: number) => ({ x: u * ux - v * uy, y: u * uy + v * ux })
  const bays: Array<Bay> = []
  const fits = (b: Bay, w: number, d: number) => carCorners(b, w, d).every(([x, y]) => pointInPolygon(x, y, pts))
  if (vMax - vMin < BAY_D) {
    for (let u = uMin + 3; u + 3 <= uMax; u += 6) {
      const bay = { ...at(u, (vMin + vMax) / 2), heading: angle }
      if (fits(bay, 1.8, 4.4)) bays.push(bay)
    }
    return bays
  }
  const period = BAY_D * 2 + AISLE_W
  for (let v0 = vMin; v0 + BAY_D <= vMax; v0 += period) {
    for (const v of [v0 + BAY_D / 2, v0 + BAY_D * 1.5]) {
      if (v + BAY_D / 2 > vMax) continue
      for (let u = uMin + BAY_W / 2; u + BAY_W / 2 <= uMax; u += BAY_W) {
        const bay = { ...at(u, v), heading: angle + Math.PI / 2 }
        if (fits(bay, BAY_W * 0.8, BAY_D * 0.8)) bays.push(bay)
      }
    }
  }
  return bays
}

/** Corners of a `w` × `d` rectangle centred on the bay, `d` along its heading. */
export const carCorners = (b: Bay, w: number, d: number): Array<readonly [number, number]> => {
  const hx = Math.cos(b.heading)
  const hy = Math.sin(b.heading)
  return [
    [1, 1],
    [1, -1],
    [-1, -1],
    [-1, 1],
  ].map(([s, t]) => [b.x + (hx * d * (s ?? 0)) / 2 - (hy * w * (t ?? 0)) / 2, b.y + (hy * d * (s ?? 0)) / 2 + (hx * w * (t ?? 0)) / 2] as const)
}
