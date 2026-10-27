import { readFileSync } from "node:fs"
import { Schema } from "effect"
import { describe, expect, it } from "vitest"
import { GameMap } from "#/map/types.ts"
import { type Rgb, roofGrade, roofTone } from "./roof-tone.ts"

const saturation = ([r, g, b]: readonly number[]) => {
  const max = Math.max(r ?? 0, g ?? 0, b ?? 0)
  const min = Math.min(r ?? 0, g ?? 0, b ?? 0)
  return max === 0 ? 0 : (max - min) / max
}
/** HSL saturation, 0–1. */
const hslSaturation = ([r = 0, g = 0, b = 0]: readonly number[]) => {
  const max = Math.max(r, g, b) / 255
  const min = Math.min(r, g, b) / 255
  const l = (max + min) / 2
  return max === min ? 0 : l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min)
}
const lightness = ([r, g, b]: readonly number[]) => ((r ?? 0) + (g ?? 0) + (b ?? 0)) / 3
const hex = (h: string): Rgb => {
  const n = Number.parseInt(h.slice(1), 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}
/** One plane, graded as a roof of its own. */
const tone = (c: Rgb, pitched = true) => roofTone(c, roofGrade([c], pitched))
const isTerracotta = (c: readonly number[]) => hslSaturation(c) >= 0.35 && (c[0] ?? 0) > (c[1] ?? 0) * 1.6

describe("roofTone", () => {
  it("turns the photo's pale salmon clay into saturated terracotta", () => {
    const tile = tone([193, 135, 108])
    expect(saturation(tile)).toBeGreaterThan(0.6)
    expect(lightness(tile)).toBeLessThan(120)
    expect(tile[0]).toBeGreaterThan(tile[1] * 2)
    expect(roofGrade([hex("#b0583c")], true).kind).toBe("clay")
    expect(isTerracotta(tone(hex("#b0583c")))).toBe(true)
  })

  it.each(["#746d5c", "#7f705f", "#686454"])("makes the Neuer Platz blocks' %s concrete tile dark brown or anthracite, not terracotta", (measured) => {
    const tile = tone(hex(measured))
    expect(roofGrade([hex(measured)], true).kind).not.toBe("clay")
    expect(hslSaturation(tile)).toBeLessThanOrEqual(0.3)
    expect(isTerracotta(tile)).toBe(false)
    expect(lightness(tile)).toBeLessThan(90)
  })

  it("never paints brown tile lighter than clay tile measured as light", () => {
    for (let l = 40; l <= 250; l += 10) {
      const brown = tone([l, Math.round(l * 0.92), Math.round(l * 0.8)])
      const clay = tone([l, Math.round(l * 0.7), Math.round(l * 0.56)])
      expect(lightness(brown)).toBeLessThanOrEqual(lightness(clay) + 1)
    }
  })

  it("keeps a roof's shaded plane darker than its lit one", () => {
    expect(lightness(tone([150, 100, 80]))).toBeLessThan(lightness(tone([200, 140, 110])))
    expect(lightness(tone([90, 80, 66]))).toBeLessThan(lightness(tone([140, 125, 105])))
  })

  it("paints all planes of one roof in its material: a clay roof's grey shaded plane stays terracotta, darker", () => {
    const lit = hex("#c08668")
    const shade = hex("#6a6660")
    const grade = roofGrade([lit, lit, shade], true)
    expect(grade.kind).toBe("clay")
    expect(isTerracotta(roofTone(shade, grade))).toBe(true)
    expect(lightness(roofTone(shade, grade))).toBeLessThan(lightness(roofTone(lit, grade)))
  })

  it("makes grey tile anthracite and flat roofs light grey gravel, as before", () => {
    const slate = tone([128, 126, 124])
    expect(lightness(slate)).toBeLessThan(90)
    expect(saturation(slate)).toBeLessThan(0.15)
    const gravel = tone([190, 170, 150], false)
    expect(saturation(gravel)).toBeLessThan(0.12)
    expect(lightness(gravel)).toBeGreaterThan(110)
    expect(gravel).toEqual([154, 148, 141, 255])
  })
})

describe("roofTone over the town (V-1)", () => {
  const map = Schema.decodeUnknownSync(GameMap)(JSON.parse(readFileSync("public/geretsried.map.json", "utf8")))
  const roofs = map.buildings.flatMap((b) => {
    const planes = (b.roof?.colors ?? []).flatMap((c) => (c === null ? [] : [hex(c)]))
    return b.roof?.pitched === true && planes.length > 0 ? [{ planes, grade: roofGrade(planes, true) }] : []
  })

  it("paints only clay terracotta: at most ~1700 of the photo-coloured pitched roofs (3215 before V-1)", () => {
    expect(roofs.length).toBeGreaterThan(3500)
    expect(roofs.filter((r) => r.grade.kind === "clay").length).toBeLessThanOrEqual(1700)
  })

  it("paints no pitched roof lighter than the lightest before V-1 (mean 108 of 255)", () => {
    const lightest = Math.max(...roofs.flatMap((r) => r.planes.map((c) => lightness(roofTone(c, r.grade)))))
    expect(lightest).toBeLessThanOrEqual(108)
  })
})
