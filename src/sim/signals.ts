import type { Signal } from "#/map/types.ts"
import type { World } from "#/world/world.ts"

export type Light = "green" | "yellow" | "red"

/** Lights within this many meters of each other run as one junction on one clock. */
const CLUSTER_M = 45
const GREEN = 18
const YELLOW = 3
const ALL_RED = 2
const HALF = GREEN + YELLOW + ALL_RED
export const CYCLE = HALF * 2

type Junction = { readonly cx: number; readonly cy: number; readonly axis: number; readonly offset: number; readonly size: number }

/** One traffic light, ready to query and draw. */
export type TrafficLight = Signal & {
  readonly junction: Junction
  /** Heading of the street through this light. */
  readonly heading: number
  readonly roadWidth: number
}

/**
 * The white line a controlled lane stops at, a few meters before its light,
 * with the signal pole on the right-hand kerb beside it. `back` is how far
 * before the light's node it lies along the approach; the line runs across
 * the lane from `from` to `to` meters right of the centre line.
 */
export type StopLine = {
  readonly light: TrafficLight
  readonly road: number
  /** The vertex of the light's node on `road`, and which way the lane drives into it. */
  readonly vertex: number
  readonly dir: 1 | -1
  /** The line's point on the road's centre line, and the heading of traffic arriving. */
  readonly x: number
  readonly y: number
  readonly heading: number
  readonly back: number
  readonly from: number
  readonly to: number
  readonly roadWidth: number
}

/** A pedestrian crossing painted across a whole road: centre, the road's heading there, its width; `signals`: one with lights and push buttons. */
export type Zebra = { readonly x: number; readonly y: number; readonly heading: number; readonly width: number; readonly signals: boolean }

export type Signals = {
  readonly lights: ReadonlyArray<TrafficLight>
  readonly byNode: ReadonlyMap<number, TrafficLight>
  readonly stops: ReadonlyArray<StopLine>
  /** Stop lines by `${road}:${vertex}:${dir}`, for traffic driving into that vertex. */
  readonly stopFor: ReadonlyMap<string, StopLine>
  readonly zebras: ReadonlyArray<Zebra>
}

/** The stop line's distance before a light standing on its own (a pedestrian light), and before one at a junction, where the crossing comes first. */
export const STOP_BACK = { light: 2.5, junction: 6 } as const
/** A zebra is this long along the road; it starts a meter past the stop line. */
export const ZEBRA_M = 3
export const stopKey = (road: number, vertex: number, dir: 1 | -1) => `${road}:${vertex}:${dir}`

const ROAD_RANK = ["primary", "secondary", "tertiary", "residential", "living_street"]
const rank = (kind: string) => ROAD_RANK.indexOf(kind)

/** Group the map's lights into junctions; the busiest road through a junction gets the first green. */
export const makeSignals = (world: World): Signals => {
  const { map } = world
  const throughRoad = (s: Signal) => {
    let best: { heading: number; width: number; rank: number } | null = null
    for (const j of world.junctions.get(s.node) ?? []) {
      const road = map.roads[j.road]
      if (road === undefined) continue
      const count = road.pts.length / 2
      const a = Math.max(0, j.vertex - 1)
      const b = Math.min(count - 1, j.vertex + 1)
      const heading = Math.atan2((road.pts[b * 2 + 1] ?? 0) - (road.pts[a * 2 + 1] ?? 0), (road.pts[b * 2] ?? 0) - (road.pts[a * 2] ?? 0))
      const r = rank(road.kind)
      if (best === null || r < best.rank) best = { heading, width: road.width, rank: r }
    }
    return best ?? { heading: 0, width: 6, rank: 9 }
  }

  const groups: Array<Array<Signal>> = []
  for (const s of map.signals) {
    const group = groups.find((g) => g.some((o) => Math.hypot(o.x - s.x, o.y - s.y) < CLUSTER_M))
    if (group === undefined) groups.push([s])
    else group.push(s)
  }

  const lights: Array<TrafficLight> = []
  groups.forEach((group, gi) => {
    const roads = group.map(throughRoad)
    const main = roads.reduce((a, b) => (b.rank < a.rank ? b : a))
    const junction: Junction = {
      cx: group.reduce((sum, s) => sum + s.x, 0) / group.length,
      cy: group.reduce((sum, s) => sum + s.y, 0) / group.length,
      axis: main.heading,
      offset: (gi * 7.3) % CYCLE,
      size: group.length,
    }
    group.forEach((s, i) => {
      const road = roads[i] ?? main
      lights.push({ ...s, junction, heading: road.heading, roadWidth: road.width })
    })
  })
  const stops = stopLines(world, lights)
  return { lights, byNode: new Map(lights.map((l) => [l.node, l])), stops, stopFor: new Map(stops.map((st) => [stopKey(st.road, st.vertex, st.dir), st])), zebras: zebras(world, stops) }
}

/** Ends of roads meeting at a node: 2 for a road passing through, 1 for one ending there. Three or more is a junction. */
const endsAt = (world: World, node: number) =>
  (world.junctions.get(node) ?? []).reduce((n, j) => {
    const last = (world.map.roads[j.road]?.nodes.length ?? 1) - 1
    return n + (j.vertex === 0 || j.vertex === last ? 1 : 2)
  }, 0)

/** Every lane driving into a light that the light controls gets a stop line before it. */
export const stopLines = (world: World, lights: ReadonlyArray<TrafficLight>): Array<StopLine> => {
  const out: Array<StopLine> = []
  for (const light of lights) {
    const wanted = endsAt(world, light.node) >= 3 ? STOP_BACK.junction : STOP_BACK.light
    for (const j of world.junctions.get(light.node) ?? []) {
      const road = world.map.roads[j.road]
      if (road === undefined) continue
      const count = road.pts.length / 2
      for (const dir of [1, -1] as const) {
        const prev = j.vertex - dir
        if (prev < 0 || prev >= count || (dir === -1 && road.oneway)) continue
        const nx = road.pts[j.vertex * 2] ?? 0
        const ny = road.pts[j.vertex * 2 + 1] ?? 0
        const px = road.pts[prev * 2] ?? 0
        const py = road.pts[prev * 2 + 1] ?? 0
        const len = Math.hypot(nx - px, ny - py)
        if (len < 1) continue
        const dx = (nx - px) / len
        const dy = (ny - py) / len
        const heading = Math.atan2(dy, dx)
        const probe = Math.min(len, 8)
        if (!controls(light, dir, nx - dx * probe, ny - dy * probe, heading)) continue
        // A short approach: the line goes at its start rather than on the road before.
        const back = Math.min(wanted, Math.max(0.5, len - 0.5))
        const half = road.width / 2
        out.push({
          light,
          road: j.road,
          vertex: j.vertex,
          dir,
          x: nx - dx * back,
          y: ny - dy * back,
          heading,
          back,
          from: road.oneway ? -half : 0,
          to: half,
          roadWidth: road.width,
        })
      }
    }
  }
  return out
}

/** A zebra just past each stop line (one per spot, where two lanes share it) and at the zebra crossings OSM maps. */
const zebras = (world: World, stops: ReadonlyArray<StopLine>): Array<Zebra> => {
  const out: Array<Zebra> = []
  // Two crossings never overlap: where lights cluster at one junction, the first one there wins.
  const taken = (x: number, y: number, width: number) => out.some((z) => Math.hypot(z.x - x, z.y - y) < (z.width + width) / 2 + 1)
  for (const st of stops) {
    const along = 1 + ZEBRA_M / 2
    const x = st.x + Math.cos(st.heading) * along
    const y = st.y + Math.sin(st.heading) * along
    if (!taken(x, y, st.roadWidth)) out.push({ x, y, heading: st.heading, width: st.roadWidth, signals: true })
  }
  for (const c of world.map.crossings) {
    if (taken(c.x, c.y, 8)) continue
    const j = world.junctions.get(c.node)?.[0]
    const road = j === undefined ? undefined : world.map.roads[j.road]
    if (j === undefined || road === undefined) continue
    const count = road.pts.length / 2
    const a = Math.max(0, j.vertex - 1)
    const b = Math.min(count - 1, j.vertex + 1)
    const heading = Math.atan2((road.pts[b * 2 + 1] ?? 0) - (road.pts[a * 2 + 1] ?? 0), (road.pts[b * 2] ?? 0) - (road.pts[a * 2] ?? 0))
    out.push({ x: c.x, y: c.y, heading, width: road.width, signals: c.signals })
  }
  return out
}

/** What a driver heading `heading` sees at this junction at `time` seconds. */
export const lightFor = (junction: Junction, heading: number, time: number): Light => {
  const t = (time + junction.offset) % CYCLE
  const onMainAxis = Math.abs(Math.cos(heading - junction.axis)) >= Math.SQRT1_2
  const local = onMainAxis ? t : (t + HALF) % CYCLE
  if (local < GREEN) return "green"
  if (local < GREEN + YELLOW) return "yellow"
  return "red"
}

/**
 * Does this light control a car at (x, y) driving `heading` along its road in
 * direction `dir`? Lights tagged forward/backward only face one way; untagged
 * lights before a junction only face traffic driving into it.
 */
export const controls = (light: TrafficLight, dir: 1 | -1, x: number, y: number, heading: number): boolean => {
  if (light.direction === "forward") return dir === 1
  if (light.direction === "backward") return dir === -1
  if (light.junction.size === 1) return true
  const toCenterX = light.junction.cx - x
  const toCenterY = light.junction.cy - y
  return toCenterX * Math.cos(heading) + toCenterY * Math.sin(heading) > 0
}
