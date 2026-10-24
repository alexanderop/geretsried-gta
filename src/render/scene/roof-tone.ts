/**
 * Roof colours from the photo, graded for GTA 2. The DOP40 plane medians are
 * hazy: a terracotta roof measures as pale salmon (lightness about 0.56,
 * saturation 0.2 across the town). The
 * grade undoes the haze and keeps each roof's own hue and the lit/shaded
 * difference between its planes, since it is monotonic in lightness.
 */
import type { Rgba } from "./mesh.ts"

type Hsl = readonly [number, number, number]

const toHsl = (r: number, g: number, b: number): Hsl => {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h / 6, s, l]
}

const toRgb = ([h, s, l]: Hsl): readonly [number, number, number] => {
  if (s === 0) return [l, l, l]
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const hue = (t: number) => {
    const u = ((t % 1) + 1) % 1
    if (u < 1 / 6) return p + (q - p) * 6 * u
    if (u < 1 / 2) return q
    if (u < 2 / 3) return p + (q - p) * (2 / 3 - u) * 6
    return p
  }
  return [hue(h + 1 / 3), hue(h), hue(h - 1 / 3)]
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

/** Reds and oranges: clay and brown tiles. */
const isWarm = (h: number) => h < 0.12 || h > 0.95

/**
 * A measured roof colour (0–255) as GTA 2 would paint it: clay tile becomes
 * saturated terracotta or brown, grey tile dark anthracite, flat roofs light
 * grey gravel.
 */
export const roofTone = (rgb: readonly [number, number, number], pitched: boolean): Rgba => {
  const [h, s, l] = toHsl(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255)
  const graded: Hsl = !pitched
    ? [h, Math.min(s, 0.06), clamp(0.3 + l * 0.42, 0.42, 0.68)]
    : isWarm(h) && s >= 0.1
      ? [h < 0.5 ? clamp(h * 0.8, 0.01, 0.055) : h, clamp(s * 2.2, 0.35, 0.58), clamp(0.06 + l * 0.6, 0.18, 0.44)]
      : [h, Math.min(s, 0.08), clamp(0.12 + l * 0.4, 0.16, 0.38)]
  const [r, g, b] = toRgb(graded)
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), 255]
}
