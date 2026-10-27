/**
 * What passers-by do besides walking on, so a street reads as lived in: they stop at a shop's window and look in, go
 * into the shop (and are gone), come out of one onto the sidewalk, wait at a bus stop, or stand together chatting.
 * A group (companion in pedestrians.ts) does it together, after its first member. Joggers never stop. A car coming,
 * a shot or a knock ends it: they are back on the sidewalk and run like anyone (game.ts).
 */
import type { PoiKind, RoadKind } from "#/map/types.ts"
import { nearestSegment } from "#/world/geometry.ts"
import type { World } from "#/world/world.ts"
import { KINDS, dodge, inCar, rejoin, spawnWalker, type Obstacle, type Threat, type Walker } from "./pedestrians.ts"

/** The POIs people look into and go into: shops and counters, not offices, schools or doctors. */
const SHOP_KINDS: ReadonlySet<PoiKind> = new Set(["supermarket", "drugstore", "bakery", "pharmacy", "shop", "food", "bank", "post", "bar"])
/** A shop's POI this close: worth a look. POIs sit inside their buildings, often 10–20 m from the sidewalk. */
const SHOP_REACH = 22
/** Its wall at most this far from the sidewalk, with no carriageway between. */
const WALL_REACH = 9
/** A bus stop this close: worth waiting at. */
const BUS_REACH = 3.5
/** Of those passing a shop, this share goes in, and up to LOOK (cumulative) stops at the window. */
const GO_IN = 0.3
const LOOK = 0.75
/** Of those passing a bus stop, this share waits. */
const WAIT = 0.35
/** A group of people spawned together stands chatting this often. */
export const CHAT = 0.3
/** Seconds of calm after a stop (or a spot passed by), so nobody stops at every door. */
const CALM: readonly [number, number] = [25, 70]
const PASSED = 6
/** How close a group member must be to its first member to stop and go in with them. */
const GROUP_M = 6
const STEP_M = 0.4
/** A car standing still this close to someone who stands about (its turn may sweep their spot) makes them walk on: they make room, as people do. */
const ROOM_M = 9
/** Nobody stands about this close to a junction: a turning car's curve sweeps the corner's sidewalk. */
const CORNER_M = 12

type Spot = { readonly x: number; readonly y: number }

const CELL = 16
const key = (x: number, y: number) => Math.floor(y / CELL) * 4096 + Math.floor(x / CELL)

type Grid = { readonly spots: ReadonlyArray<Spot>; readonly cells: ReadonlyMap<number, ReadonlyArray<number>> }

const grid = (spots: ReadonlyArray<Spot>): Grid => {
  const cells = new Map<number, Array<number>>()
  spots.forEach((s, i) => {
    const k = key(s.x, s.y)
    const list = cells.get(k)
    if (list === undefined) cells.set(k, [i])
    else list.push(i)
  })
  return { spots, cells }
}

/** The nearest spot within `reach` of (x, y), or null. */
const nearest = (g: Grid, x: number, y: number, reach: number): Spot | null => {
  let best: Spot | null = null
  let bestD = reach
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++)
      for (const i of g.cells.get(key(x + dx * CELL, y + dy * CELL)) ?? []) {
        const s = g.spots[i]
        if (s === undefined) continue
        const d = Math.hypot(s.x - x, s.y - y)
        if (d < bestD) {
          bestD = d
          best = s
        }
      }
  return best
}

const cache = new WeakMap<World, { readonly shops: Grid; readonly busStops: Grid; readonly corners: Grid }>()

/** Where three or more stretches of drivable road meet. */
const corners = (world: World): Array<Spot> =>
  [...world.junctions.values()].flatMap((j) => {
    const first = j[0]
    const road = first === undefined ? undefined : world.map.roads[first.road]
    if (first === undefined || road === undefined) return []
    const arms = j.reduce((n, { road: ri, vertex }) => n + (vertex > 0 ? 1 : 0) + (vertex + 1 < (world.map.roads[ri]?.pts.length ?? 0) / 2 ? 1 : 0), 0)
    return arms >= 3 ? [{ x: road.pts[first.vertex * 2] ?? 0, y: road.pts[first.vertex * 2 + 1] ?? 0 }] : []
  })

const spotsOf = (world: World) => {
  let spots = cache.get(world)
  if (spots === undefined) {
    spots = {
      shops: grid(world.map.pois.filter((p) => SHOP_KINDS.has(p.kind))),
      busStops: grid(world.map.props.filter((p) => p.kind === "bus_stop")),
      corners: grid(corners(world)),
    }
    cache.set(world, spots)
  }
  return spots
}

/** Streets nobody crosses to reach a shop's door; car-park aisles, driveways and paths they do. */
const STREETS: ReadonlySet<RoadKind> = new Set(["primary", "secondary", "tertiary", "residential", "living_street"])

/** On a street's carriageway at (x, y) (not its sidewalk, not an aisle or a path). */
const onCarriageway = (world: World, x: number, y: number) => {
  const hit = world.roadAt(x, y, 12)
  // roadAt's distance is from the carriageway's edge: under 0 is on it.
  return hit !== null && STREETS.has(hit.road.kind) && hit.dist < 0
}

/**
 * Straight from (x, y) towards (tx, ty): the last free point before a wall, at most WALL_REACH on; null when no wall
 * comes, or a carriageway or a parked car does first (the shop is across the street, or a car stands in the way).
 */
const wallTowards = (world: World, x: number, y: number, tx: number, ty: number, cars: ReadonlyArray<Obstacle>): Spot | null => {
  const d = Math.hypot(tx - x, ty - y)
  if (d < 1e-6) return null
  const ux = (tx - x) / d
  const uy = (ty - y) / d
  let last: Spot | null = null
  for (let t = STEP_M; t <= WALL_REACH; t += STEP_M) {
    const px = x + ux * t
    const py = y + uy * t
    if (world.isSolid(px, py)) return last
    if (onCarriageway(world, px, py) || cars.some((c) => inCar(c, px, py))) return null
    last = { x: px, y: py }
  }
  return null
}

/** The way they face to look across their street: from their spot towards its centre line. */
const streetFace = (world: World, w: Walker): number => {
  const road = world.map.roads[w.road]
  const pts = road?.pts ?? []
  const ax = pts[w.from * 2] ?? 0
  const ay = pts[w.from * 2 + 1] ?? 0
  const bx = pts[(w.from + w.dir) * 2] ?? ax + 1
  const by = pts[(w.from + w.dir) * 2 + 1] ?? ay
  const len = Math.hypot(bx - ax, by - ay) || 1
  const dx = (bx - ax) / len
  const dy = (by - ay) / len
  // `place` puts them at (-dy, dx) × side × dir off the line: facing the line is the other way.
  const s = Math.sign(w.side * w.dir) || 1
  return Math.atan2(-dx * s, dy * s)
}

/** By a junction, where standing about would be in a turning car's way. */
export const atCorner = (world: World, x: number, y: number): boolean => nearest(spotsOf(world).corners, x, y, CORNER_M) !== null

const calmFor = (random: () => number) => CALM[0] + random() * (CALM[1] - CALM[0])

/** Free to stop now: on the network, on their feet, calm, not running, not a jogger. */
const free = (w: Walker) => !w.dead && w.down <= 0 && w.panic <= 0 && w.vitals.fire <= 0 && w.stop === null && w.errand === undefined && w.visit === undefined && w.kind !== "jogger"

/** The first member of a group decides for it; someone whose first member is gone decides for themselves. */
const leads = (w: Walker, byId: ReadonlyMap<number, Walker>) => w.group === undefined || w.group === w.id || !byId.has(w.group)

/**
 * Maybe stop where they are: wait at a bus stop facing the street, look in a shop's window, or go into the shop. One
 * roll per spot passed, then calm for a while.
 */
const consider = (world: World, w: Walker, random: () => number, cars: ReadonlyArray<Obstacle>) => {
  const { shops, busStops } = spotsOf(world)
  if (atCorner(world, w.x, w.y)) return
  if (nearest(busStops, w.x, w.y, BUS_REACH) !== null) {
    if (random() < WAIT) {
      w.stop = { left: 8 + random() * 22, face: streetFace(world, w) }
      w.calm = calmFor(random)
    } else w.calm = PASSED
    return
  }
  const shop = nearest(shops, w.x, w.y, SHOP_REACH)
  if (shop === null) return
  const wall = wallTowards(world, w.x, w.y, shop.x, shop.y, cars)
  if (wall === null) {
    w.calm = PASSED
    return
  }
  const r = random()
  if (r < GO_IN) w.errand = { phase: "in", tx: wall.x, ty: wall.y }
  else if (r < LOOK) w.stop = { left: 3 + random() * 6, face: Math.atan2(shop.y - w.y, shop.x - w.x) }
  w.calm = r < LOOK ? calmFor(random) : PASSED
}

/**
 * Every step after the walkers moved: those standing in a `waiting` car's way (one stopped in traffic) walk on, the
 * calm runs down, the free ones who lead may stop or go in, and the rest of a group follows its first member into a
 * stop or a shop.
 */
export const stepErrands = (
  world: World,
  walkers: ReadonlyArray<Walker>,
  random: () => number,
  dt: number,
  cars: ReadonlyArray<Obstacle> = [],
  waiting: ReadonlyArray<{ readonly x: number; readonly y: number }> = [],
): void => {
  const byId = new Map(walkers.map((w) => [w.id, w]))
  const near = (x: number, y: number) => waiting.some((c) => Math.abs(c.x - x) < ROOM_M && Math.abs(c.y - y) < ROOM_M && Math.hypot(c.x - x, c.y - y) < ROOM_M)
  for (const w of walkers) {
    if (w.stop !== null && near(w.x, w.y)) {
      w.stop = null
      w.calm = calmFor(random)
    }
    if (!free(w)) continue
    if (!leads(w, byId)) {
      const lead = byId.get(w.group ?? -1)
      if (lead === undefined || Math.hypot(lead.x - w.x, lead.y - w.y) > GROUP_M) continue
      if (lead.stop !== null) w.stop = { ...lead.stop, left: lead.stop.left + random() * 1.5 }
      else if (lead.errand?.phase === "in") w.errand = lead.errand
      continue
    }
    w.calm -= dt
    if (w.calm <= 0) consider(world, w, random, cars)
  }
}

/**
 * Walking a shop errand, straight and off the network: into the shop until they reach its wall (then gone), or out of
 * it to the sidewalk, where they walk on.
 */
export const stepErrand = (world: World, w: Walker, threat: Threat | null, dt: number): void => {
  const errand = w.errand
  if (errand === undefined || dodge(w, threat)) return
  const dx = errand.tx - w.x
  const dy = errand.ty - w.y
  const d = Math.hypot(dx, dy)
  w.speed += (w.pace - w.speed) * Math.min(1, dt * 2)
  const step = Math.min(d, w.speed * dt)
  const nx = w.x + (dx / (d || 1)) * step
  const ny = w.y + (dy / (d || 1)) * step
  if (errand.phase === "in" && (d < 0.3 || world.isSolid(nx, ny))) {
    w.gone = true
    return
  }
  if (errand.phase === "out" && d < 0.3) {
    delete w.errand
    rejoin(world, w)
    return
  }
  w.x = nx
  w.y = ny
  w.stride += step * KINDS[w.kind].stride
  const target = Math.atan2(dy, dx)
  w.angle += Math.atan2(Math.sin(target - w.angle), Math.cos(target - w.angle)) * 0.2
}

/** Back on the sidewalk where they stand, ending an errand: knocked down, scared or on fire. */
export const endErrand = (world: World, w: Walker): void => {
  if (w.errand === undefined) return
  delete w.errand
  if (!rejoin(world, w)) w.gone = true
}

/**
 * Someone coming out of a shop `minR` to `maxR` meters from (cx, cy): at the shop's wall facing the street, walking
 * out to the sidewalk. Null when no shop there has a wall on a walkway's side.
 */
export const shopLeaver = (world: World, id: number, cx: number, cy: number, minR: number, maxR: number, random: () => number, cars: ReadonlyArray<Obstacle> = []): Walker | null => {
  const shops = spotsOf(world).shops.spots.filter((s) => {
    const d = Math.hypot(s.x - cx, s.y - cy)
    return d >= minR && d <= maxR
  })
  const shop = shops[Math.floor(random() * shops.length)]
  if (shop === undefined) return null
  const hit = world.roadAt(shop.x, shop.y, 30)
  if (hit === null) return null
  const { seg, t } = nearestSegment(hit.road.pts, shop.x, shop.y)
  const pts = hit.road.pts
  const fx = (pts[seg * 2] ?? 0) + ((pts[seg * 2 + 2] ?? 0) - (pts[seg * 2] ?? 0)) * t
  const fy = (pts[seg * 2 + 1] ?? 0) + ((pts[seg * 2 + 3] ?? 0) - (pts[seg * 2 + 1] ?? 0)) * t
  const d = Math.hypot(shop.x - fx, shop.y - fy)
  if (d < 1e-6) return null
  // The sidewalk a meter past the kerb (a footpath's middle), on the shop's side of the way.
  const out = hit.road.kind === "footway" ? 0 : hit.road.width / 2 + 1
  const sx = fx + ((shop.x - fx) / d) * out
  const sy = fy + ((shop.y - fy) / d) * out
  const wall = wallTowards(world, sx, sy, shop.x, shop.y, cars)
  // Not out onto a junction's corner, into a turning car's way.
  if (wall === null || world.isSolid(sx, sy) || atCorner(world, sx, sy)) return null
  const w = spawnWalker(world, id, sx, sy, 0, 0, random)
  if (w === null) return null
  w.x = wall.x
  w.y = wall.y
  w.angle = Math.atan2(sy - wall.y, sx - wall.x)
  w.errand = { phase: "out", tx: sx, ty: sy }
  return w
}
