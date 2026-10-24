import { describe, expect, it } from "vitest"
import { BURN_HP_S, FIRE_HP, FUSE_S, burnCar, burnPerson, hurt, ignite, isBurning, isDead, vitals } from "./damage.ts"

describe("damage", () => {
  it("takes armour first, then hp, and remembers what hit", () => {
    const v = vitals(100, 30)
    expect(hurt(v, 50, "car")).toBe(20)
    expect(v).toEqual({ hp: 80, armour: 0, lastHit: "car", fire: 0 })
  })

  it("never goes below zero", () => {
    const v = vitals(10)
    expect(hurt(v, 50, "wall")).toBe(10)
    expect(isDead(v)).toBe(true)
    expect(hurt(v, -5, "wall")).toBe(0)
  })
})

const secondsToBang = (hp: number) => {
  const v = vitals(hp)
  const dt = 1 / 60
  for (let t = 0; t < 30 / dt; t++) if (burnCar(v, dt)) return (t + 1) * dt
  return Infinity
}

describe("a burning car", () => {
  it("does not burn above the fire line", () => {
    expect(isBurning(vitals(FIRE_HP))).toBe(false)
    expect(secondsToBang(FIRE_HP)).toBe(Infinity)
  })

  it("burns down from the fire line and blows up a few seconds later", () => {
    const expected = (FIRE_HP - 1) / BURN_HP_S + FUSE_S
    expect(secondsToBang(FIRE_HP - 1)).toBeCloseTo(expected, 1)
    expect(expected).toBeGreaterThan(3)
    expect(expected).toBeLessThan(6)
  })

  it("knocked straight to nothing goes up on the short fuse, so explosions chain", () => {
    expect(secondsToBang(0)).toBeCloseTo(FUSE_S, 1)
  })
})

describe("a burning person", () => {
  it("burns for a few seconds, enough to finish someone unarmoured", () => {
    const v = vitals(100)
    ignite(v)
    for (let i = 0; i < 60 * 6; i++) burnPerson(v, 1 / 60)
    expect(isDead(v)).toBe(true)
    expect(v.fire).toBe(0)
  })
})
