/**
 * Police cars that chase a wanted player: along the shortest street route
 * while far, straight at you (aiming a little ahead) once close, feeling for
 * walls with three feelers, and bumping you. A car that gets stuck anyway is
 * sent round again from somewhere out of sight.
 */
import type { World } from "#/world/world.ts"
import { makeRoadGraph, nearestNode, route, type RoadGraph } from "#/world/route.ts"
import { ROAD, forwardSpeed, stepCar, type Car } from "./car.ts"
import { POLICE_MODEL } from "./vehicles.ts"

export type Cop = {
  readonly id: number
  car: Car
  stuck: number
  /** Street waypoints still ahead, [x0, y0, ...]. */
  path: Array<number>
  /** Seconds until the route is planned again. */
  replan: number
  /** Seconds left backing away from a wall. */
  reverse: number
}

const graphs = new WeakMap<World, RoadGraph>()
const graphOf = (world: World) => {
  const known = graphs.get(world)
  if (known !== undefined) return known
  const g = makeRoadGraph(world.map)
  graphs.set(world, g)
  return g
}

/** Meters from the player a police car turns up: just out of view. */
const SPAWN_NEAR = 70
const SPAWN_FAR = 120
const FEELER_M = 7
const STUCK_S = 2.5

/** A police car on a street corner just out of view, facing the way to (x, y). */
export const spawnCop = (world: World, id: number, x: number, y: number, random: () => number, hits: (car: Car) => boolean): Cop | null => {
  const g = graphOf(world)
  for (let attempt = 0; attempt < 12; attempt++) {
    const a = random() * Math.PI * 2
    const r = SPAWN_NEAR + random() * (SPAWN_FAR - SPAWN_NEAR)
    const n = nearestNode(g, x + Math.cos(a) * r, y + Math.sin(a) * r, 30)
    if (n < 0) continue
    const cx = g.xs[n] ?? 0
    const cy = g.ys[n] ?? 0
    if (Math.hypot(cx - x, cy - y) < SPAWN_NEAR * 0.7) continue
    const path = route(g, cx, cy, x, y)
    const angle = path.length >= 4 ? Math.atan2((path[3] ?? 0) - cy, (path[2] ?? 0) - cx) : Math.atan2(y - cy, x - cx)
    const car: Car = { x: cx, y: cy, angle, vx: 0, vy: 0, model: POLICE_MODEL, health: 100 }
    if (!hits(car)) return { id, car, stuck: 0, path, replan: 1, reverse: 0 }
  }
  return null
}

/** Shortest turn from angle a to b. */
const turn = (a: number, b: number) => Math.atan2(Math.sin(b - a), Math.cos(b - a))

/** Steering (-1..1) and throttle (-1..1) towards a target, away from walls. */
export const pursue = (world: World, car: Car, tx: number, ty: number, targetSpeed: number) => {
  const dist = Math.hypot(tx - car.x, ty - car.y)
  let want = turn(car.angle, Math.atan2(ty - car.y, tx - car.x))
  const solid = (a: number) => world.isSolid(car.x + Math.cos(car.angle + a) * FEELER_M, car.y + Math.sin(car.angle + a) * FEELER_M)
  if (solid(0)) want = solid(0.6) ? (solid(-0.6) ? Math.PI : -0.9) : 0.9
  const speed = forwardSpeed(car)
  // Close to a player who has (nearly) stopped: pull up next to them.
  // Target behind and going slowly: reverse round, wheels turned the other way (a three-point turn).
  if (Math.abs(want) > 2 && speed < 6) return { throttle: -1, steer: -Math.sign(want), handbrake: false }
  // Brake for corners, so the car makes the turn instead of the wall.
  const throttle = dist < 9 && targetSpeed < 3 ? (speed > 2 ? -1 : 0) : Math.abs(want) > 0.6 && speed > 9 ? -0.6 : 1
  return { throttle, steer: Math.max(-1, Math.min(1, want * 2.5)), handbrake: Math.abs(want) > 1.2 && speed > 10 }
}

/** One step of a chasing police car; `hits` says whether a car touches a wall. */
export const stepCop = (world: World, cop: Cop, target: { readonly x: number; readonly y: number; readonly vx: number; readonly vy: number }, dt: number, hits: (car: Car) => boolean): void => {
  cop.replan -= dt
  if (cop.replan <= 0) {
    cop.path = route(graphOf(world), cop.car.x, cop.car.y, target.x, target.y)
    cop.replan = 1
    // The route starts at the nearest corner, which may already lie behind: skip it if the car is past it.
    const [ax, ay, bx, by] = cop.path
    if (bx !== undefined && by !== undefined && ax !== undefined && ay !== undefined && (cop.car.x - ax) * (bx - ax) + (cop.car.y - ay) * (by - ay) > 0) cop.path.splice(0, 2)
  }
  // Drop the waypoints already reached.
  while (cop.path.length >= 2 && Math.hypot((cop.path[0] ?? 0) - cop.car.x, (cop.path[1] ?? 0) - cop.car.y) < 8) cop.path.splice(0, 2)
  const close = Math.hypot(target.x - cop.car.x, target.y - cop.car.y) < 30 || cop.path.length < 2
  const lead = 0.5
  const tx = close ? target.x + target.vx * lead : (cop.path[0] ?? target.x)
  const ty = close ? target.y + target.vy * lead : (cop.path[1] ?? target.y)
  const ahead = pursue(world, cop.car, tx, ty, close ? Math.hypot(target.vx, target.vy) : 99)
  // Backing out of a dead end: reverse with the wheels turned the other way.
  const controls = cop.reverse > 0 ? { throttle: -1, steer: -ahead.steer, handbrake: false } : ahead
  cop.reverse = Math.max(0, cop.reverse - dt)
  const next = stepCar(cop.car, controls, ROAD, dt)
  if (hits(next)) {
    cop.car.vx *= -0.3
    cop.car.vy *= -0.3
    cop.stuck += dt
    if (cop.reverse === 0) cop.reverse = 0.9
    return
  }
  Object.assign(cop.car, next)
  const far = Math.hypot(target.x - cop.car.x, target.y - cop.car.y) > 12
  cop.stuck = far && Math.abs(forwardSpeed(cop.car)) < 2 ? cop.stuck + dt : Math.max(0, cop.stuck - dt)
}

export const isStuck = (cop: Cop) => cop.stuck > STUCK_S
