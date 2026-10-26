import type { World } from "#/world/world.ts"
import { distToSegmentSq } from "#/world/geometry.ts"
import { CAR_LENGTH } from "./car.ts"
import type { Signals } from "./signals.ts"
import { IDM, STOP_GAP, bendPoints, laneOf, type GiveWay, type Npc, type Segment, type SlowTo } from "./traffic.ts"
import { vehicleLength } from "./vehicles.ts"

/**
 * Right of way at junctions without lights. The higher road class goes first; on equal roads, traffic from the
 * right (rechts vor links), and a car turning left lets the oncoming one go. A car that must give way slows down,
 * waits at its give-way line while a car with priority is due within GAP_S, then commits and drives through. A car
 * in the junction box blocks every path that crosses its own, priority or not.
 */

/** Road classes, the most important first. OSM's priority_road / give_way / stop tags are not in the map. */
const RANK = ["primary", "secondary", "tertiary", "unclassified", "residential", "living_street"]
const rank = (kind: string) => {
  const i = RANK.indexOf(kind)
  return i === -1 ? RANK.length : i
}

/** A priority car this many seconds from the junction (or nearer) is in the way. */
export const GAP_S = 3
/** After waiting this long, the lowest-id car waiting at a junction goes even if one with priority waits too: no deadlock. */
export const DEADLOCK_S = 4
/** m/s a car that may have to give way crosses its give-way line at. */
const APPROACH = 4
/** Meters ahead a car looks for its next junction. */
const LOOK = 50
/** Two paths through a junction closer than this (m) cross: two car widths' half each. */
const CLEAR = 2
/** Lights this close (m) to a junction run it: it keeps working as a signalled junction. */
const LIGHT_NEAR = 25

/** One road leaving the junction node: along `road` from `vertex` toward `vertex + side`. */
type Arm = {
  readonly road: number
  readonly vertex: number
  readonly side: 1 | -1
  /** The direction it leaves the node in (angle 0 east, y south). */
  readonly angle: number
  readonly rank: number
  /** The segment driving into the node along it (null: one-way out), and out of the node along it (null: one-way in). */
  readonly in: Segment | null
  readonly out: Segment | null
  /** Meters before the node its give-way line lies: half the widest road it crosses, and a meter. */
  readonly line: number
}

/**
 * An unsignalled junction: where its node is, the radius of its box and its arms. `table` holds, for a car going
 * from arm a to arm b and another from c to d, at `((a·n + b)·n + c)·n + d`: bit 1 when their paths cross, bit 2
 * when the first gives way to the second. Worked out when a car first needs it.
 */
export type Rule = {
  readonly node: number
  readonly x: number
  readonly y: number
  readonly box: number
  readonly arms: ReadonlyArray<Arm>
  table: Uint8Array | null
}

const CROSS = 1
const YIELD = 2

/** The angle from heading `h` to `angle`, in (-π, π]: positive is to the right (y points south). */
const turnOf = (h: number, angle: number) => Math.atan2(Math.sin(angle - h), Math.cos(angle - h))

const rules = new WeakMap<World, ReadonlyMap<number, Rule>>()

/** Every unsignalled junction of three or more arms, by node: worked out once per world. */
export const junctionRules = (world: World, signals: Signals): ReadonlyMap<number, Rule> => {
  const hit = rules.get(world)
  if (hit !== undefined) return hit
  const out = new Map<number, Rule>()
  for (const [node, entries] of world.junctions) {
    const arms: Array<Omit<Arm, "line">> = []
    let x = 0
    let y = 0
    for (const j of entries) {
      const road = world.map.roads[j.road]
      if (road === undefined) continue
      x = road.pts[j.vertex * 2] ?? 0
      y = road.pts[j.vertex * 2 + 1] ?? 0
      for (const side of [-1, 1] as const) {
        const to = j.vertex + side
        if (to < 0 || to >= road.pts.length / 2) continue
        const angle = Math.atan2((road.pts[to * 2 + 1] ?? 0) - y, (road.pts[to * 2] ?? 0) - x)
        // Driving in along this arm is driving the other way: against the road's direction where side is +1.
        const into: Segment = { road: j.road, from: to, dir: side === 1 ? -1 : 1 }
        const away: Segment = { road: j.road, from: j.vertex, dir: side }
        arms.push({ road: j.road, vertex: j.vertex, side, angle, rank: rank(road.kind), in: road.oneway && into.dir === -1 ? null : into, out: road.oneway && away.dir === -1 ? null : away })
      }
    }
    if (arms.length < 3 || signals.lights.some((l) => Math.abs(l.x - x) < LIGHT_NEAR && Math.abs(l.y - y) < LIGHT_NEAR)) continue
    const width = (road: number) => world.map.roads[road]?.width ?? 6
    const box = Math.max(...arms.map((a) => width(a.road))) / 2 + 1.5
    const withLines = arms.map((a) => {
      const crossed = arms.filter((o) => o.road !== a.road).map((o) => width(o.road))
      return { ...a, line: Math.max(...(crossed.length > 0 ? crossed : [width(a.road)])) / 2 + 1 }
    })
    out.set(node, { node, x, y, box, arms: withLines, table: null })
  }
  rules.set(world, out)
  return out
}

/** Which arm a car drives in along (`seg` ends at the node), or out along (`seg` starts there); -1 if none. */
const armIn = (rule: Rule, seg: Segment) => rule.arms.findIndex((a) => a.in !== null && a.in.road === seg.road && a.in.from === seg.from && a.in.dir === seg.dir)
const armOut = (rule: Rule, seg: Segment) => rule.arms.findIndex((a) => a.out !== null && a.out.road === seg.road && a.out.from === seg.from && a.out.dir === seg.dir)

/** Do two polylines [x, y, …] come closer than `clear` meters? */
const near = (a: ReadonlyArray<number>, b: ReadonlyArray<number>, clear: number) => {
  const c2 = clear * clear
  for (let i = 0; i + 3 < a.length; i += 2) {
    const [ax, ay, bx, by] = [a[i] ?? 0, a[i + 1] ?? 0, a[i + 2] ?? 0, a[i + 3] ?? 0]
    for (let k = 0; k + 3 < b.length; k += 2) {
      const [cx, cy, dx, dy] = [b[k] ?? 0, b[k + 1] ?? 0, b[k + 2] ?? 0, b[k + 3] ?? 0]
      if (distToSegmentSq(ax, ay, cx, cy, dx, dy) < c2 || distToSegmentSq(bx, by, cx, cy, dx, dy) < c2) return true
      if (distToSegmentSq(cx, cy, ax, ay, bx, by) < c2 || distToSegmentSq(dx, dy, ax, ay, bx, by) < c2) return true
      // Crossing in the middle of both pieces.
      const d1 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax)
      const d2 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax)
      const d3 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx)
      const d4 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx)
      if (d1 * d2 < 0 && d3 * d4 < 0) return true
    }
  }
  return false
}

/**
 * Does a car from arm `a` to arm `b` give way to one from `c` to `d`? The better road goes first. On equal roads
 * the one from the right does, and a car turning left lets the oncoming one go (unless that one turns left too).
 * Where exactly two arms are the best road (a priority road through the junction), cars on it give way to each
 * other only when one turns off across the other's way.
 */
const givesWay = (arms: ReadonlyArray<Arm>, a: number, b: number, c: number, d: number) => {
  const A = arms[a]
  const C = arms[c]
  const B = arms[b]
  const D = arms[d]
  if (A === undefined || B === undefined || C === undefined || D === undefined) return false
  if (C.rank !== A.rank) return C.rank < A.rank
  const best = Math.min(...arms.map((x) => x.rank))
  const top = arms.filter((x) => x.rank === best).length
  if (top === 2 && arms.length > 2 && A.rank === best) return B.rank !== best && d === a
  const h = A.angle + Math.PI
  const right = turnOf(h, C.angle)
  if (right > 0.35 && right < Math.PI - 0.35) return true
  const left = (from: Arm, to: Arm) => turnOf(from.angle + Math.PI, to.angle) < -0.5
  return Math.abs(right) < 0.6 && left(A, B) && !left(C, D)
}

const tableOf = (world: World, rule: Rule): Uint8Array => {
  if (rule.table !== null) return rule.table
  const { arms } = rule
  const n = arms.length
  const paths = new Map<number, ReadonlyArray<number>>()
  arms.forEach((a, i) =>
    arms.forEach((b, k) => {
      if (i !== k && a.in !== null && b.out !== null) paths.set(i * n + k, bendPoints(world, a.in, b.out))
    }),
  )
  const table = new Uint8Array(n * n * n * n)
  for (const [p, pa] of paths) {
    for (const [q, pb] of paths) {
      const a = Math.floor(p / n)
      const c = Math.floor(q / n)
      if (a === c) continue
      const cross = p % n === q % n || near(pa, pb, CLEAR)
      table[p * n * n + q] = (cross ? CROSS : 0) | (givesWay(arms, a, p % n, c, q % n) ? YIELD : 0)
    }
  }
  rule.table = table
  return table
}

/** A car at a junction this tick: driving in from arm `in` and out along arm `out`, `toNode` meters (of `s`) before the node, or past it (`exit`). */
type Entry = { readonly npc: Npc; readonly in: number; readonly out: number; readonly toNode: number; readonly exit: boolean }

/** What a car does at the junction ahead: wait `holdAt` meters on, or slow down for the give-way line. */
export type Hold = { readonly holdAt?: number; readonly slowTo?: SlowTo }

const nodeOf = (world: World, seg: Segment, end: boolean) => world.map.roads[seg.road]?.nodes[seg.from + (end ? seg.dir : 0)]

/** A junction on a car's way: driving in from arm `in`, out along arm `out`; `at` is how far (of `s`) its node lies from the start of the car's segment. */
type Passage = { readonly rule: Rule; readonly in: number; readonly out: number; readonly at: number }

/**
 * The first junction ahead on a car's route and the one it has just driven through, for the segment it is on: they
 * change only when it gets onto the next one, so they are kept until then.
 */
type Seen = { readonly road: number; readonly from: number; readonly dir: 1 | -1; readonly next: Segment | undefined; readonly ahead: Passage | null; readonly behind: Passage | null }
const seen = new WeakMap<Npc, Seen>()

const passages = (world: World, all: ReadonlyMap<number, Rule>, npc: Npc): Seen => {
  const hit = seen.get(npc)
  if (hit !== undefined && hit.road === npc.road && hit.from === npc.from && hit.dir === npc.dir && hit.next === npc.route[0]) return hit
  let ahead: Passage | null = null
  let seg: Segment = npc
  let at = 0
  for (const next of npc.route) {
    at += laneOf(world, seg).len
    if (at > LOOK + laneOf(world, npc).len) break
    const node = nodeOf(world, seg, true)
    const rule = node === undefined ? undefined : all.get(node)
    if (rule !== undefined) {
      const a = armIn(rule, seg)
      const b = armOut(rule, next)
      ahead = a === -1 || b === -1 ? null : { rule, in: a, out: b, at }
      break
    }
    seg = next
  }
  let behind: Passage | null = null
  const node = npc.prev === null ? undefined : nodeOf(world, npc, false)
  const rule = node === undefined ? undefined : all.get(node)
  if (rule !== undefined && npc.prev !== null) {
    const a = armIn(rule, npc.prev)
    const b = armOut(rule, npc)
    behind = a === -1 || b === -1 ? null : { rule, in: a, out: b, at: 0 }
  }
  const out = { road: npc.road, from: npc.from, dir: npc.dir, next: npc.route[0], ahead, behind }
  seen.set(npc, out)
  return out
}

const stateAt = (npc: Npc, node: number): GiveWay | null => (npc.give?.node === node ? npc.give : null)

/** Is `o` in the junction box, or committed and on its way in? Then it blocks every path crossing its own. */
const occupies = (rule: Rule, o: Entry) => {
  if (o.exit || o.toNode < rule.box) return true
  return stateAt(o.npc, rule.node)?.committed === true && (o.npc.speed > 0.5 || o.toNode < rule.box + 8)
}

/**
 * Right of way for the driving NPCs this tick (pulling in or out, they take no part). Cars decide in turn, so one
 * that commits blocks the cars after it at once. Returns what each car that must slow down or wait does.
 */
export const giveWay = (world: World, signals: Signals, npcs: ReadonlyArray<Npc>, dt: number): Map<Npc, Hold> => {
  const all = junctionRules(world, signals)
  const at = new Map<number, Array<Entry>>()
  const add = (hit: { rule: Rule; entry: Entry } | null) => {
    if (hit === null) return
    const list = at.get(hit.rule.node)
    if (list === undefined) at.set(hit.rule.node, [hit.entry])
    else list.push(hit.entry)
  }
  const ahead: Array<{ rule: Rule; entry: Entry; behind: number }> = []
  for (const npc of npcs) {
    if (npc.mode.kind !== "driving") continue
    const { ahead: next, behind } = passages(world, all, npc)
    if (behind !== null && npc.s < behind.rule.box) add({ rule: behind.rule, entry: { npc, in: behind.in, out: behind.out, toNode: -npc.s, exit: true } })
    const toNode = next === null ? Infinity : next.at - npc.s
    if (next === null || toNode > LOOK) {
      npc.give = null
      continue
    }
    const hit = { rule: next.rule, entry: { npc, in: next.in, out: next.out, toNode, exit: false } }
    add(hit)
    ahead.push({ ...hit, behind: behind === null ? 0 : behind.rule.box - npc.s })
  }
  const holds = new Map<Npc, Hold>()
  for (const { rule, entry, behind } of ahead) {
    const { npc } = entry
    const give = stateAt(npc, rule.node) ?? (npc.give = { node: rule.node, committed: false, waiting: false, waited: 0 })
    if (give.committed) continue
    const arm = rule.arms[entry.in]
    const stopAt = entry.toNode - (arm?.line ?? 0) - STOP_GAP - (vehicleLength(npc.model) - CAR_LENGTH) / 2
    // In the box already, too far over the line to stop, or a line so close to the junction behind that waiting at
    // it would block that one's box (where a car on its way out may be the one this car waits for): through.
    if (entry.toNode < rule.box || stopAt < -1 || stopAt < behind) {
      Object.assign(give, { committed: true, waiting: false })
      continue
    }
    const table = tableOf(world, rule)
    const n = rule.arms.length
    const row = (entry.in * n + entry.out) * n * n
    const others = at.get(rule.node) ?? []
    // Deadlock: everyone waits for someone; the lowest-id car that has waited DEADLOCK_S goes first.
    const breaks = give.waited >= DEADLOCK_S && others.every((o) => o.npc.id >= npc.id || stateAt(o.npc, rule.node)?.waiting !== true)
    let blocked = false
    let yields = false
    for (const o of others) {
      if (o.npc === npc || o.in === entry.in) continue
      const bits = table[row + o.in * n + o.out] ?? 0
      if ((bits & YIELD) !== 0) yields = true
      if ((bits & CROSS) === 0) continue
      if (occupies(rule, o)) blocked = true
      else if ((bits & YIELD) !== 0) {
        const waits = stateAt(o.npc, rule.node)?.waiting === true
        if (waits ? !breaks : o.toNode / Math.max(o.npc.speed, 0.1) < GAP_S) blocked = true
      }
      if (blocked) break
    }
    if (blocked) {
      give.waiting = stopAt < 3 && npc.speed < 1
      give.waited = give.waiting ? give.waited + dt : 0
      holds.set(npc, { holdAt: Math.max(0, stopAt) })
      continue
    }
    give.waiting = false
    // Clear: in once it is at the line or could no longer stop for it.
    if (stopAt <= Math.max(0.5, (npc.speed * npc.speed) / (2 * IDM.b))) {
      give.committed = true
      give.waited = 0
    } else if (yields || (careful(world, rule)[entry.in * n + entry.out] ?? 0) === 1) holds.set(npc, { slowTo: { toward: Math.max(0.5, stopAt), speed: APPROACH } })
  }
  return holds
}

/** For each way through a junction (from arm a to arm b, at a·n + b), 1 if anyone could come along it would give way to: then it comes up to its line slowly. */
const cautions = new WeakMap<Rule, Uint8Array>()
const careful = (world: World, rule: Rule): Uint8Array => {
  const hit = cautions.get(rule)
  if (hit !== undefined) return hit
  const table = tableOf(world, rule)
  const n = rule.arms.length
  const out = new Uint8Array(n * n)
  for (let p = 0; p < n * n; p++) for (let q = 0; q < n * n; q++) if (((table[p * n * n + q] ?? 0) & (CROSS | YIELD)) === (CROSS | YIELD)) out[p] = 1
  cautions.set(rule, out)
  return out
}
