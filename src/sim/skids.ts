/**
 * Black tyre marks where the player's car slides or brakes hard, like those
 * GTA 2 leaves at its junctions: two lines from the rear wheels that stay on
 * the asphalt and fade out over SKID_S.
 */
import { CAR_LENGTH, CAR_WIDTH, type Car } from "./car.ts"

/** One piece of a mark: from (ax, ay) to (bx, by), laid at game time `t`. */
export type Skid = { readonly ax: number; readonly ay: number; readonly bx: number; readonly by: number; readonly t: number }

/** The marks on the ground, and where each rear wheel's mark goes on from (null when the car is not sliding). */
export type Skids = { readonly marks: Array<Skid>; from: readonly [number, number, number, number] | null }

export const newSkids = (): Skids => ({ marks: [], from: null })

/** Seconds a mark takes to fade away. */
export const SKID_S = 30
/** At most this many pieces: the oldest go first. */
const MAX_MARKS = 1500
/** A new piece every this many meters a wheel travels. */
const PIECE_M = 0.35
/** Sliding: faster than this (m/s) and more than this share of the speed sideways; braking: this much slower per second. */
const SKID_SPEED = 6
const SKID_SLIP = 0.3

/** Where the rear wheels touch the ground: a little in from the back corners. */
const rearWheels = (car: Car): readonly [number, number, number, number] => {
  const fx = Math.cos(car.angle)
  const fy = Math.sin(car.angle)
  const back = -CAR_LENGTH * 0.32
  const side = CAR_WIDTH * 0.38
  return [car.x + fx * back - fy * side, car.y + fy * back + fx * side, car.x + fx * back + fy * side, car.y + fy * back - fx * side]
}

/** Is the car leaving marks: sliding sideways at speed, or the handbrake or brakes locked at speed? */
export const isSkidding = (speed: number, slip: number, braking: boolean): boolean => speed > SKID_SPEED && (slip > SKID_SLIP || braking)

/** Lay the marks of one step: while `skidding`, each rear wheel's line goes on to where it is now. */
export const markSkids = (skids: Skids, car: Car, skidding: boolean, time: number): void => {
  if (!skidding) {
    skids.from = null
    return
  }
  const now = rearWheels(car)
  const from = skids.from
  if (from === null) {
    skids.from = now
    return
  }
  if (Math.hypot(now[0] - from[0], now[1] - from[1]) < PIECE_M) return
  skids.marks.push({ ax: from[0], ay: from[1], bx: now[0], by: now[1], t: time }, { ax: from[2], ay: from[3], bx: now[2], by: now[3], t: time })
  if (skids.marks.length > MAX_MARKS) skids.marks.splice(0, skids.marks.length - MAX_MARKS)
  skids.from = now
}

/** Drop the marks that have faded out by `time`. */
export const fadeSkids = (skids: Skids, time: number): void => {
  const alive = skids.marks.findIndex((s) => time - s.t < SKID_S)
  if (alive === -1) skids.marks.length = 0
  else if (alive > 0) skids.marks.splice(0, alive)
}
