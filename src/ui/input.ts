import type { Input } from "#/sim/game.ts"

type Held = keyof Omit<Input, "use" | "cycle">

const KEYS: Readonly<Record<string, Held>> = {
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
  ControlLeft: "attack",
  ControlRight: "attack",
}

/** UI keys outside the game step: G horn (held), H help (toggle), M sound (toggle), and any key (audio may start). */
export type UiKeys = { readonly onHelp: () => void; readonly onMute: () => void; readonly onAnyKey: () => void }

/** Tracks held keys; `take()` returns this step's input and clears the one-shot presses (F, weapon cycling). */
export const listenKeyboard = (target: Window, ui: UiKeys) => {
  const held = new Set<Held>()
  let use = false
  let swap: -1 | 0 | 1 = 0
  let horn = false
  const down = (e: KeyboardEvent) => {
    ui.onAnyKey()
    if (e.code === "KeyG") horn = true
    if (e.code === "KeyH" && !e.repeat) ui.onHelp()
    if (e.code === "KeyM" && !e.repeat) ui.onMute()
    const key = KEYS[e.code]
    if (key !== undefined) {
      held.add(key)
      e.preventDefault()
    }
    if (e.code === "KeyF" && !e.repeat) use = true
    // Q / E or [ / ]: previous and next weapon, GTA 2's weapon keys.
    if (!e.repeat && (e.code === "KeyQ" || e.code === "BracketLeft")) swap = -1
    if (!e.repeat && (e.code === "KeyE" || e.code === "BracketRight")) swap = 1
  }
  const up = (e: KeyboardEvent) => {
    if (e.code === "KeyG") horn = false
    const key = KEYS[e.code]
    if (key !== undefined) held.delete(key)
  }
  const blur = () => {
    held.clear()
    horn = false
  }
  target.addEventListener("keydown", down)
  target.addEventListener("keyup", up)
  target.addEventListener("blur", blur)
  return {
    horn: () => horn,
    take: (): Input => {
      const input: Input = {
        up: held.has("up"),
        down: held.has("down"),
        left: held.has("left"),
        right: held.has("right"),
        handbrake: held.has("handbrake"),
        sprint: held.has("sprint"),
        attack: held.has("attack"),
        use,
        cycle: swap,
      }
      use = false
      swap = 0
      return input
    },
    dispose: () => {
      target.removeEventListener("keydown", down)
      target.removeEventListener("keyup", up)
      target.removeEventListener("blur", blur)
    },
  }
}
