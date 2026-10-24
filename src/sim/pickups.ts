/**
 * Weapon, health and armour pickups, GTA 2 style: fixed spots round town that
 * you walk over to collect, back a minute later. The spots come from the map
 * alone (behind shops, in parks, on parking lots), so every game has the same.
 */
import type { World } from "#/world/world.ts"
import { pointInPolygon } from "#/world/geometry.ts"
import type { Gun } from "./weapons.ts"

export type PickupKind = Gun | "health" | "armour"

export type Pickup = {
  readonly kind: PickupKind
  readonly x: number
  readonly y: number
  /** Seconds until it is back; 0 while it lies there. */
  respawn: number
}

export const RESPAWN_S = 60
export const PICKUP_COUNT = 40
/** Meters you must come within to take one. */
export const REACH = 1.6
/** Two spots at least this far apart, so they spread over the town. */
const SPACING = 90

/** Every ten spots: pistols and health most often, the heavy weapons rarely, like GTA 2. */
const KINDS: ReadonlyArray<PickupKind> = ["pistol", "health", "smg", "shotgun", "armour", "pistol", "molotov", "health", "rocket", "flamer"]

type Spot = { readonly x: number; readonly y: number }

/** A stable pseudo-random order for spots, from their position. */
const hash = (s: Spot) => {
  let h = Math.imul(Math.round(s.x * 10), 0x9e3779b1) ^ Math.imul(Math.round(s.y * 10), 0x85ebca77)
  h = Math.imul(h ^ (h >>> 15), 0xc2b2ae3d)
  return (h ^ (h >>> 13)) >>> 0
}

/** A point you can stand on and that is not in the water: (x, y) itself, or the first free one on a small ring round it. */
/** Where a pickup would be hidden from the camera: under a tree crown, in the woods. */
export type Hidden = (x: number, y: number) => boolean

const standable = (world: World, x: number, y: number, hidden: Hidden): Spot | null => {
  for (const r of [0, 2, 4]) {
    for (let k = 0; k < (r === 0 ? 1 : 8); k++) {
      const a = (k / 8) * Math.PI * 2
      const px = x + Math.cos(a) * r
      const py = y + Math.sin(a) * r
      if (px > 0 && py > 0 && px < world.map.width && py < world.map.height && !world.isSolid(px, py) && !world.isWater(px, py) && world.areaAt(px, py) !== "forest" && !hidden(px, py)) return { x: px, y: py }
    }
  }
  return null
}

/** Behind a shop: from its door, away from the street it faces, past the building. */
const behindShop = (world: World, x: number, y: number, hidden: Hidden): Spot | null => {
  const road = world.roadAt(x, y, 40)
  if (road === null) return standable(world, x, y, hidden)
  const pts = road.road.pts
  let best = { d: Infinity, x, y }
  for (let i = 0; i + 1 < pts.length; i += 2) {
    const d = Math.hypot((pts[i] ?? 0) - x, (pts[i + 1] ?? 0) - y)
    if (d < best.d) best = { d, x: pts[i] ?? 0, y: pts[i + 1] ?? 0 }
  }
  const len = Math.hypot(x - best.x, y - best.y) || 1
  const ax = (x - best.x) / len
  const ay = (y - best.y) / len
  for (const back of [26, 20, 14, 9]) {
    const s = standable(world, x + ax * back, y + ay * back, hidden)
    if (s !== null) return s
  }
  return null
}

const centroid = (pts: ReadonlyArray<number>): Spot => {
  let x = 0
  let y = 0
  const n = pts.length / 2
  for (let i = 0; i + 1 < pts.length; i += 2) {
    x += pts[i] ?? 0
    y += pts[i + 1] ?? 0
  }
  return { x: x / n, y: y / n }
}

/** Candidate spots: behind shops and places, inside parks and pitches, on parking lots. */
const candidates = (world: World, hidden: Hidden): Array<Spot> => {
  const out: Array<Spot> = []
  for (const poi of world.map.pois) {
    if (poi.kind === "school" || poi.kind === "police") continue
    const s = behindShop(world, poi.x, poi.y, hidden)
    if (s !== null) out.push(s)
  }
  for (const area of world.map.areas) {
    if (area.kind !== "park" && area.kind !== "pitch" && area.kind !== "parking") continue
    const c = centroid(area.pts)
    // An L-shaped lot's centroid may lie outside it.
    if (!pointInPolygon(c.x, c.y, area.pts)) continue
    const s = standable(world, c.x, c.y, hidden)
    if (s !== null) out.push(s)
  }
  return out
}

/**
 * About PICKUP_COUNT pickups spread over the town, the same every game. The
 * spot nearest `start` is a pistol, so a new player finds a gun round the corner.
 * `hidden` keeps them out from under tree crowns, which the camera cannot see through.
 */
export const placePickups = (world: World, start: Spot, hidden: Hidden = () => false, count = PICKUP_COUNT): Array<Pickup> => {
  const all = candidates(world, hidden)
  const first = all.reduce<Spot | null>((best, s) => (best === null || Math.hypot(s.x - start.x, s.y - start.y) < Math.hypot(best.x - start.x, best.y - start.y) ? s : best), null)
  const ordered = all.toSorted((a, b) => hash(a) - hash(b))
  const chosen: Array<Spot> = first === null ? [] : [first]
  for (const s of ordered) {
    if (chosen.length >= count) break
    if (chosen.every((c) => Math.hypot(c.x - s.x, c.y - s.y) >= SPACING)) chosen.push(s)
  }
  return chosen.map((s, i) => ({ kind: KINDS[i % KINDS.length] ?? "pistol", x: s.x, y: s.y, respawn: 0 }))
}

export const isAvailable = (p: Pickup) => p.respawn <= 0

export const stepPickups = (pickups: ReadonlyArray<Pickup>, dt: number): void => {
  for (const p of pickups) if (p.respawn > 0) p.respawn = Math.max(0, p.respawn - dt)
}

/**
 * The pickup under (x, y) that `wants` says is any use (a full health bar
 * leaves the first-aid kit lying), now taken: back in RESPAWN_S.
 */
export const collect = (pickups: ReadonlyArray<Pickup>, x: number, y: number, wants: (kind: PickupKind) => boolean): Pickup | null => {
  for (const p of pickups) {
    if (!isAvailable(p) || Math.hypot(p.x - x, p.y - y) > REACH || !wants(p.kind)) continue
    p.respawn = RESPAWN_S
    return p
  }
  return null
}

/** GTA 2's hidden packages: tucked away behind shops and in parks, far apart; each pays once. */
export type Package = { readonly x: number; readonly y: number; found: boolean }

export const PACKAGE_COUNT = 10
export const PACKAGE_REWARD = 1000
const PACKAGE_SPACING = 350

/** The same PACKAGE_COUNT spots every game, chosen in another order than the pickups, away from them. */
export const placePackages = (world: World, pickups: ReadonlyArray<Spot>, hidden: Hidden = () => false): Array<Package> => {
  const ordered = candidates(world, hidden).toSorted((a, b) => (hash({ x: a.y, y: a.x }) % 9973) - (hash({ x: b.y, y: b.x }) % 9973))
  const chosen: Array<Spot> = []
  for (const s of ordered) {
    if (chosen.length >= PACKAGE_COUNT) break
    if (pickups.some((p) => Math.hypot(p.x - s.x, p.y - s.y) < 15)) continue
    if (chosen.every((c) => Math.hypot(c.x - s.x, c.y - s.y) >= PACKAGE_SPACING)) chosen.push(s)
  }
  return chosen.map((s) => ({ x: s.x, y: s.y, found: false }))
}
