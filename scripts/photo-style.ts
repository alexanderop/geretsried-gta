/**
 * The light, fixed look the aerial photo gets before it becomes the game's
 * ground. DOP40 is hazy and soft; a touch of sharpening, a haze cut, a gentle
 * S-curve and a little more colour let it sit with the painted sprites while it
 * still reads as the photo. The same curve runs on every tile, so tiles cannot
 * drift apart in colour.
 */
import type { Image } from "../src/map/png.ts"

/** Unsharp mask: Gaussian sigma in pixels (0.4 m each) and strength. */
const SHARPEN_SIGMA = 1.6
const SHARPEN = 0.5
/** Input levels mapped to black and white: lifts the haze. */
const BLACK = 0.035
const WHITE = 0.98
const CONTRAST = 0.2
const SATURATION = 1.15

/** Pixels on each side the cutter fetches and crops again, at least the blur radius (5). */
export const STYLE_MARGIN = 8

const kernel = (() => {
  const r = Math.ceil(SHARPEN_SIGMA * 3)
  const k = Array.from({ length: 2 * r + 1 }, (_, i) => Math.exp(-((i - r) ** 2) / (2 * SHARPEN_SIGMA ** 2)))
  const sum = k.reduce((a, b) => a + b, 0)
  return k.map((v) => v / sum)
})()

/** Separable Gaussian blur of the RGB channels, edges clamped. */
const blur = (img: Image): Float32Array => {
  const { width, height, rgba } = img
  const r = (kernel.length - 1) / 2
  const pass = (src: ArrayLike<number>, horizontal: boolean) => {
    const out = new Float32Array(width * height * 3)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        for (let c = 0; c < 3; c++) {
          let acc = 0
          for (let k = -r; k <= r; k++) {
            const sx = horizontal ? Math.min(width - 1, Math.max(0, x + k)) : x
            const sy = horizontal ? y : Math.min(height - 1, Math.max(0, y + k))
            acc += (src[(sy * width + sx) * 3 + c] ?? 0) * (kernel[k + r] ?? 0)
          }
          out[(y * width + x) * 3 + c] = acc
        }
      }
    }
    return out
  }
  const rgb = new Float32Array(width * height * 3)
  for (let i = 0; i < width * height; i++) for (let c = 0; c < 3; c++) rgb[i * 3 + c] = rgba[i * 4 + c] ?? 0
  return pass(pass(rgb, true), false)
}

/** Levels, then an S-curve around mid grey (0..1 in and out). */
const tone = (v: number) => {
  const a = Math.min(1, Math.max(0, (v - BLACK) / (WHITE - BLACK)))
  return a + CONTRAST * a * (1 - a) * (2 * a - 1)
}

export const stylise = (img: Image): Image => {
  const soft = blur(img)
  const rgba = new Uint8Array(img.rgba.length)
  for (let i = 0; i < img.width * img.height; i++) {
    const rgb = [0, 1, 2].map((c) => {
      const v = (img.rgba[i * 4 + c] ?? 0) / 255
      return tone(v + (v - (soft[i * 3 + c] ?? 0) / 255) * SHARPEN)
    })
    const [r = 0, g = 0, b = 0] = rgb
    const luma = 0.3 * r + 0.59 * g + 0.11 * b
    rgba[i * 4] = Math.round(Math.min(1, Math.max(0, luma + (r - luma) * SATURATION)) * 255)
    rgba[i * 4 + 1] = Math.round(Math.min(1, Math.max(0, luma + (g - luma) * SATURATION)) * 255)
    rgba[i * 4 + 2] = Math.round(Math.min(1, Math.max(0, luma + (b - luma) * SATURATION)) * 255)
    rgba[i * 4 + 3] = 255
  }
  return { width: img.width, height: img.height, rgba }
}
