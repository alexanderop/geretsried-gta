/**
 * One courier job from a payphone, GTA 2 style: pick something up, bring it
 * somewhere against the clock. Pure: it only reads where the player is.
 */
import type { Poi } from "#/map/types.ts"

export type Point = { readonly x: number; readonly y: number }

export type Mission = {
  stage: "offer" | "pickup" | "deliver"
  /** Seconds left to deliver. */
  timeLeft: number
  readonly phone: Point
  readonly pickup: Poi
  readonly dropoff: Poi
  /** The phone rings again only after you walked away from it. */
  armed: boolean
}

export type MissionEvent =
  | { readonly kind: "start"; readonly text: string }
  | { readonly kind: "picked"; readonly text: string }
  | { readonly kind: "passed"; readonly reward: number }
  | { readonly kind: "failed" }

export const REWARD = 1500
/** From the pickup: 2.4 km by road, a fair run at city speeds with a few corners to spare. */
export const TIME_S = 150
const PHONE_REACH = 3
const STOP_REACH = 9

export const newMission = (phone: Point, pickup: Poi, dropoff: Poi): Mission => ({ stage: "offer", timeLeft: TIME_S, phone, pickup, dropoff, armed: true })

/** Where the arrow points now. */
export const missionTarget = (m: Mission): Point => (m.stage === "offer" ? m.phone : m.stage === "pickup" ? m.pickup : m.dropoff)

const near = (a: Point, b: Point, r: number) => Math.hypot(a.x - b.x, a.y - b.y) < r

export const stepMission = (m: Mission, player: Point, dt: number): MissionEvent | null => {
  if (m.stage === "offer") {
    if (!m.armed) {
      if (!near(player, m.phone, 20)) m.armed = true
      return null
    }
    if (!near(player, m.phone, PHONE_REACH)) return null
    m.stage = "pickup"
    m.armed = false
    return { kind: "start", text: `Hol Brezn bei ${m.pickup.name} und bring sie zur ${m.dropoff.name} in ${TIME_S} s!` }
  }
  if (m.stage === "pickup") {
    if (!near(player, m.pickup, STOP_REACH)) return null
    m.stage = "deliver"
    m.timeLeft = TIME_S
    return { kind: "picked", text: `Brezn an Bord! Ab zur ${m.dropoff.name}!` }
  }
  m.timeLeft -= dt
  if (near(player, m.dropoff, STOP_REACH)) {
    m.stage = "offer"
    return { kind: "passed", reward: REWARD }
  }
  if (m.timeLeft > 0) return null
  m.stage = "offer"
  return { kind: "failed" }
}

/** Abandon the job (busted, wrecked): the phone rings again later. */
export const cancelMission = (m: Mission): void => {
  m.stage = "offer"
  m.armed = false
}
