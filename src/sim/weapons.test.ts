import { describe, expect, it } from "vitest"
import { WEAPONS, bulletAngles, cycle, give, newArsenal, owned, pull, tickArsenal } from "./weapons.ts"
import { makeRandom } from "./random.ts"

describe("the arsenal", () => {
  it("starts with fists only, and cycling stays on them", () => {
    const a = newArsenal()
    cycle(a, 1)
    expect(a.current).toBe("fists")
    expect(owned(a, "pistol")).toBe(false)
  })

  it("takes up a picked-up gun when bare-handed and caps the rounds", () => {
    const a = newArsenal()
    expect(give(a, "pistol")).toBe(true)
    expect(a.current).toBe("pistol")
    expect(a.ammo.pistol).toBe(WEAPONS.pistol.pickup)
    give(a, "pistol")
    give(a, "pistol")
    expect(a.ammo.pistol).toBe(WEAPONS.pistol.max)
    expect(give(a, "pistol")).toBe(false)
    // Already holding a gun: a new one goes in the bag.
    give(a, "rocket")
    expect(a.current).toBe("pistol")
  })

  it("cycles forward and back over the weapons you have rounds for", () => {
    const a = newArsenal()
    give(a, "pistol")
    give(a, "rocket")
    cycle(a, 1)
    expect(a.current).toBe("rocket")
    cycle(a, 1)
    expect(a.current).toBe("fists")
    cycle(a, -1)
    expect(a.current).toBe("rocket")
  })

  it("fires once per reload, uses a round a shot, and drops back when empty", () => {
    const a = newArsenal()
    give(a, "rocket")
    a.ammo.rocket = 2
    expect(pull(a)).toBe("rocket")
    expect(pull(a)).toBeNull()
    tickArsenal(a, WEAPONS.rocket.reload)
    expect(pull(a)).toBe("rocket")
    expect(a.ammo.rocket).toBe(0)
    expect(a.current).toBe("fists")
  })
})

describe("spread", () => {
  it("scatters a single bullet inside the cone", () => {
    const random = makeRandom(3)
    for (let i = 0; i < 100; i++) {
      const [a] = bulletAngles(1, WEAPONS.smg, random)
      expect(Math.abs((a ?? 0) - 1)).toBeLessThanOrEqual(WEAPONS.smg.spread / 2)
    }
  })

  it("fans the shotgun's pellets across its cone, in order", () => {
    const angles = bulletAngles(0, WEAPONS.shotgun, makeRandom(1))
    expect(angles).toHaveLength(WEAPONS.shotgun.pellets)
    expect(angles.toSorted((x, y) => x - y)).toEqual(angles)
    for (const a of angles) expect(Math.abs(a)).toBeLessThanOrEqual(WEAPONS.shotgun.spread / 2)
    expect((angles.at(-1) ?? 0) - (angles[0] ?? 0)).toBeGreaterThan(WEAPONS.shotgun.spread * 0.6)
  })
})
