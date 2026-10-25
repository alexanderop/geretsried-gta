/**
 * Cafe Waldmann at Sudetenstraße 3: the low pavilion on the lawn in front of
 * the block, with the optician (Augenoptik Wedershoven) at its left end and
 * the cafe you can walk into at its right, a terrace with purple umbrellas
 * and the memorial obelisk by the entrance. OSM maps only the cafe's node,
 * so the pavilion is laid out here, from the photos, in meters of a frame on
 * Sudetenstraße: u along the street (south-east), n from the kerb line
 * towards the cafe's node.
 *
 * Pure layout: the world makes its solid parts solid, the renderer draws all
 * of it, the game puts the cake counter's pad at `cake`.
 */
import type { GameMap } from "#/map/types.ts"

export type Frame = { readonly ox: number; readonly oy: number; readonly ux: number; readonly uy: number; readonly nx: number; readonly ny: number }
/** A rectangle in the frame: u0..u1 along the street, n0..n1 away from it. */
export type Rect = readonly [u0: number, u1: number, n0: number, n1: number]

export const toWorld = (f: Frame, u: number, n: number): readonly [number, number] => [f.ox + f.ux * u + f.nx * n, f.oy + f.uy * u + f.ny * n]
export const toLocal = (f: Frame, x: number, y: number): readonly [number, number] => [(x - f.ox) * f.ux + (y - f.oy) * f.uy, (x - f.ox) * f.nx + (y - f.oy) * f.ny]
export const inRect = (r: Rect, u: number, n: number, pad = 0) => u >= r[0] - pad && u <= r[1] + pad && n >= r[2] - pad && n <= r[3] + pad
/** The rectangle's corners in the world, as a flat ring. */
export const rectRing = (f: Frame, r: Rect): Array<number> => [...toWorld(f, r[0], r[2]), ...toWorld(f, r[1], r[2]), ...toWorld(f, r[1], r[3]), ...toWorld(f, r[0], r[3])]

/** A square of half-width r round (u, n). */
export const square = (u: number, n: number, r: number): Rect => [u - r, u + r, n - r, n + r]

export const CAFE_NAME = "Cafe Waldmann"
const STREET = "Sudetenstraße"

export const PAVILION_H = 3.4
export const WALL_T = 0.25
/** The whole pavilion, and its two shops. */
export const PAVILION: Rect = [-15, 11, 17, 27]
export const OPTICIAN: Rect = [-15, -9, 17, 27]
/** The cafe's room inside its walls. */
export const ROOM: Rect = [-9 + WALL_T, 11 - WALL_T, 17 + WALL_T, 27 - WALL_T]
/** The glass door in the front wall, at the right under the sign. */
export const DOOR = [6.5, 8.4] as const
/** The partition between the cake counter's side and the dining room, and the doorway in it (with a green frame, like the photo). */
export const PARTITION_U = [2, 2.25] as const
export const DOORWAY = [19.2, 22.2] as const
/** The WC: a cubicle against the back wall of the dining room, its door facing the tables. */
export const WC: Rect = [-1.9, 0.1, 25.3, 27 - WALL_T]
export const WC_DOOR = [-1.3, -0.5] as const
export const TOILET = { u: -0.9, n: 26.25 } as const

export const WALLS = {
  front: [[-9, DOOR[0], 17, 17 + WALL_T], [DOOR[1], 11, 17, 17 + WALL_T]],
  back: [[-9, 11, 27 - WALL_T, 27]],
  left: [[-9, -9 + WALL_T, 17, 27]],
  right: [[11 - WALL_T, 11, 17, 27]],
  inner: [
    [PARTITION_U[0], PARTITION_U[1], 17 + WALL_T, DOORWAY[0]],
    [PARTITION_U[0], PARTITION_U[1], DOORWAY[1], 27 - WALL_T],
    [WC[0], WC_DOOR[0], WC[2], WC[2] + 0.15],
    [WC_DOOR[1], WC[1], WC[2], WC[2] + 0.15],
    [WC[0], WC[0] + 0.15, WC[2], WC[3]],
    [WC[1] - 0.15, WC[1], WC[2], WC[3]],
  ],
} as const satisfies Record<string, ReadonlyArray<Rect>>

/** The cake counter across the right-hand room, its displays to the front, the back counter with the espresso machine against the back wall. */
export const COUNTER: Rect = [4.1, 10.4, 22.6, 24.3]
export const VITRINES: ReadonlyArray<Rect> = [
  [4.4, 7.3, 22.65, 23.65],
  [7.35, 10.25, 22.65, 23.65],
]
export const BACK_COUNTER: Rect = [4.6, 10.75, 26.1, 27 - WALL_T]
export const BARISTA = { u: 7.6, n: 25.1 } as const
/** Where you stand to buy cake: in front of the left display. */
export const CAKE_PAD = { u: 5.6, n: 21.8 } as const

/** The purple upholstered benches along the dining room's back and left walls: seat depth, then the backrest against the wall. */
export const BENCHES: ReadonlyArray<Rect> = [
  [-8.75, -2.3, 26.05, 26.75],
  [-8.75, -8.05, 17.9, 26.05],
]
export const BENCH_SEAT_Z = 0.45
export const BENCH_BACK_Z = 1.1

/** The six tables of the dining room, in two rows of three (the sketch). */
const TABLE_AT: ReadonlyArray<readonly [number, number, number, number]> = [
  [-6.7, 23.1, 1.2, 0.9],
  [-3.3, 23.1, 1.2, 0.9],
  [0, 23.1, 1.2, 0.9],
  [-6.7, 20.8, 1.2, 0.9],
  [-3.3, 20.8, 1.2, 0.9],
  [0, 20.8, 0.8, 1.1],
]
export const TABLES: ReadonlyArray<Rect> = TABLE_AT.map(([u, n, w, d]): Rect => [u - w / 2, u + w / 2, n - d / 2, n + d / 2])
export const TABLE_Z = 0.75
export type Chair = { readonly u: number; readonly n: number; readonly facing: number }
/** Two chairs on each long side of every table: where they stand and which way the sitter faces (radians in the frame, 0 = +u). */
export const CHAIRS: ReadonlyArray<Chair> = TABLE_AT.flatMap(([u, n, , d]) =>
  [-0.3, 0.3].flatMap((du) => [
    { u: u + du, n: n - d / 2 - 0.4, facing: Math.PI / 2 },
    { u: u + du, n: n + d / 2 + 0.4, facing: -Math.PI / 2 },
  ]),
)

/** The tall gold planter with a snake plant, just inside the door. */
export const PLANTER = { u: 5.7, n: 18.1 } as const

/** The terrace in front: paving, white bistro tables under purple umbrellas, low planters at its edge, the path to the door. */
export const TERRACE: Rect = [-10, 9.5, 11.5, 17]
export const PATH: Rect = [6.2, 8.7, 6.4, 11.5]
export const UMBRELLAS: ReadonlyArray<{ readonly u: number; readonly n: number }> = [
  { u: -6.5, n: 14.4 },
  { u: -1.5, n: 14.4 },
  { u: 3.2, n: 14.4 },
]
export const UMBRELLA_Z = 2.5
export const BISTRO: ReadonlyArray<{ readonly u: number; readonly n: number }> = [
  ...UMBRELLAS.flatMap((p) => [{ u: p.u - 1.1, n: p.n }, { u: p.u + 1.1, n: p.n }]),
  { u: -9.2, n: 12.6 },
]
export const HEDGES: ReadonlyArray<Rect> = [
  [-10, -4.2, 11.5, 12.3],
  [-2.2, 4.4, 11.5, 12.3],
]
/** The memorial obelisk on the lawn in front of the entrance. */
export const OBELISK = { u: 9.6, n: 10.2, base: 0.55, top: 3.2 } as const

/** The cafe at Sudetenstraße, with its world frame, solid parts, room and cake pad; null when the map lacks it. */
export type Cafe = {
  readonly frame: Frame
  /** World rings nothing walks or drives through: walls, the optician, counters, benches, tables, the toilet, the obelisk. */
  readonly solids: ReadonlyArray<ReadonlyArray<number>>
  readonly cake: { readonly x: number; readonly y: number }
}

export const planCafe = (map: GameMap): Cafe | null => {
  const poi = map.pois.find((p) => p.name === CAFE_NAME)
  if (poi === undefined) return null
  // The street's closest segment to the cafe gives the frame: origin at the node's foot on it.
  let best: { d: number; fx: number; fy: number; dx: number; dy: number } | null = null
  for (const r of map.roads) {
    if (r.name !== STREET) continue
    for (let k = 0; k + 3 < r.pts.length; k += 2) {
      const ax = r.pts[k] ?? 0
      const ay = r.pts[k + 1] ?? 0
      const dx = (r.pts[k + 2] ?? 0) - ax
      const dy = (r.pts[k + 3] ?? 0) - ay
      const len2 = dx * dx + dy * dy
      if (len2 < 1e-6) continue
      const t = Math.max(0, Math.min(1, ((poi.x - ax) * dx + (poi.y - ay) * dy) / len2))
      const fx = ax + dx * t
      const fy = ay + dy * t
      const d = Math.hypot(poi.x - fx, poi.y - fy)
      if (best === null || d < best.d) best = { d, fx, fy, dx, dy }
    }
  }
  if (best === null || best.d < 1) return null
  // n towards the node; u along the street, a quarter turn clockwise from n (on the map, y down: south-east here).
  const nx = (poi.x - best.fx) / best.d
  const ny = (poi.y - best.fy) / best.d
  const frame: Frame = { ox: best.fx, oy: best.fy, ux: -ny, uy: nx, nx, ny }
  const rects: Array<Rect> = [
    OPTICIAN,
    ...Object.values(WALLS).flat(),
    COUNTER,
    BACK_COUNTER,
    ...BENCHES,
    ...TABLES,
    square(TOILET.u, TOILET.n, 0.25),
    square(PLANTER.u, PLANTER.n, 0.35),
    square(OBELISK.u, OBELISK.n, OBELISK.base),
    ...HEDGES,
  ]
  return { frame, solids: rects.map((r) => rectRing(frame, r)), cake: (([x, y]) => ({ x, y }))(toWorld(frame, CAKE_PAD.u, CAKE_PAD.n)) }
}
