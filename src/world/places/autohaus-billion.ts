import type { Rgba } from "#/render/scene/mesh.ts"
import type { Mass, Part, PlaceDressing } from "./dressing.ts"

/**
 * Autohaus Billion, Sudetenstraße 25 (B6a-8): the VW / Audi / Seat / Škoda dealer SE of the start, way 120402846 on the
 * NE side of Sudetenstraße. OSM's name is "Autohaus Billion" (also the website and the side sign in
 * reference/autohaus-billion/05); the POI keeps the brand list build.ts gives it. The street front is wall 12 (56.59 m,
 * u 0 at its NW corner, running SE); in its frame (s along it, t into the building) the outline is nearly rectilinear.
 *
 * The Bavarian LoD2 model (2026, tile 684_5302) lies about 2.5 m behind OSM's front (as along the whole row), so its
 * cut lines are carried square onto OSM's outline, which stays the solid:
 * - `DEBY_LOD2_4602925`, the white two-storey showroom block (s 27.8 to the SE wall): a gable roof along the street,
 *   eaves 8.1 m, ridge 10.2 m, gables at both ends; drawn at 15.4° over OSM's 15.35 m depth to keep the ridge.
 * - `DEBY_LOD2_23835687` + `105019359`, the low NW showroom (s 0–27.8): a gable along the street, eaves 4.25 m, ridge
 *   6.0 m (12.8° over OSM's depth), gables at the slanted NW wall and against the block; its back part flat at 4.1 m.
 * - `DEBY_LOD2_4603394` / `4603396`, the workshop halls behind, flat at 5.25 m / 5.0 m, cut at OSM's step (s 47.86).
 * DOP20: brown tiles on the block, light grey on the NW showroom with solar panels, a grey flat hall with skylights and
 * a white one to the SE.
 *
 * Street View (01 key, 02, 03): the block's ground floor is showroom glass between grey pillars under terracotta
 * awnings, a white plate "Autohaus B…" on the upper wall right of the middle, a light-grey VW "Service" pylon and three
 * blue/white flags at the NW end of the forecourt, cars parked nose-in on the paving. OSM's front stands 2.5–4.5 m from
 * the back of the pavement here (the real forecourt is deeper), so the cars stand parallel to the front, past the
 * awnings' edge, without reaching the pavement.
 *
 * Guesses: the plate's size and place, its box (a flat plate in 01), the plate on the roof (no photo; for the top-down
 * camera), the awnings' height, depth and split into three, the bay widths, the NW showroom's glazing (01 shows it
 * only behind the pylon), the pylon's and flags' places and sizes, the cars' places, colours and parallel parking, the
 * solar field's extent, the wall and roof colours. Not built: the blue-grey "Autohaus Billion" side sign (03: its
 * place on the front is unclear), the small VW roundel at the block's SE end (02), the delivery van, the street tree.
 */
const WHITE: Rgba = [250, 250, 248, 255]
const GREY_WALL: Rgba = [214, 216, 216, 255]
const TILES: Rgba = [166, 118, 92, 255]
const LIGHT_ROOF: Rgba = [214, 214, 212, 255]
const HALL_GREY: Rgba = [168, 166, 156, 255]
const HALL_WHITE: Rgba = [236, 234, 232, 255]

/** The street front, wall 12, and the cut between the low NW showroom and the block (s from the NW corner). */
const FRONT = 12
const FRONT_L = 56.59
const BLOCK_S = 27.8
/** The LoD2 eaves and the pitches that keep its ridges over OSM's 15.35 m depth. */
const BLOCK_EAVES = 8.1
const BLOCK_PITCH = 15.4
const LOW_EAVES = 4.25
const LOW_PITCH = 12.8
const flat = (top: number) => (top - 0.6) / 3

/** The outline's corners (way 120402846) and the LoD2 cut points carried onto it (comments: s, t on wall 12). */
const C = {
  p0: [4082.2, 4702.2],
  p1: [4090.9, 4688.5],
  p2: [4097.7, 4692.8],
  p3: [4100.9, 4687.9],
  p4: [4108.7, 4676.1],
  p5: [4094.3, 4666.8],
  p6: [4096.7, 4663],
  p7: [4076.9, 4650.4],
  p8: [4067.6, 4665.2],
  p9: [4052.8, 4655.8],
  /** (6.85, 15.35): the NW showroom's back line runs on from here. */
  p10: [4048.4, 4662.6],
  p11: [4039.4, 4656.9],
  p12: [4034.4, 4671.9],
  /** (27.8, 0) and (27.8, 15.35): the block's NW gable. */
  a0: [4057.88, 4686.78],
  a1: [4066.1, 4673.82],
  /** (24.45, 15.35), (47.86, 15.35), (56.61, 15.35): the halls' front line, the step between them, the SE wall. */
  b: [4063.27, 4672.03],
  c: [4083.04, 4684.56],
  d: [4090.43, 4689.24],
} as const
const ring = (...keys: ReadonlyArray<keyof typeof C>) => keys.flatMap((k) => C[k])

const MASSES: ReadonlyArray<Mass> = [
  // The showroom block: gables at the SE wall (edge 0) and the NW cut (edge 2).
  { pts: ring("p0", "d", "a1", "a0"), levels: BLOCK_EAVES / 3, roof: { colour: TILES, hip: BLOCK_PITCH, gables: [0, 2] } },
  // The low NW showroom: gables against the block (edge 0) and at the slanted NW wall (edge 2).
  { pts: ring("a0", "a1", "p11", "p12"), levels: LOW_EAVES / 3, wallColour: GREY_WALL, roof: { colour: LIGHT_ROOF, hip: LOW_PITCH, gables: [0, 2] } },
  // Its flat back part, and the two workshop halls.
  { pts: ring("b", "p8", "p9", "p10"), levels: flat(4.1), wallColour: GREY_WALL, roof: { colour: LIGHT_ROOF, pitched: false } },
  { pts: ring("p5", "p6", "p7", "p8", "b", "c"), levels: flat(5.25), wallColour: GREY_WALL, roof: { colour: HALL_GREY, pitched: false } },
  { pts: ring("d", "p1", "p2", "p3", "p4", "p5", "c"), levels: flat(5.0), roof: { colour: HALL_WHITE, pitched: false } },
]

/**
 * Wall 12 in the street frame (hung on the POI): its u 0 lies at the frame's u -33.08, n 9.10, and it runs 0.0367 rad
 * off the street (away from it to the SE). `out` meters in front of the wall at its `u`, with the angle along it.
 */
const WALL_U0 = -33.076
const WALL_N0 = 9.098
const WALL_ANGLE = 0.0367
const atWall = (u: number, out: number) => ({
  u: WALL_U0 + u * Math.cos(WALL_ANGLE) + out * Math.sin(WALL_ANGLE),
  n: WALL_N0 + u * Math.sin(WALL_ANGLE) - out * Math.cos(WALL_ANGLE),
  angle: WALL_ANGLE,
})

/** The showroom glazing: bays of glass between grey pillars, up to the awnings on the block, lower on the NW showroom. */
const GLASS_Z = 3.4
const LOW_GLASS_Z = 3.0
const bays = (u0: number, u1: number, n: number, z1: number): Array<Part> =>
  Array.from({ length: n }, (_, i): Part => ({ kind: "wallSign", texture: "billion-showroom", edge: FRONT, u0: u0 + ((u1 - u0) * i) / n, u1: u0 + ((u1 - u0) * (i + 1)) / n, z0: 0, z1 }))

/** The terracotta awnings (#f5bb95 in the sun, deepened for the awning texture's grey), three runs over the block. */
const TERRACOTTA: Rgba = [236, 150, 112, 255]
const AWNING_Z = 3.75
const AWNING_DEPTH = 1.3
const AWNINGS = [
  [28.2, 37.6],
  [37.9, 47.2],
  [47.5, 56.2],
] as const

/** The white plate on a box (0.3 m deep) on the upper wall, right of the middle; 6:1. */
const PLATE = { u0: 44.2, u1: 49.0, z0: 4.4, depth: 0.3 } as const
const PLATE_Z1 = PLATE.z0 + (PLATE.u1 - PLATE.u0) / 6
const PLATE_WHITE: Rgba = [253, 253, 254, 255]

/** The plate again on the block's SW roof plane, for the top-down camera (a guess). */
const TAN = Math.tan((BLOCK_PITCH * Math.PI) / 180)
const ROOF_PLATE = { u0: 31.5, u1: 52.5, n0: 2.0 } as const
const ROOF_N1 = ROOF_PLATE.n0 + (ROOF_PLATE.u1 - ROOF_PLATE.u0) / 6

/** Solar panels on the NW showroom's SW plane (DOP20), strips of about 4 m. */
const LOW_TAN = Math.tan((LOW_PITCH * Math.PI) / 180)
const SOLAR = { u0: 12.5, u1: 24.5, n0: 3.0, n1: 7.0 } as const

/** The VW pylon (light grey #d7d7d6) and the three flags at the NW end of the forecourt, short of the pavement. */
const PYLON = { u: 17.5, out: 1.2, w: 1.2, d: 0.4, h: 3.8 } as const
const FLAGS = [14.0, 15.6, 20.0] as const
const FLAG_OUT = 1.3
const POLE: Rgba = [214, 216, 218, 255]

/** The forecourt cars, parallel to the front past the awnings (`out` to their middle), nose SE or NW. */
const CARS = [
  { u: 31.2, car: 0, flip: false },
  { u: 36.6, car: 1, flip: false },
  { u: 42.0, car: 2, flip: true },
  { u: 47.4, car: 0, flip: false },
  { u: 52.8, car: 3, flip: true },
] as const
const CAR_OUT = 2.2
const CAR_LEN = 4.4

export const AUTOHAUS_BILLION: PlaceDressing = {
  poi: "Audi;Seat;Škoda;Volkswagen",
  street: "Sudetenstraße",
  osmBuildingId: 120402846,
  levels: 3,
  facade: "render",
  wallColour: WHITE,
  masses: MASSES,
  parts: [
    ...bays(BLOCK_S, FRONT_L, 6, GLASS_Z),
    ...bays(0.4, BLOCK_S, 5, LOW_GLASS_Z),
    ...AWNINGS.map(([u0, u1]): Part => ({ kind: "canopy", edge: FRONT, u0, u1, z: AWNING_Z, depth: AWNING_DEPTH, colour: TERRACOTTA, texture: "awning", fascia: { h: 0.45, colour: TERRACOTTA } })),
    { kind: "pylon", ...atWall((PLATE.u0 + PLATE.u1) / 2, PLATE.depth / 2), w: PLATE.u1 - PLATE.u0, d: PLATE.depth, h: PLATE_Z1, base: PLATE.z0, colour: PLATE_WHITE },
    { kind: "wallSign", texture: "billion-plate", edge: FRONT, u0: PLATE.u0, u1: PLATE.u1, z0: PLATE.z0, z1: PLATE_Z1, out: PLATE.depth + 0.05 },
    { kind: "roofSign", texture: "billion-plate", edge: FRONT, u0: ROOF_PLATE.u0, u1: ROOF_PLATE.u1, n0: ROOF_PLATE.n0, n1: ROOF_N1, z0: BLOCK_EAVES + ROOF_PLATE.n0 * TAN + 0.06, z1: BLOCK_EAVES + ROOF_N1 * TAN + 0.06 },
    ...[0, 1, 2].map((i): Part => {
      const u0 = SOLAR.u0 + ((SOLAR.u1 - SOLAR.u0) * i) / 3
      return { kind: "roofSign", texture: "solar-field", edge: FRONT, u0, u1: u0 + (SOLAR.u1 - SOLAR.u0) / 3, n0: SOLAR.n0, n1: SOLAR.n1, z0: LOW_EAVES + SOLAR.n0 * LOW_TAN + 0.05, z1: LOW_EAVES + SOLAR.n1 * LOW_TAN + 0.05 }
    }),
    { kind: "pylon", ...atWall(PYLON.u, PYLON.out), w: PYLON.w, d: PYLON.d, h: PYLON.h, colour: [215, 215, 214, 255], texture: "vw-pylon", z0: 0.2, z1: PYLON.h - 0.1 },
    ...FLAGS.map((u): Part => ({ kind: "sprite", name: "vw-flag", ...atWall(u, FLAG_OUT), z: 6, len: 2.2, pole: POLE })),
    ...CARS.map((c): Part => {
      const p = atWall(c.u, CAR_OUT)
      return { kind: "sprite", name: `billion-car-${c.car}`, ...p, z: 1.5, angle: p.angle + (c.flip ? Math.PI : 0), len: CAR_LEN }
    }),
  ],
}
