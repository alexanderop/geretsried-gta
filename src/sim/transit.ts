/**
 * Bus lines on the street graph. The map has each run (one direction of an OSM route=bus relation) as OSM
 * node ids; here they become legs (a road and the vertex a segment starts at, as NPC traffic drives them)
 * and halts (a stop's place on a leg), which `stepNpc` follows: the bus stops at each halt for a while and
 * at a run's end starts the next run (the way back), jumping from where the map ends to where it begins.
 */
import { DRIVABLE, type World } from "#/world/world.ts"
import { BUS_ROADS } from "#/map/bus.ts"
import type { RoadKind } from "#/map/types.ts"
import { BUS_LENGTH } from "./vehicles.ts"

export type Leg = { readonly road: number; readonly from: number; readonly dir: 1 | -1; readonly len: number }
/** A bus stop on a run: `s` meters into leg `leg`. */
export type Halt = { readonly name: string; readonly leg: number; readonly s: number }
export type Run = { readonly to: string; readonly legs: ReadonlyArray<Leg>; readonly halts: ReadonlyArray<Halt>; readonly length: number }
export type Line = { readonly ref: string; readonly operator: string; readonly runs: ReadonlyArray<Run>; /** How many buses drive it. */ readonly buses: number }
export type Transit = ReadonlyArray<Line>

/** Where a bus is on its line. `dwell`: seconds left standing at the halt it has reached. */
export type BusTrip = { readonly line: Line; run: number; leg: number; halt: number; dwell: number }

/** Seconds a bus stands at a stop. */
export const DWELL_S = 7
/** Meters of route per bus: a line of 10 km gets three, at most. */
const BUS_EVERY_M = 4000
const MAX_BUSES = 3

/** How well a road suits a leg: a real street over a service road, its own direction over against it. */
const legScore = (kind: RoadKind, dir: number, oneway: boolean) => (DRIVABLE.has(kind) ? 2 : 0) + (oneway && dir < 0 ? 0 : 1)

/**
 * Legs of one run: for each pair of neighbouring nodes the road that joins them, a real street over a service
 * road and with the road's direction over against it (OSM's route takes a one-way street the other way only
 * where buses may). A gap cuts the run short.
 */
const legsOf = (world: World, nodes: ReadonlyArray<number>, index: ReadonlyMap<number, ReadonlyArray<{ road: number; vertex: number }>>): Array<Leg> => {
  const legs: Array<Leg> = []
  for (let i = 0; i + 1 < nodes.length; i++) {
    const b = nodes[i + 1]
    let leg: Leg | null = null
    let best = -1
    for (const { road, vertex } of index.get(nodes[i] ?? -1) ?? []) {
      const r = world.map.roads[road]
      if (r === undefined) continue
      const dir = r.nodes[vertex + 1] === b ? 1 : r.nodes[vertex - 1] === b ? -1 : 0
      if (dir === 0 || legScore(r.kind, dir, r.oneway) <= best) continue
      best = legScore(r.kind, dir, r.oneway)
      const to = vertex + dir
      leg = { road, from: vertex, dir, len: Math.hypot((r.pts[to * 2] ?? 0) - (r.pts[vertex * 2] ?? 0), (r.pts[to * 2 + 1] ?? 0) - (r.pts[vertex * 2 + 1] ?? 0)) }
    }
    if (leg === null) break
    legs.push(leg)
  }
  return legs
}

/** The bus lines of the map as legs and halts. Pure: the same every game. */
export const planTransit = (world: World): Transit => {
  const index = new Map<number, Array<{ road: number; vertex: number }>>()
  world.map.roads.forEach((r, road) => {
    if (!BUS_ROADS.has(r.kind)) return
    r.nodes.forEach((n, vertex) => {
      const list = index.get(n)
      if (list === undefined) index.set(n, [{ road, vertex }])
      else list.push({ road, vertex })
    })
  })
  const lines: Array<Line> = []
  for (const l of world.map.buses) {
    const runs: Array<Run> = []
    for (const r of l.runs) {
      const legs = legsOf(world, r.nodes, index)
      const halts = r.stops.filter((s) => s.at < legs.length).map((s) => ({ name: s.name, leg: s.at, s: Math.min(s.s, legs[s.at]?.len ?? 0) }))
      const length = legs.reduce((n, leg) => n + leg.len, 0)
      if (halts.length >= 2) runs.push({ to: r.to, legs, halts, length })
    }
    const loop = runs.reduce((n, r) => n + r.length, 0)
    if (runs.length > 0) lines.push({ ref: l.ref, operator: l.operator, runs, buses: Math.max(1, Math.min(MAX_BUSES, Math.round(loop / BUS_EVERY_M))) })
  }
  return lines
}

/** The place `fraction` (0 … 1) of the way round a line's loop of runs: run, leg, meters into it, and the next halt. */
export const along = (line: Line, fraction: number): { readonly run: number; readonly leg: number; readonly s: number; readonly halt: number } => {
  let d = (((fraction % 1) + 1) % 1) * line.runs.reduce((n, r) => n + r.length, 0)
  for (let run = 0; run < line.runs.length; run++) {
    const r = line.runs[run]
    if (r === undefined) continue
    if (d >= r.length) {
      d -= r.length
      continue
    }
    for (let leg = 0; leg < r.legs.length; leg++) {
      const len = r.legs[leg]?.len ?? 0
      if (d < len) return { run, leg, s: d, halt: Math.max(0, r.halts.findIndex((h) => h.leg > leg || (h.leg === leg && h.s >= d))) }
      d -= len
    }
  }
  return { run: 0, leg: 0, s: 0, halt: 0 }
}

/** Meters from a bus (`s` into its leg) to the halt it is heading for, or Infinity when that is further than a bus needs to see. */
export const distanceToHalt = (trip: BusTrip, s: number): number => {
  const run = trip.line.runs[trip.run]
  const halt = run?.halts[trip.halt]
  if (run === undefined || halt === undefined) return Infinity
  let d = -s
  for (let i = trip.leg; i < halt.leg; i++) {
    d += run.legs[i]?.len ?? 0
    if (d > 80) return Infinity
  }
  return d + halt.s
}

/** Skip halts that lie behind the bus (a run begun past its first stop). */
export const dropPassedHalts = (trip: BusTrip): void => {
  const halts = trip.line.runs[trip.run]?.halts ?? []
  while (trip.halt < halts.length && (halts[trip.halt]?.leg ?? Infinity) < trip.leg) trip.halt++
}

/** Move on to the next leg; at a run's end, to the start of the next run (`jumped`: the bus left the map and comes back at the other end). */
export const nextBusLeg = (trip: BusTrip): { readonly leg: Leg; readonly jumped: boolean } => {
  const run = trip.line.runs[trip.run]
  trip.leg++
  let jumped = false
  if (run === undefined || trip.leg >= run.legs.length) {
    trip.run = (trip.run + 1) % trip.line.runs.length
    trip.leg = 0
    trip.halt = 0
    trip.dwell = 0
    jumped = true
  }
  const leg = trip.line.runs[trip.run]?.legs[trip.leg]
  return { leg: leg ?? { road: 0, from: 0, dir: 1, len: 1 }, jumped }
}

/** Up to `count` legs after the bus's current one, without moving on; none past its run's end, where `nextBusLeg` jumps. */
export const legsAfter = (trip: BusTrip, count: number): ReadonlyArray<Leg> => trip.line.runs[trip.run]?.legs.slice(trip.leg + 1, trip.leg + 1 + count) ?? []

/** What the next stop is called, or where the run ends. */
export const nextStop = (trip: BusTrip): string => {
  const run = trip.line.runs[trip.run]
  return run?.halts[trip.halt]?.name ?? run?.to ?? ""
}

/** True while the bus stands at its last stop of the run: the end of the line. */
export const atTerminus = (trip: BusTrip): boolean => trip.dwell > 0 && trip.halt >= (trip.line.runs[trip.run]?.halts.length ?? 0) - 1

/** Where the bus is going: its run's end, or at the end of the line where the next run goes. */
export const direction = (trip: BusTrip): string => trip.line.runs[atTerminus(trip) ? (trip.run + 1) % trip.line.runs.length : trip.run]?.to ?? ""

/** Half a bus: how far a passenger may stand from its middle along it. */
export const BOARD_HALF = BUS_LENGTH / 2
