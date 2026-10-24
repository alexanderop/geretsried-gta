import type { World } from "#/world/world.ts"
import { controls, lightFor, type Signals } from "./signals.ts"
import { DRIVABLE } from "#/world/world.ts"

/** An NPC car glued to the road graph. It drives from vertex `from` toward `from + dir`. */
export type Npc = {
  readonly id: number
  road: number
  from: number
  dir: 1 | -1
  /** meters travelled along the current segment */
  s: number
  speed: number
  x: number
  y: number
  angle: number
  readonly model: number
}

/** Meters between a stopped car's center and the light. */
const STOP_GAP = 4

const CRUISE: Readonly<Record<string, number>> = {
  primary: 14,
  secondary: 13,
  tertiary: 11,
  residential: 8,
  living_street: 4,
}

/** Car sprite indices for ordinary traffic; 5 is the police car, which shows up rarely. */
const CIVILIAN_MODELS = [0, 1, 2, 3, 4, 6, 7]
const POLICE_MODEL = 5
const modelFor = (id: number) => (id % 23 === 0 ? POLICE_MODEL : (CIVILIAN_MODELS[id % CIVILIAN_MODELS.length] ?? 0))

const vertex = (pts: ReadonlyArray<number>, i: number) => [pts[i * 2] ?? 0, pts[i * 2 + 1] ?? 0] as const

const segmentLength = (world: World, npc: Npc) => {
  const pts = world.map.roads[npc.road]?.pts ?? []
  const [ax, ay] = vertex(pts, npc.from)
  const [bx, by] = vertex(pts, npc.from + npc.dir)
  return Math.hypot(bx - ax, by - ay)
}

/** Where the NPC goes after reaching the vertex it was heading to. */
const nextLeg = (world: World, npc: Npc, random: () => number): Pick<Npc, "road" | "from" | "dir"> => {
  const road = world.map.roads[npc.road]
  const at = npc.from + npc.dir
  const node = road?.nodes[at]
  const options: Array<Pick<Npc, "road" | "from" | "dir">> = []
  for (const j of (node === undefined ? undefined : world.junctions.get(node)) ?? []) {
    const r = world.map.roads[j.road]
    if (r === undefined) continue
    const count = r.pts.length / 2
    const sameWayBack = j.road === npc.road
    if (j.vertex + 1 < count && !(sameWayBack && npc.dir === -1)) options.push({ road: j.road, from: j.vertex, dir: 1 })
    if (j.vertex > 0 && !r.oneway && !(sameWayBack && npc.dir === 1)) options.push({ road: j.road, from: j.vertex, dir: -1 })
  }
  const pick = options[Math.floor(random() * options.length)]
  if (pick !== undefined) return pick
  // Dead end: turn around (even on a one-way street, so nobody gets stuck).
  return { road: npc.road, from: at, dir: npc.dir === 1 ? -1 : 1 }
}

const place = (world: World, npc: Npc) => {
  const road = world.map.roads[npc.road]
  if (road === undefined) return
  const [ax, ay] = vertex(road.pts, npc.from)
  const [bx, by] = vertex(road.pts, npc.from + npc.dir)
  const len = Math.hypot(bx - ax, by - ay) || 1
  const t = Math.min(1, npc.s / len)
  const dx = (bx - ax) / len
  const dy = (by - ay) / len
  // Keep right: offset to the right of travel direction.
  const lane = road.oneway ? 0 : road.width / 4
  npc.x = ax + (bx - ax) * t - dy * lane
  npc.y = ay + (by - ay) * t + dx * lane
  const target = Math.atan2(dy, dx)
  let delta = target - npc.angle
  delta = Math.atan2(Math.sin(delta), Math.cos(delta))
  npc.angle += delta * 0.25
}

/** Put an NPC on a random drivable segment whose midpoint is within `[minR, maxR]` of (cx, cy). */
export const spawnNpc = (world: World, id: number, cx: number, cy: number, minR: number, maxR: number, random: () => number): Npc | null => {
  for (let attempt = 0; attempt < 60; attempt++) {
    const angle = random() * Math.PI * 2
    const r = minR + random() * (maxR - minR)
    const hit = world.roadAt(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, 20)
    if (hit === null || !DRIVABLE.has(hit.road.kind)) continue
    const count = hit.road.pts.length / 2
    const from = Math.floor(random() * (count - 1))
    const dir: 1 | -1 = hit.road.oneway || random() < 0.5 ? 1 : -1
    const npc: Npc = {
      id,
      road: hit.index,
      from: dir === 1 ? from : from + 1,
      dir,
      s: 0,
      speed: 0,
      x: 0,
      y: 0,
      angle: 0,
      model: modelFor(id),
    }
    const pts = hit.road.pts
    const [ax, ay] = vertex(pts, npc.from)
    const [bx, by] = vertex(pts, npc.from + dir)
    npc.angle = Math.atan2(by - ay, bx - ax)
    place(world, npc)
    return npc
  }
  return null
}

/**
 * Advance one NPC. `blocked` says whether something is close in front,
 * so the car brakes instead of driving through it.
 */
export const stepNpc = (world: World, signals: Signals, time: number, npc: Npc, blocked: boolean, dt: number, random: () => number): void => {
  const road = world.map.roads[npc.road]
  const cruise = CRUISE[road?.kind ?? "residential"] ?? 8
  const segment = segmentLength(world, npc)
  // Red light at the end of this segment: stop a few meters before it.
  const node = road?.nodes[npc.from + npc.dir]
  const light = node === undefined ? undefined : signals.byNode.get(node)
  const toLight = segment - npc.s
  let stopAt = Infinity
  if (light !== undefined && controls(light, npc.dir, npc.x, npc.y, npc.angle)) {
    const state = lightFor(light.junction, npc.angle, time)
    // On yellow, only cars that can still stop do.
    if (state === "red" || (state === "yellow" && toLight > 10)) stopAt = Math.max(0, toLight - STOP_GAP)
  }
  const target = blocked ? 0 : Math.min(cruise, stopAt < 40 ? stopAt * 0.6 : cruise)
  npc.speed += Math.sign(target - npc.speed) * Math.min(Math.abs(target - npc.speed), (blocked || stopAt < 40 ? 14 : 4) * dt)
  npc.s += Math.min(npc.speed * dt, stopAt)
  let len = segment
  let guard = 0
  while (npc.s >= len && guard++ < 16) {
    npc.s -= len
    Object.assign(npc, nextLeg(world, npc, random))
    len = segmentLength(world, npc)
  }
  place(world, npc)
}
