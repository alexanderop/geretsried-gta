import { describe, expect, it } from "vitest"
import { hurt, isDead, vitals } from "./damage.ts"

describe("damage", () => {
  it("takes armour first, then hp, and remembers what hit", () => {
    const v = vitals(100, 30)
    expect(hurt(v, 50, "car")).toBe(20)
    expect(v).toEqual({ hp: 80, armour: 0, lastHit: "car" })
  })

  it("never goes below zero", () => {
    const v = vitals(10)
    expect(hurt(v, 50, "wall")).toBe(10)
    expect(isDead(v)).toBe(true)
    expect(hurt(v, -5, "wall")).toBe(0)
  })
})
