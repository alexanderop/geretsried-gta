import type { Road } from "#/map/types.ts"
import type { World } from "#/world/world.ts"
import { WALKABLE } from "#/world/world.ts"
import type { GangId } from "./gangs.ts"
import { PERSON_HP, burnPerson, hurt, isDead, vitals, type Vitals } from "./damage.ts"

/** Someone walking the footpath and sidewalk network. */
export type Walker = {
  readonly id: number
  road: number
  from: number
  dir: 1 | -1
  s: number
  /** Signed sideways offset from the way's center line: the sidewalk, or a dodge. */
  side: number
  /** -1 left, 1 right: which sidewalk this person keeps to on streets. */
  readonly curb: 1 | -1
  readonly pace: number
  x: number
  y: number
  angle: number
  /** Walk-cycle phase, for the bob. */
  stride: number
  /** Seconds left running from a car or from gunfire. */
  panic: number
  /** Length of the current leg in meters. */
  leg: number
  /** Seconds left lying on the ground after being hit; for the dead, how long the body stays. */
  down: number
  /** Down for good (no gore: they just lie there until they fade). */
  dead: boolean
  /** One in a few fights back when you hit them. */
  readonly tough: boolean
  readonly vitals: Vitals
  readonly sprite: number
  /** A gang member, in their gang's colours, on their turf. */
  gang?: GangId
}

/** Seconds a body stays on the ground, fading over the last of them. */
export const CORPSE_S = 20
export const CORPSE_FADE_S = 3
/** Every TOUGH-th person punches back. */
const TOUGH = 7

export const kill = (w: Walker): void => {
  if (w.dead) return
  w.dead = true
  w.down = CORPSE_S
  w.panic = 0
  w.vitals.fire = 0
}

/** Knocked off their feet for `seconds`; killed if the hit took their last hp. */
export const knockDown = (w: Walker, seconds: number): void => {
  if (isDead(w.vitals)) kill(w)
  else w.down = Math.max(w.down, seconds)
}

/** A shot or a bang at (x, y): run, away from it. */
export const scare = (w: Walker, x: number, y: number): void => {
  if (w.dead || w.down > 0) return
  const heading = Math.atan2(Math.sin(w.angle), Math.cos(w.angle))
  const towards = Math.cos(Math.atan2(y - w.y, x - w.x) - heading) > 0
  // Walking towards the noise: turn round on the spot (the side flips with the direction, see nextLeg).
  if (towards && w.panic <= 0) {
    w.from += w.dir
    w.dir = w.dir === 1 ? -1 : 1
    w.side = -w.side
    w.s = Math.max(0, w.leg - w.s)
    w.angle += Math.PI
  }
  w.panic = Math.max(w.panic, 4)
}

const PED_SPRITES = [1, 2, 3]

/** Where on the cross-section this person belongs: middle of a path, or out on the sidewalk. */
const homeSide = (road: Road, curb: 1 | -1) => (road.kind === "footway" ? curb * 0.3 : curb * (road.width / 2 + 1))

const vertex = (pts: ReadonlyArray<number>, i: number) => [pts[i * 2] ?? 0, pts[i * 2 + 1] ?? 0] as const

const place = (world: World, w: Walker) => {
  const road = world.map.roads[w.road]
  if (road === undefined) return
  const [ax, ay] = vertex(road.pts, w.from)
  const [bx, by] = vertex(road.pts, w.from + w.dir)
  const len = Math.hypot(bx - ax, by - ay) || 1
  const t = Math.min(1, w.s / len)
  const dx = (bx - ax) / len
  const dy = (by - ay) / len
  w.x = ax + (bx - ax) * t - dy * w.side * w.dir
  w.y = ay + (by - ay) * t + dx * w.side * w.dir
  const target = Math.atan2(dy, dx)
  w.angle += Math.atan2(Math.sin(target - w.angle), Math.cos(target - w.angle)) * 0.2
}

export const spawnWalker = (world: World, id: number, cx: number, cy: number, minR: number, maxR: number, random: () => number): Walker | null => {
  for (let attempt = 0; attempt < 40; attempt++) {
    const a = random() * Math.PI * 2
    const r = minR + random() * (maxR - minR)
    const hit = world.roadAt(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 15)
    if (hit === null || !WALKABLE.has(hit.road.kind)) continue
    const count = hit.road.pts.length / 2
    const from = Math.floor(random() * (count - 1))
    const dir: 1 | -1 = random() < 0.5 ? 1 : -1
    const curb: 1 | -1 = random() < 0.5 ? 1 : -1
    const w: Walker = {
      id,
      road: hit.index,
      from: dir === 1 ? from : from + 1,
      dir,
      s: 0,
      side: homeSide(hit.road, curb) * dir,
      curb,
      pace: 1.1 + random() * 0.6,
      x: 0,
      y: 0,
      angle: 0,
      stride: random() * 10,
      panic: 0,
      leg: 1,
      down: 0,
      dead: false,
      tough: id % TOUGH === 0,
      vitals: vitals(PERSON_HP),
      sprite: PED_SPRITES[id % PED_SPRITES.length] ?? 1,
    }
    const [ax, ay] = vertex(hit.road.pts, w.from)
    const [bx, by] = vertex(hit.road.pts, w.from + dir)
    w.angle = Math.atan2(by - ay, bx - ax)
    place(world, w)
    if (world.isSolid(w.x, w.y)) continue
    return w
  }
  return null
}

const nextLeg = (world: World, w: Walker, random: () => number): Pick<Walker, "road" | "from" | "dir"> => {
  const road = world.map.roads[w.road]
  const at = w.from + w.dir
  const node = road?.nodes[at]
  const options: Array<Pick<Walker, "road" | "from" | "dir">> = []
  for (const j of (node === undefined ? undefined : world.walkJunctions.get(node)) ?? []) {
    const r = world.map.roads[j.road]
    if (r === undefined) continue
    const back = j.road === w.road
    if (j.vertex + 1 < r.pts.length / 2 && !(back && w.dir === -1)) options.push({ road: j.road, from: j.vertex, dir: 1 })
    if (j.vertex > 0 && !(back && w.dir === 1)) options.push({ road: j.road, from: j.vertex, dir: -1 })
  }
  return options[Math.floor(random() * options.length)] ?? { road: w.road, from: at, dir: w.dir === 1 ? -1 : 1 }
}

/** A car that may run someone over: position, velocity. */
export type Threat = { readonly x: number; readonly y: number; readonly vx: number; readonly vy: number }

/** Walk on; dodge sideways from a fast car coming at you; get knocked down if it hits. */
export const stepWalker = (world: World, w: Walker, threat: Threat | null, dt: number, random: () => number): void => {
  if (w.dead) {
    w.down -= dt
    return
  }
  if (w.vitals.fire > 0) {
    // On fire: running about until it goes out, or they go down for good.
    burnPerson(w.vitals, dt)
    if (isDead(w.vitals)) {
      kill(w)
      return
    }
    w.panic = Math.max(w.panic, 0.5)
  }
  if (w.down > 0) {
    w.down -= dt
    // Knocked down, not killed: they get up again, shaken but whole.
    if (w.down <= 0) w.vitals.hp = PERSON_HP
    return
  }
  const road = world.map.roads[w.road]
  if (road === undefined) return
  const home = homeSide(road, w.curb) * w.dir

  if (threat !== null) {
    const speed = Math.hypot(threat.vx, threat.vy)
    const dx = w.x - threat.x
    const dy = w.y - threat.y
    const dist = Math.hypot(dx, dy)
    if (speed > 3 && dist < 1.6) {
      // Over 70 km/h or so is the end of them.
      hurt(w.vitals, speed * 5, "car")
      knockDown(w, 4)
      w.panic = 0
      return
    }
    // Coming at me fast and close: run.
    if (speed > 4 && dist < 12 && dx * threat.vx + dy * threat.vy > 0) w.panic = 2
  }

  if (w.panic > 0) {
    w.panic -= dt
    // Dodge away from the street's center line, out past the curb.
    const away = Math.sign(w.side || w.curb)
    w.side = Math.max(-(road.width / 2 + 5), Math.min(road.width / 2 + 5, w.side + away * 5 * dt))
  } else {
    w.side += (home - w.side) * Math.min(1, dt * 1.5)
  }

  const speed = w.panic > 0 ? 5 : w.pace
  w.stride += speed * dt * 4
  w.s += speed * dt
  const pts = road.pts
  let len = Math.hypot((pts[(w.from + w.dir) * 2] ?? 0) - (pts[w.from * 2] ?? 0), (pts[(w.from + w.dir) * 2 + 1] ?? 0) - (pts[w.from * 2 + 1] ?? 0))
  w.leg = len
  let guard = 0
  while (w.s >= len && guard++ < 8) {
    w.s -= len
    const sideOnRoad = w.side * w.dir
    Object.assign(w, nextLeg(world, w, random))
    w.side = sideOnRoad * w.dir
    const r = world.map.roads[w.road]
    if (r === undefined) break
    len = Math.hypot((r.pts[(w.from + w.dir) * 2] ?? 0) - (r.pts[w.from * 2] ?? 0), (r.pts[(w.from + w.dir) * 2 + 1] ?? 0) - (r.pts[w.from * 2 + 1] ?? 0))
    w.leg = len
  }
  place(world, w)
  // Narrow street, wall right at the curb: step in toward the path until clear.
  for (let tries = 0; tries < 3 && world.isSolid(w.x, w.y); tries++) {
    w.side *= 0.5
    place(world, w)
  }
}
