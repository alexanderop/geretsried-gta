import type { Rgba } from "#/render/scene/mesh.ts"
import type { Mass, Part, PlaceDressing } from "./dressing.ts"

/**
 * Sudetenstraße 10, the white block with dark balconies on the SW side of Sudetenstraße at the Kirchweg corner,
 * opposite the VR Bank: way 538512734, one OSM outline over KIND Augenoptik (the corner, B6a-6) and Bistro Malor (NW of
 * it, B6a-7). The street front is wall 1 (16.71 m, u 0 at the Kirchweg corner, running NW) and on in line with it wall 0
 * (16.21 m, to the NW end); the Kirchweg side is wall 2 (22.33 m, u 0 at the S end, the corner at its u 22.33).
 * `UNITS` gives each unit's stretch per wall, so B6a-7 adds its parts in its own section below.
 *
 * The Bavarian LoD2 model (2026, tile 684_5302, `DEBY_LOD2_4602674`): one gable roof along the street, eaves 12.1 m,
 * ridge 16.2 m, gables at the NW and SE ends, and in front of the NE plane at its SE end a flat-roofed corner volume
 * at the eaves (7.9 m along the street, 2.9 m deep): the KIND corner. OSM's outline lies off the model's (its front
 * about 2.5 m nearer the street, its SE wall 7 m further out over the Kirchweg pavement), so the model is carried onto
 * OSM's corners, which stay the solid: the flat corner volume at OSM's corner, the gable drawn at 20.6° over OSM's
 * 21.5 m depth to keep the model's ridge. DOP20: red-brown tiles with white dormers on the NE plane, solar panels on
 * the SW plane (not drawn), the corner's flat roof light grey.
 */
const WHITE: Rgba = [238, 240, 244, 255]
const TILES: Rgba = [176, 104, 80, 255]
const FLAT_ROOF: Rgba = [196, 196, 192, 255]

const EAVES = 12.1
const PITCH = 20.6

/** Each unit's stretch of wall 1 (front, from the corner), wall 0 (front, NW part) and wall 2 (Kirchweg side). Shop boundaries are guesses. */
export const UNITS = {
  kind: { 1: [0, 7.9], 2: [16.6, 22.33] },
  bistroMalor: { 1: [7.9, 16.71], 0: [0, 16.21] },
} as const

/**
 * Each wall's u 0 in the street frame (hung on KIND's POI) and the angle it runs off the street's u. `atWall(edge, u,
 * out)` is the point `out` meters in front of wall `edge` at its `u`, with the angle for a part square to that wall.
 */
const WALLS = {
  0: { u0: 8.445, n0: 13.452, angle: 0.0412 },
  1: { u0: -8.249, n0: 12.81, angle: 0.0385 },
  2: { u0: -10.335, n0: 35.043, angle: -1.4772 },
} as const
export const atWall = (edge: keyof typeof WALLS, u: number, out: number) => {
  const w = WALLS[edge]
  return {
    u: w.u0 + u * Math.cos(w.angle) + out * Math.sin(w.angle),
    n: w.n0 + u * Math.sin(w.angle) - out * Math.cos(w.angle),
    angle: w.angle,
  }
}

/** The outline's corners (way 538512734) and the flat corner volume's inner corners carried onto it. */
const C = {
  p0: [3925.5, 4626.4],
  p1: [3939.3, 4634.9],
  p2: [3953.5, 4643.7],
  p3: [3942.8, 4663.3],
  p4: [3913, 4643.1],
  /** Wall 1 u 7.9, 2.9 m in from it, and wall 2 2.9 m from the corner. */
  a: [3946.78, 4639.54],
  b: [3945.26, 4642.0],
  c: [3952.11, 4646.25],
} as const
const ring = (...keys: ReadonlyArray<keyof typeof C>) => keys.flatMap((k) => C[k])

const MASSES: ReadonlyArray<Mass> = [
  // The house: gables at the SE wall (edge 4, c to p3) and the NW wall (edge 6), the NE plane stepping back round the corner volume.
  { pts: ring("p0", "p1", "a", "b", "c", "p3", "p4"), levels: EAVES / 3, roof: { colour: TILES, hip: PITCH, gables: [4, 6] } },
  { pts: ring("a", "p2", "c", "b"), levels: EAVES / 3, roof: { pitched: false, colour: FLAT_ROOF } },
]

/**
 * KIND Augenoptik (B6a-6, reference/optik-kind/01 key, 02, 03): a dark-blue fascia (#305499) with white serif "KIND"
 * wrapping the corner, twice over the street front's glazing (a two-pane window, then the glass door) and once on the
 * Kirchweg side over a grey roller shutter. The band goes on a blue box in line with the VR Bank row across the street
 * (the 2.85 m bottom, 0.9 m high, 0.3 m deep), the front box running on past the corner over the side box's end, so the
 * straight-down play camera sees a blue L round the corner and the lettering reads from the street. An A-board with an
 * advert poster stands on the pavement in front of the door. Guesses: the box depth (the real band is a flat fascia),
 * the glazing's and shutters' widths, the side band's length, the A-board's place. Not built: the balconies over the
 * shop (they would hide the band from the play camera), the small door canopy, the shop's opening-hours stickers.
 */
const KIND_BLUE: Rgba = [62, 100, 178, 255]
const FRONT_Z = 2.85
const SIGN_Z = 3.75
const BOX = 0.3
/** The box fronts: wall 1 from 0.3 m past the corner (over the side box's end) to the unit's end; wall 2 up to the corner. */
const FRONT_BOX = [-BOX, UNITS.kind[1][1]] as const
const SIDE_BOX = [17.8, UNITS.kind[2][1]] as const
/** The three "KIND" boards (4:1, 3.6 m), two on the front and one on the side. */
const BOARDS = [
  { edge: 1, u0: 0.2, u1: 3.8 },
  { edge: 1, u0: 4.15, u1: 7.75 },
  { edge: 2, u0: 18.3, u1: 21.9 },
] as const
/** The sprite's up turned to the screen's: the frame's u runs NW here, -2.548 rad on the map. */
const UPRIGHT = 2.548
const box = (edge: 1 | 2, [u0, u1]: readonly [number, number]): Part => ({
  kind: "pylon",
  ...atWall(edge, (u0 + u1) / 2, BOX / 2),
  w: u1 - u0,
  d: BOX,
  h: SIGN_Z,
  base: FRONT_Z,
  colour: KIND_BLUE,
})

export const KIND: ReadonlyArray<Part> = [
  { kind: "wallSign", texture: "kind-front", edge: 1, u0: UNITS.kind[1][0], u1: UNITS.kind[1][1], z0: 0, z1: FRONT_Z },
  { kind: "wallSign", texture: "kind-side", edge: 2, u0: UNITS.kind[2][0], u1: UNITS.kind[2][1], z0: 0, z1: FRONT_Z },
  box(1, FRONT_BOX),
  box(2, SIDE_BOX),
  ...BOARDS.map((b): Part => ({ kind: "wallSign", texture: "kind-sign", edge: b.edge, u0: b.u0, u1: b.u1, z0: FRONT_Z, z1: SIGN_Z, out: BOX + 0.05 })),
  { kind: "sprite", name: "kind-aboard", ...atWall(1, 5.6, 1.6), z: 0.6, angle: UPRIGHT, len: 0.85 },
]

/**
 * Bistro Malor (B6a-7, reference/bistro-malor/05 key, 06 logo, 07): the restaurant NW of KIND on the street front (wall 1
 * from KIND's end). 05 shows a paved terrace in front of a white wall with tall glazed double doors: dark oak tables
 * with a cream runner, brown rattan armchairs with tan cushions, white planters of laurel round it; 07 (Street View)
 * shows it just past the KIND corner behind low hedges. Built as a terrace about 7.8 x 5 m on the pavement in front of
 * wall 1 u 8.6–16.4: six tables with two chairs each in two rows, a planter hedge along its street side with a gap in
 * the middle and one at each end, square to the wall; the pavement past it stays walkable (props are never solid).
 * No sign on the building: no photo shows lettering there (the spec says to wait for one). Guesses: the doors' places,
 * the terrace's size, table count and layout, the hedge gap. The map has a lawn in front of the house, so the terrace stands on a stone slab. Not built: the terrace roof (05 shows a dark steel frame, 07 a dark-red roof; which is current
 * needs reference).
 */
/** The terrace's pale stone paving (05), laid over the lawn the map has in front of the house. */
const PAVING: Rgba = [204, 199, 190, 255]
/** The terrace's stretch of wall 1 and its depth out from the wall. */
const TERRACE = { u0: 8.6, u1: 16.4, out: 5 } as const
const TABLES = [10.0, 12.5, 15.0].flatMap((u) => [1.5, 3.5].map((out) => [u, out] as const))
/** Planter hedges: [u0, u1] along the street side, and the two ends square to the wall. */
const HEDGE_FRONT = [[TERRACE.u0, 11.8], [13.2, TERRACE.u1]] as const
const HEDGE_W = 0.5

export const BISTRO_MALOR: ReadonlyArray<Part> = [
  { kind: "wallSign", texture: "malor-front", edge: 1, u0: UNITS.bistroMalor[1][0], u1: UNITS.bistroMalor[1][1], z0: 0, z1: FRONT_Z },
  {
    kind: "pylon",
    ...atWall(1, (TERRACE.u0 + TERRACE.u1) / 2, TERRACE.out / 2),
    w: TERRACE.u1 - TERRACE.u0 + HEDGE_W,
    d: TERRACE.out,
    h: 0.04,
    colour: PAVING,
  },
  ...TABLES.map(([u, out]): Part => ({ kind: "sprite", name: "malor-terrace", ...atWall(1, u, out), z: 0.75, len: 2.1 })),
  ...HEDGE_FRONT.map(([u0, u1]): Part => ({ kind: "sprite", name: "malor-hedge", ...atWall(1, (u0 + u1) / 2, TERRACE.out - HEDGE_W / 2), z: 0.9, len: u1 - u0 })),
  ...[TERRACE.u0, TERRACE.u1].map((u): Part => {
    const p = atWall(1, u, (TERRACE.out - HEDGE_W) / 2)
    return { kind: "sprite", name: "malor-hedge", ...p, z: 0.9, angle: p.angle + Math.PI / 2, len: TERRACE.out - HEDGE_W - 0.3 }
  }),
]

export const SUDETENSTRASSE_10: PlaceDressing = {
  poi: "Optik Kind Geretsried-Zentrum II",
  street: "Sudetenstraße",
  osmBuildingId: 538512734,
  levels: 4,
  facade: "render",
  wallColour: WHITE,
  masses: MASSES,
  parts: [...KIND, ...BISTRO_MALOR],
}
