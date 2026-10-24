/**
 * Tree crowns as a small binary file (public/trees.bin): there are too many
 * for the JSON map. Layout: uint32 count, then count × uint16 x, count × uint16
 * y (decimeters) and count × uint8 radius (decimeters), little-endian.
 */

/** Crowns in decimeters, struct-of-arrays. */
export type Crowns = { readonly xs: Uint16Array; readonly ys: Uint16Array; readonly rs: Uint8Array }

const dm = (meters: number, max: number) => Math.max(0, Math.min(max, Math.round(meters * 10)))

export const encodeCrowns = (crowns: ReadonlyArray<readonly [number, number, number]>): Uint8Array => {
  const n = crowns.length
  const bytes = new Uint8Array(4 + n * 5)
  const view = new DataView(bytes.buffer)
  view.setUint32(0, n, true)
  crowns.forEach(([x, y, r], i) => {
    view.setUint16(4 + i * 2, dm(x, 0xffff), true)
    view.setUint16(4 + n * 2 + i * 2, dm(y, 0xffff), true)
    bytes[4 + n * 4 + i] = dm(r, 0xff)
  })
  return bytes
}

export const decodeCrowns = (buffer: ArrayBuffer): Crowns => {
  const view = new DataView(buffer)
  const n = view.getUint32(0, true)
  const xs = new Uint16Array(n)
  const ys = new Uint16Array(n)
  for (let i = 0; i < n; i++) {
    xs[i] = view.getUint16(4 + i * 2, true)
    ys[i] = view.getUint16(4 + n * 2 + i * 2, true)
  }
  return { xs, ys, rs: new Uint8Array(buffer, 4 + n * 4, n) }
}

/** Is (x, y) meters under a tree crown? Bucketed once, so each question looks at a few crowns only. */
const COVER_CELL = 16
const cellKey = (cx: number, cy: number) => cy * 4096 + cx

export const crownCover = (crowns: Crowns): ((x: number, y: number) => boolean) => {
  const cells = new Map<number, Array<number>>()
  for (let i = 0; i < crowns.xs.length; i++) {
    const k = cellKey(Math.floor((crowns.xs[i] ?? 0) / 10 / COVER_CELL), Math.floor((crowns.ys[i] ?? 0) / 10 / COVER_CELL))
    const list = cells.get(k)
    if (list === undefined) cells.set(k, [i])
    else list.push(i)
  }
  return (x, y) => {
    const cx = Math.floor(x / COVER_CELL)
    const cy = Math.floor(y / COVER_CELL)
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++)
        for (const i of cells.get(cellKey(cx + dx, cy + dy)) ?? []) {
          const r = (crowns.rs[i] ?? 0) / 10 + 0.8
          if (Math.hypot((crowns.xs[i] ?? 0) / 10 - x, (crowns.ys[i] ?? 0) / 10 - y) < r) return true
        }
    return false
  }
}
