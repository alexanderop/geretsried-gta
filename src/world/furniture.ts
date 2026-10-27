/**
 * Street furniture on the ground (V-11): where OSM's benches, litter bins, recycling points and bike racks stand.
 * OSM puts a bench's node a meter or two beside the path, often on it or in a hedge; here each piece is moved to the
 * nearest edge of a path (a footway's side, the back of a street's sidewalk, beside a service road) and turned to
 * face it, as long as that edge is within SNAP_M. A spot must be clear of buildings, water, carriageways, footways and
 * the furniture placed before it; the piece slides along the edge, then tries the far side and the next paths, then
 * its own OSM spot, and is left out where nothing fits. Never solid, like the bus shelters: nothing blocks a path.
 * Pure: the same every game.
 */
import type { Container, Prop, RoadKind } from "#/map/types.ts"
import { toWorld } from "./frame.ts"
import { boxOf, pointInPolygon } from "./geometry.ts"
import { Grid } from "./grid.ts"
import type { World } from "./world.ts"

export type FurnitureKind = "bench" | "bin" | "recycling" | "bike_rack"

/**
 * A piece of street furniture placed: its centre, `facing` the direction its front looks (radians, towards the path),
 * `along` and `depth` its footprint (meters along the path and towards it). A recycling point's containers stand in a
 * row along the path (`holds`, left to right seen from the path); a bike rack is `racks` racks side by side, under a
 * roof when `covered`.
 */
export type Furniture = {
  readonly kind: FurnitureKind
  readonly x: number
  readonly y: number
  readonly facing: number
  readonly along: number
  readonly depth: number
  readonly holds: ReadonlyArray<Container>
  readonly racks: number
  readonly covered: boolean
}

/** Each container's footprint, along the row and deep: a bottle bank (paper and cans in the same body), a clothes box, an 1100 L bin. */
export const CONTAINER_M: Readonly<Record<Container, readonly [number, number]>> = {
  glass: [1.6, 1.5],
  paper: [1.6, 1.5],
  cans: [1.6, 1.5],
  clothes: [1.2, 1.0],
  green: [1.37, 1.07],
}
/** Between two containers of a row. */
export const CONTAINER_GAP = 0.2
/** One bike rack (bike-rack.webp): three bikes, 1.34 m along the path, 1.9 m long (a bike) towards it. */
export const RACK_M = [1.34, 1.9] as const
/** Bikes per rack counted from OSM's capacity (racks are seldom full), and the most racks in a row. */
const BIKES_PER_RACK = 6
const MAX_RACKS = 4
/** A roof over covered bike racks reaches this far past them. */
export const RACK_ROOF_M = 0.3

/** Only snapped when a path's edge is this close; further out (a bench in a meadow) it keeps its OSM spot. */
export const SNAP_M = 10
/** Sidewalk width on each side of a street (scene.ts draws it). */
const SIDEWALK_M = 2.6
/** Kerb past the carriageway that counts as road too. */
const KERB_M = 0.3
/** How far round its OSM spot a piece that fits on no edge looks for room (meters, in 1 m rings). */
const AROUND_M = 8
/** How far a piece slides along the edge, either way, to find room (meters, in half-meter steps). */
const SLIDE_M = 4
/** The paths furniture snaps to and the ways a car drives on. */
const STREETS: ReadonlySet<RoadKind> = new Set(["primary", "secondary", "tertiary", "residential", "living_street"])
const ROADWAYS: ReadonlySet<RoadKind> = new Set([...STREETS, "service", "track"])

/** The footprint of a prop: along the path and towards it. */
const footprint = (p: Prop): readonly [number, number, ReadonlyArray<Container>, number] => {
  if (p.kind === "bench") return [1.8, 0.65, [], 0]
  if (p.kind === "bin") return [0.5, 0.5, [], 0]
  if (p.kind === "bike_rack") {
    const racks = Math.max(1, Math.min(MAX_RACKS, Math.ceil((p.capacity ?? BIKES_PER_RACK) / BIKES_PER_RACK)))
    const roof = p.covered === true ? RACK_ROOF_M * 2 : 0
    return [racks * RACK_M[0] + roof, RACK_M[1] + roof, [], racks]
  }
  const holds = p.holds ?? ["glass", "paper", "cans"]
  const along = holds.reduce((s, c) => s + CONTAINER_M[c][0], 0) + (holds.length - 1) * CONTAINER_GAP
  return [along, Math.max(...holds.map((c) => CONTAINER_M[c][1])), holds, 0]
}

/** A rectangle: centre, unit vector along it, half sizes. */
type Rect = { readonly x: number; readonly y: number; readonly ux: number; readonly uy: number; readonly ha: number; readonly hd: number }

/** Whether two rectangles overlap (separating axes). */
const overlaps = (a: Rect, b: Rect): boolean => {
  const axes = [
    [a.ux, a.uy],
    [-a.uy, a.ux],
    [b.ux, b.uy],
    [-b.uy, b.ux],
  ] as const
  const dx = b.x - a.x
  const dy = b.y - a.y
  return axes.every(([ax, ay]) => {
    const reach = (r: Rect) => r.ha * Math.abs(r.ux * ax + r.uy * ay) + r.hd * Math.abs(-r.uy * ax + r.ux * ay)
    return Math.abs(dx * ax + dy * ay) <= reach(a) + reach(b)
  })
}

/** Where a candidate spot lies off a path's centre line: on its edge outside it, or on the back of a street's sidewalk. */
type Edge = { readonly road: number; readonly k: number; readonly t: number; readonly d: number; readonly side: number; readonly edgeDist: number }

/**
 * The furniture props of the map placed on the ground. `blocked` are rectangles already taken (bus shelters,
 * signal poles), and so are the places' own props; what this places is added to them as it goes. Props inside an
 * area a ground dressing furnishes (places/: the Breslauer Weg playground) are left to it.
 */
export const placeFurniture = (world: World, blocked: ReadonlyArray<{ readonly x: number; readonly y: number; readonly angle: number; readonly length: number; readonly depth: number }> = []): Array<Furniture> => {
  const { map } = world
  const roadGrid = new Grid(map.width, map.height, 32)
  map.roads.forEach((r, i) => roadGrid.insert(i, boxOf(r.pts, r.width / 2 + SIDEWALK_M + 1)))
  const taken: Array<Rect> = blocked.map((b) => ({ x: b.x, y: b.y, ux: Math.cos(b.angle), uy: Math.sin(b.angle), ha: b.length / 2, hd: b.depth / 2 }))
  // The places' own free-standing props and signs (a sprite as a square as wide as it is long) are taken too.
  for (const { frame, dressing } of [...world.places, ...world.grounds]) {
    for (const part of dressing.parts) {
      if (part.kind !== "sprite" && part.kind !== "pylon") continue
      const [x, y] = toWorld(frame, part.u, part.n)
      const a = Math.atan2(frame.uy, frame.ux) + part.angle
      const [ha, hd] = part.kind === "sprite" ? [part.len / 2, part.len / 2] : [part.w / 2, part.d / 2]
      taken.push({ x, y, ux: Math.cos(a), uy: Math.sin(a), ha, hd })
    }
  }
  const dressed = world.grounds.flatMap((g) => {
    const a = map.areas[g.area]
    return a === undefined ? [] : [a.pts]
  })

  /** Every way within `reach` of (x, y): road index, segment, how far along it, distance and side of its centre line. */
  const near = (x: number, y: number, reach: number) => {
    const out: Array<{ road: number; k: number; t: number; d: number; side: number }> = []
    for (const i of roadGrid.query({ minX: x - reach, minY: y - reach, maxX: x + reach, maxY: y + reach })) {
      const r = map.roads[i]
      if (r === undefined) continue
      let best: { k: number; t: number; d: number; side: number } | null = null
      for (let k = 0; k + 3 < r.pts.length; k += 2) {
        const ax = r.pts[k] ?? 0
        const ay = r.pts[k + 1] ?? 0
        const bx = r.pts[k + 2] ?? 0
        const by = r.pts[k + 3] ?? 0
        const len2 = (bx - ax) ** 2 + (by - ay) ** 2
        if (len2 < 1e-6) continue
        const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / len2))
        const d = Math.hypot(ax + (bx - ax) * t - x, ay + (by - ay) * t - y)
        if (best === null || d < best.d) {
          // Left (+1) or right (−1) of the way's direction; y points south, so this is the cross product's sign.
          const cross = (bx - ax) * (y - ay) - (by - ay) * (x - ax)
          best = { k, t, d, side: cross >= 0 ? 1 : -1 }
        }
      }
      if (best !== null && best.d <= reach + r.width / 2 + SIDEWALK_M) out.push({ road: i, ...best })
    }
    return out
  }

  /** Whether (x, y) is on a carriageway (the class width, or a street profile's lanes and parking) or a footway. */
  const onWay = (x: number, y: number, footways: boolean) => {
    for (const w of near(x, y, 0)) {
      const r = map.roads[w.road]
      if (r === undefined) continue
      if (ROADWAYS.has(r.kind) && w.d < r.width / 2 + KERB_M) return true
      if (footways && r.kind === "footway" && w.d < r.width / 2) return true
    }
    for (const l of world.streets) {
      const [s, n] = l.local(x, y)
      const c = l.carriageway(s)
      if (c !== null && l.spans.some(([a, b]) => s >= a && s <= b) && (n >= 0 ? n < c.right + KERB_M : -n < c.left + KERB_M)) return true
    }
    return false
  }

  const fits = (rect: Rect, onSidewalk: boolean) => {
    const pts: Array<readonly [number, number]> = []
    for (const fa of [-1, 0, 1]) for (const fd of [-1, 0, 1]) pts.push([rect.x + rect.ux * rect.ha * fa - rect.uy * rect.hd * fd, rect.y + rect.uy * rect.ha * fa + rect.ux * rect.hd * fd])
    if (pts.some(([x, y]) => world.isSolid(x, y) || world.isWater(x, y) || onWay(x, y, false))) return false
    // The middle off any footway (unless it stands on a street's own sidewalk band), and clear of what stands already.
    if (!onSidewalk && onWay(rect.x, rect.y, true)) return false
    return !taken.some((t) => overlaps(t, rect))
  }

  const out: Array<Furniture> = []
  for (const p of map.props) {
    const kind = p.kind
    if (kind === "bus_stop") continue
    if (dressed.some((pts) => pointInPolygon(p.x, p.y, pts))) continue
    const [along, depth, holds, racks] = footprint(p)
    const ways = near(p.x, p.y, SNAP_M)
      .flatMap((w): Array<Edge> => {
        const r = map.roads[w.road]
        if (r === undefined) return []
        const e = r.width / 2 + (STREETS.has(r.kind) ? SIDEWALK_M : 0)
        return [{ ...w, edgeDist: Math.abs(w.d - e) }]
      })
      .toSorted((a, b) => a.edgeDist - b.edgeDist || a.road - b.road)
    const place = (rect: Rect, facing: number) => {
      taken.push(rect)
      out.push({ kind, x: rect.x, y: rect.y, facing, along, depth, holds, racks, covered: p.covered === true })
    }
    /** The rectangle at `off` meters from the way's centre line on `side`, slid `slide` meters along it. */
    const spotOn = (w: Edge, side: number, off: number, slide: number) => {
      const r = map.roads[w.road]
      const pts = r?.pts ?? []
      const ax = pts[w.k] ?? 0
      const ay = pts[w.k + 1] ?? 0
      const bx = pts[w.k + 2] ?? 0
      const by = pts[w.k + 3] ?? 0
      const len = Math.hypot(bx - ax, by - ay)
      const ux = (bx - ax) / len
      const uy = (by - ay) / len
      // Side +1 is where the cross product of the way's direction and the point is positive (near's `side`): (−uy, ux).
      const nx = -uy * side
      const ny = ux * side
      const cx = ax + (bx - ax) * w.t + ux * slide
      const cy = ay + (by - ay) * w.t + uy * slide
      return { rect: { x: cx + nx * off, y: cy + ny * off, ux, uy, ha: along / 2, hd: depth / 2 }, facing: Math.atan2(-ny, -nx) }
    }
    const tryEdge = (w: Edge, side: number) => {
      const r = map.roads[w.road]
      if (r === undefined) return false
      const street = STREETS.has(r.kind)
      const e = r.width / 2 + (street ? SIDEWALK_M : 0)
      // Outside the path's edge; on a street, else on the back of its sidewalk (small things only).
      const offsets: Array<readonly [number, boolean]> = [[e + depth / 2 + 0.15, false]]
      if (street && depth <= 1) offsets.push([e - depth / 2 - 0.1, true])
      for (const [off, onSidewalk] of offsets) {
        for (let s = 0; s <= SLIDE_M; s += 0.5) {
          for (const slide of s === 0 ? [0] : [s, -s]) {
            const { rect, facing } = spotOn(w, side, off, slide)
            if (fits(rect, onSidewalk)) {
              place(rect, facing)
              return true
            }
          }
        }
      }
      return false
    }
    const first = ways[0]
    // Snapped: the nearest edge on the piece's own side, then the far side, then the next paths.
    if (ways.filter((w) => w.edgeDist <= SNAP_M).slice(0, 3).some((w) => tryEdge(w, w.side) || tryEdge(w, -w.side))) continue
    // Out in the open, or nothing fitted on an edge (a car park, a crowded yard): its own OSM spot, else the nearest
    // free spot round it, facing the nearest path (else north).
    const facing = first === undefined ? -Math.PI / 2 : spotOn(first, first.side, first.d, 0).facing
    const ux = Math.cos(facing + Math.PI / 2)
    const uy = Math.sin(facing + Math.PI / 2)
    for (let ring = 0; ring <= AROUND_M; ring++) {
      const steps = ring === 0 ? 1 : ring * 8
      const spot = Array.from({ length: steps }, (_, i) => (i / steps) * Math.PI * 2)
        .map((a): Rect => ({ x: p.x + Math.cos(a) * ring, y: p.y + Math.sin(a) * ring, ux, uy, ha: along / 2, hd: depth / 2 }))
        .find((r) => fits(r, false))
      if (spot !== undefined) {
        place(spot, facing)
        break
      }
    }
  }
  return out
}
