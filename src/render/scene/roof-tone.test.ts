import { describe, expect, it } from "vitest"
import { roofTone } from "./roof-tone.ts"

const saturation = ([r, g, b]: readonly number[]) => {
  const max = Math.max(r ?? 0, g ?? 0, b ?? 0)
  const min = Math.min(r ?? 0, g ?? 0, b ?? 0)
  return max === 0 ? 0 : (max - min) / max
}
const lightness = ([r, g, b]: readonly number[]) => ((r ?? 0) + (g ?? 0) + (b ?? 0)) / 3

describe("roofTone", () => {
  it("turns the photo's pale salmon clay into saturated terracotta", () => {
    const tile = roofTone([193, 135, 108], true)
    expect(saturation(tile)).toBeGreaterThan(0.6)
    expect(lightness(tile)).toBeLessThan(120)
    expect(tile[0]).toBeGreaterThan(tile[1] * 2)
  })

  it("keeps a roof's shaded plane darker than its lit one", () => {
    expect(lightness(roofTone([150, 100, 80], true))).toBeLessThan(lightness(roofTone([200, 140, 110], true)))
  })

  it("makes grey tile anthracite and flat roofs light grey gravel", () => {
    const slate = roofTone([128, 126, 124], true)
    expect(lightness(slate)).toBeLessThan(90)
    expect(saturation(slate)).toBeLessThan(0.15)
    const gravel = roofTone([190, 170, 150], false)
    expect(saturation(gravel)).toBeLessThan(0.12)
    expect(lightness(gravel)).toBeGreaterThan(110)
  })
})
