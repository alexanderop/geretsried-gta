import { describe, expect, it } from "vitest"
import { GANGS, HOSTILE, JOB_RESPECT, KILL_RESPECT, MAX_RESPECT, gangJobDone, isHostile, memberKilled, newRespect, turfAt, turfs } from "./gangs.ts"

describe("gang respect", () => {
  it("rises with a gang's job and falls with its rival", () => {
    const r = newRespect()
    gangJobDone(r, "gartenberg", GANGS.gartenberg.rival)
    expect(r.gartenberg).toBe(JOB_RESPECT.for)
    expect(r[GANGS.gartenberg.rival]).toBe(-JOB_RESPECT.against)
    expect(r.gelting).toBe(0)
  })

  it("stays within ±100", () => {
    const r = newRespect()
    for (let i = 0; i < 20; i++) gangJobDone(r, "stein", "gelting")
    expect(r.stein).toBe(MAX_RESPECT)
    expect(r.gelting).toBe(-MAX_RESPECT)
  })

  it("falls when you kill one of theirs (their rival likes that), until they attack you", () => {
    const r = newRespect()
    memberKilled(r, "gelting")
    expect(r.gelting).toBe(-KILL_RESPECT)
    expect(r[GANGS.gelting.rival]).toBe(KILL_RESPECT / 2)
    expect(isHostile(r, "gelting")).toBe(false)
    while (r.gelting > HOSTILE) memberKilled(r, "gelting")
    expect(isHostile(r, "gelting")).toBe(true)
  })

  it("splits the town into turfs round Gartenberg, Stein and Gelting", () => {
    const t = turfs([
      { name: "Gartenberg", x: 2726, y: 2721 },
      { name: "Stein", x: 3526, y: 6100 },
      { name: "Gelting", x: 0, y: 692 },
      { name: "Geretsried", x: 4254, y: 4824 },
    ])
    expect(t.map((o) => o.gang)).toEqual(["gartenberg", "stein", "gelting"])
    expect(turfAt(t, 2700, 2900)).toBe("gartenberg")
    expect(turfAt(t, 3600, 5900)).toBe("stein")
    expect(turfAt(t, 300, 900)).toBe("gelting")
    expect(turfAt([], 0, 0)).toBeNull()
  })
})
