/**
 * Roof colours from the photo, graded for GTA 2. The DOP40 plane medians are
 * hazy: a terracotta roof measures as pale salmon (lightness about 0.56,
 * saturation 0.2 across the town). The grade undoes the haze. Only real clay
 * is terracotta: brown and grey-beige concrete or fibre-cement tiles (a warm
 * hue with little colour) become dark brown, never lighter than terracotta
 * from the same measurement. One roof is one material: what it is made of and
 * its hue come from all its planes together (a shaded plane just measures
 * darker and greyer), each plane keeps its own lightness, so the lit/shaded
 * difference stays (the grade is monotonic in lightness).
 */
import type { Rgba } from "./mesh.ts"

export type Rgb = readonly [number, number, number]

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

/** Clay tile: red to orange (under 26 degrees) with colour left under the haze. Tuned on DOP20 at the six V-item spots. */
const isClay = (h: number, s: number) => (h < 0.072 || h > 0.95) && s >= 0.25

/** Brown and grey-beige tile: a warm hue with a little colour. Less colour than that is grey tile. */
const isBrown = (h: number, s: number) => (h < 0.12 || h > 0.95) && s >= 0.1

/** A roof's material, with the hue and saturation measured over all its planes. */
export type RoofGrade = { readonly kind: "flat" | "clay" | "brown" | "grey"; readonly h: number; readonly s: number }

/** What a roof is made of, from the mean of its planes' measured colours (0–255). */
export const roofGrade = (planes: ReadonlyArray<Rgb>, pitched: boolean): RoofGrade => {
  const n = Math.max(1, planes.length)
  const mean = (i: 0 | 1 | 2) => planes.reduce((sum, c) => sum + c[i], 0) / n / 255
  const [h, s] = toHsl(mean(0), mean(1), mean(2))
  const kind = !pitched ? "flat" : isClay(h, s) ? "clay" : isBrown(h, s) ? "brown" : "grey"
  return { kind, h, s }
}

/**
 * A plane's measured colour (0–255) as GTA 2 would paint it: clay tile
 * becomes saturated terracotta, brown tile dark brown, grey tile dark
 * anthracite, flat roofs light grey gravel (their own hue, barely any).
 */
export const roofTone = (rgb: Rgb, grade: RoofGrade): Rgba => {
  const own = toHsl(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255)
  const l = own[2]
  const { h, s } = grade
  const graded: Hsl =
    grade.kind === "flat"
      ? [own[0], Math.min(own[1], 0.06), clamp(0.3 + l * 0.42, 0.42, 0.68)]
      : grade.kind === "clay"
        ? [h < 0.5 ? clamp(h * 0.8, 0.01, 0.055) : h, clamp(s * 2.2, 0.35, 0.58), clamp(0.06 + l * 0.6, 0.18, 0.44)]
        : grade.kind === "brown"
          ? [h < 0.5 ? clamp(h, 0.07, 0.1) : 0.07, clamp(s * 1.4, 0.14, 0.3), clamp(0.03 + l * 0.49, 0.15, 0.36)]
          : [h, Math.min(s, 0.08), clamp(0.12 + l * 0.4, 0.16, 0.38)]
  const [r, g, b] = toRgb(graded)
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), 255]
}
