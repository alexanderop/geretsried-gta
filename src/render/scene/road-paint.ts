/**
 * GTA 2's busy streets, in German: words painted on the lanes ("STOP" before
 * the lights, "BUS" at the stops, "30" where a residential street leaves a
 * main road, "LANGSAM" before schools and kindergartens), and the power and
 * phone lines on poles along the residential streets and across their
 * junctions, high enough to slide against the ground as the camera moves.
 * Pure: the same every game.
 */
import type { Road } from "#/map/types.ts"
import type { World } from "#/world/world.ts"
import type { StopLine, Zebra } from "#/sim/signals.ts"
import { SHADOW_DIR, SHADOW_PER_M } from "#/map/photo.ts"
import { MATERIAL_FILES, MeshBuilder, Mode, spriteQuad, type Rgba } from "./mesh.ts"
import { polylineLength } from "./geometry.ts"
import { column, type Placed } from "./street.ts"

/** The words, each one material layer after the files (textures.ts draws them). */
export const ROAD_WORDS = ["STOP", "BUS", "30", "LANGSAM"] as const
export type RoadWordText = (typeof ROAD_WORDS)[number]
export const wordLayer = (word: RoadWordText) => MATERIAL_FILES.length + ROAD_WORDS.indexOf(word)
/**
 * Each word's rows on its layer, top (the end towards where the driver goes) first: a long word goes in two, its
 * first half nearest the driver, so it is read in the order it comes, as road lettering is.
 */
export const WORD_ROWS: Readonly<Record<RoadWordText, ReadonlyArray<string>>> = { STOP: ["STOP"], BUS: ["BUS"], "30": ["30"], LANGSAM: ["SAM", "LANG"] }

/** A word on a lane, centred at (x, y), read by drivers heading `heading`, `across` the lane and `along` it. */
export type RoadWord = { readonly word: RoadWordText; readonly x: number; readonly y: number; readonly heading: number; readonly across: number; readonly along: number }

const PAINT: Rgba = [236, 234, 222, 255]
/** Over the lane markings (0.08), under the stop lines (0.085) and zebras. */
const WORD_Z = 0.083
/** Meters along the lane a word takes: road lettering is long, so a driver reads it at a slant. */
const ALONG = { STOP: 4.5, BUS: 4, "30": 3.6, LANGSAM: 8 } as const
const MAIN: ReadonlySet<string> = new Set(["primary", "secondary", "tertiary"])
const WHERE_KIDS: ReadonlySet<string> = new Set(["school", "kindergarten"])

/** Right of heading `h` (y points south). */
const right = (h: number): readonly [number, number] => [-Math.sin(h), Math.cos(h)]

/** The point `s` meters along polyline `pts` from its start, and its direction there. */
const along = (pts: ReadonlyArray<number>, s: number): { readonly x: number; readonly y: number; readonly angle: number } => {
  let left = s
  for (let i = 0; i + 3 < pts.length; i += 2) {
    const ax = pts[i] ?? 0
    const ay = pts[i + 1] ?? 0
    const bx = pts[i + 2] ?? 0
    const by = pts[i + 3] ?? 0
    const len = Math.hypot(bx - ax, by - ay)
    if (left <= len || i + 4 >= pts.length - 1) {
      const t = len === 0 ? 0 : Math.min(1, left / len)
      return { x: ax + (bx - ax) * t, y: ay + (by - ay) * t, angle: Math.atan2(by - ay, bx - ax) }
    }
    left -= len
  }
  return { x: pts[0] ?? 0, y: pts[1] ?? 0, angle: 0 }
}

/** The road `pts` reversed, so `along` measures from its far end. */
const reversed = (pts: ReadonlyArray<number>): Array<number> => {
  const out: Array<number> = []
  for (let i = pts.length - 2; i >= 0; i -= 2) out.push(pts[i] ?? 0, pts[i + 1] ?? 0)
  return out
}

/** A word in the right-hand lane of a two-way road `width` wide (the middle of a one-way one) at (x, y), heading `h`. */
const inLane = (word: RoadWordText, x: number, y: number, h: number, width: number, oneway: boolean): RoadWord => {
  const [rx, ry] = right(h)
  const off = oneway ? 0 : width / 4
  return { word, x: x + rx * off, y: y + ry * off, heading: h, across: Math.min(oneway ? width - 1.2 : width / 2 - 0.6, 2.8), along: ALONG[word] }
}

/**
 * Where the words go: STOP just before each stop line at the lights, BUS where the bus waits at each stop, 30 a little
 * into each residential street off a main road (Geretsried's Wohngebiete are Tempo-30 zones; the map has no
 * maxspeed), LANGSAM on both lanes 25 m either side of each school and kindergarten. None on a zebra or another word.
 */
export const roadWords = (world: World, stops: ReadonlyArray<StopLine>, zebras: ReadonlyArray<Zebra>, busStops: ReadonlyArray<Placed & { readonly angle: number }>): Array<RoadWord> => {
  const { map, junctions } = world
  const out: Array<RoadWord> = []
  const add = (w: RoadWord) => {
    const clear = (p: Placed, r: number) => Math.hypot(p.x - w.x, p.y - w.y) > r
    if (zebras.every((z) => clear(z, w.along / 2 + 2.5)) && out.every((o) => clear(o, (o.along + w.along) / 2 + 1)) && !world.isSolid(w.x, w.y)) out.push(w)
  }
  for (const st of stops) {
    const [rx, ry] = right(st.heading)
    const mid = (st.from + st.to) / 2
    const back = 1.5 + ALONG.STOP / 2
    const fx = Math.cos(st.heading)
    const fy = Math.sin(st.heading)
    add({ word: "STOP", x: st.x + rx * mid - fx * back, y: st.y + ry * mid - fy * back, heading: st.heading, across: Math.min(st.to - st.from - 0.4, 2.8), along: ALONG.STOP })
  }
  for (const stop of busStops) {
    // The prop faces the houses: traffic in the stop's lane drives the other way round.
    const h = stop.angle + Math.PI
    const road = world.roadAt(stop.x, stop.y, 15)
    if (road === null) continue
    const [rx, ry] = right(h)
    // From the H pole at the kerb in to the lane's middle, and back to where the bus stands.
    const inward = 0.45 + road.road.width / 4
    const across = Math.min(road.road.width / 2 - 0.6, 2.8)
    add({ word: "BUS", x: stop.x - rx * inward - Math.cos(h) * 6, y: stop.y - ry * inward - Math.sin(h) * 6, heading: h, across, along: ALONG.BUS })
  }
  map.roads.forEach((r: Road) => {
    if (r.kind !== "residential" || polylineLength(r.pts) < 30) return
    for (const end of [0, r.nodes.length - 1]) {
      const meet = junctions.get(r.nodes[end] ?? -1) ?? []
      if (!meet.some((j) => MAIN.has(map.roads[j.road]?.kind ?? ""))) continue
      // Driving in from the main road: measured from this end.
      const p = along(end === 0 ? r.pts : reversed(r.pts), 12)
      if (r.oneway && end !== 0) continue
      add(inLane("30", p.x, p.y, p.angle, r.width, r.oneway))
    }
  })
  for (const poi of map.pois) {
    if (!WHERE_KIDS.has(poi.kind)) continue
    let best: { readonly r: Road; readonly s: number; readonly d: number } | null = null
    for (const r of map.roads) {
      if (!MAIN.has(r.kind) && r.kind !== "residential") continue
      let s = 0
      for (let i = 0; i + 3 < r.pts.length; i += 2) {
        const ax = r.pts[i] ?? 0
        const ay = r.pts[i + 1] ?? 0
        const dx = (r.pts[i + 2] ?? 0) - ax
        const dy = (r.pts[i + 3] ?? 0) - ay
        const len = Math.hypot(dx, dy)
        const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((poi.x - ax) * dx + (poi.y - ay) * dy) / (len * len)))
        const d = Math.hypot(ax + dx * t - poi.x, ay + dy * t - poi.y)
        if (d < 60 && (best === null || d < best.d)) best = { r, s: s + t * len, d }
        s += len
      }
    }
    if (best === null) continue
    const total = polylineLength(best.r.pts)
    for (const dir of best.r.oneway ? [1] : [1, -1]) {
      // 25 m before the school, coming from either side.
      const s = dir === 1 ? best.s - 25 : total - best.s - 25
      if (s < 8 || s > total - 8) continue
      const p = along(dir === 1 ? best.r.pts : reversed(best.r.pts), s)
      add(inLane("LANGSAM", p.x, p.y, p.angle, best.r.width, best.r.oneway))
    }
  }
  return out
}

/** One word: the lettering's top towards where the driver is heading, read left to right across the lane. */
export const roadWord = (m: MeshBuilder, w: RoadWord) => {
  spriteQuad(m, { x: w.x, y: w.y, z: WORD_Z, angle: w.heading + Math.PI / 2, length: w.across, width: w.along }, wordLayer(w.word), [1, 1], PAINT, Mode.material)
}

/** Is (x, y) within `d` meters of one of `list`? */
const near = (x: number, y: number, list: ReadonlyArray<Placed>, d: number) => list.some((p) => Math.abs(p.x - x) < d && Math.abs(p.y - y) < d && Math.hypot(p.x - x, p.y - y) < d)

/** A power or phone line's pole; a span of line between two, `sag` meters low in the middle. */
export type WirePole = Placed & { readonly road: number }
/** `side`: meters to the right of a→b the line hangs, off the pole's cross-arm. */
export type Wire = { readonly a: WirePole; readonly b: WirePole; readonly z: number; readonly side: number; readonly sag: number }

/** Pole tops and the heights the lines hang from: high over the street, under the lamps' reach. */
export const POLE_Z = 8.6
const LINES = [{ z: 8.1, side: -0.45 }, { z: 8.3, side: 0.45 }] as const
const POLE_SPACING_M = 34
const WIRE: Rgba = [28, 28, 32, 255]
const WIRE_SHADOW: Rgba = [14, 22, 40, 60]
const WIRE_HALF = 0.035
const STREETS: ReadonlySet<string> = new Set(["residential", "living_street"])

/**
 * Poles every POLE_SPACING_M on one side of each residential street, clear of walls, junctions and the furniture in
 * `avoid`; two lines along the street from pole to pole where no building stands in between, and two across each
 * junction of those streets, between the nearest poles of two different streets meeting there.
 */
export const overheadLines = (world: World, avoid: ReadonlyArray<Placed>): { readonly poles: Array<WirePole>; readonly wires: Array<Wire> } => {
  const { map, junctions } = world
  const poles: Array<WirePole> = []
  const wires: Array<Wire> = []
  const junctionPts: Array<Placed & { readonly node: number }> = []
  for (const [node, meet] of junctions) {
    // Ends meeting here: 2 for a road passing through, 1 for one ending. Three or more is a junction.
    const ends = meet.reduce((n, j) => n + (j.vertex === 0 || j.vertex === (map.roads[j.road]?.nodes.length ?? 1) - 1 ? 1 : 2), 0)
    if (ends < 3) continue
    const j = meet[0]
    const r = j === undefined ? undefined : map.roads[j.road]
    if (j !== undefined && r !== undefined) junctionPts.push({ x: r.pts[j.vertex * 2] ?? 0, y: r.pts[j.vertex * 2 + 1] ?? 0, node })
  }
  // Clear of houses: the line at its height only crosses open ground.
  const open = (a: Placed, b: Placed) => {
    const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 0.5)
    for (let k = 1; k < n; k++) if (world.isSolid(a.x + ((b.x - a.x) * k) / n, a.y + ((b.y - a.y) * k) / n)) return false
    return true
  }
  const span = (a: WirePole, b: WirePole) => {
    const d = Math.hypot(b.x - a.x, b.y - a.y)
    for (const { z, side } of LINES) wires.push({ a, b, z, side, sag: 0.012 * d })
  }
  map.roads.forEach((r, ri) => {
    if (!STREETS.has(r.kind)) return
    const side = ri % 2 === 0 ? 1 : -1
    let prev: WirePole | null = null
    let carry = POLE_SPACING_M / 2
    for (let k = 0; k + 3 < r.pts.length; k += 2) {
      const ax = r.pts[k] ?? 0
      const ay = r.pts[k + 1] ?? 0
      const bx = r.pts[k + 2] ?? 0
      const by = r.pts[k + 3] ?? 0
      const len = Math.hypot(bx - ax, by - ay)
      if (len < 1e-3) continue
      const dx = (bx - ax) / len
      const dy = (by - ay) / len
      let s = carry
      for (; s < len; s += POLE_SPACING_M) {
        const off = r.width / 2 + 1.1
        const x = ax + dx * s - dy * off * side
        const y = ay + dy * s + dx * off * side
        if (world.isSolid(x, y) || world.isWater(x, y) || near(x, y, junctionPts, 9) || near(x, y, avoid, 4) || near(x, y, poles, 12)) continue
        const on = world.roadAt(x, y, 0)
        if (on !== null && on.road !== r && on.road.kind !== "footway") continue
        const pole = { x, y, road: ri }
        if (prev !== null && Math.hypot(prev.x - x, prev.y - y) < POLE_SPACING_M * 1.8 && open(prev, pole)) span(prev, pole)
        poles.push(pole)
        prev = pole
      }
      carry = s - len
    }
  })
  // Across the junctions: from one street's nearest pole to another's, over the crossing.
  for (const j of junctionPts) {
    const meet = junctions.get(j.node) ?? []
    if (!meet.some((m) => STREETS.has(map.roads[m.road]?.kind ?? ""))) continue
    const close = poles.filter((p) => Math.hypot(p.x - j.x, p.y - j.y) < 30).toSorted((a, b) => Math.hypot(a.x - j.x, a.y - j.y) - Math.hypot(b.x - j.x, b.y - j.y))
    const first = close[0]
    const other = close.find((p) => first !== undefined && p.road !== first.road)
    if (first !== undefined && other !== undefined && open(first, other)) span(first, other)
  }
  return { poles, wires }
}

/** A pole: a dark post up to POLE_Z with its shadow. */
export const wirePole = (m: MeshBuilder, p: Placed) => column(m, p.x, p.y, 0.1, POLE_Z)

/** A line between two poles as a thin dark ribbon, sagging in the middle, and its faint shadow on the ground. */
export const wire = (m: MeshBuilder, w: Wire) => {
  const { a, b } = w
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1
  const nx = (-(b.y - a.y) / len) * WIRE_HALF
  const ny = ((b.x - a.x) / len) * WIRE_HALF
  const steps = 6
  const at = (k: number): readonly [number, number, number] => {
    const t = k / steps
    return [a.x + (b.x - a.x) * t + (nx / WIRE_HALF) * w.side, a.y + (b.y - a.y) * t + (ny / WIRE_HALF) * w.side, w.z - w.sag * 4 * t * (1 - t)]
  }
  for (let k = 0; k < steps; k++) {
    const [x0, y0, z0] = at(k)
    const [x1, y1, z1] = at(k + 1)
    const v = (x: number, y: number, z: number) => m.vertex(x, y, z, 0, 0, WIRE, Mode.color, 0)
    m.quad(v(x0 + nx, y0 + ny, z0), v(x1 + nx, y1 + ny, z1), v(x1 - nx, y1 - ny, z1), v(x0 - nx, y0 - ny, z0))
    m.target = "shadow"
    const s = (x: number, y: number, z: number) => m.vertex(x + SHADOW_DIR[0] * z * SHADOW_PER_M, y + SHADOW_DIR[1] * z * SHADOW_PER_M, 0.1, 0, 0, WIRE_SHADOW, Mode.color, 0)
    m.quad(s(x0 + nx, y0 + ny, z0), s(x1 + nx, y1 + ny, z1), s(x1 - nx, y1 - ny, z1), s(x0 - nx, y0 - ny, z0))
    m.target = "opaque"
  }
}
