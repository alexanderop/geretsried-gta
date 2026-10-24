import type { Input } from "#/sim/game.ts"

const KEYS: Readonly<Record<string, keyof Omit<Input, "use">>> = {
  KeyW: "up",
  ArrowUp: "up",
  KeyS: "down",
  ArrowDown: "down",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  Space: "handbrake",
  ShiftLeft: "sprint",
  ShiftRight: "sprint",
}

/** Tracks held keys; `take()` returns this step's input and clears the one-shot F press. */
export const listenKeyboard = (target: Window) => {
  const held = new Set<keyof Omit<Input, "use">>()
  let use = false
  const down = (e: KeyboardEvent) => {
    const key = KEYS[e.code]
    if (key !== undefined) {
      held.add(key)
      e.preventDefault()
    }
    if (e.code === "KeyF" && !e.repeat) use = true
  }
  const up = (e: KeyboardEvent) => {
    const key = KEYS[e.code]
    if (key !== undefined) held.delete(key)
  }
  const blur = () => held.clear()
  target.addEventListener("keydown", down)
  target.addEventListener("keyup", up)
  target.addEventListener("blur", blur)
  return {
    take: (): Input => {
      const input: Input = {
        up: held.has("up"),
        down: held.has("down"),
        left: held.has("left"),
        right: held.has("right"),
        handbrake: held.has("handbrake"),
        sprint: held.has("sprint"),
        use,
      }
      use = false
      return input
    },
    dispose: () => {
      target.removeEventListener("keydown", down)
      target.removeEventListener("keyup", up)
      target.removeEventListener("blur", blur)
    },
  }
}
