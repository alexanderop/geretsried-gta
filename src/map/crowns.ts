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
