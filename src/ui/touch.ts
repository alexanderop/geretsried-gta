import type { Input } from "#/sim/game.ts"

/** Share of the stick's radius it must move before it counts as a direction, and past which you sprint on foot. */
const DEAD = 0.35
const SPRINT = 0.9

/**
 * The thumb stick (x right, y down, both -1 … 1, the knob's offset over the radius) as the arrow keys: eight
 * directions, so walking goes where you push and in a car up is gas, down is brake, the sides steer.
 */
export const stickKeys = (x: number, y: number): Pick<Input, "up" | "down" | "left" | "right" | "sprint"> => {
  const r = Math.hypot(x, y)
  if (r < DEAD) return { up: false, down: false, left: false, right: false, sprint: false }
  // Within 22.5° of an axis it is that axis alone; between, both (a diagonal).
  const ax = Math.abs(x) / r
  const ay = Math.abs(y) / r
  const diag = Math.sin(Math.PI / 8)
  return { up: y < 0 && ay > diag, down: y > 0 && ay > diag, left: x < 0 && ax > diag, right: x > 0 && ax > diag, sprint: r >= SPRINT }
}

export type TouchHold = "attack" | "handbrake" | "horn"

/**
 * The on-screen controls' state, written by TouchControls and read once per step like the keyboard: `take()`
 * returns this step's input and clears the one-shot taps (in/out, weapon cycling).
 */
export const newTouchPad = () => {
  let x = 0
  let y = 0
  const held = new Set<TouchHold>()
  let use = false
  let cycle: -1 | 0 | 1 = 0
  return {
    stick: (sx: number, sy: number) => {
      x = sx
      y = sy
    },
    hold: (key: TouchHold, on: boolean) => void (on ? held.add(key) : held.delete(key)),
    use: () => void (use = true),
    cycle: (dir: -1 | 1) => void (cycle = dir),
    horn: () => held.has("horn"),
    take: (): Input => {
      const input: Input = { ...stickKeys(x, y), handbrake: held.has("handbrake"), attack: held.has("attack"), use, cycle }
      use = false
      cycle = 0
      return input
    },
  }
}

export type TouchPad = ReturnType<typeof newTouchPad>

/** Keyboard and touch together: either one holding a key holds it. */
export const mergeInput = (a: Input, b: Input): Input => ({
  up: a.up || b.up,
  down: a.down || b.down,
  left: a.left || b.left,
  right: a.right || b.right,
  handbrake: a.handbrake || b.handbrake,
  sprint: a.sprint || b.sprint,
  attack: a.attack || b.attack,
  use: a.use || b.use,
  cycle: a.cycle !== 0 ? a.cycle : b.cycle,
})

/** A phone or tablet: a coarse pointer without hover, or `?touch=1` to try the controls on a desktop. */
export const isTouchDevice = (): boolean => {
  const forced = new URLSearchParams(location.search).get("touch")
  if (forced !== null) return forced !== "0"
  return matchMedia("(pointer: coarse)").matches || (navigator.maxTouchPoints > 0 && matchMedia("(hover: none)").matches)
}
