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

export type Signals = {
  readonly lights: ReadonlyArray<TrafficLight>
  readonly byNode: ReadonlyMap<number, TrafficLight>
}

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
  return { lights, byNode: new Map(lights.map((l) => [l.node, l])) }
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
