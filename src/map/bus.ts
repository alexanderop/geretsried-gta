/**
 * Bus lines from OSM route=bus relations: every relation's ways are chained in member order (roundabouts
 * entered and left where the route does), walked node by node along the streets the game has (matched by OSM
 * node id; a step between two nodes that are not neighbours, such as a member OSM left out, is bridged by
 * the shortest way round the streets), cut to the part inside the map, and its platforms become the stops,
 * named and placed along that path.
 */
import type { BusLine, BusRun, BusStop, Road } from "./types.ts"
import { makeProjection, type Bbox } from "./project.ts"

/** One element of Overpass' `out body` for the relations and `>` (their ways, those ways' nodes). */
export type OsmElement = {
  readonly type: string
  readonly id: number
  readonly lat?: number
  readonly lon?: number
  readonly nodes?: ReadonlyArray<number>
  readonly members?: ReadonlyArray<{ readonly type: string; readonly ref: number; readonly role: string }>
  readonly tags?: Readonly<Record<string, string>>
}

/** Streets a bus drives on (the service roads and busways of bus stations and school loops included). */
export const BUS_ROADS: ReadonlySet<string> = new Set(["primary", "secondary", "tertiary", "residential", "living_street", "service"])

/** A run shorter than this (meters), or with fewer stops, is just a route clipping a corner of the map. */
const MIN_RUN_M = 250
const MIN_STOPS = 2
/** A platform farther than this from the path is not a stop of this run. */
const STOP_REACH_M = 35
/** The two runs of a line meet within this many meters at the map's edge (one ends where the other begins). */
const MEET_M = 600
/** The longest detour that bridges a gap in a relation; a longer gap cuts the run. */
const BRIDGE_M = 500

const round = (n: number) => Math.round(n * 10) / 10

/**
 * Join a route's ways, in member order, into chains of OSM node ids: each way is turned to start where the
 * last ended; a closed way (a roundabout) is driven round in its own direction from where the chain enters it
 * to where the next way leaves it. A gap starts a new chain.
 */
export const chainWays = (ways: ReadonlyArray<ReadonlyArray<number>>): Array<Array<number>> => {
  const chains: Array<Array<number>> = []
  let cur: Array<number> = []
  const flush = () => {
    if (cur.length > 1) chains.push(cur)
    cur = []
  }
  const usable = ways.filter((w) => w.length >= 2)
  for (let i = 0; i < usable.length; i++) {
    const way = usable[i] ?? []
    const next = usable[i + 1]
    const touches = (n: number | undefined) => next !== undefined && next.includes(n ?? NaN)
    const end = cur[cur.length - 1]
    const closed = way[0] === way[way.length - 1]
    if (closed && (end === undefined || way.includes(end))) {
      // Round from the entry (or the start) to the first node the next way shares; all the way round otherwise.
      const ring = way.slice(0, -1)
      const from = end === undefined ? 0 : ring.indexOf(end)
      const out: Array<number> = []
      for (let k = 1; k <= ring.length; k++) {
        const n = ring[(from + k) % ring.length] ?? 0
        out.push(n)
        if (touches(n)) break
      }
      if (end === undefined) cur.push(ring[from] ?? 0)
      cur.push(...out)
    } else if (end === undefined) {
      // A chain's first way ends where the next one touches it.
      cur = !touches(way[way.length - 1]) && touches(way[0]) ? way.toReversed() : [...way]
    } else if (way[0] === end) cur.push(...way.slice(1))
    else if (way[way.length - 1] === end) cur.push(...way.toReversed().slice(1))
    else {
      flush()
      i--
    }
  }
  flush()
  return chains
}

type Vertex = { readonly road: number; readonly vertex: number }

/** The bus streets as a graph of OSM nodes: where each node sits, its position, and the neighbours a bus may drive to (one-way streets forwards only). */
type BusGraph = {
  readonly at: ReadonlyMap<number, Vertex>
  readonly xy: ReadonlyMap<number, readonly [number, number]>
  readonly next: ReadonlyMap<number, ReadonlyArray<number>>
  /** Any road joins the two nodes (either way: a bus may use a one-way street the other way where OSM's route does). */
  readonly joined: (a: number, b: number) => boolean
}

export const busGraph = (roads: ReadonlyArray<Road>): BusGraph => {
  const at = new Map<number, Vertex>()
  const xy = new Map<number, readonly [number, number]>()
  const next = new Map<number, Array<number>>()
  const pairs = new Set<string>()
  const link = (a: number, b: number) => {
    const list = next.get(a)
    if (list === undefined) next.set(a, [b])
    else if (!list.includes(b)) list.push(b)
  }
  roads.forEach((r, road) => {
    if (!BUS_ROADS.has(r.kind)) return
    r.nodes.forEach((n, vertex) => {
      if (!at.has(n)) at.set(n, { road, vertex })
      if (!xy.has(n)) xy.set(n, [r.pts[vertex * 2] ?? 0, r.pts[vertex * 2 + 1] ?? 0])
      const b = r.nodes[vertex + 1]
      if (b === undefined) return
      pairs.add(`${n} ${b}`)
      pairs.add(`${b} ${n}`)
      link(n, b)
      if (!r.oneway) link(b, n)
    })
  })
  return { at, xy, next, joined: (a, b) => pairs.has(`${a} ${b}`) }
}

/** The nodes strictly between `a` and `b` on the shortest drive along the bus streets, or null when it is longer than BRIDGE_M. */
export const bridge = (graph: BusGraph, a: number, b: number): Array<number> | null => {
  const dist = new Map<number, number>([[a, 0]])
  const prev = new Map<number, number>()
  const open = [a]
  const d = (p: number, q: number) => {
    const [px, py] = graph.xy.get(p) ?? [0, 0]
    const [qx, qy] = graph.xy.get(q) ?? [0, 0]
    return Math.hypot(qx - px, qy - py)
  }
  while (open.length > 0) {
    // Few nodes lie within BRIDGE_M, so a plain scan for the nearest open node is enough.
    let best = 0
    for (let i = 1; i < open.length; i++) if ((dist.get(open[i] ?? 0) ?? 0) < (dist.get(open[best] ?? 0) ?? 0)) best = i
    const u = open.splice(best, 1)[0] ?? 0
    if (u === b) {
      const path: Array<number> = []
      for (let n = prev.get(b); n !== undefined && n !== a; n = prev.get(n)) path.push(n)
      return path.toReversed()
    }
    const du = dist.get(u) ?? 0
    for (const v of graph.next.get(u) ?? []) {
      const dv = du + d(u, v)
      if (dv > BRIDGE_M || dv >= (dist.get(v) ?? Infinity)) continue
      if (!dist.has(v)) open.push(v)
      dist.set(v, dv)
      prev.set(v, u)
    }
  }
  return null
}

/** The stretches of a route's nodes that are on bus streets inside the map, each a walk from node to neighbouring node (gaps bridged where they can be). */
export const pieces = (route: ReadonlyArray<number>, graph: BusGraph, width: number, height: number): Array<Array<number>> => {
  const out: Array<Array<number>> = []
  let cur: Array<number> = []
  const flush = () => {
    if (cur.length > 1) out.push(cur)
    cur = []
  }
  const inside = (n: number) => {
    const p = graph.xy.get(n)
    return p !== undefined && p[0] >= 0 && p[1] >= 0 && p[0] <= width && p[1] <= height
  }
  for (const n of route) {
    const last = cur[cur.length - 1]
    if (n === last) continue
    if (!inside(n)) flush()
    else if (last === undefined || graph.joined(last, n)) cur.push(n)
    else {
      const via = bridge(graph, last, n)
      if (via === null) flush()
      else cur.push(...via)
      cur.push(n)
    }
  }
  flush()
  return out
}

const pathLength = (pts: ReadonlyArray<number>) => {
  let sum = 0
  for (let i = 0; i + 3 < pts.length; i += 2) sum += Math.hypot((pts[i + 2] ?? 0) - (pts[i] ?? 0), (pts[i + 3] ?? 0) - (pts[i + 1] ?? 0))
  return sum
}

/** Two halts in a row are at least this far apart along the path, so a stop listed twice is not served twice on the spot. */
const STOP_GAP_M = 20
/** Once a pass comes within reach of a platform, how much further along its nearest point is looked for. */
const LOOK_ON_M = 60

/**
 * Place stops on a path in order: each takes the point of the path past the previous stop where it first comes
 * within STOP_REACH_M of the platform (its nearest there), as the segment and the meters into it.
 */
export const placeStops = (pts: ReadonlyArray<number>, platforms: ReadonlyArray<{ readonly name: string; readonly x: number; readonly y: number }>): Array<BusStop> => {
  const out: Array<BusStop> = []
  /** Meters along the path from which the next stop may be. */
  let from = 0
  for (const p of platforms) {
    let best = { d: Infinity, at: -1, s: 0, along: 0 }
    let walked = 0
    for (let i = 0; i + 3 < pts.length; i += 2) {
      const ax = pts[i] ?? 0
      const ay = pts[i + 1] ?? 0
      const dx = (pts[i + 2] ?? 0) - ax
      const dy = (pts[i + 3] ?? 0) - ay
      const len = Math.hypot(dx, dy)
      if (walked + len >= from && len > 1e-6) {
        const lo = Math.max(0, (from - walked) / len)
        const t = Math.max(lo, Math.min(1, ((p.x - ax) * dx + (p.y - ay) * dy) / (len * len)))
        const d = Math.hypot(ax + dx * t - p.x, ay + dy * t - p.y)
        if (d < best.d) best = { d, at: i / 2, s: t * len, along: walked + t * len }
      }
      walked += len
      // The first pass within reach is the one: a path that comes back later along the same street halts there then.
      if (best.d <= STOP_REACH_M && walked > best.along + LOOK_ON_M) break
    }
    if (best.at < 0 || best.d > STOP_REACH_M) continue
    out.push({ name: p.name, x: round(p.x), y: round(p.y), at: best.at, s: round(best.s) })
    from = best.along + STOP_GAP_M
  }
  return out
}

/** A run with how many "=>" its relation's name has: the line's plain pattern has fewest (370: Stein => Wolfratshausen), variants more. */
type Candidate = BusRun & { readonly vias: number }

/** The compact map's bus lines, one per `ref`, with the (at most two) runs a bus drives in turn: there, then back. */
export const buildBusLines = (elements: ReadonlyArray<OsmElement>, roads: ReadonlyArray<Road>, bbox: Bbox): Array<BusLine> => {
  const projection = makeProjection(bbox)
  const graph = busGraph(roads)
  const nodes = new Map<number, OsmElement>()
  const ways = new Map<number, ReadonlyArray<number>>()
  for (const e of elements) {
    if (e.type === "node") nodes.set(e.id, e)
    else if (e.type === "way") ways.set(e.id, e.nodes ?? [])
  }
  const at = (e: OsmElement | undefined): readonly [number, number] | null => (e?.lat === undefined || e.lon === undefined ? null : projection.toMeters({ lat: e.lat, lon: e.lon }))

  /** A platform (or stop position) member as a named point: a node itself, or the middle of a way. */
  const platform = (m: NonNullable<OsmElement["members"]>[number]) => {
    const el = m.type === "node" ? nodes.get(m.ref) : undefined
    const wayNodes = m.type === "way" ? (ways.get(m.ref) ?? []) : []
    const pts = m.type === "node" ? [at(el)] : wayNodes.map((n) => at(nodes.get(n)))
    const known = pts.filter((p) => p !== null)
    if (known.length === 0) return null
    const x = known.reduce((s, p) => s + p[0], 0) / known.length
    const y = known.reduce((s, p) => s + p[1], 0) / known.length
    return { name: el?.tags?.name ?? "", x, y }
  }

  const byRef = new Map<string, { operator: string; runs: Array<Candidate> }>()
  for (const rel of elements) {
    if (rel.type !== "relation" || rel.tags?.route !== "bus") continue
    const ref = rel.tags.ref ?? ""
    if (ref === "") continue
    const members = rel.members ?? []
    const route = chainWays(members.filter((m) => m.type === "way" && !/^(platform|stop)/.test(m.role)).map((m) => ways.get(m.ref) ?? [])).flat()
    const plat = members.filter((m) => m.role.startsWith("platform"))
    const named = (plat.length > 0 ? plat : members.filter((m) => m.role.startsWith("stop"))).flatMap((m) => {
      const p = platform(m)
      return p === null || p.name === "" ? [] : [p]
    })
    const vias = (rel.tags.name ?? "").split("=>").length
    for (const piece of pieces(route, graph, projection.width, projection.height)) {
      const pts = piece.flatMap((n) => (graph.xy.get(n) ?? [0, 0]).map(round))
      const stops = placeStops(pts, named)
      if (pathLength(pts) < MIN_RUN_M || stops.length < MIN_STOPS) continue
      const line = byRef.get(ref) ?? { operator: "", runs: [] }
      // Some of a line's relations have no operator tag; any of the others names it.
      line.operator ||= rel.tags.operator ?? ""
      line.runs.push({ to: rel.tags.to ?? stops[stops.length - 1]?.name ?? "", nodes: piece, pts, stops, vias })
      byRef.set(ref, line)
    }
  }

  const lines: Array<BusLine> = []
  for (const [ref, { operator, runs }] of byRef) {
    const chosen = pickRuns(runs).map((r) => ({ to: r.to, nodes: r.nodes, pts: r.pts, stops: r.stops }))
    if (chosen.length > 0) lines.push({ ref, operator, runs: chosen })
  }
  return lines.toSorted((a, b) => a.ref.localeCompare(b.ref, "en", { numeric: true }))
}

const head = (r: BusRun) => [r.pts[0] ?? 0, r.pts[1] ?? 0] as const
const tail = (r: BusRun) => [r.pts[r.pts.length - 2] ?? 0, r.pts[r.pts.length - 1] ?? 0] as const
const apart = (a: readonly [number, number], b: readonly [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1])

/**
 * A line has many relations (370 and its trips on to Königsdorf, both directions): drive its plain pattern
 * (fewest "=>" in the name) that serves the most stops, then the best run that comes back, starting near where
 * the first ended and ending near where it began.
 */
export const pickRuns = <R extends Candidate>(runs: ReadonlyArray<R>): Array<R> => {
  const rank = (a: R, b: R) => a.vias - b.vias || b.stops.length - a.stops.length || pathLength(b.pts) - pathLength(a.pts)
  const first = runs.toSorted(rank)[0]
  if (first === undefined) return []
  const back = runs.filter((r) => r !== first && apart(head(r), tail(first)) < MEET_M && apart(tail(r), head(first)) < MEET_M).toSorted(rank)[0]
  return back === undefined ? [first] : [first, back]
}
