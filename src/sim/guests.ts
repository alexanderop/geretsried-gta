/**
 * Cafe Waldmann's guests: passers-by who come up the path from the
 * Sudetenstraße sidewalk, through the door to the cake counter, buy a slice,
 * carry it through the dining room's doorway to a free chair and eat it,
 * maybe use the WC, and walk out again to carry on along the sidewalk. When
 * nothing is free they take it away. A shot or a bang sends them running
 * out. They are ordinary walkers with a `visit` (so bullets, cars and
 * explosions treat them like anyone), following fixed routes in the cafe's
 * frame; game.ts steps them here instead of along the sidewalk.
 */
import type { World } from "#/world/world.ts"
import { CHAIRS, DOOR, DOORWAY, PARTITION_U, TABLE_Z, WC, toLocal, toWorld, type Chair, type Frame } from "#/world/cafe.ts"
import { burnPerson, isDead, vitals, PERSON_HP } from "./damage.ts"
import { SHADES, kill, rejoin, type Walker } from "./pedestrians.ts"

type Point = readonly [u: number, n: number]

export type Visit = {
  phase: "enter" | "order" | "seat" | "eat" | "wc" | "toilet" | "leave"
  /** Waypoints in the cafe's frame still to walk, the next first. */
  route: Array<Point>
  /** Seconds left ordering, eating, or in the WC. */
  wait: number
  /** The chair they sit on (index into CHAIRS), or -1. */
  seat: number
  /** Carrying or eating a slice: where its plate is (on the table while they eat), for the renderer. */
  plate: { x: number; y: number; z: number } | null
  /** Which way along the sidewalk they leave. */
  readonly exit: 1 | -1
}

/** The sidewalk's middle in front of the cafe, the path to the door, the door from either side. */
const SIDEWALK_N = 5.3
const DOOR_U = (DOOR[0] + DOOR[1]) / 2
const ENTRY: Point = [DOOR_U, SIDEWALK_N]
const PATH_TOP: Point = [DOOR_U, 15.9]
const DOOR_IN: Point = [DOOR_U, 18.6]
/** Through the green doorway, and the aisle between the two rows of tables. */
const DOORWAY_MID: Point = [(PARTITION_U[0] + PARTITION_U[1]) / 2, (DOORWAY[0] + DOORWAY[1]) / 2 - 0.3]
const AISLE_N = 21.95
const AISLE_IN: Point = [1.2, AISLE_N]
/** The gaps between the table columns, where they turn to their chairs. */
const GAPS = [-5, -1.65, 1.2]
const WC_U = -0.9
const WC_IN: Point = [WC_U, 25.75]
const WC_FRONT: Point = [WC_U, 24.6]
/** Where they wait their turn at the counter, side by side by id. */
const queueSpot = (id: number): Point => [8.6 + (id % 3) * 0.55, 21.9]

const ORDER_S = 3
const WALK_IN = { cap: 6, every: [7, 15] } as const
/** Guests come while you are this close to the cafe; farther off nobody sees them. */
const NEAR_M = 120
const STRAY_M = 14

const gapFor = (c: Chair) => GAPS.reduce((best, g) => (Math.abs(g - c.u) < Math.abs(best - c.u) ? g : best), GAPS[0] ?? 0)
const toChair = (c: Chair): Array<Point> => [DOORWAY_MID, AISLE_IN, [gapFor(c), AISLE_N], [gapFor(c), c.n], [c.u, c.n]]
const fromChair = (c: Chair): Array<Point> => [[gapFor(c), c.n], [gapFor(c), AISLE_N]]
const outside = (exit: 1 | -1): Array<Point> => [DOOR_IN, PATH_TOP, ENTRY, [DOOR_U + exit * STRAY_M, SIDEWALK_N]]
const leaveFromDining: Array<Point> = [AISLE_IN, DOORWAY_MID]

/** The way out from wherever they are: from the WC, the dining room, the counter's side, or outside already. */
const wayOut = (u: number, n: number, exit: 1 | -1): Array<Point> => {
  const inWc = u > WC[0] && u < WC[1] && n > WC[2]
  if (inWc) return [WC_FRONT, [WC_U, AISLE_N], ...leaveFromDining, ...outside(exit)]
  if (n > 17 && u < PARTITION_U[0]) return [[u, AISLE_N], ...leaveFromDining, ...outside(exit)]
  if (n > 17) return outside(exit)
  return [ENTRY, [DOOR_U + exit * STRAY_M, SIDEWALK_N]]
}

const taken = (walkers: ReadonlyArray<Walker>): Set<number> => new Set(walkers.flatMap((w) => (w.visit !== undefined && w.visit.seat >= 0 && !w.dead ? [w.visit.seat] : [])))

/** Seconds until the next guest walks up, and a new one when it is time and there is room. */
export const stepArrivals = (world: World, game: { walkers: Array<Walker>; nextId: number; guestCooldown: number; readonly random: () => number }, player: { readonly x: number; readonly y: number }, dt: number): void => {
  const cafe = world.cafe
  if (cafe === null) return
  const f = cafe.frame
  if (Math.hypot(player.x - f.ox, player.y - f.oy) > NEAR_M) return
  game.guestCooldown -= dt
  if (game.guestCooldown > 0) return
  const [lo, hi] = WALK_IN.every
  game.guestCooldown = lo + game.random() * (hi - lo)
  if (game.walkers.filter((w) => w.visit !== undefined && !w.dead).length >= WALK_IN.cap) return
  const guest = arrive(world, f, game.nextId++, game.random)
  if (guest !== null) game.walkers.push(guest)
}

/** A passer-by on the sidewalk a little along the street, heading for the cafe. */
export const arrive = (world: World, f: Frame, id: number, random: () => number): Walker | null => {
  const from: 1 | -1 = random() < 0.5 ? 1 : -1
  const start: Point = [DOOR_U + from * STRAY_M, SIDEWALK_N]
  const [x, y] = toWorld(f, ...start)
  const road = world.roadAt(x, y, 15)
  if (road === null) return null
  return {
    id,
    road: road.index,
    from: 0,
    dir: 1,
    s: 0,
    side: 0,
    curb: 1,
    kind: "adult",
    pace: 1.1 + random() * 0.4,
    speed: 1.2,
    stop: null,
    calm: 60,
    shade: id % SHADES,
    x,
    y,
    angle: 0,
    stride: random() * 10,
    panic: 0,
    leg: 1,
    down: 0,
    dead: false,
    tough: false,
    vitals: vitals(PERSON_HP),
    sprite: 1 + (id % 3),
    visit: { phase: "enter", route: [ENTRY, PATH_TOP, DOOR_IN, queueSpot(id)], wait: 0, seat: -1, plate: null, exit: from === 1 ? -1 : 1 },
  }
}

/** One step of a guest's visit. Knocked down or dead, game.ts leaves them to stepWalker. */
export const stepGuest = (world: World, w: Walker, walkers: ReadonlyArray<Walker>, dt: number, random: () => number): void => {
  const v = w.visit
  const cafe = world.cafe
  if (v === undefined || cafe === null) return
  const f = cafe.frame
  if (w.vitals.fire > 0) {
    burnPerson(w.vitals, dt)
    if (isDead(w.vitals)) {
      kill(w)
      return
    }
    w.panic = Math.max(w.panic, 0.5)
  }
  if (w.panic > 0) {
    w.panic -= dt
    // Frightened: drop the cake and get out.
    if (v.phase !== "leave") {
      const [u, n] = toLocal(f, w.x, w.y)
      Object.assign(v, { phase: "leave", route: wayOut(u, n, v.exit), seat: -1, plate: null, wait: 0 })
    }
  }

  if (v.wait > 0) {
    v.wait -= dt
    if (v.wait > 0) return
    next(world, w, v, f, walkers, random)
    return
  }
  const target = v.route[0]
  if (target === undefined) {
    next(world, w, v, f, walkers, random)
    return
  }
  const [tx, ty] = toWorld(f, ...target)
  const dx = tx - w.x
  const dy = ty - w.y
  const d = Math.hypot(dx, dy)
  const speed = (w.panic > 0 ? 5 : w.pace) * dt
  if (d <= speed) {
    w.x = tx
    w.y = ty
    v.route.shift()
    if (v.route.length === 0) next(world, w, v, f, walkers, random)
  } else {
    w.x += (dx / d) * speed
    w.y += (dy / d) * speed
    const heading = Math.atan2(dy, dx)
    w.angle += Math.atan2(Math.sin(heading - w.angle), Math.cos(heading - w.angle)) * 0.25
  }
  w.stride += speed * 4
  if (v.plate !== null && v.phase === "seat") Object.assign(v.plate, { x: w.x + Math.cos(w.angle) * 0.4, y: w.y + Math.sin(w.angle) * 0.4, z: 1.3 })
}

const face = (w: Walker, f: Frame, along: number) => {
  w.angle = Math.atan2(f.uy, f.ux) + along
}

/** At the end of a route or a wait: what they do next. */
const next = (world: World, w: Walker, v: Visit, f: Frame, walkers: ReadonlyArray<Walker>, random: () => number) => {
  switch (v.phase) {
    case "enter":
      v.phase = "order"
      v.wait = ORDER_S
      face(w, f, Math.PI / 2)
      return
    case "order": {
      v.plate = { x: w.x, y: w.y, z: 1.3 }
      const busy = taken(walkers)
      const free = CHAIRS.map((_, i) => i).filter((i) => !busy.has(i))
      const seat = free[Math.floor(random() * free.length)]
      const chair = seat === undefined ? undefined : CHAIRS[seat]
      if (seat === undefined || chair === undefined) {
        // Nowhere to sit: a slice to take away.
        Object.assign(v, { phase: "leave", route: outside(v.exit) })
        return
      }
      Object.assign(v, { phase: "seat", seat, route: toChair(chair) })
      return
    }
    case "seat": {
      const chair = CHAIRS[v.seat]
      if (chair === undefined) return
      face(w, f, chair.facing)
      const [x, y] = toWorld(f, chair.u + Math.cos(chair.facing) * 0.5, chair.n + Math.sin(chair.facing) * 0.5)
      v.plate = { x, y, z: TABLE_Z + 0.02 }
      v.phase = "eat"
      v.wait = 20 + random() * 25
      return
    }
    case "eat": {
      const chair = CHAIRS[v.seat]
      v.plate = null
      const back = chair === undefined ? [] : fromChair(chair)
      if (random() < 0.35) Object.assign(v, { phase: "wc", seat: -1, route: [...back, [WC_U, AISLE_N], WC_FRONT, WC_IN] })
      else Object.assign(v, { phase: "leave", seat: -1, route: [...back, ...leaveFromDining, ...outside(v.exit)] })
      return
    }
    case "wc":
      v.phase = "toilet"
      v.wait = 6
      face(w, f, -Math.PI / 2)
      return
    case "toilet":
      Object.assign(v, { phase: "leave", route: wayOut(WC_IN[0], WC_IN[1], v.exit) })
      return
    case "leave":
      // Back on the sidewalk: on along it like anyone else.
      if (!rejoin(world, w)) delete w.visit
  }
}
