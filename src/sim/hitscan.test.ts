import { describe, expect, it } from "vitest"
import { blast, inBox, inCone, rayBox, rayCircle, rayWall } from "./hitscan.ts"

/** A wall from x = 5 to 8 m across the ray. */
const solid = (x: number) => x > 5 && x < 8

describe("rays", () => {
  it("hit a person in their way and miss one beside it", () => {
    expect(rayCircle(0, 0, 1, 0, 10, 0, 0.5)).toBeCloseTo(9.5)
    expect(rayCircle(0, 0, 1, 0, 10, 2, 0.5)).toBeNull()
    expect(rayCircle(0, 0, 1, 0, -10, 0, 0.5)).toBeNull()
  })

  it("hit a car turned at an angle on its near side", () => {
    const car = { x: 10, y: 0, angle: Math.PI / 2, hl: 2.2, hw: 1 }
    expect(rayBox(0, 0, 1, 0, car)).toBeCloseTo(9)
    expect(rayBox(0, 5, 1, 0, car)).toBeNull()
    expect(inBox(10, 2, car)).toBe(true)
    expect(inBox(11.5, 0, car)).toBe(false)
  })

  it("stop at a wall, so a bullet does not reach someone behind it", () => {
    const reach = rayWall(solid, 0, 0, 1, 0, 40)
    expect(reach).toBeGreaterThan(4.7)
    expect(reach).toBeLessThan(5.3)
    const behind = rayCircle(0, 0, 1, 0, 12, 0, 0.5) ?? Infinity
    expect(behind > reach).toBe(true)
    expect(rayWall(() => false, 0, 0, 1, 0, 40)).toBe(40)
  })
})

describe("explosions", () => {
  it("do all their damage at the centre and fall off to nothing at the radius", () => {
    expect(blast(0, 6, 160)).toBe(160)
    expect(blast(3, 6, 160)).toBe(80)
    expect(blast(6, 6, 160)).toBe(0)
    expect(blast(9, 6, 160)).toBe(0)
    expect(blast(1, 6, 160)).toBeGreaterThan(blast(2, 6, 160))
  })
})

describe("the flame cone", () => {
  it("reaches what is in front and close, not behind or beside", () => {
    expect(inCone(0, 0, 0, 7, 0.3, 5, 0.5)).toBe(true)
    expect(inCone(0, 0, 0, 7, 0.3, 9, 0)).toBe(false)
    expect(inCone(0, 0, 0, 7, 0.3, -3, 0)).toBe(false)
    expect(inCone(0, 0, 0, 7, 0.3, 3, 3)).toBe(false)
  })
})
