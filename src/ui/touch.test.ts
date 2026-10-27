import { describe, expect, it } from "vitest"
import { mergeInput, newTouchPad, stickKeys } from "./touch.ts"

describe("stickKeys", () => {
  it("ignores a small push", () => {
    expect(stickKeys(0.2, -0.1)).toEqual({ up: false, down: false, left: false, right: false, sprint: false })
  })

  it("maps a push near an axis to that key alone", () => {
    expect(stickKeys(0.1, -0.7)).toEqual({ up: true, down: false, left: false, right: false, sprint: false })
    expect(stickKeys(-0.8, 0.05)).toEqual({ up: false, down: false, left: true, right: false, sprint: false })
  })

  it("maps a diagonal push to both keys", () => {
    expect(stickKeys(0.5, 0.5)).toMatchObject({ down: true, right: true, up: false, left: false })
  })

  it("sprints when pushed to the rim", () => {
    expect(stickKeys(0, -1).sprint).toBe(true)
  })
})

describe("TouchPad.take", () => {
  it("fires use and weapon cycling for one step only", () => {
    const pad = newTouchPad()
    pad.use()
    pad.cycle(1)
    pad.hold("attack", true)
    expect(pad.take()).toMatchObject({ use: true, cycle: 1, attack: true })
    expect(pad.take()).toMatchObject({ use: false, cycle: 0, attack: true })
    pad.hold("attack", false)
    expect(pad.take().attack).toBe(false)
  })
})

describe("mergeInput", () => {
  it("holds a key when either source holds it", () => {
    const pad = newTouchPad()
    pad.stick(0, -0.6)
    const keyboard = { up: false, down: false, left: true, right: false, handbrake: false, sprint: false, attack: false, use: false, cycle: -1 } as const
    expect(mergeInput(keyboard, pad.take())).toMatchObject({ up: true, left: true, cycle: -1 })
  })
})
