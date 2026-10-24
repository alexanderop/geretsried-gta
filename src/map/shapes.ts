/** Connected regions of a raster mask and their oriented bounding rectangles. */

/**
 * 4-connected components of the pixels where `inside(i)` holds, as pixel
 * index lists. Components larger than `maxArea` are skipped (not returned).
 */
export const components = (width: number, height: number, inside: (i: number) => boolean, maxArea: number): Array<Array<number>> => {
  const seen = new Uint8Array(width * height)
  const out: Array<Array<number>> = []
  const stack: Array<number> = []
  for (let start = 0; start < seen.length; start++) {
    if (seen[start] === 1 || !inside(start)) continue
    const pixels: Array<number> = []
    seen[start] = 1
    stack.push(start)
    while (stack.length > 0) {
      const i = stack.pop() ?? 0
      pixels.push(i)
      const x = i % width
      const neighbours = [x > 0 ? i - 1 : -1, x < width - 1 ? i + 1 : -1, i - width, i + width]
      for (const j of neighbours) {
        if (j < 0 || j >= seen.length || seen[j] === 1 || !inside(j)) continue
        seen[j] = 1
        stack.push(j)
      }
    }
    if (pixels.length <= maxArea) out.push(pixels)
  }
  return out
}

/** Every pixel that touches the component from outside (4-neighbourhood). */
export const rim = (width: number, height: number, pixels: ReadonlyArray<number>): Array<number> => {
  const own = new Set(pixels)
  const out = new Set<number>()
  for (const i of pixels) {
    const x = i % width
    for (const j of [x > 0 ? i - 1 : -1, x < width - 1 ? i + 1 : -1, i - width, i + width]) {
      if (j >= 0 && j < width * height && !own.has(j)) out.add(j)
    }
  }
  return [...out]
}

/** The rectangle around a pixel set, along its main axis (pixel units, centre at pixel centres). */
export type OrientedRect = {
  readonly cx: number
  readonly cy: number
  readonly angle: number
  /** Full length along `angle` and width across it. */
  readonly length: number
  readonly width: number
  /** Share of the rectangle the pixels cover. */
  readonly fill: number
}

export const orientedRect = (width: number, pixels: ReadonlyArray<number>): OrientedRect => {
  const n = pixels.length
  let mx = 0
  let my = 0
  for (const i of pixels) {
    mx += (i % width) + 0.5
    my += Math.floor(i / width) + 0.5
  }
  mx /= n
  my /= n
  let sxx = 0
  let syy = 0
  let sxy = 0
  for (const i of pixels) {
    const dx = (i % width) + 0.5 - mx
    const dy = Math.floor(i / width) + 0.5 - my
    sxx += dx * dx
    syy += dy * dy
    sxy += dx * dy
  }
  const angle = Math.atan2(2 * sxy, sxx - syy) / 2
  const ux = Math.cos(angle)
  const uy = Math.sin(angle)
  let uMin = Infinity
  let uMax = -Infinity
  let vMin = Infinity
  let vMax = -Infinity
  for (const i of pixels) {
    const dx = (i % width) + 0.5 - mx
    const dy = Math.floor(i / width) + 0.5 - my
    const u = dx * ux + dy * uy
    const v = -dx * uy + dy * ux
    uMin = Math.min(uMin, u)
    uMax = Math.max(uMax, u)
    vMin = Math.min(vMin, v)
    vMax = Math.max(vMax, v)
  }
  const length = uMax - uMin + 1
  const across = vMax - vMin + 1
  const cu = (uMin + uMax) / 2
  const cv = (vMin + vMax) / 2
  return { cx: mx + cu * ux - cv * uy, cy: my + cu * uy + cv * ux, angle, length, width: across, fill: n / (length * across) }
}

/** Whether pixel centre (x, y) lies inside the rectangle. */
export const inRect = (r: OrientedRect, x: number, y: number): boolean => {
  const dx = x - r.cx
  const dy = y - r.cy
  const u = dx * Math.cos(r.angle) + dy * Math.sin(r.angle)
  const v = -dx * Math.sin(r.angle) + dy * Math.cos(r.angle)
  return Math.abs(u) <= r.length / 2 && Math.abs(v) <= r.width / 2
}

/** Corners of the rectangle, closed (first point repeated), in pixel units. */
export const rectCorners = (r: OrientedRect): Array<number> => {
  const ux = Math.cos(r.angle)
  const uy = Math.sin(r.angle)
  const corner = (s: number, t: number) => [r.cx + (ux * r.length * s) / 2 - (uy * r.width * t) / 2, r.cy + (uy * r.length * s) / 2 + (ux * r.width * t) / 2]
  return [...corner(1, 1), ...corner(1, -1), ...corner(-1, -1), ...corner(-1, 1), ...corner(1, 1)]
}
