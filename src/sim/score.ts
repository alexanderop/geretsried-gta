/**
 * Money for driving like GTA 2, two cheap rules: a near miss (passing another
 * car fast, close, without touching it) and a drift (sliding sideways at
 * speed). Scoring again soon after builds the multiplier.
 */

export type Score = {
  money: number
  /** Awards in a row, each within CHAIN_S of the last. */
  chain: number
  /** Seconds since the last award. */
  since: number
  /** Seconds of the current slide not yet paid. */
  drift: number
  /** When each NPC last paid a near miss (game time), so one pass pays once. */
  readonly missed: Map<number, number>
}

export const newScore = (): Score => ({ money: 0, chain: 0, since: 0, drift: 0, missed: new Map() })

const CHAIN_S = 5
const MAX_MULTIPLIER = 4
export const NEAR_MISS = 50
export const DRIFT = 20
/** Faster than 50 km/h, centres 3.4 to 4.6 m apart: the cars nearly touched. */
const MISS_SPEED = 14
const MISS_NEAR = 3.4
const MISS_FAR = 4.6
const DRIFT_SPEED = 8
const DRIFT_SLIP = 0.35
const DRIFT_PAY_S = 0.5

export const multiplier = (s: Score) => Math.min(MAX_MULTIPLIER, 1 + Math.floor(s.chain / 4))

/** Pay `base` times the multiplier; returns what was paid. */
export const award = (s: Score, base: number): number => {
  const paid = base * multiplier(s)
  s.money += paid
  s.chain++
  s.since = 0
  return paid
}

export const tickScore = (s: Score, dt: number): void => {
  s.since += dt
  if (s.since > CHAIN_S) s.chain = 0
}

/** Did passing NPC `id` at `dist` meters, at `speed` m/s, just make a near miss at `time`? Pays it if so. */
export const nearMiss = (s: Score, id: number, dist: number, speed: number, time: number): number => {
  if (speed < MISS_SPEED || dist < MISS_NEAR || dist > MISS_FAR) return 0
  const last = s.missed.get(id)
  if (last !== undefined && time - last < 3) return 0
  s.missed.set(id, time)
  return award(s, NEAR_MISS)
}

/** Pay a slide every half second it lasts: `slip` is the sideways share of the car's speed. */
export const drift = (s: Score, speed: number, slip: number, dt: number): number => {
  if (speed < DRIFT_SPEED || slip < DRIFT_SLIP) {
    s.drift = 0
    return 0
  }
  s.drift += dt
  if (s.drift < DRIFT_PAY_S) return 0
  s.drift -= DRIFT_PAY_S
  return award(s, DRIFT)
}
