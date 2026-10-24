/**
 * Petrol stations at Geretsried's real `amenity=fuel` places: a flat canopy
 * on pillars over the pump islands (the OSM `building=roof` where it is
 * mapped, otherwise one laid out between the station and its street), the
 * kiosk (the mapped building next to it), a price sign at the street and an
 * air and water post. Pure: the same every game, for the sim and the renderer.
 *
 * The pump islands are explosive, as in GTA 2: shoot or ram one hard enough
 * and it goes up like a car, setting off the next.
 */
import type { World } from "#/world/world.ts"
import type { Poi } from "#/map/types.ts"
import { boxOf, centroid, longestEdgeAngle, pointInPolygon } from "#/world/geometry.ts"
import { polygonArea } from "#/map/build.ts"
import { DRIVABLE } from "#/world/world.ts"

export type Spot = { readonly x: number; readonly y: number; readonly angle: number }

export type Station = {
  readonly name: string
  /** The canopy's outline (open ring), and whether it is OSM's or laid out here. */
  readonly canopy: ReadonlyArray<number>
  readonly mapped: boolean
  /** The canopy's long axis. */
  readonly angle: number
  readonly pillars: ReadonlyArray<{ readonly x: number; readonly y: number }>
  /** Pump islands, along `angle`, ISLAND_M long. */
  readonly islands: ReadonlyArray<Spot>
  readonly pylon: Spot | null
  readonly air: Spot | null
  /** The kiosk: index of the map building with the shop, or -1. */
  readonly kiosk: number
  /** Index into the fascia colours: each station's own band, no brand. */
  readonly band: number
}

export const CANOPY_Z = 5
export const ISLAND_M = 4.6
export const ISLAND_W = 1.3
export const PILLAR_R = 0.25
/** Meters from the station's node within which a mapped canopy is its own. */
const CANOPY_REACH = 45
/** A canopy laid out where none is mapped: long side along the street. */
const LAID_OUT = { length: 13, depth: 8 } as const
const SIDEWALK_M = 2.6

/** The canopy in its own frame: u along the long axis, v across. */
const frame = (ring: ReadonlyArray<number>, angle: number) => {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  let minU = Infinity
  let maxU = -Infinity
  let minV = Infinity
  let maxV = -Infinity
  for (let i = 0; i + 1 < ring.length; i += 2) {
    const x = ring[i] ?? 0
    const y = ring[i + 1] ?? 0
    const u = x * c + y * s
    const v = -x * s + y * c
    minU = Math.min(minU, u)
    maxU = Math.max(maxU, u)
    minV = Math.min(minV, v)
    maxV = Math.max(maxV, v)
  }
  const at = (u: number, v: number) => ({ x: u * c - v * s, y: u * s + v * c })
  return { minU, maxU, minV, maxV, at }
}

/** A rectangle as an open ring. */
const rect = (cx: number, cy: number, angle: number, length: number, depth: number): Array<number> => {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const hl = length / 2
  const hd = depth / 2
  return [
    [-hl, -hd],
    [hl, -hd],
    [hl, hd],
    [-hl, hd],
  ].flatMap(([u = 0, v = 0]) => [cx + u * c - v * s, cy + u * s + v * c])
}

const openRing = (pts: ReadonlyArray<number>) => {
  const n = pts.length
  return n >= 4 && pts[0] === pts[n - 2] && pts[1] === pts[n - 1] ? pts.slice(0, n - 2) : [...pts]
}

/** Is a rectangle clear of buildings and water, and off the street? Sampled on a 1 m grid. */
const clear = (world: World, ring: ReadonlyArray<number>) => {
  const box = boxOf(ring)
  for (let y = box.minY; y <= box.maxY; y += 1)
    for (let x = box.minX; x <= box.maxX; x += 1) {
      if (!pointInPolygon(x, y, ring)) continue
      if (world.isSolid(x, y) || world.isWater(x, y)) return false
      const road = world.roadAt(x, y, 0)
      if (road !== null && DRIVABLE.has(road.road.kind)) return false
    }
  return true
}

/** The nearest point on the nearest drivable street (not the station's own service lanes), with its heading and width. */
const streetBy = (world: World, x: number, y: number) => {
  let best: { d: number; x: number; y: number; angle: number; width: number } | null = null
  for (const road of world.map.roads) {
    if (!DRIVABLE.has(road.kind)) continue
    const { pts } = road
    for (let i = 0; i + 3 < pts.length; i += 2) {
      const ax = pts[i] ?? 0
      const ay = pts[i + 1] ?? 0
      const bx = pts[i + 2] ?? 0
      const by = pts[i + 3] ?? 0
      if (Math.min(ax, bx) > x + 80 || Math.max(ax, bx) < x - 80 || Math.min(ay, by) > y + 80 || Math.max(ay, by) < y - 80) continue
      const len2 = (bx - ax) ** 2 + (by - ay) ** 2 || 1
      const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / len2))
      const px = ax + (bx - ax) * t
      const py = ay + (by - ay) * t
      const d = Math.hypot(px - x, py - y)
      if (best === null || d < best.d) best = { d, x: px, y: py, angle: Math.atan2(by - ay, bx - ax), width: road.width }
    }
  }
  return best
}

/** A canopy between the station and its street, its long side along the street, where the ground is free. */
const layOut = (world: World, poi: Poi): Array<number> | null => {
  const street = streetBy(world, poi.x, poi.y)
  if (street === null) return null
  // Away from the street, towards the station.
  let nx = poi.x - street.x
  let ny = poi.y - street.y
  const len = Math.hypot(nx, ny)
  if (len < 1e-3) {
    nx = -Math.sin(street.angle)
    ny = Math.cos(street.angle)
  } else {
    nx /= len
    ny /= len
  }
  const ax = Math.cos(street.angle)
  const ay = Math.sin(street.angle)
  for (const extra of [1.5, 3, 5, 8, 11]) {
    for (const shift of [0, 5, -5, 10, -10, 15, -15]) {
      const off = street.width / 2 + SIDEWALK_M + extra + LAID_OUT.depth / 2
      const ring = rect(street.x + nx * off + ax * shift, street.y + ny * off + ay * shift, street.angle, LAID_OUT.length, LAID_OUT.depth)
      if (clear(world, ring)) return ring
    }
  }
  // A forecourt off the street (an industrial yard): anywhere free near the station itself.
  for (let r = 0; r <= 24; r += 3) {
    for (let k = 0; k < (r === 0 ? 1 : 12); k++) {
      const a = (k / 12) * Math.PI * 2
      const ring = rect(poi.x + Math.cos(a) * r, poi.y + Math.sin(a) * r, street.angle, LAID_OUT.length, LAID_OUT.depth)
      if (clear(world, ring)) return ring
    }
  }
  return null
}

/** Pillars: the corners of the canopy inset a meter, and between them on a long side; only those under the roof. */
export const pillarsOf = (ring: ReadonlyArray<number>, angle: number) => {
  const f = frame(ring, angle)
  const us = [f.minU + 1, f.maxU - 1]
  if (f.maxU - f.minU > 16) us.push((f.minU + f.maxU) / 2)
  const vs = [f.minV + 1, f.maxV - 1]
  return us.flatMap((u) => vs.map((v) => f.at(u, v))).filter((p) => pointInPolygon(p.x, p.y, ring))
}

/** Pump islands in rows along the long axis, between the pillars, a car's width and more apart. */
const islandsOf = (ring: ReadonlyArray<number>, angle: number) => {
  const f = frame(ring, angle)
  const spanV = f.maxV - f.minV
  const spanU = f.maxU - f.minU
  const rows = Math.max(1, Math.min(3, Math.floor(spanV / 5)))
  const perRow = spanU > 14 ? 2 : 1
  const out: Array<Spot> = []
  for (let r = 0; r < rows; r++) {
    const v = f.minV + ((r + 0.5) / rows) * spanV
    for (let k = 0; k < perRow; k++) {
      const u = f.minU + ((k + 0.5) / perRow) * spanU
      const p = f.at(u, v)
      if (pointInPolygon(p.x, p.y, ring)) out.push({ ...p, angle })
    }
  }
  return out
}

/** The kiosk: the nearest small building (not a canopy) within 35 m. */
const kioskFor = (world: World, x: number, y: number) => {
  let best = { d: 35, i: -1 }
  world.map.buildings.forEach((b, i) => {
    if (b.canopy === true || polygonArea(b.pts) > 600) return
    const [cx, cy] = centroid(openRing(b.pts))
    const d = Math.hypot(cx - x, cy - y)
    if (d < best.d) best = { d, i }
  })
  return best.i
}

/** d meters from p towards q (away from it for negative d). */
const toward = (p: { x: number; y: number }, q: { x: number; y: number }, d: number) => {
  const l = Math.hypot(q.x - p.x, q.y - p.y) || 1
  return { x: p.x + ((q.x - p.x) / l) * d, y: p.y + ((q.y - p.y) / l) * d }
}

/** Every petrol station on the map. */
export const planStations = (world: World): Array<Station> => {
  const { map } = world
  const out: Array<Station> = []
  const used = new Set<number>()
  for (const poi of map.pois) {
    if (poi.kind !== "fuel") continue
    let canopy: Array<number> | null = null
    let mapped = false
    map.buildings.forEach((b, i) => {
      if (canopy !== null || b.canopy !== true || used.has(i)) return
      const ring = openRing(b.pts)
      const [cx, cy] = centroid(ring)
      if (Math.hypot(cx - poi.x, cy - poi.y) < CANOPY_REACH) {
        canopy = ring
        mapped = true
        used.add(i)
      }
    })
    canopy ??= layOut(world, poi)
    if (canopy === null) continue
    const ring: Array<number> = canopy
    const angle = longestEdgeAngle([...ring, ring[0] ?? 0, ring[1] ?? 0])
    const [cx, cy] = centroid(ring)
    const street = streetBy(world, cx, cy)
    const f = frame(ring, angle)
    // The price sign at the canopy corner nearest the street, on the street side; the air post at the far corner.
    const corners = [f.at(f.minU, f.minV), f.at(f.maxU, f.minV), f.at(f.maxU, f.maxV), f.at(f.minU, f.maxV)]
    const byStreet = street === null ? corners : corners.toSorted((a, b) => Math.hypot(a.x - street.x, a.y - street.y) - Math.hypot(b.x - street.x, b.y - street.y))
    const signAt = street === null || byStreet[0] === undefined ? null : toward(byStreet[0], street, 2.5)
    const far = byStreet.at(-1)
    const airAt = far === undefined ? null : toward(far, { x: cx, y: cy }, -1.5)
    const ok = (p: { x: number; y: number } | null) => p !== null && !world.isSolid(p.x, p.y) && world.roadAt(p.x, p.y, 0)?.road.kind !== "primary"
    out.push({
      name: poi.name,
      canopy: ring,
      mapped,
      angle,
      pillars: pillarsOf(ring, angle),
      islands: islandsOf(ring, angle),
      pylon: signAt !== null && ok(signAt) ? { ...signAt, angle: street?.angle ?? angle } : null,
      air: airAt !== null && ok(airAt) ? { ...airAt, angle } : null,
      kiosk: kioskFor(world, cx, cy),
      band: out.length,
    })
  }
  return out
}

/** A pump island in the game: it burns and blows up. */
export type Pump = Spot & {
  hp: number
  /** Seconds until it goes up, once it is past saving; null while it holds. */
  fuse: number | null
  dead: boolean
}

export const PUMP_HP = 70

export const pumpsOf = (stations: ReadonlyArray<Station>): Array<Pump> => stations.flatMap((s) => s.islands.map((i): Pump => ({ ...i, hp: PUMP_HP, fuse: null, dead: false })))

/** Damage to a pump; once it is out of hp it goes up a moment later. */
export const hurtPump = (p: Pump, amount: number, delay: number): void => {
  if (p.dead || p.fuse !== null) return
  p.hp -= amount
  if (p.hp <= 0) p.fuse = delay
}

/** The point of an island's spine nearest (x, y): what a car bumps into. */
export const nearestOnIsland = (p: Spot, x: number, y: number) => {
  const c = Math.cos(p.angle)
  const s = Math.sin(p.angle)
  const t = Math.max(-ISLAND_M / 2 + ISLAND_W / 2, Math.min(ISLAND_M / 2 - ISLAND_W / 2, (x - p.x) * c + (y - p.y) * s))
  return { x: p.x + c * t, y: p.y + s * t }
}
