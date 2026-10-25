import type { Rgba } from "#/render/scene/mesh.ts"
import type { Part, PlaceDressing } from "./dressing.ts"

/**
 * Metzgerei Länger, Amselweg 9: way 858188287, one OSM outline over the butcher's house and its low back wing. The shop
 * front faces NW onto the paved forecourt (wall 2, 13.76 m, u 0 at its N end); the three-storey house with the
 * red-brown pilasters is set back beside it (wall 4, facing W, u 0 at its N end). The street frame hangs on the Amselweg
 * stretch NE of the house (foot at 2671, 2487.5), so the forecourt props sit far out in it.
 *
 * The Bavarian LoD2 model (2026, tile 684_5304) has it as two buildings. `DEBY_LOD2_4533034`: a hipped block (roofType
 * 3200) with eaves at 8.36 m and its ridge at 9.42 m, 7.3 m deep, the ridge running NNE; on its N and NW sides a lower
 * part under a shallow gable whose ridge (6.65 m) runs ESE square to the shop front, the eaves 5.06 m (SW) and 5.72 m
 * (NE). `DEBY_LOD2_4533949`: the low wing round the E and S sides (roofType 3100), 4.3–4.9 m along the E strip and
 * 2.5–3.5 m over the S part. The model lines up with the DOP20; OSM's outline is up to 3 m wider on the W side, so the
 * masses below are the model's cut lines carried out to OSM's walls: the hipped block is 9.4 m deep here, drawn at
 * 12.7° to keep the model's ridge. DOP20: the block's tiles brown (#aa937c sunlit), the wing's paler (#c0a280).
 *
 * Street View (reference/metzgerei-laenger/01 key, 02, 03): white render; on the shop front a big black cow over the
 * left window, a window, a smaller window and the crest sign (05: "Aus Liebe zum Handwerk / Metzgerei Länger", ram, cow
 * and pig heads) upstairs; downstairs the shop window under a red and white awning, the open entrance, a pig picture
 * board and a menu, a white house door, dark menu boards; a slim dark green fascia over the whole ground floor. The
 * three-storey block: red-brown pilasters and a red-brown band under the eaves, a second crest low on its front;
 * benches and planters in front of it.
 *
 * Guesses (off photos taken at an angle, no measure): every part's u and z, the window count, the textures (painted
 * after the photos), the pilasters' count (three on wall 4) and colour, the wing's flat roof (the model has a very low
 * gable), the roof colours, the roof board (no photo of the roof), the bench and planter spots. Not built: the paved
 * forecourt's colour (map ground), the garages' doors on the wing (render windows instead), the balcony on the block,
 * the AC unit, the N/E/S sides' details (no reference).
 */
const WHITE: Rgba = [244, 243, 239, 255]
const ROOF: Rgba = [160, 104, 82, 255]
const WING_ROOF: Rgba = [178, 140, 110, 255]
const PILASTER: Rgba = [140, 102, 108, 255]
const FASCIA: Rgba = [45, 53, 55, 255]

/** The LoD2 heights: the hipped block's eaves (ridge 9.42 m over 4.72 m), the shop house's eaves, the wing's two parts. */
const BLOCK_EAVES = 8.36
const BLOCK_PITCH = 12.7
const SHOP_EAVES = 5.4
const SHOP_PITCH = 12
const EAST_TOP = 4.6
const WING_TOP = 3.2

/** The outline's corners (way 858188287) and the model's cut points carried out to them. */
const C = {
  c0: [2670.8, 2489.3],
  c1: [2664.9, 2482.8],
  c2: [2654.8, 2476.3],
  c3: [2647.4, 2487.9],
  c4: [2651.7, 2490.7],
  c5: [2647.3, 2497.6],
  c6: [2648.8, 2498.6],
  c7: [2646.5, 2502.1],
  c8: [2656.4, 2508.5],
  c9: [2650.6, 2517.4],
  c10: [2658.8, 2522.7],
  c11: [2671.5, 2503.1],
  c12: [2664.7, 2498.7],
  /** The block's NW corner (its W side carried along wall 4), NE and SE corners, and its S side meeting wall 4. */
  x: [2655.8, 2482.3],
  ne: [2664.2, 2486.6],
  se: [2657.4, 2500.3],
  z: [2648.47, 2495.77],
} as const
const ring = (...keys: ReadonlyArray<keyof typeof C>) => keys.flatMap((k) => C[k])

/** Shop front (wall 2) spots, u from its N end. */
const FASCIA_Z = 2.85
const AWNING = [1.0, 5.0] as const
/** Wall 4's block part (u 0 to the wing at 6.0): pilasters at both ends and in the middle, from the ground floor's top. */
const BLOCK_W = 6.0
const PILASTER_W = 0.45

/** The forecourt props in the street frame: along wall 4 (angle 1.788 in the frame), the wall at (-0.976, -0.216) of each. */
const ALONG = 1.788
const BENCHES = [
  [11.39, 20.51],
  [8.4, 25.81],
] as const
const PLANTERS = [
  [12.05, 17.09],
  [10.81, 22.65],
] as const
const WOOD: Rgba = [112, 78, 52, 255]

const sign = (texture: Extract<Part, { kind: "wallSign" }>["texture"], edge: number, u0: number, u1: number, z0: number, z1: number): Part => ({ kind: "wallSign", texture, edge, u0, u1, z0, z1 })

export const METZGEREI_LAENGER: PlaceDressing = {
  poi: "Metzgerei Länger",
  street: "Amselweg",
  osmBuildingId: 858188287,
  facade: "render",
  wallColour: WHITE,
  masses: [
    // The shop house on the N and NW sides: plain render (its windows are drawn), gables on the shop front (1) and the E end (5).
    { pts: ring("c1", "c2", "c3", "c4", "x", "ne"), levels: SHOP_EAVES / 3, roof: { colour: ROOF, hip: SHOP_PITCH, gables: [1, 5] }, bands: [{ z0: 0, z1: SHOP_EAVES + 0.6, colour: WHITE, plain: true }] },
    // The hipped three-storey block, the red-brown band under its eaves.
    { pts: ring("c4", "z", "se", "ne", "x"), levels: BLOCK_EAVES / 3, roof: { colour: ROOF, hip: BLOCK_PITCH }, bands: [{ z0: BLOCK_EAVES - 0.4, z1: BLOCK_EAVES, colour: PILASTER, plain: true }] },
    // The wing: its taller E strip and its low S part.
    { pts: ring("c0", "c1", "ne", "se", "c12"), levels: EAST_TOP / 3, roof: { pitched: false, colour: WING_ROOF } },
    { pts: ring("c12", "se", "z", "c5", "c6", "c7", "c8", "c9", "c10", "c11"), levels: WING_TOP / 3, roof: { pitched: false, colour: WING_ROOF } },
  ],
  parts: [
    // Shop front, ground floor: the dark green fascia over it all, the awning over the window, entrance, boards.
    { kind: "canopy", edge: 2, u0: 0.3, u1: 13.5, z: FASCIA_Z, depth: 0.35, colour: FASCIA, fascia: { h: 0.28, colour: FASCIA } },
    { kind: "canopy", edge: 2, u0: AWNING[0], u1: AWNING[1], z: 2.5, depth: 0.9, colour: [255, 255, 255, 255], texture: "metz-awning" },
    sign("metz-window", 2, AWNING[0], AWNING[1], 0, 2.3),
    sign("metz-door", 2, 5.1, 9.3, 0, 2.55),
    sign("metz-boards", 2, 9.5, 13.4, 0.2, 2.5),
    // Upstairs: the cow, two windows, the crest.
    sign("metz-cow", 2, 0.9, 3.4, 3.3, 4.8),
    sign("metz-upwin", 2, 3.7, 5.8, 3.1, 5.0),
    sign("metz-upwin", 2, 7.0, 8.7, 3.3, 4.9),
    sign("metz-crest", 2, 10.2, 12.4, 3.2, 4.8),
    // The shop house's other walls: two windows upstairs on the lane side (wall 1), one in the notch (wall 3).
    sign("metz-upwin", 1, 3.0, 4.8, 3.3, 4.9),
    sign("metz-upwin", 1, 7.2, 9.0, 3.3, 4.9),
    sign("metz-upwin", 3, 1.6, 3.4, 3.3, 4.9),
    // The block's front (wall 4): the pilasters, the second crest under the middle one.
    ...[0, (BLOCK_W - PILASTER_W) / 2, BLOCK_W - PILASTER_W].map((u) => sign("metz-pilaster", 4, u, u + PILASTER_W, 3.0, BLOCK_EAVES - 0.4)),
    sign("metz-crest", 4, 2.22, 3.78, 1.9, 3.0),
    // Benches and planters on the forecourt in front of the block: a seat with a backrest, never solid.
    ...BENCHES.flatMap(([u, n]): Array<Part> => [
      { kind: "pylon", u, n, angle: ALONG, w: 1.6, d: 0.42, h: 0.46, colour: WOOD },
      { kind: "pylon", u: u - 0.2 * 0.976, n: n - 0.2 * 0.216, angle: ALONG, w: 1.6, d: 0.07, h: 0.92, base: 0.46, colour: WOOD },
    ]),
    ...PLANTERS.map(([u, n]): Part => ({ kind: "sprite", name: "cafe-planter", u, n, z: 0.8, angle: ALONG, len: 1.0 })),
    // The name on the wing's flat roof, for the top-down camera (wall 10's frame: u NNE along the E wall, n into the wing).
    { kind: "roofSign", texture: "metz-board", edge: 10, u0: 3.4, u1: 7.0, n0: 0.9, n1: 9.0, z0: WING_TOP + 0.05, z1: WING_TOP + 0.05, up: "u1" },
  ],
}
