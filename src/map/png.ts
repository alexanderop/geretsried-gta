/**
 * Minimal PNG codec for the importer: 8-bit RGB / RGBA, no interlacing.
 * Node only (uses node:zlib); the game never imports it.
 */
import { deflateSync, inflateSync } from "node:zlib"

/** An 8-bit RGBA image. */
export type Image = { readonly width: number; readonly height: number; readonly rgba: Uint8Array }

const SIGNATURE = Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10)

export class PngError extends Error {}

const paeth = (a: number, b: number, c: number) => {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
}

export const decodePng = (bytes: Uint8Array): Image => {
  if (!SIGNATURE.every((b, i) => bytes[i] === b)) throw new PngError("not a PNG")
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let width = 0
  let height = 0
  let channels = 0
  const idat: Array<Uint8Array> = []
  for (let at = 8; at + 8 <= bytes.length; ) {
    const length = view.getUint32(at)
    const type = String.fromCharCode(...bytes.subarray(at + 4, at + 8))
    const data = bytes.subarray(at + 8, at + 8 + length)
    if (type === "IHDR") {
      width = view.getUint32(at + 8)
      height = view.getUint32(at + 12)
      const depth = data[8]
      const colour = data[9]
      if (depth !== 8 || data[12] !== 0 || (colour !== 2 && colour !== 6)) throw new PngError(`unsupported PNG (depth ${depth}, colour ${colour})`)
      channels = colour === 6 ? 4 : 3
    } else if (type === "IDAT") idat.push(data)
    else if (type === "IEND") break
    at += 12 + length
  }
  const raw = inflateSync(Buffer.concat(idat))
  const stride = width * channels
  const pixels = new Uint8Array(stride * height)
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]
    const src = y * (stride + 1) + 1
    const row = y * stride
    for (let i = 0; i < stride; i++) {
      const x = raw[src + i] ?? 0
      const a = i >= channels ? (pixels[row + i - channels] ?? 0) : 0
      const b = y > 0 ? (pixels[row - stride + i] ?? 0) : 0
      const c = y > 0 && i >= channels ? (pixels[row - stride + i - channels] ?? 0) : 0
      const predicted = filter === 1 ? a : filter === 2 ? b : filter === 3 ? (a + b) >> 1 : filter === 4 ? paeth(a, b, c) : 0
      pixels[row + i] = (x + predicted) & 0xff
    }
  }
  if (channels === 4) return { width, height, rgba: pixels }
  const rgba = new Uint8Array(width * height * 4)
  for (let p = 0; p < width * height; p++) {
    rgba[p * 4] = pixels[p * 3] ?? 0
    rgba[p * 4 + 1] = pixels[p * 3 + 1] ?? 0
    rgba[p * 4 + 2] = pixels[p * 3 + 2] ?? 0
    rgba[p * 4 + 3] = 255
  }
  return { width, height, rgba }
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

const crc32 = (bytes: Uint8Array) => {
  let c = 0xffffffff
  for (const b of bytes) c = (CRC_TABLE[(c ^ b) & 0xff] ?? 0) ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

const chunk = (type: string, data: Uint8Array) => {
  const out = new Uint8Array(12 + data.length)
  const view = new DataView(out.buffer)
  view.setUint32(0, data.length)
  out.set(Array.from(type, (ch) => ch.charCodeAt(0)), 4)
  out.set(data, 8)
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)))
  return out
}

/** RGBA PNG, every row with the "up" filter (compresses smooth masks well). */
export const encodePng = (image: Image): Uint8Array => {
  const { width, height, rgba } = image
  const stride = width * 4
  const raw = new Uint8Array((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 2
    for (let i = 0; i < stride; i++) {
      const above = y > 0 ? (rgba[(y - 1) * stride + i] ?? 0) : 0
      raw[y * (stride + 1) + 1 + i] = ((rgba[y * stride + i] ?? 0) - above) & 0xff
    }
  }
  const header = new Uint8Array(13)
  const view = new DataView(header.buffer)
  view.setUint32(0, width)
  view.setUint32(4, height)
  header.set([8, 6, 0, 0, 0], 8)
  return Buffer.concat([SIGNATURE, chunk("IHDR", header), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", new Uint8Array())])
}
