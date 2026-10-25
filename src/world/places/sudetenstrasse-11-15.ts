import type { Rgba } from "#/render/scene/mesh.ts"
import type { Mass, Part, PlaceDressing } from "./dressing.ts"

/**
 * Sudetenstraße 11–15, the row NW of the Mühlenbäck block (way 127604891) it shares its SE wall with: way 127604887,
 * one OSM outline over four shop units, NW to SE VR Bank München Land (No. 11, the corner by the car park), Bodystreet,
 * Stroblume and Dolce Gelato (No. 15), then a recessed passage to the house door. The street front is wall 4 (36.33 m,
 * u 0 at its NW end) plus wall 5, a 2.97 m jog that carries it on to the NW corner; `UNITS` gives each unit's stretch
 * of wall 4, so B6a-4 (Stroblume) and B6a-5 (VR Bank) add their parts in their own sections below.
 *
 * The Bavarian LoD2 model (2026, tile 684_5302) has four houses here: `DEBY_LOD2_4602982` the white VR corner house
 * (hipped to the NW), `DEBY_LOD2_4602981` (Bodystreet) and `DEBY_LOD2_4602922` (Stroblume, Dolce Gelato) under one gable
 * roof along the street that ends in a gable at the Mühlenbäck wall, and `DEBY_LOD2_4602983` the hipped back wing on
 * the NE. Eaves 9.3–9.4 m, ridges 11.2–11.3 m. The model's houses are about 3 m NE of OSM's front (the DOP20 agrees with
 * the model: the awnings lie in that strip), so its cut lines are carried square across OSM's outline, which stays the
 * solid (the Mühlenbäck front is OSM's line too): the cuts at wall 4 u 7.2 and 17.3. Drawn at 16° on OSM's 13.1 m depth
 * to keep the model's ridge. DOP20: terracotta tiles on the SE house and the back wing, grey-brown on the other two.
 *
 * Dolce Gelato (B6a-3, reference/dolce-gelato/01 key, 02): a white light-box plate with "Dolce Gelato" over a
 * raspberry awning across its front, white plastic chairs and tables under it. The small orange disc under the plate in
 * 01 is a Google Maps pin, not on the wall. Guesses: where Stroblume ends and Dolce Gelato begins, the passage's
 * width, the awning's depth, the sign box's depth and size, the glazing (painted after 01: the interior is too dark).
 * Not built: the blue parking sign and the street tree in front (no sign or tree part).
 */
const WHITE: Rgba = [252, 252, 250, 255]
/** The beige render, sampled #e3d6b0-ish off 01/02 in the sun, divided by the render's own #edeadf. */
const BEIGE: Rgba = [244, 232, 200, 255]
const TILES: Rgba = [190, 120, 86, 255]
const GREY_TILES: Rgba = [140, 130, 112, 255]

/** The LoD2 eaves (9.3–9.4 m) and the pitch that keeps its ridge (11.2–11.3 m) over OSM's 13.1 m depth. */
const EAVES = 9.35
const PITCH = 16

/** Wall 4's unit stretches (u from its NW end); the VR Bank also has all of wall 5. Shop boundaries other than the LoD2 cuts are guesses. */
export const UNITS = {
  vrBank: [0, 7.2],
  bodystreet: [7.2, 17.3],
  stroblume: [17.3, 27.0],
  dolceGelato: [27.0, 33.5],
  passage: [33.5, 36.33],
} as const

/** Same heights as the Mühlenbäck row next door: glazing up to FRONT_Z, the signs from it, awnings' tops at AWNING_Z. */
const FRONT_Z = 2.85
const AWNING_Z = 2.55
const WALL = 4

/**
 * Wall 4 in the street frame (hung on Dolce Gelato's POI): its u 0 lies at the frame's u -29.08, n 6.89, and it runs
 * 0.0065 rad off the street. `out` meters in front of the wall at its `u`, for the parts in the street frame.
 */
const WALL_U0 = -29.08
const WALL_N0 = 6.89
const WALL_ANGLE = 0.0065
const atWall = (u: number, out: number) => ({
  u: WALL_U0 + u * Math.cos(WALL_ANGLE) + out * Math.sin(WALL_ANGLE),
  n: WALL_N0 + u * Math.sin(WALL_ANGLE) - out * Math.cos(WALL_ANGLE),
})

/** The outline's corners (way 127604887) and the LoD2 cut points carried onto it. */
const C = {
  c0: [3967.3, 4598.3],
  c1: [3977.3, 4604.9],
  c2: [3970.3, 4615.4],
  c3: [3993.3, 4630.6],
  c4: [3985.8, 4641.5],
  c6: [3953.1, 4619.7],
  /** Wall 4 u 7.2 (VR | Bodystreet) at the front and at the back wing, and the back wing's SW side on the NW wall. */
  a0: [3961.58, 4625.3],
  a1: [3968.86, 4614.43],
  b: [3960.37, 4608.75],
  /** Wall 4 u 17.3 (Bodystreet | Stroblume) at the front and the back. */
  d0: [3969.98, 4630.92],
  d1: [3977.28, 4620.01],
} as const
const ring = (...keys: ReadonlyArray<keyof typeof C>) => keys.flatMap((k) => C[k])
const mass = (pts: ReadonlyArray<number>, wallColour: Rgba, colour: Rgba, gables: ReadonlyArray<number>): Mass => ({
  pts,
  levels: EAVES / 3,
  wallColour,
  roof: { colour, hip: PITCH, gables },
})

const MASSES: ReadonlyArray<Mass> = [
  // The VR corner house: hipped to the NW, its ridge running on into Bodystreet's through the gable at the cut (edge 1).
  mass(ring("c6", "a0", "a1", "b"), WHITE, GREY_TILES, [1]),
  // Bodystreet's house, gables at both cuts (edges 1 and 3).
  mass(ring("a0", "d0", "d1", "a1"), BEIGE, GREY_TILES, [1, 3]),
  // Stroblume and Dolce Gelato: a gable at the Mühlenbäck wall (edge 1) and at the cut (edge 3).
  mass(ring("d0", "c4", "c3", "d1"), BEIGE, TILES, [1, 3]),
  // The hipped back wing (its walls are not in any photo: white like the corner house, a guess).
  mass(ring("b", "c2", "c1", "c0"), WHITE, TILES, []),
]

/** Dolce Gelato's raspberry awning (#d46172 sampled off 01, lifted for the awning texture's grey) and white plate. */
const RASPBERRY: Rgba = [226, 104, 122, 255]
const PLATE: Rgba = [240, 238, 240, 255]
/** The plate on a box (a guess: 0.3 m deep), so the straight-down play camera sees a white strip over the awning. */
const DOLCE_SIGN = { u0: 28.5, u1: 32.0, z1: 3.75, depth: 0.3 } as const
/**
 * The awning as deep as the Mühlenbäck row's (1.4 m; 01 suggests about 2 m, but OSM's front stands 3 m out into the
 * pavement), the terrace tables at its edge, `out` meters from the wall, so the play camera sees the chairs past it.
 */
const DOLCE_AWNING = 1.4
const TERRACE = [28.6, 31.6] as const
const TERRACE_OUT = 1.7

export const DOLCE_GELATO: ReadonlyArray<Part> = [
  { kind: "wallSign", texture: "dolce-gelato-front", edge: WALL, u0: UNITS.dolceGelato[0], u1: UNITS.dolceGelato[1], z0: 0, z1: FRONT_Z },
  { kind: "canopy", edge: WALL, u0: UNITS.dolceGelato[0] + 0.1, u1: UNITS.dolceGelato[1] - 0.1, z: AWNING_Z, depth: DOLCE_AWNING, colour: RASPBERRY, texture: "awning" },
  {
    kind: "pylon",
    ...atWall((DOLCE_SIGN.u0 + DOLCE_SIGN.u1) / 2, DOLCE_SIGN.depth / 2),
    angle: WALL_ANGLE,
    w: DOLCE_SIGN.u1 - DOLCE_SIGN.u0,
    d: DOLCE_SIGN.depth,
    h: DOLCE_SIGN.z1,
    base: FRONT_Z,
    colour: PLATE,
  },
  { kind: "wallSign", texture: "dolce-gelato-sign", edge: WALL, u0: DOLCE_SIGN.u0, u1: DOLCE_SIGN.u1, z0: FRONT_Z, z1: DOLCE_SIGN.z1, out: DOLCE_SIGN.depth + 0.02 },
  // Two white tables with a chair each side at the awning's edge, about a meter of pavement left before the kerb.
  ...TERRACE.map((u): Part => ({ kind: "sprite", name: "gelato-terrace", ...atWall(u, TERRACE_OUT), z: 0.75, angle: WALL_ANGLE, len: 1.9 })),
]

/**
 * Stroblume (B6a-4, reference/stroblume/01 key, 02): a florist under a long red awning (#d25f5e sampled off 01, lifted
 * like Dolce Gelato's) whose valance carries "Stroblume" in white script with a small flower logo and curly lines.
 * The awning's sloping face is drawn as a red box over the flat awning, the row's 2.85 m bottom, its front the script
 * band, so the straight-down play camera sees a red strip over the awning and the lettering reads from across the
 * street. On the pavement a wooden table full of potted flowers and a red heart sign on a stand, just past the
 * awning's edge so the play camera sees them (OSM's front stands 3 m out into the pavement: on the real, wider
 * pavement the table stands about as far from the glass with more room to the kerb). Guesses: the box's depth and
 * height, the table's size and place, the plain shop glazing behind the plants (01: dark glass, too dark to paint).
 */
const STRO_RED: Rgba = [224, 101, 100, 255]
const STRO_SIGN = { u0: 17.8, u1: 26.5, z1: 3.75, depth: 0.3 } as const
/** The script band covers the box's front (process-sprites.py pads the lettering with the fabric's red to its 8.7 x 0.9 m). */
const STRO_SCRIPT = [STRO_SIGN.u0, STRO_SIGN.u1] as const
const STRO_AWNING = 1.4
/** The plant tables (u along wall 4, long side along it) and the heart sign, `out` meters from the wall. */
const PLANT_TABLES = [
  { u: 20.0, len: 1.6 },
  { u: 22.8, len: 2.2 },
] as const
const PLANTS_OUT = 1.75
const HEART = { u: 24.6, out: 1.85 } as const
/** Upright boards turn by minus the Sudetenstraße frame's angle (0.596 rad) to read upright on screen, as Mühlenbäck's board. */
const UPRIGHT = -0.596

export const STROBLUME: ReadonlyArray<Part> = [
  { kind: "wallSign", texture: "shop-front", edge: WALL, u0: UNITS.stroblume[0], u1: UNITS.stroblume[1], z0: 0, z1: FRONT_Z },
  { kind: "canopy", edge: WALL, u0: UNITS.stroblume[0] + 0.1, u1: UNITS.stroblume[1] - 0.1, z: AWNING_Z, depth: STRO_AWNING, colour: STRO_RED, texture: "awning" },
  {
    kind: "pylon",
    ...atWall((STRO_SIGN.u0 + STRO_SIGN.u1) / 2, STRO_SIGN.depth / 2),
    angle: WALL_ANGLE,
    w: STRO_SIGN.u1 - STRO_SIGN.u0,
    d: STRO_SIGN.depth,
    h: STRO_SIGN.z1,
    base: FRONT_Z,
    colour: STRO_RED,
  },
  { kind: "wallSign", texture: "stroblume-sign", edge: WALL, u0: STRO_SCRIPT[0], u1: STRO_SCRIPT[1], z0: FRONT_Z, z1: STRO_SIGN.z1, out: STRO_SIGN.depth + 0.02 },
  ...PLANT_TABLES.map((t): Part => ({ kind: "sprite", name: "stroblume-plants", ...atWall(t.u, PLANTS_OUT), z: 0.8, angle: WALL_ANGLE, len: t.len })),
  { kind: "sprite", name: "stroblume-heart", ...atWall(HEART.u, HEART.out), z: 1.0, angle: UPRIGHT, len: 0.9 },
]

/**
 * VR Bank München Land (B6a-5, reference/vr-bank-zentrum/01 key, 02): the white corner house's ground floor is orange
 * render (#e2a470 sun / #d68756 shade) around a glass entrance at the NW and two wide white-framed windows with frosted
 * film; a thin grey metal canopy (#787c75) runs over the whole front, and above it blue letters "VR Bank München Land"
 * with the square VR logo stand on the white wall. Its front is wall 5 (2.97 m, the entrance) plus wall 4 u 0–7.2 (the
 * windows), 10.2 m, about what 01 shows; the orange stops at the LoD2 cut, so none reaches Bodystreet. The letters span
 * 01's 7 % to 76 % of the front (10.17 m): they go on a box in line with the row's signs (the 2.85 m bottom, sitting on
 * the canopy), blue so the straight-down play camera sees a blue strip in front of the white house; the lettering on
 * the white wall goes on its front as two wallSigns, the logo half on wall 5 and the words on wall 4 (one texture cut at
 * the corner). The canopy is only 0.45 m deep, so a little of the orange below it shows past it. Guesses: the canopy's
 * depth, the box and its blue sides and top (the real letters are single letters on the wall), the door's and windows'
 * widths. Not built: the ATM (OSM atm=yes, place unknown), the street-name plate, the A-board.
 */
const VR_GREY: Rgba = [120, 124, 117, 255]
const VR_BLUE: Rgba = [85, 116, 213, 255]
/** Wall 5's 2.97 m ends at wall 4's u 0 almost in line with it (0.017 rad off): the box spans both, placed off wall 4. */
const VR_FRONT = 10.17
const VR_WALL5 = 2.97
const VR_SIGN = { c0: 0.07 * VR_FRONT, c1: 0.76 * VR_FRONT, z1: 3.75, depth: 0.3 } as const
const VR_CANOPY = 0.45

export const VR_BANK: ReadonlyArray<Part> = [
  { kind: "wallSign", texture: "vr-bank-door", edge: 5, u0: 0, u1: VR_WALL5, z0: 0, z1: FRONT_Z },
  { kind: "wallSign", texture: "vr-bank-front", edge: WALL, u0: UNITS.vrBank[0], u1: UNITS.vrBank[1], z0: 0, z1: FRONT_Z },
  { kind: "canopy", edge: 5, u0: 0.1, u1: VR_WALL5, z: FRONT_Z, depth: VR_CANOPY, colour: VR_GREY },
  { kind: "canopy", edge: WALL, u0: UNITS.vrBank[0], u1: UNITS.vrBank[1] - 0.1, z: FRONT_Z, depth: VR_CANOPY, colour: VR_GREY },
  {
    kind: "pylon",
    ...atWall((VR_SIGN.c0 + VR_SIGN.c1) / 2 - VR_WALL5, VR_SIGN.depth / 2),
    angle: WALL_ANGLE,
    w: VR_SIGN.c1 - VR_SIGN.c0,
    d: VR_SIGN.depth,
    h: VR_SIGN.z1,
    base: FRONT_Z,
    colour: VR_BLUE,
  },
  { kind: "wallSign", texture: "vr-bank-logo", edge: 5, u0: VR_SIGN.c0, u1: VR_WALL5, z0: FRONT_Z, z1: VR_SIGN.z1, out: VR_SIGN.depth + 0.05 },
  { kind: "wallSign", texture: "vr-bank-sign", edge: WALL, u0: 0, u1: VR_SIGN.c1 - VR_WALL5, z0: FRONT_Z, z1: VR_SIGN.z1, out: VR_SIGN.depth + 0.05 },
]

/** The open passage at the SE end, the house door at its back (01, right of the awning). */
const PASSAGE: ReadonlyArray<Part> = [{ kind: "wallSign", texture: "passage-door", edge: WALL, u0: UNITS.passage[0] + 0.1, u1: UNITS.passage[1] - 0.1, z0: 0, z1: FRONT_Z }]

export const SUDETENSTRASSE_11_15: PlaceDressing = {
  poi: "Dolce Gelato",
  street: "Sudetenstraße",
  osmBuildingId: 127604887,
  levels: 3,
  facade: "render",
  wallColour: BEIGE,
  masses: MASSES,
  parts: [...VR_BANK, ...STROBLUME, ...DOLCE_GELATO, ...PASSAGE],
}
