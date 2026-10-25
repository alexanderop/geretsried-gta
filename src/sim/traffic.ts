import type { World } from "#/world/world.ts"
import { lightFor, stopKey, type Signals } from "./signals.ts"
import { DRIVABLE } from "#/world/world.ts"
import { BUS_MODEL, POLICE_MODEL, vehicleLength } from "./vehicles.ts"
import { CAR_LENGTH } from "./car.ts"
import { DWELL_S, along, distanceToHalt, dropPassedHalts, legsAfter, nextBusLeg, type BusTrip, type Line } from "./transit.ts"
import { CAR_HP, vitals, type Vitals } from "./damage.ts"

/** One segment of a road as traffic drives it: from vertex `from` toward `from + dir`. */
export type Segment = { readonly road: number; readonly from: number; readonly dir: 1 | -1 }

/** An NPC car glued to the road graph. It drives from vertex `from` toward `from + dir`. */
export type Npc = {
  readonly id: number
  road: number
  from: number
  dir: 1 | -1
  /** meters travelled along the current segment */
  s: number
  speed: number
  x: number
  y: number
  angle: number
  /** The segment it came from (null after spawning or a bus's jump): its first meters bend out of that one. */
  prev: Segment | null
  /**
   * The segments it drives after this one, chosen ahead so it can brake for their bends and lights in time (empty:
   * a bus at its run's end). The last meters of this one bend into the first.
   */
  route: Array<Segment>
  readonly model: number
  readonly vitals: Vitals
  /** A bus follows its line (transit.ts) instead of turning at random, and stands at its stops. */
  readonly bus?: BusTrip
}

/** The nearest thing on the road ahead: the bumper-to-bumper gap (m) and how fast it moves along the road (m/s). */
export type Leader = { readonly gap: number; readonly speed: number }

/** Meters between a stopped car's centre and its stop line: half a car and a little air, so the bumper stays behind the line. */
const STOP_GAP = 2.6
/** A car takes a bend over this many meters either side of the vertex (at most half of each segment). */
const BEND_M = 6
/** Sideways acceleration a car takes a bend with, and the braking it slows down for one with (m/s²). */
const A_LAT = 4
const COMFY = 3
/** On yellow a car stops only if it can do so braking at most this hard (m/s²). */
const YELLOW_BRAKE = 5
/** Intelligent Driver Model: acceleration, comfortable braking (m/s²), gap at a standstill (m), time gap (s), hardest braking (m/s²). */
export const IDM = { a: 3, b: 4, s0: 2, t: 1.2, emergency: 9 } as const
/** Meters of road a car looks ahead for something in its way. */
export const LOOK_M = 60

const CRUISE: Readonly<Record<string, number>> = {
  primary: 14,
  secondary: 13,
  tertiary: 11,
  residential: 8,
  living_street: 4,
}

/** Car sprite indices for ordinary traffic; 5 is the police car, which shows up rarely. */
const CIVILIAN_MODELS = [0, 1, 2, 3, 4, 6, 7]
const modelFor = (id: number) => (id % 23 === 0 ? POLICE_MODEL : (CIVILIAN_MODELS[id % CIVILIAN_MODELS.length] ?? 0))

const vertex = (pts: ReadonlyArray<number>, i: number) => [pts[i * 2] ?? 0, pts[i * 2 + 1] ?? 0] as const

/** A segment's right-hand lane: where it starts, its direction and length. */
type Lane = { readonly x: number; readonly y: number; readonly dx: number; readonly dy: number; readonly len: number; readonly angle: number }

/** A number naming a segment, for the caches below. */
const segKey = (seg: Segment) => (seg.road * 8192 + seg.from) * 2 + (seg.dir === 1 ? 1 : 0)

/** Lanes and bends are pure geometry of the map: worked out once per world and kept. */
const lanes = new WeakMap<World, Map<number, Lane>>()
const bends = new WeakMap<World, Map<number, Map<number, Bend>>>()

const laneOf = (world: World, seg: Segment): Lane => {
  let cache = lanes.get(world)
  if (cache === undefined) lanes.set(world, (cache = new Map()))
  const key = segKey(seg)
  const hit = cache.get(key)
  if (hit !== undefined) return hit
  const lane = makeLane(world, seg)
  cache.set(key, lane)
  return lane
}

/** The bend from `seg` onto `next`. */
const bendBetween = (world: World, seg: Segment, next: Segment): Bend => {
  let all = bends.get(world)
  if (all === undefined) bends.set(world, (all = new Map()))
  let onto = all.get(segKey(seg))
  if (onto === undefined) all.set(segKey(seg), (onto = new Map()))
  const hit = onto.get(segKey(next))
  if (hit !== undefined) return hit
  const bend = bendOf(laneOf(world, seg), laneOf(world, next))
  onto.set(segKey(next), bend)
  return bend
}

const makeLane = (world: World, seg: Segment): Lane => {
  const road = world.map.roads[seg.road]
  const pts = road?.pts ?? []
  const [ax, ay] = vertex(pts, seg.from)
  const [bx, by] = vertex(pts, seg.from + seg.dir)
  const len = Math.hypot(bx - ax, by - ay)
  const dx = len > 0 ? (bx - ax) / len : 1
  const dy = len > 0 ? (by - ay) / len : 0
  // Keep right: offset to the right of travel direction.
  const lane = road === undefined || road.oneway ? 0 : road.width / 4
  return { x: ax - dy * lane, y: ay + dx * lane, dx, dy, len, angle: Math.atan2(dy, dx) }
}

const BEND_SAMPLES = 12

/**
 * The curve from one lane onto the next, from `before` meters ahead of the vertex on the first lane to `after`
 * meters past it on the second: a quadratic Bézier whose control point is where the two lanes cross, kept as the
 * equal cubic. Where that point is no good (hardly a turn, a U-turn, lanes crossing outside the curve) it is a cubic
 * that leaves and joins each lane along it. `arc` is its length at each of BEND_SAMPLES steps.
 */
type Bend = {
  readonly p: readonly [number, number, number, number, number, number, number, number]
  readonly before: number
  readonly after: number
  readonly arc: ReadonlyArray<number>
  /** The tightest radius on the curve (m), Infinity when it is straight. */
  readonly radius: number
  /** Meters driven on the curve per meter of `s` it spans. */
  readonly stretch: number
}

const cubic = (a: number, b: number, c: number, d: number, t: number) => (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t * t * c + t ** 3 * d
const cubicSlope = (a: number, b: number, c: number, d: number, t: number) => 3 * (1 - t) ** 2 * (b - a) + 6 * (1 - t) * t * (c - b) + 3 * t * t * (d - c)
const cubicBend = (a: number, b: number, c: number, d: number, t: number) => 6 * (1 - t) * (c - 2 * b + a) + 6 * t * (d - 2 * c + b)

const bendOf = (a: Lane, b: Lane): Bend => {
  const before = Math.min(BEND_M, a.len / 2)
  const after = Math.min(BEND_M, b.len / 2)
  const ex = a.x + a.dx * a.len
  const ey = a.y + a.dy * a.len
  const x0 = ex - a.dx * before
  const y0 = ey - a.dy * before
  const x3 = b.x + b.dx * after
  const y3 = b.y + b.dy * after
  const cross = a.dx * b.dy - a.dy * b.dx
  // Where the lanes cross, if that lies well between the curve's ends: the quadratic's control point.
  const wx = b.x - ex
  const wy = b.y - ey
  const t = Math.abs(cross) > 0.15 ? (wx * b.dy - wy * b.dx) / cross : NaN
  const u = Math.abs(cross) > 0.15 ? (wx * a.dy - wy * a.dx) / cross : NaN
  if (a.dx * b.dx + a.dy * b.dy > -0.7 && t > -0.75 * before && u < 0.75 * after) {
    const x1 = ex + a.dx * t
    const y1 = ey + a.dy * t
    // As far from the crossing on both lanes, so the curve is even and not sharp at one end.
    const arm = Math.min(t + before, after - u)
    const sx = x1 - a.dx * arm
    const sy = y1 - a.dy * arm
    const fx = x1 + b.dx * arm
    const fy = y1 + b.dy * arm
    // The quadratic as a cubic: its control points two thirds of the way to the quadratic's one.
    return bendFrom([sx, sy, sx + ((x1 - sx) * 2) / 3, sy + ((y1 - sy) * 2) / 3, fx + ((x1 - fx) * 2) / 3, fy + ((y1 - fy) * 2) / 3, fx, fy], arm - t, u + arm)
  }
  // Hardly a turn, a U-turn, or lanes that cross outside the curve: leave and join each lane along it.
  const chord = Math.hypot(x3 - x0, y3 - y0)
  const reach = Math.max(1, chord * (0.4 + 0.27 * Math.max(0, -(a.dx * b.dx + a.dy * b.dy))))
  return bendFrom([x0, y0, x0 + a.dx * reach, y0 + a.dy * reach, x3 - b.dx * reach, y3 - b.dy * reach, x3, y3], before, after)
}

const bendFrom = (p: Bend["p"], before: number, after: number): Bend => {
  const [px0, py0, px1, py1, px2, py2, px3, py3] = p
  const arc = [0]
  let radius = Infinity
  let lx = px0
  let ly = py0
  for (let i = 0; i <= BEND_SAMPLES; i++) {
    const t = i / BEND_SAMPLES
    const x = cubic(px0, px1, px2, px3, t)
    const y = cubic(py0, py1, py2, py3, t)
    if (i > 0) arc.push((arc[i - 1] ?? 0) + Math.hypot(x - lx, y - ly))
    lx = x
    ly = y
    // Curvature: |B'×B''| / |B'|³.
    const tx = cubicSlope(px0, px1, px2, px3, t)
    const ty = cubicSlope(py0, py1, py2, py3, t)
    const k = Math.abs(tx * cubicBend(py0, py1, py2, py3, t) - ty * cubicBend(px0, px1, px2, px3, t))
    if (k > 1e-9) radius = Math.min(radius, Math.hypot(tx, ty) ** 3 / k)
  }
  const length = arc[BEND_SAMPLES] ?? 0
  return { p, before, after, arc, radius, stretch: length > 1e-6 ? length / (before + after) : 1 }
}

/** How fast a car may take a bend (m/s). */
const bendSpeed = (bend: Bend) => Math.max(2, Math.sqrt(A_LAT * bend.radius))

/** How fast a car may drive from `seg` round the bend onto `next` (m/s). */
export const bendSpeedOnto = (world: World, seg: Segment, next: Segment): number => bendSpeed(bendBetween(world, seg, next))

/** The point and heading `u` meters (of `s`) into a bend, spaced by arc length so a car's speed holds on it; `until` and `len` as in `placeOn`. */
const onBend = (bend: Bend, u: number, until: number, len: number) => {
  const [x0, y0, x1, y1, x2, y2, x3, y3] = bend.p
  const length = bend.arc[BEND_SAMPLES] ?? 0
  const want = (Math.min(Math.max(u, 0), bend.before + bend.after) / (bend.before + bend.after || 1)) * length
  let i = 0
  while (i < BEND_SAMPLES - 1 && (bend.arc[i + 1] ?? 0) < want) i++
  const lo = bend.arc[i] ?? 0
  const hi = bend.arc[i + 1] ?? lo
  const t = (i + (hi > lo ? (want - lo) / (hi - lo) : 0)) / BEND_SAMPLES
  const angle = Math.atan2(cubicSlope(y0, y1, y2, y3, t), cubicSlope(x0, x1, x2, x3, t))
  return { x: cubic(x0, x1, x2, x3, t), y: cubic(y0, y1, y2, y3, t), angle, stretch: bend.stretch, until, bend: bend as Bend | null, len }
}

/**
 * Where a car `s` meters into `seg` is: on its lane, or on the bend out of `prev` (its first meters) or into `next`
 * (its last). `stretch` is meters driven per meter of `s` there and `until` the `s` where that stretch ends.
 */
const placeOn = (world: World, prev: Segment | null, seg: Segment, next: Segment | null, s: number) => {
  const lane = laneOf(world, seg)
  const into = next === null ? null : bendBetween(world, seg, next)
  const start = lane.len - (into?.before ?? 0)
  if (into !== null && s >= start) return onBend(into, s - start, lane.len, lane.len)
  if (prev !== null) {
    const bend = bendBetween(world, prev, seg)
    if (s < bend.after) return onBend(bend, bend.before + s, bend.after, lane.len)
  }
  return { x: lane.x + lane.dx * s, y: lane.y + lane.dy * s, angle: lane.angle, stretch: 1, until: start, bend: null as Bend | null, len: lane.len }
}

const segmentOf = (seg: Segment): Segment => ({ road: seg.road, from: seg.from, dir: seg.dir })

/** Where a car goes after reaching the vertex `seg` heads to. */
const nextLeg = (world: World, seg: Segment, random: () => number): Segment => {
  const road = world.map.roads[seg.road]
  const at = seg.from + seg.dir
  const node = road?.nodes[at]
  const options: Array<Segment> = []
  for (const j of (node === undefined ? undefined : world.junctions.get(node)) ?? []) {
    const r = world.map.roads[j.road]
    if (r === undefined) continue
    const count = r.pts.length / 2
    const sameWayBack = j.road === seg.road
    if (j.vertex + 1 < count && !(sameWayBack && seg.dir === -1)) options.push({ road: j.road, from: j.vertex, dir: 1 })
    if (j.vertex > 0 && !r.oneway && !(sameWayBack && seg.dir === 1)) options.push({ road: j.road, from: j.vertex, dir: -1 })
  }
  // Nobody turns right back (onto the other half of a dual carriageway, say) while there is another way.
  const lane = laneOf(world, seg)
  const onward = options.filter((o) => {
    const next = laneOf(world, o)
    return next.dx * lane.dx + next.dy * lane.dy > -0.7
  })
  const choices = onward.length > 0 ? onward : options
  const pick = choices[Math.floor(random() * choices.length)]
  if (pick !== undefined) return pick
  // Dead end: turn around (even on a one-way street, so nobody gets stuck).
  return { road: seg.road, from: at, dir: seg.dir === 1 ? -1 : 1 }
}

/** The map node at a segment's start, or at its end. */
const nodeAt = (world: World, seg: Segment, end: boolean) => world.map.roads[seg.road]?.nodes[seg.from + (end ? seg.dir : 0)]

/** Does the bus's next run start where this one ends (the way back from a turning loop), so it drives straight on? */
const runGoesOn = (world: World, trip: BusTrip) => {
  const last = trip.line.runs[trip.run]?.legs.at(-1)
  const first = trip.line.runs[(trip.run + 1) % trip.line.runs.length]?.legs[0]
  return last !== undefined && first !== undefined && nodeAt(world, last, true) !== undefined && nodeAt(world, last, true) === nodeAt(world, first, false)
}

/** A bus's route: its run's next legs, on into the next run where that starts where this one ends, to LOOK_M meters past this one. */
const planBus = (world: World, npc: Npc, trip: BusTrip) => {
  const legs = [...legsAfter(trip, 16)]
  const run = trip.line.runs[trip.run]
  if (run !== undefined && trip.leg + 1 + legs.length >= run.legs.length && runGoesOn(world, trip)) legs.push(...(trip.line.runs[(trip.run + 1) % trip.line.runs.length]?.legs.slice(0, 16) ?? []))
  npc.route = []
  let length = 0
  for (const leg of legs) {
    if (length > LOOK_M) break
    npc.route.push(segmentOf(leg))
    length += leg.len
  }
}

/** Pick the route at random on to LOOK_M meters past this segment. */
const plan = (world: World, npc: Npc, random: () => number) => {
  let length = npc.route.reduce((n, seg) => n + laneOf(world, seg).len, 0)
  while (npc.route.length === 0 || (length < LOOK_M && npc.route.length < 16)) {
    const seg = nextLeg(world, npc.route[npc.route.length - 1] ?? npc, random)
    npc.route.push(seg)
    length += laneOf(world, seg).len
  }
}

const place = (world: World, npc: Npc) => {
  const at = placeOn(world, npc.prev, npc, npc.route[0] ?? null, npc.s)
  npc.x = at.x
  npc.y = at.y
  npc.angle = at.angle
}

/** On to the next segment, with `s` already that far into it. */
const enterNext = (world: World, npc: Npc, len: number, random: () => number) => {
  npc.s = Math.max(0, npc.s - len)
  const trip = npc.bus
  if (trip === undefined) {
    const next = npc.route.shift() ?? nextLeg(world, npc, random)
    npc.prev = segmentOf(npc)
    Object.assign(npc, segmentOf(next))
    plan(world, npc, random)
  } else {
    const goesOn = runGoesOn(world, trip)
    const { leg, jumped } = nextBusLeg(trip)
    npc.prev = jumped && !goesOn ? null : segmentOf(npc)
    Object.assign(npc, segmentOf(leg))
    // Off the map's end and back in at the other: a new run, from rest.
    if (jumped && !goesOn) Object.assign(npc, { s: 0, speed: 0 })
    planBus(world, npc, trip)
  }
}

/** Move `meters` along the road, through bends and onto the following segments. */
const drive = (world: World, npc: Npc, meters: number, random: () => number) => {
  let left = meters
  for (let guard = 0; left > 1e-9 && guard < 32; guard++) {
    const here = placeOn(world, npc.prev, npc, npc.route[0] ?? null, npc.s)
    const room = Math.max(0, here.until - npc.s) * here.stretch
    if (left < room) {
      npc.s += left / here.stretch
      return
    }
    npc.s = here.until
    left -= room
    if (npc.s >= here.len) {
      const jumped = npc.bus !== undefined && npc.route.length === 0
      enterNext(world, npc, here.len, random)
      if (jumped && npc.prev === null) return
    }
  }
}

/**
 * The segments in front of a car, starting with its own: each with the one before and after it, and how far its
 * end is from the car (in meters of `s`), as far as its route goes.
 */
const ahead = (world: World, npc: Npc) => {
  const out: Array<{ readonly prev: Segment | null; readonly seg: Segment; readonly next: Segment | null; readonly lane: Lane; readonly toEnd: number }> = []
  let prev = npc.prev
  let seg: Segment = npc
  let toEnd = -npc.s
  for (let i = 0; i <= npc.route.length; i++) {
    const lane = laneOf(world, seg)
    toEnd += lane.len
    const next = npc.route[i] ?? null
    out.push({ prev, seg, next, lane, toEnd })
    if (next === null) break
    prev = seg
    seg = next
  }
  return out
}

/**
 * Points along the road in front of a car, up to `reach`: along its route, a few on each bend, as
 * [x, y, meters from the car, …]. Traffic looks along it for whatever is in its way.
 */
export const roadAhead = (world: World, npc: Npc, reach = LOOK_M): Array<number> => {
  const out = [npc.x, npc.y, 0]
  let d = 0
  for (const { prev, seg, next, lane } of ahead(world, npc)) {
    // Straight lanes need only their ends; bends a few points along them.
    const after = prev === null ? 0 : bendBetween(world, prev, seg).after
    const before = next === null ? 0 : bendBetween(world, seg, next).before
    const from = seg === npc ? npc.s : 0
    for (const s of [after / 2, after, lane.len - before, lane.len - before / 2, lane.len]) {
      if (s <= from + 0.01) continue
      const at = placeOn(world, prev, seg, next, s)
      const x = out[out.length - 3] ?? 0
      const y = out[out.length - 2] ?? 0
      if (Math.abs(at.x - x) + Math.abs(at.y - y) < 0.01) continue
      d += Math.hypot(at.x - x, at.y - y)
      out.push(at.x, at.y, d)
      if (d >= reach) return out
    }
  }
  return out
}

/** Intelligent Driver Model: the acceleration toward `v0`, `gap` meters behind a leader `dv` m/s slower. */
const idm = (v: number, v0: number, gap = Infinity, dv = 0) => {
  const free = 1 - (v / v0) ** 4
  if (gap === Infinity) return IDM.a * free
  const want = IDM.s0 + Math.max(0, v * IDM.t + (v * dv) / (2 * Math.sqrt(IDM.a * IDM.b)))
  return IDM.a * (free - (want / Math.max(gap, 0.01)) ** 2)
}

/**
 * Meters (of `s`) a car `toEnd` meters before the end of `seg` may still drive before it stands at that end's stop
 * line, or Infinity when it need not stop there. On yellow, only cars that can still stop do; a car already over
 * the line drives on.
 */
const redLight = (signals: Signals, time: number, seg: Segment, toEnd: number, v: number, model: number) => {
  const stop = signals.stopFor.get(stopKey(seg.road, seg.from + seg.dir, seg.dir))
  if (stop === undefined) return Infinity
  const toLine = toEnd - stop.back
  const spot = toLine - STOP_GAP - (vehicleLength(model) - CAR_LENGTH) / 2
  const state = lightFor(stop.light.junction, stop.heading, time)
  const stops = state === "red" || (state === "yellow" && (v * v) / (2 * YELLOW_BRAKE) < spot + 0.5)
  return stops && toLine > -0.5 ? Math.max(0, spot) : Infinity
}

/** A bus of `line` `fraction` of the way round its loop, standing still: the first ones are spread out, so they are far apart. */
export const spawnBus = (world: World, id: number, line: Line, fraction: number): Npc => {
  const at = along(line, fraction)
  const leg = line.runs[at.run]?.legs[at.leg]
  const npc: Npc = {
    id,
    road: leg?.road ?? 0,
    from: leg?.from ?? 0,
    dir: leg?.dir ?? 1,
    s: at.s,
    speed: 0,
    x: 0,
    y: 0,
    angle: 0,
    prev: null,
    route: [],
    model: BUS_MODEL,
    vitals: vitals(CAR_HP),
    bus: { line, run: at.run, leg: at.leg, halt: at.halt, dwell: 0 },
  }
  if (npc.bus !== undefined) planBus(world, npc, npc.bus)
  place(world, npc)
  return npc
}

/** Put an NPC on a random drivable segment whose midpoint is within `[minR, maxR]` of (cx, cy). */
export const spawnNpc = (world: World, id: number, cx: number, cy: number, minR: number, maxR: number, random: () => number): Npc | null => {
  for (let attempt = 0; attempt < 60; attempt++) {
    const angle = random() * Math.PI * 2
    const r = minR + random() * (maxR - minR)
    const hit = world.roadAt(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, 20)
    if (hit === null || !DRIVABLE.has(hit.road.kind)) continue
    const count = hit.road.pts.length / 2
    const from = Math.floor(random() * (count - 1))
    const dir: 1 | -1 = hit.road.oneway || random() < 0.5 ? 1 : -1
    const npc: Npc = {
      id,
      road: hit.index,
      from: dir === 1 ? from : from + 1,
      dir,
      s: 0,
      speed: 0,
      x: 0,
      y: 0,
      angle: 0,
      prev: null,
      route: [],
      model: modelFor(id),
      vitals: vitals(CAR_HP),
    }
    plan(world, npc, random)
    place(world, npc)
    return npc
  }
  return null
}

/**
 * Advance one NPC. It follows `leader` (the nearest thing in front along `roadAhead`) with the Intelligent Driver
 * Model, slows down in time for the bends on its route, and treats a red light or its bus stop as a car standing
 * at the stop point.
 */
export const stepNpc = (world: World, signals: Signals, time: number, npc: Npc, leader: Leader | null, dt: number, random: () => number): void => {
  const road = world.map.roads[npc.road]
  const cruise = CRUISE[road?.kind ?? "residential"] ?? 8
  const here = placeOn(world, npc.prev, npc, npc.route[0] ?? null, npc.s)
  const v = npc.speed
  const route = ahead(world, npc)
  // Red lights at the end of this segment or one further on: stop behind the white line.
  let stopAt = Infinity
  for (const { seg, toEnd } of route) if (toEnd < LOOK_M + 10) stopAt = Math.min(stopAt, redLight(signals, time, seg, toEnd, v, npc.model))
  // A bus brakes for its next stop, stands there for DWELL_S, then goes on to the one after.
  const trip = npc.bus
  if (trip !== undefined) {
    dropPassedHalts(trip)
    const toHalt = trip.dwell > 0 ? 0 : distanceToHalt(trip, npc.s)
    stopAt = Math.min(stopAt, Math.max(0, toHalt))
    if (trip.dwell > 0) {
      trip.dwell -= dt
      if (trip.dwell <= 0) {
        trip.dwell = 0
        trip.halt++
      }
    } else if (toHalt < 0.4 && v < 1.2) trip.dwell = DWELL_S
  }
  // On a bend, its speed; ahead of one, brake comfortably so as to reach it at that speed.
  const v0 = here.bend === null ? cruise : Math.min(cruise, bendSpeed(here.bend))
  let a = idm(v, v0, leader?.gap, v - (leader?.speed ?? 0))
  // A red light or a bus stop is a car standing at the stop point.
  if (stopAt !== Infinity) a = Math.min(a, idm(v, v0, stopAt + IDM.s0, v))
  for (const { seg, next, toEnd } of route) {
    if (next === null || toEnd - BEND_M > LOOK_M) continue
    const bend = bendBetween(world, seg, next)
    const toBend = toEnd - bend.before
    const vb = bendSpeed(bend)
    const need = toBend > 0 && v > vb ? (v * v - vb * vb) / (2 * toBend) : 0
    if (need >= COMFY) a = Math.min(a, -need)
  }
  npc.speed = Math.max(0, v + Math.max(a, -IDM.emergency) * dt)
  // Never through the stop line or into what is in front.
  const room = Math.min(stopAt, leader === null ? Infinity : Math.max(0, leader.gap - 0.1 + leader.speed * dt))
  let travel = npc.speed * dt
  if (travel > room) {
    travel = room
    npc.speed = room / dt
  }
  drive(world, npc, travel, random)
  place(world, npc)
}
