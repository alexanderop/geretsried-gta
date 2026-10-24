import { describe, expect, it } from "vitest"
import { REWARD, TIME_S, missionTarget, newMission, stepMission } from "./mission.ts"

const phone = { x: 0, y: 0 }
const bakery = { name: "Mühlenbäck", kind: "bakery" as const, x: 500, y: 0 }
const pharmacy = { name: "Rehmaus Apotheke", kind: "pharmacy" as const, x: 0, y: 300 }

describe("the payphone job", () => {
  it("starts at the phone, picks up at the bakery and pays at the pharmacy", () => {
    const m = newMission(phone, bakery, pharmacy)
    expect(stepMission(m, { x: 50, y: 0 }, 1)).toBeNull()
    expect(stepMission(m, { x: 1, y: 1 }, 1)?.kind).toBe("start")
    expect(missionTarget(m)).toBe(bakery)
    expect(stepMission(m, { x: 495, y: 2 }, 1)?.kind).toBe("picked")
    expect(missionTarget(m)).toBe(pharmacy)
    expect(stepMission(m, { x: 2, y: 298 }, 1)).toEqual({ kind: "passed", reward: REWARD })
  })

  it("fails when the clock runs out, and rings again only after you walked away", () => {
    const m = newMission(phone, bakery, pharmacy)
    stepMission(m, phone, 0)
    stepMission(m, bakery, 0)
    expect(stepMission(m, { x: 250, y: 0 }, TIME_S + 1)?.kind).toBe("failed")
    expect(stepMission(m, phone, 0)).toBeNull()
    stepMission(m, { x: 100, y: 0 }, 0)
    expect(stepMission(m, phone, 0)?.kind).toBe("start")
  })
})
