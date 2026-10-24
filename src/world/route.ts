/**
 * Shortest routes along the street network, for police cars that must drive
 * round blocks instead of into them. Nodes are OSM nodes of drivable roads,
 * edges the road segments between them.
 */
import type { GameMap } from "#/map/types.ts"
import { Grid } from "./grid.ts"
import { DRIVABLE } from "./world.ts"

export type RoadGraph = {
  readonly xs: Float64Array
  readonly ys: Float64Array
  /** Neighbours of node i: pairs of (node, meters). */
  readonly edges: ReadonlyArray<ReadonlyArray<readonly [number, number]>>
  readonly grid: Grid
}

const ROUTED: ReadonlySet<string> = new Set([...DRIVABLE, "service"])

export const makeRoadGraph = (map: GameMap): RoadGraph => {
  const index = new Map<number, number>()
  const xs: Array<number> = []
  const ys: Array<number> = []
  const edges: Array<Array<readonly [number, number]>> = []
  const node = (id: number, x: number, y: number) => {
    const known = index.get(id)
    if (known !== undefined) return known
    index.set(id, xs.length)
    xs.push(x)
    ys.push(y)
    edges.push([])
    return xs.length - 1
  }
  for (const r of map.roads) {
    if (!ROUTED.has(r.kind)) continue
    let prev = -1
    r.nodes.forEach((id, v) => {
      const x = r.pts[v * 2] ?? 0
      const y = r.pts[v * 2 + 1] ?? 0
      const i = node(id, x, y)
      if (prev >= 0) {
        const len = Math.hypot(x - (xs[prev] ?? 0), y - (ys[prev] ?? 0))
        edges[prev]?.push([i, len])
        // Police ignore one-way streets.
        edges[i]?.push([prev, len])
      }
      prev = i
    })
  }
  const grid = new Grid(map.width, map.height, 32)
  xs.forEach((x, i) => grid.insert(i, { minX: x, minY: ys[i] ?? 0, maxX: x, maxY: ys[i] ?? 0 }))
  return { xs: Float64Array.from(xs), ys: Float64Array.from(ys), edges, grid }
}

/** The node nearest to (x, y) within `reach` meters, or -1. */
export const nearestNode = (g: RoadGraph, x: number, y: number, reach = 80): number => {
  let best = -1
  let bestD = Infinity
  for (const i of g.grid.query({ minX: x - reach, minY: y - reach, maxX: x + reach, maxY: y + reach })) {
    const d = Math.hypot((g.xs[i] ?? 0) - x, (g.ys[i] ?? 0) - y)
    if (d < bestD) {
      bestD = d
      best = i
    }
  }
  return best
}

/** Waypoints [x0, y0, x1, y1, ...] of the shortest street route between two points, or [] if there is none. */
export const route = (g: RoadGraph, fromX: number, fromY: number, toX: number, toY: number): Array<number> => {
  const a = nearestNode(g, fromX, fromY)
  const b = nearestNode(g, toX, toY)
  if (a < 0 || b < 0) return []
  const dist = new Map<number, number>([[a, 0]])
  const prev = new Map<number, number>()
  // A* with straight-line distance: the graph is small, but four police cars ask every second.
  const h = (i: number) => Math.hypot((g.xs[i] ?? 0) - toX, (g.ys[i] ?? 0) - toY)
  const heap: Array<readonly [number, number]> = [[h(a), a]]
  const push = (item: readonly [number, number]) => {
    heap.push(item)
    let k = heap.length - 1
    while (k > 0) {
      const p = (k - 1) >> 1
      if ((heap[p]?.[0] ?? 0) <= item[0]) break
      heap[k] = heap[p] ?? item
      k = p
    }
    heap[k] = item
  }
  const key = (k: number) => heap[k]?.[0] ?? Infinity
  const pop = () => {
    const top = heap[0]
    const last = heap.pop()
    if (last === undefined || heap.length === 0) return top
    let k = 0
    for (;;) {
      const l = k * 2 + 1
      if (l >= heap.length) break
      const m = l + 1 < heap.length && key(l + 1) < key(l) ? l + 1 : l
      if (key(m) >= last[0]) break
      heap[k] = heap[m] ?? last
      k = m
    }
    heap[k] = last
    return top
  }
  for (let guard = 0; heap.length > 0 && guard < 200_000; guard++) {
    const top = pop()
    if (top === undefined) break
    const i = top[1]
    if (i === b) break
    const di = dist.get(i) ?? Infinity
    if (top[0] - h(i) > di + 1e-6) continue
    for (const [j, len] of g.edges[i] ?? []) {
      const dj = di + len
      if (dj < (dist.get(j) ?? Infinity)) {
        dist.set(j, dj)
        prev.set(j, i)
        push([dj + h(j), j])
      }
    }
  }
  if (a !== b && !prev.has(b)) return []
  const path: Array<number> = []
  for (let i: number | undefined = b; i !== undefined; i = prev.get(i)) path.unshift(g.xs[i] ?? 0, g.ys[i] ?? 0)
  return path
}
