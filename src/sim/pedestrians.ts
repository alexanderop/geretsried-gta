import type { World } from "#/world/world.ts"
import { WALKABLE } from "#/world/world.ts"
import type { GangId } from "./gangs.ts"
import type { Visit } from "./guests.ts"
import { CAR_LENGTH, CAR_WIDTH } from "./car.ts"
import { PERSON_HP, burnPerson, hurt, isDead, vitals, type Vitals } from "./damage.ts"
import { kerbOffset, parksAlong } from "./parking.ts"
import { nearestSegment } from "#/world/geometry.ts"

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
  /** A guest in Cafe Waldmann, off the network until they come back out (guests.ts). */
  visit?: Visit
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

const vertex = (pts: ReadonlyArray<number>, i: number) => [pts[i * 2] ?? 0, pts[i * 2 + 1] ?? 0] as const

/** Meters between a parked car's side and the people walking past it. */
const CAR_CLEAR = 0.4
/** Meters in from a profile's kerb that people walk its pavement: clear of the parked cars, short of the shop fronts. */
const PAVEMENT_IN = 0.6
/** Meters between samples of the walking line along a way. */
const LINE_M = 2
/** Meters ahead a walker looks for a parked car in the way. */
const LOOK_M = 3

/**
 * The walking line of a way: how far from its centre line people walk, sampled every LINE_M along each segment, on
 * its right (index 0) and left (1). A footpath is walked down the middle. A street profile's stretch (world/places/
 * streets.ts) is walked in its pavement band. Elsewhere it is the sidewalk a meter past the carriageway, and on a
 * street with kerbside parking past the outer side of the parked cars (parking.ts kerbOffset); pulled in toward the
 * street where a wall stands closer.
 */
type WalkLine = ReadonlyArray<readonly [Float32Array, Float32Array]>

const lines = new WeakMap<World, Map<number, WalkLine>>()

const walkLine = (world: World, ri: number): WalkLine => {
  let byRoad = lines.get(world)
  if (byRoad === undefined) lines.set(world, (byRoad = new Map()))
  let line = byRoad.get(ri)
  if (line === undefined) byRoad.set(ri, (line = makeWalkLine(world, ri)))
  return line
}

const makeWalkLine = (world: World, ri: number): WalkLine => {
  const road = world.map.roads[ri]
  if (road === undefined) return []
  const street = world.streets.find((st) => st.road === ri)
  const kerb = road.width / 2
  const sidewalk = parksAlong(road) ? Math.max(kerb + 1, kerbOffset(road) + CAR_WIDTH / 2 + CAR_CLEAR) : kerb + 1
  const out: Array<readonly [Float32Array, Float32Array]> = []
  for (let k = 0; k + 1 < road.pts.length / 2; k++) {
    const [ax, ay] = vertex(road.pts, k)
    const [bx, by] = vertex(road.pts, k + 1)
    const len = Math.hypot(bx - ax, by - ay)
    const n = Math.max(2, Math.ceil(len / LINE_M) + 1)
    const sides = [new Float32Array(n), new Float32Array(n)] as const
    const dx = len > 1e-6 ? (bx - ax) / len : 1
    const dy = len > 1e-6 ? (by - ay) / len : 0
    for (let i = 0; i < n; i++) {
      const t = (len * i) / (n - 1)
      const cx = ax + dx * t
      const cy = ay + dy * t
      for (const [si, side] of [[0, 1], [1, -1]] as const) {
        let want = road.kind === "footway" ? 0.3 : sidewalk
        if (street !== undefined) {
          // The profile's offsets are + to the right of its + station direction, which runs `direction` along the way.
          const [st] = street.local(cx, cy)
          const bands = street.bandsAt(st, side * street.profile.direction === 1 ? "right" : "left")
          const walk = bands?.find(([kind]) => kind === "pavement" || kind === "sidewalk")
          if (walk !== undefined) want = walk[1] + Math.min((walk[2] - walk[1]) / 2, PAVEMENT_IN)
        }
        // A wall closer than that: walk in front of it, at most back to the kerb (where parked cars are stepped round).
        while (want > kerb && world.isSolid(cx - dy * want * side, cy + dx * want * side)) want -= 0.25
        sides[si][i] = want
      }
    }
    out.push(sides)
  }
  return out
}

/**
 * The walking line `t` meters along segment `seg` (of length `len`) on the way's right (`side` 1) or left (-1), as
 * a signed offset (+ right of the way's direction, like a walker's `side`).
 */
const lineAt = (world: World, ri: number, seg: number, t: number, len: number, side: number): number => {
  const samples = walkLine(world, ri)[seg]?.[side > 0 ? 0 : 1]
  if (samples === undefined) return side * 0.3
  const f = Math.max(0, Math.min(1, t / (len || 1))) * (samples.length - 1)
  const i = Math.min(samples.length - 2, Math.floor(f))
  const a = samples[i] ?? 0
  return side * (a + ((samples[i + 1] ?? a) - a) * (f - i))
}

/** Where on the cross-section this person belongs now: the walking line on their curb (which turns with the way they walk). */
const homeSide = (world: World, w: Walker): number => {
  const seg = w.dir === 1 ? w.from : w.from - 1
  const t = w.dir === 1 ? w.s : w.leg - w.s
  return lineAt(world, w.road, seg, t, w.leg, w.curb * w.dir)
}

/** A parked car: where it stands and which way it faces. */
export type Obstacle = { readonly x: number; readonly y: number; readonly angle: number }

export const inCar = (c: Obstacle, x: number, y: number) => {
  if (Math.abs(c.x - x) > CAR_LENGTH || Math.abs(c.y - y) > CAR_LENGTH) return false
  const along = (x - c.x) * Math.cos(c.angle) + (y - c.y) * Math.sin(c.angle)
  const across = -(x - c.x) * Math.sin(c.angle) + (y - c.y) * Math.cos(c.angle)
  return Math.abs(along) < CAR_LENGTH / 2 && Math.abs(across) < CAR_WIDTH / 2
}

/**
 * A parked car on the walking line just ahead: the offset (signed like the line, + right of the way's direction) to
 * step to so as to pass it, on its far side when that is free of walls, else on the street side; null when the way
 * ahead is clear.
 */
const stepRound = (world: World, w: Walker, home: number, cars: ReadonlyArray<Obstacle>): number | null => {
  const road = world.map.roads[w.road]
  if (road === undefined || cars.length === 0) return null
  const [ax, ay] = vertex(road.pts, w.from)
  const [bx, by] = vertex(road.pts, w.from + w.dir)
  const len = Math.hypot(bx - ax, by - ay) || 1
  // Along the walking direction from the leg's start, and across it, + to the right of the way's own direction.
  const dx = (bx - ax) / len
  const dy = (by - ay) / len
  // The nearest car in the way decides: the one being passed, or else the next one.
  let best: number | null = null
  let bestGap = Infinity
  for (const c of cars) {
    if (Math.abs(c.x - w.x) > LOOK_M + CAR_LENGTH || Math.abs(c.y - w.y) > LOOK_M + CAR_LENGTH) continue
    const along = (c.x - ax) * dx + (c.y - ay) * dy
    const across = (-(c.x - ax) * dy + (c.y - ay) * dx) * w.dir
    const cos = Math.abs(Math.cos(c.angle - Math.atan2(dy, dx)))
    const sin = Math.sqrt(Math.max(0, 1 - cos * cos))
    const halfAlong = cos * (CAR_LENGTH / 2) + sin * (CAR_WIDTH / 2) + CAR_CLEAR
    const halfAcross = sin * (CAR_LENGTH / 2) + cos * (CAR_WIDTH / 2) + CAR_CLEAR
    if (along + halfAlong < w.s - 0.5 || along - halfAlong > w.s + LOOK_M) continue
    // In the way when the line runs through the car, or when getting back to the line would cross it.
    if (Math.max(w.side, home) <= across - halfAcross + 0.05 || Math.min(w.side, home) >= across + halfAcross - 0.05) continue
    const gap = Math.max(0, Math.abs(along - w.s) - halfAlong)
    if (gap >= bestGap) continue
    bestGap = gap
    // Already past its side, or beside it: stay on that side (never across the car).
    if (gap === 0 || Math.abs(w.side - across) >= halfAcross - 0.05) {
      best = across + Math.sign(w.side - across) * halfAcross
      continue
    }
    const outward = Math.sign(across || home) || 1
    const far = across + outward * halfAcross
    const near = across - outward * halfAcross
    // The far side free all along the car (the same answer wherever the walker is, so they never swap sides halfway).
    let free = true
    for (let at = along - halfAlong; at <= along + halfAlong && free; at += 0.5) free = !world.isSolid(ax + dx * at - dy * far * w.dir, ay + dy * at + dx * far * w.dir)
    best = free ? far : near
  }
  return best
}

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

/** Someone on the way nearest a random point `minR` to `maxR` meters from (cx, cy), walking either way, or towards (cx, cy) when `inbound`. */
export const spawnWalker = (world: World, id: number, cx: number, cy: number, minR: number, maxR: number, random: () => number, inbound = false): Walker | null => {
  for (let attempt = 0; attempt < 40; attempt++) {
    const a = random() * Math.PI * 2
    const r = minR + random() * (maxR - minR)
    const px = cx + Math.cos(a) * r
    const py = cy + Math.sin(a) * r
    const hit = world.roadAt(px, py, 15)
    if (hit === null || !WALKABLE.has(hit.road.kind)) continue
    const { seg: from, t, len } = nearestSegment(hit.road.pts, px, py)
    const [sx, sy, ex, ey] = hit.road.pts.slice(from * 2, from * 2 + 4)
    const towards = (cx - px) * ((ex ?? 0) - (sx ?? 0)) + (cy - py) * ((ey ?? 0) - (sy ?? 0)) >= 0
    const dir: 1 | -1 = (inbound ? towards : random() < 0.5) ? 1 : -1
    const curb: 1 | -1 = random() < 0.5 ? 1 : -1
    const w: Walker = {
      id,
      road: hit.index,
      from: dir === 1 ? from : from + 1,
      dir,
      s: (dir === 1 ? t : 1 - t) * len,
      side: lineAt(world, hit.index, from, dir === 1 ? 0 : 1, 1, curb * dir),
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

/**
 * Walking with `leader`: `k` places behind them on the same sidewalk, a little to the side, at their pace, so a group
 * keeps together like GTA 2's crowds. Null where that spot is inside a wall.
 */
export const companion = (world: World, leader: Walker, id: number, k: number, random: () => number): Walker | null => {
  const w: Walker = {
    ...leader,
    id,
    s: leader.s >= k * 1.1 ? leader.s - k * 1.1 : leader.s + k * 1.1,
    side: leader.side + (k % 2 === 0 ? 0.35 : -0.35) * (0.5 + random()),
    stride: random() * 10,
    tough: id % TOUGH === 0,
    vitals: vitals(PERSON_HP),
    sprite: PED_SPRITES[id % PED_SPRITES.length] ?? 1,
  }
  place(world, w)
  return world.isSolid(w.x, w.y) ? null : w
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

/**
 * Put someone who walked off the network (a cafe guest coming back out) onto
 * the nearest way where they stand, so they walk on from there; false when
 * no way is near.
 */
export const rejoin = (world: World, w: Walker): boolean => {
  const hit = world.roadAt(w.x, w.y, 15)
  if (hit === null || !WALKABLE.has(hit.road.kind)) return false
  const { pts } = hit.road
  let best = { d: Infinity, k: 0, t: 0, len: 1, dx: 1, dy: 0 }
  for (let k = 0; k + 1 < pts.length / 2; k++) {
    const [ax, ay] = vertex(pts, k)
    const [bx, by] = vertex(pts, k + 1)
    const len = Math.hypot(bx - ax, by - ay)
    if (len < 1e-6) continue
    const dx = (bx - ax) / len
    const dy = (by - ay) / len
    const t = Math.max(0, Math.min(len, (w.x - ax) * dx + (w.y - ay) * dy))
    const d = Math.hypot(ax + dx * t - w.x, ay + dy * t - w.y)
    if (d < best.d) best = { d, k, t, len, dx, dy }
  }
  const [ax, ay] = vertex(pts, best.k)
  // Heading the way they face; `place` turns the side offset with the direction, so it is the same either way.
  const dir: 1 | -1 = Math.cos(w.angle) * best.dx + Math.sin(w.angle) * best.dy >= 0 ? 1 : -1
  const offset = (w.x - ax) * -best.dy + (w.y - ay) * best.dx
  Object.assign(w, { road: hit.index, from: dir === 1 ? best.k : best.k + 1, dir, s: dir === 1 ? best.t : best.len - best.t, leg: best.len, side: offset })
  delete w.visit
  return true
}

/** A car that may run someone over: position, velocity. */
export type Threat = { readonly x: number; readonly y: number; readonly vx: number; readonly vy: number }

/** Walk on; step round parked cars; dodge sideways from a fast car coming at you; get knocked down if it hits. */
export const stepWalker = (world: World, w: Walker, threat: Threat | null, dt: number, random: () => number, cars: ReadonlyArray<Obstacle> = []): void => {
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
  const line = homeSide(world, w)
  const round = stepRound(world, w, line, cars)
  const home = round ?? line

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

  // Where they walked a step ago, which was clear: kept to fall back on if the sideways step runs into a bollard or a wall.
  let before = w.side
  if (w.panic > 0) {
    w.panic -= dt
    // Dodge away from the street's center line, out past the curb.
    const away = Math.sign(w.side || w.curb)
    w.side = Math.max(-(road.width / 2 + 5), Math.min(road.width / 2 + 5, w.side + away * 5 * dt))
  } else {
    // Quicker sideways round a parked car, so they are past its corner before they reach it.
    w.side += (home - w.side) * Math.min(1, dt * (round === null ? 1.5 : 4))
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
    const turn = w.dir
    Object.assign(w, nextLeg(world, w, random))
    w.side *= turn * w.dir
    before *= turn * w.dir
    const r = world.map.roads[w.road]
    if (r === undefined) break
    len = Math.hypot((r.pts[(w.from + w.dir) * 2] ?? 0) - (r.pts[w.from * 2] ?? 0), (r.pts[(w.from + w.dir) * 2 + 1] ?? 0) - (r.pts[w.from * 2 + 1] ?? 0))
    w.leg = len
  }
  place(world, w)
  // Run into a bollard or a wall: back to the clear offset of a step ago, or a little either side of it, nearer the
  // line first; on a narrow street with a wall right at the kerb, in toward the centre line. Never into a parked car:
  // with nowhere clear they keep the offset of a step ago.
  if (world.isSolid(w.x, w.y)) {
    const toward = Math.sign(homeSide(world, w) - before) || 1
    const clear = [0, 0.3, -0.3, 0.6, -0.6].map((n) => before + n * toward).concat(before * 0.5, before * 0.25, before * 0.125).find((side) => {
      w.side = side
      place(world, w)
      return !world.isSolid(w.x, w.y) && !cars.some((c) => inCar(c, w.x, w.y))
    })
    if (clear === undefined) {
      w.side = before
      place(world, w)
    }
  }
}
