import { describe, expect, it } from "vitest"
import { DRIFT, NEAR_MISS, drift, multiplier, nearMiss, newScore, tickScore } from "./score.ts"

describe("scoring", () => {
  it("pays a fast, close pass once, not a crawl or a crash", () => {
    const s = newScore()
    expect(nearMiss(s, 1, 4, 20, 0)).toBe(NEAR_MISS)
    expect(nearMiss(s, 1, 4, 20, 0.5)).toBe(0)
    expect(nearMiss(s, 2, 4, 5, 0)).toBe(0)
    expect(nearMiss(s, 3, 2, 20, 0)).toBe(0)
    expect(s.money).toBe(NEAR_MISS)
  })

  it("pays a drift every half second it lasts", () => {
    const s = newScore()
    let paid = 0
    for (let i = 0; i < 61; i++) paid += drift(s, 15, 0.6, 1 / 60)
    expect(paid).toBe(2 * DRIFT)
    expect(drift(s, 15, 0.1, 1 / 60)).toBe(0)
  })

  it("builds a multiplier from awards in a row and drops it after a pause", () => {
    const s = newScore()
    for (let id = 0; id < 8; id++) nearMiss(s, id, 4, 20, 0)
    expect(multiplier(s)).toBe(3)
    for (let i = 0; i < 60 * 6; i++) tickScore(s, 1 / 60)
    expect(multiplier(s)).toBe(1)
  })
})
