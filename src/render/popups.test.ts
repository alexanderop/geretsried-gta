import { describe, expect, it } from "vitest"
import { POPUP_S, addPopup, agePopups, popupColour, type Popup } from "./popups.ts"

describe("score popups", () => {
  it("live for 1.2 s and are then dropped", () => {
    const list: Array<Popup> = []
    addPopup(list, 50, { kind: "player", times: 1 })
    agePopups(list, POPUP_S / 2)
    expect(list).toHaveLength(1)
    expect(list[0]?.age).toBeCloseTo(POPUP_S / 2)
    agePopups(list, POPUP_S / 2)
    expect(list).toHaveLength(0)
  })

  it("stack: one paid while another still stands goes a slot above it, and back to the bottom once they are gone", () => {
    const list: Array<Popup> = []
    addPopup(list, 10, { kind: "spot", x: 0, y: 0, times: 1 })
    addPopup(list, 20, { kind: "spot", x: 0, y: 0, times: 2 })
    agePopups(list, 0.1)
    addPopup(list, 30, { kind: "spot", x: 0, y: 0, times: 3 })
    expect(list.map((p) => p.slot)).toEqual([0, 1, 2])
    agePopups(list, POPUP_S)
    addPopup(list, 40, { kind: "player", times: 1 })
    expect(list.map((p) => p.slot)).toEqual([0])
  })

  it("are coloured by multiplier: white, yellow, orange, red", () => {
    expect([1, 2, 3, 4].map(popupColour)).toEqual(["#ffffff", "#ffd60a", "#ff8c1a", "#ff3b30"])
  })
})
