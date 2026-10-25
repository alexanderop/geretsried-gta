import type { World } from "#/world/world.ts"
import { isBurning } from "./damage.ts"
import { claimedSlots, kerbCars, kerbRoom, kerbSlots, laneFor, slotFree, slotsBeside, type Slot } from "./parking.ts"
import { curveLength, curveOf, laneOf, npcOn, onCurve, place, poseAt, stepNpc, type Curve, type Leader, type Npc, type NpcMode } from "./traffic.ts"
import { POLICE_MODEL } from "./vehicles.ts"
import type { Game } from "./state.ts"

/**
 * Traffic and the kerb trade cars: now and then a car driving past a free slot pulls in and parks (it becomes a
 * kerbside car, parking.ts), and a kerbside car pulls out into a gap in the traffic (it becomes an NPC).
 */

type PullingIn = Extract<NpcMode, { kind: "pullingIn" }>
type PullingOut = Extract<NpcMode, { kind: "pullingOut" }>

const DRIVING: NpcMode = { kind: "driving" }

/** Meters along the lane the curve into a slot and out of one takes. */
const IN_M = 7
const OUT_M = 9
/** m/s a car turns in to park at, and the braking (m/s²) it stops in the slot with. */
const IN_SPEED = 5
const PARK_BRAKE = 2.5
/** Braking (m/s²) a car plans with to slow down for the slot, so it does not decide on one it cannot reach. */
const PLAN_BRAKE = 2
/** The farthest a slot may be ahead (m) for a car to decide on it. */
const LOOK_MAX = 40
/** Pulling out: acceleration (m/s²), top speed on the curve (m/s), seconds indicating first. */
const OUT_ACCEL = 2.5
const OUT_TOP = 6
const INDICATE_S = 1.2
/** The lane must be free this far behind the slot (plus 2 s at the speed coming) and ahead of it (m), this wide either side. */
const CLEAR_BEHIND = 20
const CLEAR_AHEAD = 16
const LANE_HALF = 2.2
/** Only within this many meters of the player (the view), and pulling out not closer than OUT_NEAR. */
const VIEW_M = 150
const OUT_NEAR = 40
/** Cars pulling in, and pulling out, at once at most. */
const AT_ONCE = 2
/**
 * Every IN_EVERY ticks, a chance P_IN that one of the cars passing a free slot parks there; every OUT_EVERY ticks, a
 * chance P_OUT that a kerbside car in range pulls out. About one of each every 10 to 20 s in view.
 */
const IN_EVERY = 30
const P_IN = 0.08
const OUT_EVERY = 60
const P_OUT = 0.06

/** How far along its lane a slot is, from the lane's start (m). */
const alongLane = (world: World, slot: Slot) => {
  const lane = laneOf(world, laneFor(slot))
  return (slot.x - lane.x) * lane.dx + (slot.y - lane.y) * lane.dy
}

/** A curve from one pose to another that leaves and joins each along its heading. */
const curveBetween = (a: { readonly x: number; readonly y: number; readonly angle: number }, b: { readonly x: number; readonly y: number; readonly angle: number }): Curve => {
  const reach = Math.hypot(b.x - a.x, b.y - a.y) * 0.4
  return curveOf([a.x, a.y, a.x + Math.cos(a.angle) * reach, a.y + Math.sin(a.angle) * reach, b.x - Math.cos(b.angle) * reach, b.y - Math.sin(b.angle) * reach, b.x, b.y])
}

/** Is the NPC on the lane beside the slot? */
const besideSlot = (npc: Npc, slot: Slot) => {
  const lane = laneFor(slot)
  return npc.road === lane.road && npc.from === lane.from && npc.dir === lane.dir
}

/** Start pulling in to `slot`, which lies ahead on the NPC's lane. */
export const beginPullIn = (world: World, npc: Npc, slot: Slot): void => {
  npc.mode = { kind: "pullingIn", slot: slot.id, at: alongLane(world, slot) - IN_M, path: null, t: 0 }
}

/** A kerbside car leaves `game.parked` and becomes an NPC in its slot, indicating; the slot stays empty until recycled. */
export const beginPullOut = (world: World, game: Game, slot: Slot): Npc | null => {
  const car = game.kerb.get(slot.id)
  if (car === undefined || !game.parked.includes(car)) return null
  const seg = laneFor(slot)
  const end = Math.min(alongLane(world, slot) + OUT_M, laneOf(world, seg).len - 0.5)
  const npc = npcOn(world, game.nextId++, seg, end, car.model, car.vitals, { kind: "pullingOut", slot: slot.id, wait: 0, path: null, t: 0 }, game.kerbRandom)
  Object.assign(npc, { x: slot.x, y: slot.y, angle: slot.angle })
  game.parked = game.parked.filter((c) => c !== car)
  game.npcs.push(npc)
  return npc
}

/** A car pulling in: on its lane it brakes for the slot like for a bend (`leader` as when driving), then curves in, slowing to a stop. */
export const stepPullIn = (world: World, game: Game, npc: Npc, mode: PullingIn, leader: Leader | null, dt: number): void => {
  const slot = kerbSlots(world)[mode.slot]
  if (slot === undefined) {
    npc.mode = DRIVING
    return
  }
  const path = mode.path
  if (path === null) {
    stepNpc(world, game.signals, game.time, npc, leader, dt, game.kerbRandom, { toward: mode.at - npc.s, speed: IN_SPEED })
    // Turned off, or someone took the place: drive on.
    if (!besideSlot(npc, slot)) npc.mode = DRIVING
    else if (npc.s >= mode.at) {
      if (slotFree(game, slot, npc)) mode.path = curveBetween(npc, slot)
      else npc.mode = DRIVING
    }
    return
  }
  const left = curveLength(path) - mode.t
  npc.speed = Math.min(npc.speed + OUT_ACCEL * dt, IN_SPEED, Math.sqrt(2 * PARK_BRAKE * left))
  mode.t = Math.min(mode.t + npc.speed * dt, curveLength(path))
  const at = mode.t >= curveLength(path) - 1e-6 ? slot : onCurve(path, mode.t)
  Object.assign(npc, { x: at.x, y: at.y, angle: at.angle })
}

/** A car pulling out: it indicates, waits for a gap in the lane, then curves out onto it, speeding up, and drives on. */
export const stepPullOut = (world: World, game: Game, npc: Npc, mode: PullingOut, dt: number): void => {
  const slot = kerbSlots(world)[mode.slot]
  if (mode.path === null) {
    npc.speed = 0
    mode.wait += dt
    if (slot === undefined || mode.wait < INDICATE_S || !laneClear(world, game, npc, slot)) return
    mode.path = curveBetween(npc, poseAt(world, npc, npc.s))
    mode.t = 0
    return
  }
  npc.speed = Math.min(npc.speed + OUT_ACCEL * dt, OUT_TOP)
  mode.t += npc.speed * dt
  if (mode.t < curveLength(mode.path)) {
    Object.assign(npc, onCurve(mode.path, mode.t))
    return
  }
  npc.mode = DRIVING
  place(world, npc)
}

/** No car in the lane beside the slot from CLEAR_BEHIND (and 2 s at its speed) behind to CLEAR_AHEAD ahead, nobody on foot in it. */
const laneClear = (world: World, game: Game, npc: Npc, slot: Slot) => {
  const lane = laneOf(world, laneFor(slot))
  const base = alongLane(world, slot)
  const blocks = (x: number, y: number, speed: number) => {
    const along = (x - lane.x) * lane.dx + (y - lane.y) * lane.dy - base
    const across = Math.abs(-(x - lane.x) * lane.dy + (y - lane.y) * lane.dx)
    return across < LANE_HALF && along < CLEAR_AHEAD && along > -(CLEAR_BEHIND + 2 * speed)
  }
  const player = game.player.car
  if (player === null ? blocks(game.player.x, game.player.y, 0) : blocks(player.x, player.y, Math.hypot(player.vx, player.vy))) return false
  for (const o of game.npcs) if (o !== npc && blocks(o.x, o.y, o.speed)) return false
  for (const c of game.cops) if (blocks(c.car.x, c.car.y, Math.hypot(c.car.vx, c.car.vy))) return false
  return true
}

/** Cars that stood in their slot pull in for good: kerbside cars from now on, if the kerb has room, or they pull out again. */
export const parkArrived = (world: World, game: Game): void => {
  const p = game.player.car ?? game.player
  for (const npc of game.npcs) {
    const mode = npc.mode
    if (mode.kind !== "pullingIn" || mode.path === null || mode.t < curveLength(mode.path)) continue
    const slot = kerbSlots(world)[mode.slot]
    if (slot === undefined) continue
    if (!kerbRoom(world, game, p.x, p.y, true)) {
      npc.s = Math.min(alongLane(world, slot) + OUT_M, laneOf(world, npc).len - 0.5)
      npc.mode = { kind: "pullingOut", slot: slot.id, wait: 0, path: null, t: 0 }
      continue
    }
    const car = { x: slot.x, y: slot.y, angle: slot.angle, vx: 0, vy: 0, model: npc.model, vitals: npc.vitals }
    game.parked.push(car)
    game.kerb.set(slot.id, car)
    game.npcs = game.npcs.filter((n) => n !== npc)
  }
}

/** The first free slot far enough ahead on the NPC's lane for it to slow down for, and no farther than LOOK_MAX. */
const slotAhead = (world: World, game: Game, npc: Npc, claimed: ReadonlySet<number>): Slot | null => {
  const near = npc.s + IN_M + Math.max(0, npc.speed ** 2 - IN_SPEED ** 2) / (2 * PLAN_BRAKE) + 2
  let best: Slot | null = null
  let bestAt = Infinity
  for (const slot of slotsBeside(world, npc.road, npc.from, npc.dir)) {
    const at = alongLane(world, slot)
    if (at < near || at > npc.s + LOOK_MAX || at >= bestAt || claimed.has(slot.id) || !slotFree(game, slot, npc)) continue
    best = slot
    bestAt = at
  }
  return best
}

/** Now and then a car in view decides to park at a free slot ahead, and a kerbside car decides to pull out. */
export const startManoeuvres = (world: World, game: Game): void => {
  const tick = Math.round(game.time * 60)
  if (tick % IN_EVERY === 7) maybePullIn(world, game)
  if (tick % OUT_EVERY === 37) maybePullOut(world, game)
}

const busy = (game: Game, kind: NpcMode["kind"]) => game.npcs.reduce((n, o) => n + (o.mode.kind === kind ? 1 : 0), 0)

const maybePullIn = (world: World, game: Game) => {
  if (busy(game, "pullingIn") >= AT_ONCE) return
  const p = game.player.car ?? game.player
  const claimed = claimedSlots(game)
  const options: Array<readonly [Npc, Slot]> = []
  for (const npc of game.npcs) {
    // Ordinary traffic: not a bus, not the police.
    if (npc.mode.kind !== "driving" || npc.bus !== undefined || npc.model === POLICE_MODEL) continue
    if (Math.abs(npc.x - p.x) > VIEW_M || Math.abs(npc.y - p.y) > VIEW_M) continue
    const slot = slotAhead(world, game, npc, claimed)
    if (slot !== null) options.push([npc, slot])
  }
  if (options.length === 0 || game.kerbRandom() >= P_IN) return
  const pick = options[Math.floor(game.kerbRandom() * options.length)]
  if (pick !== undefined && kerbRoom(world, game, p.x, p.y, false)) beginPullIn(world, pick[0], pick[1])
}

const maybePullOut = (world: World, game: Game) => {
  if (busy(game, "pullingOut") >= AT_ONCE || game.kerbRandom() >= P_OUT) return
  const p = game.player.car ?? game.player
  const target = game.jobs.active?.target
  const standing = kerbCars(world, game)
  const slots = kerbSlots(world)
  const options: Array<Slot> = []
  for (const [id, car] of game.kerb) {
    const slot = slots[id]
    if (slot === undefined || car === target || !standing.has(car) || isBurning(car.vitals)) continue
    // A one-way street's left kerb faces against the traffic.
    if (slot.side === -1 && world.map.roads[slot.road]?.oneway === true) continue
    const d = Math.hypot(car.x - p.x, car.y - p.y)
    if (d >= OUT_NEAR && d <= VIEW_M) options.push(slot)
  }
  const pick = options[Math.floor(game.kerbRandom() * options.length)]
  if (pick !== undefined) beginPullOut(world, game, pick)
}
