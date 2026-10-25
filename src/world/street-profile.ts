/**
 * Street profiles: a real street's cross-section declared as data (one per
 * OSM way, world/places/streets.ts) instead of the class default every road
 * gets (carriageway by class, 2.6 m sidewalk, 0.3 m kerb). A profile names
 * its way, an origin on it and which way stations run; everything along it
 * is in (station, offset) meters: station along the centre line from the
 * origin, offset across it, + to the right of the + station direction on
 * the map (y down).
 *
 * Over a station range the profile replaces the drawn cross-section by bands
 * from the centre line out on each side (lanes, parking, a sett gutter, the
 * kerb, the pavement, a forecourt), the last one ending at the first building
 * ("facade"), so the bands tile kerb to facade and never run into a wall. It
 * also lays out what stands along the street: parked cars in the parking
 * bands (solid), bollards (solid), street trees, lamps, traffic signs, a
 * rounded kerb where a side street joins, paved plazas and lettering painted
 * on the asphalt.
 *
 * Only what is drawn and what is solid changes: the road's `width` (the lanes
 * the traffic drives, the line people walk, zebras and stop lines) stays as
 * OSM's class gives it.
 */
import type { GameMap, Road } from "#/map/types.ts"

export type BandKind = "lanes" | "parking" | "gutter" | "kerb" | "pavement" | "sidewalk" | "forecourt"

/** One band of a side: from the previous band's outer edge (the centre line for the first) out to `to` meters, or to the first building ("facade", at most the side's `reach`). */
export type Band = { readonly kind: BandKind; readonly to: number | "facade" }

/** A side's bands from the centre line out, and how far a "facade" band looks for a building. */
export type Side = { readonly bands: ReadonlyArray<Band>; readonly reach?: number }

/** The cross-section over stations `from`…`to` (either order). */
export type ProfileRange = { readonly from: number; readonly to: number; readonly right: Side; readonly left: Side }

export type SideName = "right" | "left"

/**
 * A German traffic sign on a grey pole at (x, y) map meters, its face turned to `facing` (radians on the map, the way
 * the face looks): `vz` the StVO number of the sign (its sprite in SIGN_SPRITES), `plates` the Zusatzzeichen under it,
 * top down, `flash` an amber flashing light on top (a zebra's).
 */
export type StreetSign = { readonly vz: string; readonly x: number; readonly y: number; readonly facing: number; readonly plates?: ReadonlyArray<string>; readonly flash?: boolean }

export type StreetProfile = {
  /** The OSM way (Road.id) and a readable name for it. */
  readonly way: number
  readonly name: string
  /** Station 0: the foot of this point on the centre line. */
  readonly origin: readonly [number, number]
  /** +1: stations grow along the way's node order, -1 against it. */
  readonly direction: 1 | -1
  readonly ranges: ReadonlyArray<ProfileRange>
  /** Stations without the solid edge lines the class paints (the dashed centre line stays). */
  readonly noEdgeLines?: readonly [number, number]
  /** Lamp posts with a curved arm over the road, every `every` meters on one side, `setback` behind the kerb face. */
  readonly lamps?: { readonly side: SideName; readonly from: number; readonly to: number; readonly every: number; readonly setback: number }
  /** Stretches of a side's parking band without parked cars (driveways, the player's car), besides the automatic gaps at zebras, corners and side roads. */
  readonly parkingGaps?: ReadonlyArray<{ readonly side: SideName; readonly from: number; readonly to: number }>
  /** Street trees at (s, n), crown radius r. */
  readonly trees?: ReadonlyArray<{ readonly s: number; readonly n: number; readonly r: number }>
  /** Rows of bollards at offset n from s0 to s1, one every `every` meters. */
  readonly bollards?: ReadonlyArray<{ readonly from: number; readonly to: number; readonly n: number; readonly every: number }>
  /** A side street joining at OSM node `node` on `side`: the kerb turns into it round a quarter of radius `radii[0]` on the + station corner, `radii[1]` on the − one. */
  readonly corners?: ReadonlyArray<{ readonly node: number; readonly side: SideName; readonly radii: readonly [number, number] }>
  /** Paved plazas, rings of (s, n). */
  readonly plazas?: ReadonlyArray<ReadonlyArray<readonly [number, number]>>
  /** Lettering painted on the asphalt: centred at (s, n), `length` along the street, reading towards + station when `up` is 1. */
  readonly paint?: ReadonlyArray<{ readonly sprite: "road-name"; readonly s: number; readonly n: number; readonly length: number; readonly up: 1 | -1 }>
  readonly signs?: ReadonlyArray<StreetSign>
}

/** A band as drawn: its inner and outer edges as polylines of the same length (map meters), and how it is textured. */
export type Strip = { readonly kind: BandKind; readonly inner: ReadonlyArray<number>; readonly outer: ReadonlyArray<number> }

export type ParkedCar = { readonly x: number; readonly y: number; readonly angle: number; readonly model: number; readonly paint: number }

/** A rounded kerb: the asphalt filling the corner (a fan from `corner`), and the kerb and gutter along the arc as strips. */
export type Fillet = { readonly asphalt: ReadonlyArray<number>; readonly kerb: Strip; readonly gutter: Strip }

/** A profile laid out on the map. */
export type StreetLayout = {
  readonly profile: StreetProfile
  /** The road in map.roads, and the stretch of its polyline (meters from its first node) the bands replace. */
  readonly road: number
  readonly spans: ReadonlyArray<readonly [number, number]>
  /** Stretches of the polyline without solid edge lines. */
  readonly noEdgeLines: ReadonlyArray<readonly [number, number]>
  /** The bands, cut in pieces of at most PIECE_M along the street. */
  readonly strips: ReadonlyArray<Strip>
  readonly fillets: ReadonlyArray<Fillet>
  readonly plazas: ReadonlyArray<ReadonlyArray<number>>
  readonly parked: ReadonlyArray<ParkedCar>
  readonly bollards: ReadonlyArray<{ readonly x: number; readonly y: number }>
  readonly trees: ReadonlyArray<{ readonly x: number; readonly y: number; readonly r: number }>
  readonly lamps: ReadonlyArray<{ readonly x: number; readonly y: number; readonly angle: number }>
  readonly signs: ReadonlyArray<StreetSign>
  readonly paint: ReadonlyArray<{ readonly sprite: "road-name"; readonly x: number; readonly y: number; readonly angle: number; readonly length: number }>
  /** What stands in the way: parked cars and bollards, as rings. */
  readonly solids: ReadonlyArray<ReadonlyArray<number>>
  /** The carriageway at station s: its edges (offsets of the kerb faces), or null outside the bands. */
  readonly carriageway: (s: number) => { readonly right: number; readonly left: number } | null
  /** Station and offset of a map point, and back. */
  readonly local: (x: number, y: number) => readonly [number, number]
  readonly world: (s: number, n: number) => readonly [number, number]
  /** The bands of a side at station s as [kind, inner, outer] intervals from the centre line out (offsets as positive meters). */
  readonly bandsAt: (s: number, side: SideName) => ReadonlyArray<readonly [BandKind, number, number]> | null
}

/** Strips are cut this long, so one never stretches a chunk's bounds far (scene.ts PIECE_M). */
export const PIECE_M = 32
/** A parked car's solid: a little inside the sprite, so traffic in the lane and people on the kerb line pass. */
export const PARKED = { length: 4.2, width: 1.7, pitch: 5.7, inset: 1.05 } as const
/** Bollards: square posts this wide; solid half a meter square, so a car's collision points (a meter apart across its nose) always meet one while people still walk between them. */
export const BOLLARD_M = 0.16
export const BOLLARD_SOLID_M = 0.5
/** The models a parked car can be (sim/vehicles.ts CAR_NAMES): no taxi, police, post van or bus. */
const PARKED_MODELS = [0, 1, 3, 4, 6, 0, 3, 1]
const PAINTS = 5
const CARRIAGEWAY: ReadonlySet<BandKind> = new Set(["lanes", "parking", "gutter"])
/** How far a facade band looks for a building when the side does not say. */
const REACH_M = 12
const SAMPLE_M = 1

/** Deterministic 0..1 hash (the same as scene.ts hash2). */
const hash2 = (x: number, y: number, salt: number) => {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(salt, 2246822519)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

type Polyline = { readonly pts: ReadonlyArray<number>; readonly at: ReadonlyArray<number>; readonly length: number }

const polyline = (pts: ReadonlyArray<number>): Polyline => {
  const at = [0]
  for (let k = 2; k + 1 < pts.length; k += 2) at.push((at[at.length - 1] ?? 0) + Math.hypot((pts[k] ?? 0) - (pts[k - 2] ?? 0), (pts[k + 1] ?? 0) - (pts[k - 1] ?? 0)))
  return { pts, at, length: at[at.length - 1] ?? 0 }
}

/** The point at `t` meters along, the unit direction there and (at a vertex) the miter: the normal's scale so offsets meet. */
const pointAt = (p: Polyline, t: number): { x: number; y: number; dx: number; dy: number; rx: number; ry: number } => {
  const n = p.at.length
  let i = 0
  while (i + 2 < n && (p.at[i + 1] ?? 0) < t) i++
  const seg = (k: number) => {
    const ax = p.pts[k * 2] ?? 0
    const ay = p.pts[k * 2 + 1] ?? 0
    const len = Math.max(1e-9, Math.hypot((p.pts[k * 2 + 2] ?? 0) - ax, (p.pts[k * 2 + 3] ?? 0) - ay))
    return { ax, ay, dx: ((p.pts[k * 2 + 2] ?? 0) - ax) / len, dy: ((p.pts[k * 2 + 3] ?? 0) - ay) / len }
  }
  const a = seg(i)
  const u = t - (p.at[i] ?? 0)
  const x = a.ax + a.dx * u
  const y = a.ay + a.dy * u
  // Right of the direction on the map (y down): (-dy, dx).
  let rx = -a.dy
  let ry = a.dx
  const at = (k: number) => p.at[k] ?? 0
  const corner = Math.abs(t - at(i + 1)) < 1e-6 && i + 2 < n ? seg(i + 1) : Math.abs(t - at(i)) < 1e-6 && i > 0 ? seg(i - 1) : null
  if (corner !== null) {
    const bx = -corner.dy
    const by = corner.dx
    const mx = rx + bx
    const my = ry + by
    const ml = Math.hypot(mx, my)
    if (ml > 1e-6) {
      const cos = (mx / ml) * rx + (my / ml) * ry
      rx = mx / ml / Math.max(0.5, cos)
      ry = my / ml / Math.max(0.5, cos)
    }
  }
  return { x, y, dx: a.dx, dy: a.dy, rx, ry }
}

/** Meters along the polyline of the foot of (x, y), and the signed offset (+ right). */
const project = (p: Polyline, x: number, y: number): readonly [number, number] => {
  let best = { d: Infinity, t: 0, off: 0 }
  for (let k = 0; k + 1 < p.at.length; k++) {
    const ax = p.pts[k * 2] ?? 0
    const ay = p.pts[k * 2 + 1] ?? 0
    const bx = p.pts[k * 2 + 2] ?? 0
    const by = p.pts[k * 2 + 3] ?? 0
    const len = Math.hypot(bx - ax, by - ay)
    if (len < 1e-9) continue
    const dx = (bx - ax) / len
    const dy = (by - ay) / len
    const u = Math.max(0, Math.min(len, (x - ax) * dx + (y - ay) * dy))
    const d = Math.hypot(ax + dx * u - x, ay + dy * u - y)
    if (d < best.d) best = { d, t: (p.at[k] ?? 0) + u, off: (x - ax) * -dy + (y - ay) * dx }
  }
  return [best.t, best.off]
}

/** Where two lines (point, direction) cross, or null when parallel. */
const cross = (ax: number, ay: number, adx: number, ady: number, bx: number, by: number, bdx: number, bdy: number): readonly [number, number] | null => {
  const det = adx * -bdy - ady * -bdx
  if (Math.abs(det) < 1e-9) return null
  const t = ((bx - ax) * -bdy - (by - ay) * -bdx) / det
  return [ax + adx * t, ay + ady * t]
}

const sign = (side: SideName) => (side === "right" ? 1 : -1)

/** A ring of four corners round (x, y): `hl` along `angle`, `hw` across. */
const rectRing = (x: number, y: number, angle: number, hl: number, hw: number): Array<number> => {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return [-1, 1, 1, -1].flatMap((f, i) => {
    const r = i < 2 ? -1 : 1
    return [x + c * f * hl - s * r * hw, y + s * f * hl + c * r * hw]
  })
}

export type LayoutQueries = {
  /** Is (x, y) inside a building (not a canopy)? */
  readonly isBuilding: (x: number, y: number) => boolean
}

/** Lay `profile` out on `map`; null when its way is not on the map. */
export const layoutStreet = (map: GameMap, profile: StreetProfile, q: LayoutQueries): StreetLayout | null => {
  const road = map.roads.findIndex((r) => r.id === profile.way)
  const r = map.roads[road]
  if (r === undefined) return null
  const line = polyline(r.pts)
  const [t0] = project(line, profile.origin[0], profile.origin[1])
  const dir = profile.direction
  /** Polyline meters of station s, and back. */
  const tOf = (s: number) => t0 + dir * s
  const sOf = (t: number) => (t - t0) * dir
  /** The frame at station s: point, + station direction and the + offset normal (mitered at vertices). */
  const frame = (s: number) => {
    const p = pointAt(line, Math.max(0, Math.min(line.length, tOf(s))))
    return { x: p.x, y: p.y, dx: p.dx * dir, dy: p.dy * dir, nx: p.rx * dir, ny: p.ry * dir }
  }
  const world = (s: number, n: number): readonly [number, number] => {
    const f = frame(s)
    return [f.x + f.nx * n, f.y + f.ny * n]
  }
  const local = (x: number, y: number): readonly [number, number] => {
    const [t, off] = project(line, x, y)
    return [sOf(t), off * dir]
  }
  const rangeAt = (s: number) => profile.ranges.find((g) => s >= Math.min(g.from, g.to) && s <= Math.max(g.from, g.to)) ?? null

  /** How far out from `n0` the first building is on a side at station s (at most `reach`). */
  const facade = (s: number, side: SideName, n0: number, reach: number) => {
    const k = sign(side)
    for (let n = Math.max(0, n0); n < reach; n += 0.1) {
      const [x, y] = world(s, n * k)
      if (q.isBuilding(x, y)) return Math.max(n0, n)
    }
    return Math.max(n0, reach)
  }
  const bandsAt = (s: number, side: SideName): ReadonlyArray<readonly [BandKind, number, number]> | null => {
    const g = rangeAt(s)
    if (g === null) return null
    const def = g[side]
    const out: Array<readonly [BandKind, number, number]> = []
    let n = 0
    for (const b of def.bands) {
      const to = b.to === "facade" ? facade(s, side, n, def.reach ?? REACH_M) : b.to
      out.push([b.kind, n, to])
      n = to
    }
    return out
  }
  const kerbFace = (s: number, side: SideName) => {
    const bands = bandsAt(s, side)
    if (bands === null) return null
    return bands.filter(([k]) => CARRIAGEWAY.has(k)).reduce((m, [, , to]) => Math.max(m, to), 0)
  }
  const carriageway = (s: number) => {
    const right = kerbFace(s, "right")
    const left = kerbFace(s, "left")
    return right === null || left === null ? null : { right, left }
  }

  // Side streets: where the kerb turns away (fillets), and the stretch of that side without kerb, pavement or parking.
  const cuts: Array<{ side: SideName; from: number; to: number }> = []
  const fillets: Array<Fillet> = []
  for (const c of profile.corners ?? []) {
    const vi = r.nodes.indexOf(c.node)
    const side = map.roads.find((o) => o !== r && o.nodes.includes(c.node))
    if (vi < 0 || side === undefined) continue
    const sNode = sOf(line.at[vi] ?? 0)
    const nodeX = r.pts[vi * 2] ?? 0
    const nodeY = r.pts[vi * 2 + 1] ?? 0
    // The side street's first segment away from the node.
    const si = side.nodes.indexOf(c.node)
    const ni = si === 0 ? 1 : si - 1
    const ox = (side.pts[ni * 2] ?? 0) - nodeX
    const oy = (side.pts[ni * 2 + 1] ?? 0) - nodeY
    const ol = Math.hypot(ox, oy) || 1
    const bdx = ox / ol
    const bdy = oy / ol
    const span: Array<number> = []
    for (const [which, radius] of [[1, c.radii[0]], [-1, c.radii[1]]] as const) {
      const fs = frame(sNode + which * 1.5)
      const k = sign(c.side)
      const face = kerbFace(sNode + which * 1.5, c.side) ?? r.width / 2
      // The main street's kerb line on that side, running away from the node towards this corner.
      const adx = fs.dx * which
      const ady = fs.dy * which
      const ax = nodeX + fs.nx * k * face
      const ay = nodeY + fs.ny * k * face
      // The side street's edge on this corner's side: its normal that points along +which station.
      let enx = -bdy
      let eny = bdx
      if (enx * fs.dx * which + eny * fs.dy * which < 0) {
        enx = -enx
        eny = -eny
      }
      const bx = nodeX + enx * (side.width / 2)
      const by = nodeY + eny * (side.width / 2)
      const p = cross(ax, ay, adx, ady, bx, by, bdx, bdy)
      if (p === null) continue
      const cos = adx * bdx + ady * bdy
      const theta = Math.acos(Math.max(-1, Math.min(1, cos)))
      const d = radius / Math.tan(theta / 2)
      const ta: readonly [number, number] = [p[0] + adx * d, p[1] + ady * d]
      const tb: readonly [number, number] = [p[0] + bdx * d, p[1] + bdy * d]
      const hx = adx + bdx
      const hy = ady + bdy
      const hl = Math.hypot(hx, hy) || 1
      const cx = p[0] + (hx / hl) * (radius / Math.sin(theta / 2))
      const cy = p[1] + (hy / hl) * (radius / Math.sin(theta / 2))
      const a0 = Math.atan2(ta[1] - cy, ta[0] - cx)
      let a1 = Math.atan2(tb[1] - cy, tb[0] - cx)
      while (a1 - a0 > Math.PI) a1 -= Math.PI * 2
      while (a0 - a1 > Math.PI) a1 += Math.PI * 2
      const steps = 10
      const arc = (rad: number) => Array.from({ length: steps + 1 }, (_, i) => [cx + Math.cos(a0 + ((a1 - a0) * i) / steps) * rad, cy + Math.sin(a0 + ((a1 - a0) * i) / steps) * rad]).flat()
      fillets.push({
        asphalt: [p[0], p[1], ...arc(radius)],
        kerb: { kind: "kerb", inner: arc(radius), outer: arc(Math.max(0.1, radius - 0.3)) },
        gutter: { kind: "gutter", inner: arc(radius + 0.4), outer: arc(radius) },
      })
      span.push(local(ta[0], ta[1])[0])
    }
    if (span.length === 2) cuts.push({ side: c.side, from: Math.min(span[0] ?? 0, span[1] ?? 0), to: Math.max(span[0] ?? 0, span[1] ?? 0) })
  }
  const cutAt = (s: number, side: SideName) => cuts.some((c) => c.side === side && s > c.from && s < c.to)

  // The bands, sampled every SAMPLE_M (and at the polyline's vertices) in pieces of at most PIECE_M.
  const strips: Array<Strip> = []
  const spans: Array<readonly [number, number]> = []
  const vertexS = line.at.map(sOf)
  for (const g of profile.ranges) {
    const s0 = Math.min(g.from, g.to)
    const s1 = Math.max(g.from, g.to)
    spans.push([Math.min(tOf(s0), tOf(s1)), Math.max(tOf(s0), tOf(s1))])
    for (let p0 = s0; p0 < s1 - 1e-6; p0 += PIECE_M) {
      const p1 = Math.min(s1, p0 + PIECE_M)
      const marks = new Set<number>([p0, p1])
      for (let s = p0; s < p1; s += SAMPLE_M) marks.add(s)
      for (const v of vertexS) if (v > p0 && v < p1) marks.add(v)
      for (const c of cuts) for (const e of [c.from, c.to]) if (e > p0 && e < p1) marks.add(e)
      const ss = [...marks].toSorted((a, b) => a - b)
      for (const side of ["right", "left"] as const) {
        const k = sign(side)
        const rows = ss.map((s) => ({ s, bands: bandsAt(s, side) ?? [] }))
        const kinds = rows[0]?.bands.map(([kind]) => kind) ?? []
        kinds.forEach((kind, bi) => {
          // Runs of samples where this band is drawn: not past the kerb face at a side street; the gutter turns to asphalt there.
          let run: Array<{ s: number; a: number; b: number }> = []
          const flush = (as: BandKind) => {
            if (run.length >= 2) {
              const inner = run.flatMap((p) => world(p.s, p.a * k))
              const outer = run.flatMap((p) => world(p.s, p.b * k))
              strips.push(side === "right" ? { kind: as, inner, outer } : { kind: as, inner: outer, outer: inner })
            }
            run = []
          }
          let mode: BandKind | null = null
          rows.forEach((row, ri) => {
            const band = row.bands[bi]
            if (band === undefined) return
            const midCut = ri + 1 < rows.length ? cutAt((row.s + (rows[ri + 1]?.s ?? row.s)) / 2, side) : cutAt((row.s + (rows[ri - 1]?.s ?? row.s)) / 2, side)
            const as: BandKind | null = midCut ? (CARRIAGEWAY.has(kind) ? "lanes" : null) : kind
            if (as !== mode) {
              const last = run[run.length - 1]
              if (mode !== null) flush(mode)
              // Keep the strips joined: the new run starts where the last one ended.
              if (as !== null && last !== undefined && last.s < row.s) run.push(last)
              mode = as
            }
            if (as !== null) run.push({ s: row.s, a: band[1], b: band[2] })
          })
          if (mode !== null) flush(mode)
        })
      }
    }
  }

  // Zebras on this road (OSM crossings within a meter of the centre line): no parked cars within 5 m.
  const zebraS = map.crossings.flatMap((c) => {
    const [s, n] = local(c.x, c.y)
    return Math.abs(n) < 1.5 ? [s] : []
  })
  // Roads meeting the street: their mouths keep clear of parked cars, the side by where they come from.
  const mouths: Array<{ side: SideName; s: number; half: number }> = []
  map.roads.forEach((o: Road) => {
    if (o === r || o.kind === "footway") return
    for (const e of [0, o.pts.length / 2 - 1]) {
      const [s, n] = local(o.pts[e * 2] ?? 0, o.pts[e * 2 + 1] ?? 0)
      if (Math.abs(n) > 12 || s < -400 || s > 400) continue
      const toward = local(o.pts[(e === 0 ? 1 : e - 1) * 2] ?? 0, o.pts[(e === 0 ? 1 : e - 1) * 2 + 1] ?? 0)[1]
      if (Math.abs(n) < 0.5 && Math.abs(toward) < 0.5) continue
      mouths.push({ side: (Math.abs(n) > 0.5 ? n : toward) > 0 ? "right" : "left", s, half: o.width / 2 + 1.5 })
    }
  })

  const parked: Array<ParkedCar> = []
  const solids: Array<Array<number>> = []
  for (const g of profile.ranges) {
    const s0 = Math.min(g.from, g.to)
    const s1 = Math.max(g.from, g.to)
    for (const side of ["right", "left"] as const) {
      const k = sign(side)
      const blocked = (s: number) =>
        zebraS.some((z) => Math.abs(z - s) < 5 + PARKED.length / 2) ||
        cuts.some((c) => c.side === side && s > c.from - 2 - PARKED.length / 2 && s < c.to + 2 + PARKED.length / 2) ||
        mouths.some((m) => m.side === side && Math.abs(m.s - s) < m.half + PARKED.length / 2) ||
        (profile.parkingGaps ?? []).some((gp) => gp.side === side && s > Math.min(gp.from, gp.to) - PARKED.length / 2 && s < Math.max(gp.from, gp.to) + PARKED.length / 2) ||
        (bandsAt(s, side)?.some(([kind]) => kind === "parking") ?? false) === false
      // Fill each free stretch from its end with cars a pitch apart.
      let s = s0 + PARKED.length / 2 + 0.6
      while (s <= s1 - PARKED.length / 2 - 0.6) {
        if (blocked(s - PARKED.length / 2) || blocked(s) || blocked(s + PARKED.length / 2)) {
          s += 0.5
          continue
        }
        const face = kerbFace(s, side) ?? 0
        const [x, y] = world(s, (face - PARKED.inset) * k)
        const f = frame(s)
        const i = parked.length
        const h = hash2(profile.way % 100000, i, 31)
        const angle = Math.atan2(f.dy, f.dx) + (side === "right" ? 0 : Math.PI) + (hash2(profile.way % 100000, i, 32) - 0.5) * 0.03
        parked.push({ x, y, angle, model: PARKED_MODELS[Math.floor(h * PARKED_MODELS.length)] ?? 0, paint: Math.floor(hash2(profile.way % 100000, i, 33) * PAINTS) })
        solids.push(rectRing(x, y, angle, PARKED.length / 2, PARKED.width / 2))
        s += PARKED.pitch + hash2(profile.way % 100000, i, 34) * 0.8
      }
    }
  }

  const bollards: Array<{ x: number; y: number }> = []
  for (const b of profile.bollards ?? []) {
    const lo = Math.min(b.from, b.to)
    const hi = Math.max(b.from, b.to)
    for (let s = lo; s <= hi + 1e-6; s += b.every) {
      const [x, y] = world(s, b.n)
      if (q.isBuilding(x, y)) continue
      bollards.push({ x, y })
      solids.push(rectRing(x, y, 0, BOLLARD_SOLID_M / 2, BOLLARD_SOLID_M / 2))
    }
  }

  const trees = (profile.trees ?? []).map((t) => {
    const [x, y] = world(t.s, t.n)
    return { x, y, r: t.r }
  })

  const lamps: Array<{ x: number; y: number; angle: number }> = []
  const lp = profile.lamps
  if (lp !== undefined) {
    const k = sign(lp.side)
    const lo = Math.min(lp.from, lp.to)
    const hi = Math.max(lp.from, lp.to)
    for (let s = hi; s >= lo; s -= lp.every) {
      // Clear of zebras, side streets and buildings: slide along a few meters if needed.
      const spot = [0, -3, 3, -6, 6].map((d) => s + d).find((c) => {
        if (c < lo || c > hi) return false
        if (zebraS.some((z) => Math.abs(z - c) < 6) || cutAt(c, lp.side) || mouths.some((m) => m.side === lp.side && Math.abs(m.s - c) < m.half + 2)) return false
        const face = kerbFace(c, lp.side) ?? r.width / 2
        const [x, y] = world(c, (face + 0.3 + lp.setback) * k)
        return !q.isBuilding(x, y)
      })
      if (spot === undefined) continue
      const face = kerbFace(spot, lp.side) ?? r.width / 2
      const [x, y] = world(spot, (face + 0.3 + lp.setback) * k)
      const [cx, cy] = world(spot, 0)
      lamps.push({ x, y, angle: Math.atan2(cy - y, cx - x) })
    }
  }

  const plazas = (profile.plazas ?? []).map((ring) => ring.flatMap(([s, n]) => world(s, n)))
  const paint = (profile.paint ?? []).map((p) => {
    const [x, y] = world(p.s, p.n)
    const f = frame(p.s)
    return { sprite: p.sprite, x, y, angle: Math.atan2(f.dy, f.dx) + (p.up === 1 ? 0 : Math.PI), length: p.length }
  })

  const edge = profile.noEdgeLines
  return {
    profile,
    road,
    spans,
    noEdgeLines: edge === undefined ? [] : [[Math.min(tOf(edge[0]), tOf(edge[1])), Math.max(tOf(edge[0]), tOf(edge[1]))]],
    strips,
    fillets,
    plazas,
    parked,
    bollards,
    trees,
    lamps,
    signs: profile.signs ?? [],
    paint,
    solids,
    carriageway,
    local,
    world,
    bandsAt,
  }
}
