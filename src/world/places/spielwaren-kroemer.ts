import type { Rgba } from "#/render/scene/mesh.ts"
import type { Part, PlaceDressing } from "./dressing.ts"

/**
 * Sudetenstraße 20 in Stein, on the SW side of the street between the Kompetenzcenter block and TEDi: way 120402849,
 * a long white block whose NE front on Sudetenstraße OSM splits into three straight walls (3: 9.1 m at the SE end,
 * 4: 42 m, 5: 10.3 m at the NW end; u 0 at each one's SE end). The Bavarian LoD2 model (2026, tile 684_5302) has it as
 * `DEBY_LOD2_4602884` (the main block: a gable roof along the street, eaves 11.9–12.9 m, ridge 16.48 m, a gable at the
 * NW end) and `DEBY_LOD2_105018827` (a short block at the SE end, eaves 12.1–12.3 m, its own ridge along the street at
 * 15.55 m). The footprint is cut into those two on the model's seam (wall 3 u 2.77, wall 1 u 58.99). OSM's outline is
 * 14.7 m deep and the model's ridge lies a little nearer the front than the middle; the roof is drawn over OSM's depth
 * at 29.5° (main) and 24.6° (SE), which gives the model's ridges. The DOP20 shows orange-brown tiles (#cc9373 on the
 * sunlit SW plane, #675243 on the NE plane in shade).
 *
 * Street View (reference/spielwaren-kroemer/01, 02, Sep 2023): white render, the upper floors' windows under flat
 * mustard-yellow lintels, full-height stairwell strips framed in blue, a glass canopy on blue struts along the whole
 * ground floor. Spielwaren Krömer is in the middle of the front: a blue-framed shop window packed with toys, the glazed
 * door, a second wide window, the white sign (blue "Spielwaren", red "Krömer", balloons) on the canopy's front edge
 * over the door, and toys on racks on the pavement. The sign also goes on the street-side roof plane for the top-down
 * camera.
 *
 * Guesses (read off the photos, no measure): the shop's run along wall 4 (round the POI at u ≈ 17), every bay's,
 * door's and sign's spot and size, the canopy's height, depth and run (the whole of walls 4 and 5; not on wall 3, where
 * the model's front steps 2.6 m out), where the stairwell strips stand (one SE of the shop as in 01, two more spaced
 * along the front as in 02), the upper windows' spacing, the racks' spots, the roof sign (no photo of the roof), the
 * roof colour (between the DOP20's two planes; the engine shades the NE one). Not built: the other units' shop fronts
 * (Arztpraxis, SC Smart Connect), the model's 2.6 m step out at the SE end of the front, the roof's dormers.
 */
const WHITE: Rgba = [240, 241, 238, 255]
const ROOF: Rgba = [200, 146, 116, 255]
const BLUE: Rgba = [47, 79, 166, 255]
/** The LoD2 eaves (mean of the front's 12.8 and the back's 12.0) and the pitches that reach the model's ridges. */
const EAVES = 12.4
const PITCH = 29.5
const SE_EAVES = 12.2
const SE_PITCH = 24.6
/** The seam between the main block and the SE block, on wall 3 (front) and wall 1 (back). */
const SEAM_FRONT = [4115.11, 4753.44] as const
const SEAM_BACK = [4107.17, 4765.79] as const
/** The glass canopy along the ground floor: its top, how far it reaches out, its thin blue front edge (the struts). */
const CANOPY_Z = 3.3
const CANOPY_DEPTH = 2
const WALL_4 = 41.96
const WALL_5 = 10.29
/** Krömer on wall 4: the toy window, the door, the second window; the sign (the Codex board's 3.6:1) over the door. */
const GLASS_Z = 2.9
const SHOP = { glassA: [12.6, 16.5], door: [16.6, 19.0], glassB: [19.1, 24.4] } as const
const SIGN = [16.0, 20.4] as const
const SIGN_H = (SIGN[1] - SIGN[0]) / 3.6
const SIGN_Z0 = CANOPY_Z - 0.35
/** The blue stairwell strips: [wall, u0] each 1.5 m wide, with their glazed entrance under the canopy. */
const STRIPES = [[4, 10.6], [4, 31.0], [5, 4.0]] as const
const STRIPE_W = 1.5
/** The upper floors' windows (each texture a 2.4 m square of wall round one window), three rows under the eaves. */
const WIN_W = 2.4
const WIN_ROWS = [3.7, 6.6, 9.5] as const
const WIN_STEP = 3.4

const wallBay = (texture: "kroemer-glass" | "kroemer-door" | "shop-front", edge: number, u0: number, u1: number, z1 = GLASS_Z): Part => ({ kind: "wallSign", texture, edge, u0, u1, z0: 0, z1 })
/** Window columns along a wall at WIN_STEP spacing from `start`, leaving out the stairwell strips. */
const windows = (edge: number, start: number, end: number): Array<Part> => {
  const strips = STRIPES.filter(([e]) => e === edge).map(([, u]) => u)
  const cols: Array<number> = []
  for (let u = start; u + WIN_W <= end; u += WIN_STEP) if (!strips.some((s) => u < s + STRIPE_W + 0.2 && u + WIN_W > s - 0.2)) cols.push(u)
  return cols.flatMap((u) => WIN_ROWS.map((z): Part => ({ kind: "wallSign", texture: "kroemer-window", edge, u0: u, u1: u + WIN_W, z0: z, z1: z + WIN_W })))
}
/** z on the main block's street-side roof plane, n meters in from wall 4, a few centimetres over the tiles. */
const roofZ = (n: number) => EAVES + n * Math.tan((PITCH * Math.PI) / 180) + 0.06

export const SPIELWAREN_KROEMER: PlaceDressing = {
  poi: "Spielwaren Krömer",
  street: "Sudetenstraße",
  osmBuildingId: 120402849,
  facade: "render",
  wallColour: WHITE,
  masses: [
    // The main block: gables at the NW end (0) and on the seam (2).
    { pts: [4066.7, 4720.5, 4058.4, 4732.6, ...SEAM_BACK, ...SEAM_FRONT, 4109.9, 4749.9, 4075.2, 4726.3], levels: EAVES / 3, roof: { colour: ROOF, hip: PITCH, gables: [0, 2] } },
    // The short SE block, a little lower: gables at the SE end (1) and on the seam (3).
    { pts: [...SEAM_FRONT, 4117.4, 4755, 4109.1, 4767.1, ...SEAM_BACK], levels: SE_EAVES / 3, roof: { colour: ROOF, hip: SE_PITCH, gables: [1, 3] } },
  ],
  parts: [
    // The glass canopy on blue struts along the ground floor of walls 4 and 5.
    ...[[4, WALL_4], [5, WALL_5]].map(([edge, len]): Part => ({ kind: "canopy", edge: edge ?? 4, u0: 0.2, u1: (len ?? 0) - 0.2, z: CANOPY_Z, depth: CANOPY_DEPTH, colour: [210, 222, 232, 255], texture: "canopy-glass", fascia: { h: 0.12, colour: BLUE } })),
    // Krömer: the toy window, the glazed door, the second window; the sign on the canopy's front edge over the door.
    wallBay("kroemer-glass", 4, SHOP.glassA[0], SHOP.glassA[1]),
    wallBay("kroemer-door", 4, SHOP.door[0], SHOP.door[1]),
    wallBay("kroemer-glass", 4, SHOP.glassB[0], SHOP.glassB[1]),
    { kind: "wallSign", texture: "kroemer-sign", edge: 4, u0: SIGN[0], u1: SIGN[1], z0: SIGN_Z0, z1: SIGN_Z0 + SIGN_H, out: CANOPY_DEPTH + 0.03 },
    // Toy racks on the pavement in front of the windows, just out from under the canopy's edge so the top-down camera
    // sees them (street frame: wall 4 runs along u at n 12.5, its u 0 at street u -17.4).
    ...[-3.2, 3.4, 6.0].map((u): Part => ({ kind: "sprite", name: "goods-rack", u, n: 9.9, z: 1.1, angle: 0, len: 2.2 })),
    // The blue stairwell strips from the canopy up under the eaves, a glazed entrance under each.
    ...STRIPES.flatMap(([edge, u]): Array<Part> => [
      { kind: "wallSign", texture: "kroemer-stripe", edge, u0: u, u1: u + STRIPE_W, z0: CANOPY_Z + 0.1, z1: EAVES - 0.3 },
      wallBay("shop-front", edge, u, u + STRIPE_W, 2.6),
    ]),
    // The upper floors' windows under their yellow lintels.
    ...windows(3, 3.4, 9.07),
    ...windows(4, 0.6, WALL_4),
    ...windows(5, 0.6, WALL_5),
    // The sign painted on the street-side roof plane over the shop, its top towards the street (n0) so it reads
    // nearly level on the north-up screen.
    { kind: "roofSign", texture: "kroemer-sign", edge: 4, u0: 13.5, u1: 23, n0: 1.0, n1: 3.3, z0: roofZ(1.0), z1: roofZ(3.3), up: "n0" },
  ],
}
