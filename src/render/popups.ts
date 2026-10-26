/**
 * GTA 2's score popups: every payout puts its number up big where the money
 * was made ("10" on a kill, "100" on a wreck, "50" over the car on a near
 * miss), chunky italic with a dark outline, rising a meter and fading.
 * Later ones stack above earlier ones instead of covering them.
 */
import { CAR_LENGTH } from "#/sim/car.ts"
import { playerPos, type Game } from "#/sim/game.ts"
import type { Payout } from "#/sim/score.ts"
import { project } from "./camera.ts"

export type Popup = { readonly amount: number; readonly at: Payout; age: number; readonly slot: number }

/** Seconds a popup stays; it fades over the second half. */
export const POPUP_S = 1.2
/** Meters it rises (north, up the screen) over its life. */
const RISE_M = 1
/** CSS px of the digits. */
const SIZE = 72
/** Popups younger than this still stand where a new one would: it goes one slot above them. */
const STACK_S = 0.6

/** Colour by multiplier, as GTA 2: ×1 white, ×2 yellow, ×3 orange, ×4 red. */
const COLOURS = ["#ffffff", "#ffd60a", "#ff8c1a", "#ff3b30"] as const

export const popupColour = (times: number) => COLOURS[Math.min(COLOURS.length, Math.max(1, times)) - 1] ?? COLOURS[0]

/** A new popup for `amount` paid at `at`, one slot above the young ones still showing. */
export const addPopup = (list: Array<Popup>, amount: number, at: Payout): void => {
  const slot = list.filter((p) => p.age < STACK_S).reduce((top, p) => Math.max(top, p.slot + 1), 0)
  list.push({ amount, at, age: 0, slot })
}

/** Age the popups by `dt` seconds and drop the ones whose time is up. */
export const agePopups = (list: Array<Popup>, dt: number): void => {
  for (const p of list) p.age += dt
  let kept = 0
  for (const p of list) if (p.age < POPUP_S) list[kept++] = p
  list.length = kept
}

/**
 * Draw the popups. A player's popup stands just above the car on screen (or the
 * walker), so it moves with you at top speed and never sits on your sprite;
 * a spot's popup stays on the spot, pushed above the player if it would land
 * on them (running someone over).
 */
export const drawPopups = (ctx: CanvasRenderingContext2D, view: Float32Array, game: Game, list: ReadonlyArray<Popup>, dpr: number): void => {
  if (list.length === 0) return
  const { width, height } = ctx.canvas
  const p = playerPos(game)
  const inCar = game.player.car !== null
  const z = inCar ? 1.5 : 1.75
  const me = project(view, p.x, p.y, z, width, height)
  // How far north of the player a popup's foot stands: clear of the car's nose whichever way it points.
  const clear = inCar ? CAR_LENGTH / 2 + 0.8 : 1.2
  const overPlayer = (rise: number) => project(view, p.x, p.y - clear - rise, z, width, height)
  const size = SIZE * dpr
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.font = `italic 900 ${size}px "Arial Black", "Arial Bold", Impact, sans-serif`
  ctx.textAlign = "center"
  ctx.textBaseline = "alphabetic"
  ctx.lineJoin = "round"
  ctx.lineWidth = 9 * dpr
  ctx.strokeStyle = "rgba(10,10,14,0.95)"
  for (const pop of list) {
    const rise = (pop.age / POPUP_S) * RISE_M
    const text = String(pop.amount)
    const half = ctx.measureText(text).width / 2
    let at = pop.at.kind === "player" ? overPlayer(rise) : project(view, pop.at.x, pop.at.y - rise, 1, width, height)
    if (at === null) continue
    // A spot's number that would land on the player (running someone over) stands above them instead.
    const foot = overPlayer(rise)
    if (pop.at.kind === "spot" && me !== null && foot !== null) {
      const r = me[1] - foot[1]
      if (Math.abs(at[0] - me[0]) < half + r && at[1] > me[1] - r && at[1] - size < me[1] + r) at = [at[0], foot[1]]
    }
    const x = at[0]
    const y = at[1] - pop.slot * size * 0.85
    ctx.globalAlpha = Math.min(1, 2 - (2 * pop.age) / POPUP_S)
    ctx.strokeText(text, x, y)
    ctx.fillStyle = popupColour(pop.at.times)
    ctx.fillText(text, x, y)
  }
  ctx.globalAlpha = 1
}
