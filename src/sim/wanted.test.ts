import { describe, expect, it } from "vitest"
import { MAX_WANTED, coolDown, commit, noHeat, tactics, wantedLevel } from "./wanted.ts"

describe("wanted level", () => {
  it("takes a few offences for the first cop head, theft in front of the police right away", () => {
    const w = noHeat()
    commit(w, "crash")
    commit(w, "crash")
    expect(wantedLevel(w)).toBe(0)
    commit(w, "pedestrian")
    expect(wantedLevel(w)).toBe(1)
    const t = noHeat()
    commit(t, "theft")
    expect(wantedLevel(t)).toBe(1)
  })

  it("stops at four heads", () => {
    const w = noHeat()
    for (let i = 0; i < 20; i++) commit(w, "theft")
    expect(wantedLevel(w)).toBe(MAX_WANTED)
  })

  it("cools only once no police car has seen you for a while", () => {
    const w = { heat: 2.5, unseen: 0 }
    for (let i = 0; i < 600; i++) coolDown(w, true, 1 / 60)
    expect(w.heat).toBe(2.5)
    for (let i = 0; i < 60 * 7; i++) coolDown(w, false, 1 / 60)
    expect(w.heat).toBe(2.5)
    for (let i = 0; i < 60 * 30; i++) coolDown(w, false, 1 / 60)
    expect(wantedLevel(w)).toBe(0)
  })

  it("escalates: cars at one head, cops on foot with pistols at two, shooting from cars at three", () => {
    expect(tactics(1)).toEqual({ onFoot: false, shootFromCar: false })
    expect(tactics(2)).toEqual({ onFoot: true, shootFromCar: false })
    expect(tactics(3)).toEqual({ onFoot: true, shootFromCar: true })
  })

  it("puts a whole head on for killing a cop", () => {
    const w = noHeat()
    commit(w, "copKill")
    expect(wantedLevel(w)).toBe(1)
  })
})
