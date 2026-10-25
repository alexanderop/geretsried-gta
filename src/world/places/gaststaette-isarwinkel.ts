import type { Rgba } from "#/render/scene/mesh.ts"
import type { Mass, Part, PlaceDressing } from "./dressing.ts"

/**
 * Gaststätte Isarwinkel, Richard-Wagner-Straße 14 (B6a-10): way 119894071 on the E side of Richard-Wagner-Straße, the
 * Sportschule Kubis against its N wall, an open car park to its S. The street front is wall 5 (17.19 m, u 0 at the N
 * end, running SSE); in its frame (s along it, t into the building) the outline is nearly rectilinear: the house's
 * front 17.2 m, its N wall 14.1 m deep, a back wing to 20.7 m behind the S half.
 *
 * The Bavarian LoD2 model (2026, tile 684_5302, `DEBY_LOD2_4602821`, 3 storeys) lies within a metre of OSM here:
 * - the house (t 0–11): a gable roof along the street, eaves 10.8 m, ridge 12.71 m, gables at the N and S ends; drawn
 *   at 19.15° over OSM's 11 m to keep the ridge.
 * - a flat part behind its N half (s 0–8.4, t 11–14.1) at 4.81 m.
 * - the SE wing (s 8.4–17.2, t 11–20.7): a low gable along s, eaves 7.8 m, ridge 8.96 m (13.25° over OSM's 9.7 m),
 *   gables N and S. The model's lean-to bits between it and the house (8.6 m) are folded into it.
 * DOP20: the house's roof grey (#a3a7a4 on the sunlit W plane), the back parts darker grey, and a red strip along the
 * whole street front: the awnings.
 *
 * Street View (01 key, 02): pale yellow render, three storeys of white windows; "GASTSTÄTTE ISARWINKEL" in dark capitals
 * over the awnings from the middle to the S end, a painted Alpine landscape over it at the S end of the first floor; a
 * small terracotta tile lean-to over the N part of the ground floor, red awnings along the rest; a hedge and grey pots
 * of shrubs in the front garden; a pole sign at the car park with a white "Restaurant Isarwinkel" board (the brewery
 * roundel over it is unreadable, so it is left out, as the spec says).
 *
 * The map puts a synthetic building, -159 (photo.ts found the awnings' red in the DOP20 and took it for a shed), over the
 * whole front garden, u -9…8.5, n 4.4–9.9 in the street frame, its W side on the back 2 m of the pavement. It stays the
 * solid it is; `GASTSTAETTE_ISARWINKEL_TERRACE` only lowers it to a paved terrace inside a low stone wall (0.15 m +
 * the 0.6 m parapet), so the hedge and pots stand on it and what blocks the way reads as the garden.
 *
 * For the play camera (nearly straight down) the lettering goes on a shallow yellow box over the awnings and again on
 * the W roof plane. Guesses (read off two photos at an angle, no measure): the lettering's and mural's size and place,
 * the box (painted on the wall in 01), the roof lettering (no roof photo), the lean-to's and awnings' heights, depths
 * and split, the hedge's and pots' places, the pole's place, height and board size, the wall and awning colours. Not
 * built: the lanterns, the wooden trellis screens, the brewery roundel, the new hotel wing (2027, not in the photos),
 * the N/E facades (no reference).
 */
const YELLOW: Rgba = [238, 222, 170, 255]
const ROOF_GREY: Rgba = [160, 166, 162, 255]
const BACK_GREY: Rgba = [112, 120, 114, 255]
const TILE: Rgba = [200, 136, 111, 255]
const AWNING_RED: Rgba = [218, 88, 86, 255]

/** The street front and the LoD2 heights; the pitches keep the model's ridges over OSM's depths. */
const FRONT = 5
const EAVES = 10.8
const PITCH = 19.15
const WING_EAVES = 7.8
const WING_PITCH = 13.25
const flat = (top: number) => (top - 0.6) / 3

/** The outline's corners (way 119894071) and the LoD2 cut points carried onto it (comments: s, t on wall 5). */
const C = {
  p0: [3877.6, 4788.4],
  p1: [3890.5, 4782.6],
  p2: [3894.2, 4790.4],
  p3: [3899.9, 4787.7],
  p4: [3903.4, 4795.4],
  p5: [3884.6, 4804.1],
  /** (0, 11) on the N wall, (8.44, 11) under the wing's N wall, (17.04, 11) on the S wall: the house's back line. */
  a: [3887.64, 4783.89],
  c: [3891.08, 4791.63],
  b: [3894.59, 4799.48],
} as const
const ring = (...keys: ReadonlyArray<keyof typeof C>) => keys.flatMap((k) => C[k])

const MASSES: ReadonlyArray<Mass> = [
  // The house: gables at the N wall (edge 1) and the S wall (edge 3).
  { pts: ring("p5", "p0", "a", "b"), levels: EAVES / 3, roof: { colour: ROOF_GREY, hip: PITCH, gables: [1, 3] } },
  // The flat part behind its N half, and the SE wing with gables N (edge 0) and S (edge 2).
  { pts: ring("a", "p1", "p2", "p3", "c"), levels: flat(4.81), roof: { colour: BACK_GREY, pitched: false } },
  { pts: ring("c", "p3", "p4", "b"), levels: WING_EAVES / 3, roof: { colour: BACK_GREY, hip: WING_PITCH, gables: [0, 2] } },
]

/**
 * Wall 5 in the street frame (hung on the POI): its u 0 lies at the frame's u -9.129, n 9.815, and it runs 0.0595 rad
 * off the street. `out` meters in front of the wall at its `u`, with the angle along it.
 */
const WALL_U0 = -9.129
const WALL_N0 = 9.815
const WALL_ANGLE = 0.0595
const atWall = (u: number, out: number) => ({
  u: WALL_U0 + u * Math.cos(WALL_ANGLE) + out * Math.sin(WALL_ANGLE),
  n: WALL_N0 + u * Math.sin(WALL_ANGLE) - out * Math.cos(WALL_ANGLE),
  angle: WALL_ANGLE,
})

/** The tile lean-to over the N part of the ground floor, a red awning under it, the long red awning on to the S end. */
const LEAN_TO = { u0: 0.3, u1: 6.0, z: 3.7, depth: 2.0 } as const
const AWNINGS = [
  { u0: 0.5, u1: 5.8, z: 3.2, depth: 2.7 },
  { u0: 6.0, u1: 16.9, z: 3.5, depth: 2.7 },
] as const

/** The name (11:1) on a yellow box (0.3 m deep) over the long awning, and the mural (2:1) over it at the S end. */
const NAME = { u0: 6.1, u1: 14.9, z0: 3.9, depth: 0.3 } as const
const NAME_Z1 = NAME.z0 + (NAME.u1 - NAME.u0) / 11
const MURAL = { u0: 10.3, u1: 15.5, z0: 5.0 } as const

/** The name again on the W roof plane, for the top-down camera (a guess). */
const TAN = Math.tan((PITCH * Math.PI) / 180)
const ROOF_NAME = { u0: 1.5, u1: 15.7, n0: 1.0 } as const
const ROOF_N1 = ROOF_NAME.n0 + (ROOF_NAME.u1 - ROOF_NAME.u0) / 11

/** The front garden on the terrace (building -159, its wall top 0.75 m): a hedge along the pavement's back on the N part, grey pots of shrubs by the entrance at the S end, out past the awnings. */
const HEDGE = { u0: 0.4, u1: 10.6, out: 2.6 } as const
const POTS = [
  [11.4, 3.3],
  [12.6, 3.4],
  [16.4, 3.3],
] as const

/** The pole sign at the car park S of the house (street frame): a grey post, the white board facing the street. */
const POLE = { u: 16.5, n: 7.4 } as const
const POLE_GREY: Rgba = [96, 98, 100, 255]

export const GASTSTAETTE_ISARWINKEL: PlaceDressing = {
  poi: "Gaststätte Isarwinkel",
  street: "Richard-Wagner-Straße",
  osmBuildingId: 119894071,
  levels: EAVES / 3,
  facade: "render",
  wallColour: YELLOW,
  masses: MASSES,
  parts: [
    { kind: "canopy", edge: FRONT, ...LEAN_TO, colour: TILE, texture: "roof-tiles" },
    ...AWNINGS.map((a): Part => ({ kind: "canopy", edge: FRONT, ...a, colour: AWNING_RED, texture: "awning", fascia: { h: 0.35, colour: AWNING_RED } })),
    { kind: "pylon", ...atWall((NAME.u0 + NAME.u1) / 2, NAME.depth / 2), w: NAME.u1 - NAME.u0, d: NAME.depth, h: NAME_Z1, base: NAME.z0, colour: YELLOW },
    { kind: "wallSign", texture: "isarwinkel-sign", edge: FRONT, u0: NAME.u0, u1: NAME.u1, z0: NAME.z0, z1: NAME_Z1, out: NAME.depth + 0.05 },
    { kind: "wallSign", texture: "isarwinkel-mural", edge: FRONT, u0: MURAL.u0, u1: MURAL.u1, z0: MURAL.z0, z1: MURAL.z0 + (MURAL.u1 - MURAL.u0) / 2 },
    { kind: "roofSign", texture: "isarwinkel-sign", edge: FRONT, u0: ROOF_NAME.u0, u1: ROOF_NAME.u1, n0: ROOF_NAME.n0, n1: ROOF_N1, z0: EAVES + ROOF_NAME.n0 * TAN + 0.06, z1: EAVES + ROOF_N1 * TAN + 0.06 },
    { kind: "sprite", name: "malor-hedge", ...atWall((HEDGE.u0 + HEDGE.u1) / 2, HEDGE.out), z: 1.4, len: HEDGE.u1 - HEDGE.u0 },
    ...POTS.map(([u, out]): Part => ({ kind: "sprite", name: "isarwinkel-planter", ...atWall(u, out), z: 1.5, len: 0.9 })),
    { kind: "pylon", u: POLE.u, n: POLE.n, angle: 0, w: 0.12, d: 0.12, h: 3.3, colour: POLE_GREY },
    { kind: "pylon", u: POLE.u, n: POLE.n, angle: 0, w: 2.1, d: 0.08, h: 3.3, base: 2.6, colour: [246, 246, 244, 255], texture: "isarwinkel-pole", z0: 2.6, z1: 3.3 },
  ],
}


/** The terrace's paving and its low wall. */
const PAVING: Rgba = [198, 192, 182, 255]
const STONE: Rgba = [176, 172, 164, 255]

/** Building -159, the synthetic "shed" over the front garden, as a low walled terrace (see above). */
export const GASTSTAETTE_ISARWINKEL_TERRACE: PlaceDressing = {
  poi: "Gaststätte Isarwinkel",
  street: "Richard-Wagner-Straße",
  osmBuildingId: -159,
  levels: 0.05,
  facade: "render",
  wallColour: STONE,
  roof: { colour: PAVING, pitched: false },
  parts: [],
}
