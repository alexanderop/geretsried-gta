import type { Road } from "#/map/types.ts"
import { distToSegmentSq } from "#/world/geometry.ts"
import { DRIVABLE, type World } from "#/world/world.ts"
import { CAR_LENGTH, CAR_WIDTH, carOutline, type Car } from "./car.ts"
import { CAR_HP, vitals } from "./damage.ts"
import { makeSignals } from "./signals.ts"
import type { Game } from "./state.ts"

/**
 * Kerbside parking: slots along the town's streets where a car stands parallel to the kerb, worked out once per
 * world, and the parked cars kept in them near the player. A slot is filled or not by a hash of its id, so a street
 * looks the same each time you come back.
 */

/** A place at the kerb: the car's centre and heading. `id` is its index in `kerbSlots`, the same for the same map. */
export type Slot = { readonly id: number; readonly x: number; readonly y: number; readonly angle: number }

/** Streets people park along. Main roads keep their kerbs clear; service ways are yards and lots. */
const KINDS: ReadonlySet<string> = new Set(["residential", "living_street", "tertiary"])
/** One-way streets narrower than this have no room left beside the lane. */
const ONEWAY_MIN_W = 6
/** Meters between slot centres along the kerb. */
const EVERY_M = 6
/**
 * Meters from the moving lane's line to a parked car's centre: past traffic's look-ahead tolerance for something on
 * its path (PATH_HALF.car, 2.2 m, in game.ts), so cars drive by without stopping.
 */
export const LANE_CLEAR = 1.4 + CAR_WIDTH / 2
/** Meters of kerb left free either side of a junction or a dead end, a way split, a driveway, a bend. */
const JUNCTION_M = 12
const SPLIT_M = 10
const DRIVEWAY_M = 7
const BEND_M = 10
/** A turn at a vertex sharper than this (radians) bends the lane enough to matter. */
const BEND_RAD = 0.2
/** Meters around a zebra, a stop line, a traffic light, a bus stop. */
export const POINT_CLEAR_M = 12
const BUS_STOP_M = 15
/** Meters kept off a street profile's own stretch (it parks its own cars) and its parked cars. */
const PROFILE_M = 8
const CELL_M = 16
const cellOf = (x: number, y: number) => Math.floor(x / CELL_M) * 4096 + Math.floor(y / CELL_M)

/** How far from a street's centre line its parked cars stand: half on the kerb, LANE_CLEAR from the moving lane. */
export const kerbOffset = (road: Road): number => Math.max(road.width / 2 - CAR_WIDTH / 2, (road.oneway ? 0 : road.width / 4) + LANE_CLEAR)

const cache = new WeakMap<World, ReadonlyArray<Slot>>()

/** Every kerbside slot in town. */
export const kerbSlots = (world: World): ReadonlyArray<Slot> => {
  let slots = cache.get(world)
  if (slots === undefined) cache.set(world, (slots = makeSlots(world)))
  return slots
}

/** How many road ends meet at a node of the drivable network: 2 where a road passes through, 3 or more at a junction. */
const endsAt = (world: World, node: number) =>
  (world.junctions.get(node) ?? []).reduce((n, j) => {
    const last = (world.map.roads[j.road]?.nodes.length ?? 1) - 1
    return n + (j.vertex === 0 || j.vertex === last ? 1 : 2)
  }, 0)

const makeSlots = (world: World): Array<Slot> => {
  const { map } = world
  const signals = makeSignals(world)
  const points = [
    ...signals.zebras.map((z) => [z.x, z.y, POINT_CLEAR_M] as const),
    ...signals.stops.map((s) => [s.x, s.y, POINT_CLEAR_M] as const),
    ...signals.lights.map((l) => [l.x, l.y, POINT_CLEAR_M] as const),
    ...map.props.filter((p) => p.kind === "bus_stop").map((p) => [p.x, p.y, BUS_STOP_M] as const),
    ...map.buses.flatMap((l) => l.runs.flatMap((r) => r.stops.map((s) => [s.x, s.y, BUS_STOP_M] as const))),
    ...world.streets.flatMap((st) => st.parked.map((c) => [c.x, c.y, PROFILE_M] as const)),
    // Junctions of any street, also those of the street next door.
    ...map.roads.flatMap((r) => r.nodes.flatMap((node, i) => (endsAt(world, node) > 2 ? [[r.pts[i * 2] ?? 0, r.pts[i * 2 + 1] ?? 0, JUNCTION_M] as const] : []))),
  ]
  // Bucketed by CELL_M, which no clearance reaches past: a point is in one of the nine cells round a slot.
  const cells = new Map<number, Array<readonly [number, number, number]>>()
  for (const pt of points) {
    const key = cellOf(pt[0], pt[1])
    cells.set(key, [...(cells.get(key) ?? []), pt])
  }
  const nearPoint = (x: number, y: number) => {
    for (const dx of [-1, 0, 1]) for (const dy of [-1, 0, 1]) for (const [px, py, r] of cells.get(cellOf(x + dx * CELL_M, y + dy * CELL_M)) ?? []) if (Math.hypot(px - x, py - y) < r) return true
    return false
  }
  const out: Array<Slot> = []
  map.roads.forEach((road, ri) => {
    if (!KINDS.has(road.kind) || (road.oneway && road.width < ONEWAY_MIN_W)) return
    const offset = kerbOffset(road)
    // The car's road side must still be on the carriageway: no parking out on the pavement.
    if (offset - CAR_WIDTH / 2 > road.width / 2) return
    const count = road.pts.length / 2
    const station = [0]
    for (let i = 1; i < count; i++) station.push((station[i - 1] ?? 0) + Math.hypot((road.pts[i * 2] ?? 0) - (road.pts[i * 2 - 2] ?? 0), (road.pts[i * 2 + 1] ?? 0) - (road.pts[i * 2 - 1] ?? 0)))
    // Stretches of the road (stations) where nobody parks.
    const keepFree: Array<readonly [number, number]> = []
    const free = (at: number, m: number) => keepFree.push([at - m, at + m])
    for (let i = 0; i < count; i++) {
      const at = station[i] ?? 0
      const node = road.nodes[i]
      const ends = node === undefined ? 0 : endsAt(world, node)
      if (i === 0 || i === count - 1) free(at, ends === 2 ? SPLIT_M : JUNCTION_M)
      else if (ends > 2) free(at, JUNCTION_M)
      // A service way off the street is a driveway or a yard's gate.
      if (node !== undefined && (world.walkJunctions.get(node) ?? []).some((j) => j.road !== ri && map.roads[j.road]?.kind === "service")) free(at, DRIVEWAY_M)
      if (i > 0 && i < count - 1) {
        const a = Math.atan2((road.pts[i * 2 + 1] ?? 0) - (road.pts[i * 2 - 1] ?? 0), (road.pts[i * 2] ?? 0) - (road.pts[i * 2 - 2] ?? 0))
        const b = Math.atan2((road.pts[i * 2 + 3] ?? 0) - (road.pts[i * 2 + 1] ?? 0), (road.pts[i * 2 + 2] ?? 0) - (road.pts[i * 2] ?? 0))
        if (Math.abs(Math.atan2(Math.sin(b - a), Math.cos(b - a))) > BEND_RAD) free(at, BEND_M)
      }
    }
    for (const st of world.streets) if (st.road === ri) for (const [s0, s1] of st.spans) keepFree.push([s0 - PROFILE_M, s1 + PROFILE_M])
    for (let i = 0; i + 1 < count; i++) {
      const ax = road.pts[i * 2] ?? 0
      const ay = road.pts[i * 2 + 1] ?? 0
      const len = (station[i + 1] ?? 0) - (station[i] ?? 0)
      if (len < EVERY_M) continue
      const dx = ((road.pts[i * 2 + 2] ?? 0) - ax) / len
      const dy = ((road.pts[i * 2 + 3] ?? 0) - ay) / len
      const angle = Math.atan2(dy, dx)
      const n = Math.floor(len / EVERY_M)
      for (let k = 0; k < n; k++) {
        const t = (len - n * EVERY_M) / 2 + EVERY_M * (k + 0.5)
        const s = (station[i] ?? 0) + t
        // The whole car, not just its centre, clear of the free stretches.
        if (keepFree.some(([s0, s1]) => s + CAR_LENGTH / 2 > s0 && s - CAR_LENGTH / 2 < s1)) continue
        for (const side of [1, -1]) {
          // Right of the way's direction is +, as traffic keeps right.
          const x = ax + dx * t - dy * offset * side
          const y = ay + dy * t + dx * offset * side
          const slot: Slot = { id: out.length, x, y, angle: side === 1 ? angle : angle + Math.PI }
          if (nearPoint(x, y) || nearOwnRoad(road, i, x, y, offset)) continue
          if (!clear(world, slot, ri)) continue
          out.push(slot)
        }
      }
    }
  })
  return out
}

/** Does another stretch of the slot's own street (one that bends back on itself) come closer than the kerb offset? */
const nearOwnRoad = (road: Road, seg: number, x: number, y: number, offset: number) => {
  for (let j = 0; j + 1 < road.pts.length / 2; j++) {
    if (j === seg) continue
    const d = distToSegmentSq(x, y, road.pts[j * 2] ?? 0, road.pts[j * 2 + 1] ?? 0, road.pts[j * 2 + 2] ?? 0, road.pts[j * 2 + 3] ?? 0)
    if (d < (offset - 0.01) ** 2) return true
  }
  return false
}

/** A slot's car on the map, out of any wall, water and other street's carriageway. */
const clear = (world: World, slot: Slot, road: number) => {
  const car = parkedAt(slot, 0)
  const pts: Array<readonly [number, number]> = [[slot.x, slot.y], ...carOutline(car)]
  if (!pts.every(([x, y]) => x >= 0 && y >= 0 && x <= world.map.width && y <= world.map.height && !world.isSolid(x, y) && !world.isWater(x, y))) return false
  // The corners off every other street's carriageway.
  return pts.slice(1, 5).every(([x, y]) => {
    const on = world.roadAt(x, y, 0)
    return on === null || on.index === road || !DRIVABLE.has(on.road.kind)
  })
}

/** Car sprites people park: everything but the police car and the bus (see vehicles.ts). */
const MODELS = [0, 1, 2, 3, 4, 6, 7]

/** A number in [0, 1) from an integer, the same each time (a 32-bit integer hash). */
export const hash01 = (n: number): number => {
  let t = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b)
  t ^= t >>> 13
  t = Math.imul(t, 0xc2b2ae35)
  t ^= t >>> 16
  return (t >>> 0) / 4294967296
}

/** Share of slots with a car in them. */
export const FILL = 0.45
export const isFilled = (slot: Slot) => hash01(slot.id) < FILL

/** The car that parks in a slot: its model from the slot's hash. */
const parkedAt = (slot: Slot, model: number): Car => ({ x: slot.x, y: slot.y, angle: slot.angle, vx: 0, vy: 0, model, vitals: vitals(CAR_HP) })
export const carFor = (slot: Slot): Car => parkedAt(slot, MODELS[Math.floor(hash01(slot.id + 0x51ed27) * MODELS.length)] ?? 0)

/** Kerbside cars kept around the player at most, and how far off they go (beyond the view, which is about 140 m). */
export const PARKED_COUNT = 60
export const PARK_FAR = 220
/** A kerbside car this far off is out of sight (the renderer draws to 140 m): it may give way to a nearer slot. */
const OUT_OF_VIEW_M = 140

/** Is the car still standing where it was parked (not taken and driven off)? */
const inSlot = (car: Car, slot: Slot) => Math.abs(car.x - slot.x) < 0.5 && Math.abs(car.y - slot.y) < 0.5

/** Is something with its centre at (x, y) where a car in this slot would stand? */
const inSlotRect = (slot: Slot, x: number, y: number) => {
  const fx = Math.cos(slot.angle)
  const fy = Math.sin(slot.angle)
  const along = (x - slot.x) * fx + (y - slot.y) * fy
  const across = -(x - slot.x) * fy + (y - slot.y) * fx
  return Math.abs(along) < CAR_LENGTH + 0.4 && Math.abs(across) < CAR_WIDTH + 0.2
}

/** The kerbside cars still standing in their slots. */
export const kerbCars = (world: World, game: Game): Set<Car> => {
  const slots = kerbSlots(world)
  const out = new Set<Car>()
  for (const [id, car] of game.kerb) {
    const slot = slots[id]
    if (slot !== undefined && inSlot(car, slot) && game.parked.includes(car)) out.add(car)
  }
  return out
}

/**
 * Keep the slots between `minR` and PARK_FAR of (x, y) filled, nearest first, up to PARKED_COUNT cars: when that many
 * stand, one out of view and farther off makes room for a nearer one. A slot once filled is remembered while in
 * range: if its car is taken or burnt, it stays empty until the player has been far away. Kerbside cars left out of
 * range go (a car the player drove off is not one any more).
 */
export const fillKerbs = (world: World, game: Game, x: number, y: number, minR: number): void => {
  const slots = kerbSlots(world)
  const target = game.jobs.active?.target
  const dist = (o: { readonly x: number; readonly y: number }) => Math.hypot(o.x - x, o.y - y)
  const gone = new Set<object>()
  for (const [id, car] of game.kerb) {
    const slot = slots[id]
    if (slot !== undefined && dist(slot) < PARK_FAR) continue
    game.kerb.delete(id)
    if (car !== target && slot !== undefined && inSlot(car, slot)) gone.add(car)
  }
  const standing = [...game.kerb].filter(([id, car]) => {
    const slot = slots[id]
    return slot !== undefined && inSlot(car, slot) && !gone.has(car) && game.parked.includes(car)
  })
  // Farthest last, to give way first.
  standing.sort((a, b) => dist(a[1]) - dist(b[1]))
  const near: Array<{ readonly slot: Slot; readonly d: number }> = []
  for (const slot of slots) {
    if (Math.abs(slot.x - x) > PARK_FAR || Math.abs(slot.y - y) > PARK_FAR || !isFilled(slot) || game.kerb.has(slot.id)) continue
    const d = dist(slot)
    if (d >= minR && d < PARK_FAR) near.push({ slot, d })
  }
  near.sort((a, b) => a.d - b.d)
  const others = [...game.parked, ...game.npcs, ...game.cops.map((c) => c.car), ...game.wrecks, ...(game.player.car === null ? [] : [game.player.car])]
  for (const { slot, d } of near) {
    if (standing.length >= PARKED_COUNT) {
      const far = standing[standing.length - 1]
      if (far === undefined || far[1] === target || dist(far[1]) < Math.max(OUT_OF_VIEW_M, d + 20)) break
      standing.pop()
      game.kerb.delete(far[0])
      gone.add(far[1])
    }
    // Never on top of another car: one abandoned there, or traffic passing through.
    if (others.some((c) => !gone.has(c) && inSlotRect(slot, c.x, c.y))) continue
    const car = carFor(slot)
    game.parked.push(car)
    game.kerb.set(slot.id, car)
    standing.unshift([slot.id, car])
  }
  if (gone.size > 0) game.parked = game.parked.filter((c) => !gone.has(c))
}

/** Take the kerbside cars within `r` meters of (x, y) away (a job's car parks there); their slots stay empty while in range. */
export const clearKerb = (world: World, game: Game, x: number, y: number, r: number): void => {
  const away = new Set([...kerbCars(world, game)].filter((c) => Math.hypot(c.x - x, c.y - y) < r))
  if (away.size > 0) game.parked = game.parked.filter((c) => !away.has(c))
}
