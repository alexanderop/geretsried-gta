import type { Rgba } from "#/render/scene/mesh.ts"
import type { Mass, PlaceDressing } from "./dressing.ts"

/**
 * Schreibwaren Schröter, Adalbert-Stifter-Straße 39 (B6d-8): the stationer's in the shop wing of a cream three-storey
 * block on the NE side of the street. One OSM outline (way 668663477, 414 m²) over two volumes, and the Occasione annex
 * in front of its NW wall is a way of its own (668663478, occasione.ts): so one place per way, not one place with two
 * units. Walls of the outline: 3 = the block's street end (11.96 m, faces 218°, u 0 at its W corner), 4 = the wing's
 * street front (12.65 m, faces 231°, u 0 at its NW end).
 *
 * The Bavarian LoD2 model (2026, tile 684_5304): the block `DEBY_LOD2_4603829`, a very flat hipped roof with eaves at
 * 10.6 m and the ridge at 11.25 m (7°), and the wing SE of it `4604182`, hipped, eaves 7.3 m, ridge 7.85 m (10°). OSM's
 * outline is cut along the model's party wall (the straight line from OSM's E corner to the wing's NW corner, which OSM's
 * inner corner lies on): the block is the quadrilateral NW of it, the wing the one SE of it. Roof colour: the DOP's
 * #c6b9a8 on both.
 *
 * Street View (Sept 2023): 01 (key) the wing's front: a red ground floor to about 3.4 m (#6e1a1b sampled in sun) with
 * white-framed glazing (window, door, window, window, door), two navy awnings with a pale stripe and white edge over
 * the left two thirds, the white "Schröter" logo panel (black and red swoosh) on the cream upper storey above the
 * middle; 02: the block's street end, cream, with a large panel "OCCASIONE Mode & Lifestyle" over the Schröter logo.
 * Metres along the walls are read off the photos with the perspective taken out (the near end of each wall is the
 * larger); the cream is the engine's warm off-white (the SV samples are shade).
 *
 * Guesses: the openings' and awnings' widths to about ±0.4 m, the awnings' 0.8 m depth, the gable panel's size and
 * height. Not built: the three small lines under the logo (illegible), the white board and the red banner by the shop,
 * the parasol and racks outside, the wing's small flat stair part in LoD2 (inside the outline, 10.1 m), the hip roofs'
 * timber eaves.
 */
const CREAM: Rgba = [230, 222, 206, 255]
const ROOF: Rgba = [198, 185, 168, 255]
const WHITE: Rgba = [255, 255, 255, 255]

/** The outline's corners (way 668663477) the two volumes need: N, W, the wing's NW, S and E corners, the inner corner, the block's E corner. */
const N = [3655.1, 3978.2]
const W = [3641.5, 3996.3]
const WING_NW = [3650.9, 4003.7]
const WING_S = [3658.9, 4013.5]
const WING_E = [3666.1, 4007.9]
const INNER = [3656.5, 3997.3]
const E = [3666.4, 3985.8]

const MASSES: ReadonlyArray<Mass> = [
  { pts: [...N, ...W, ...WING_NW, ...E], levels: 10.6 / 3, roof: { colour: ROOF, hip: 7 } },
  { pts: [...WING_NW, ...WING_S, ...WING_E, ...INNER], levels: 7.3 / 3, roof: { colour: ROOF, hip: 10 } },
]

/** The wing's street front and the block's street end. */
const WING = 4
const BLOCK_END = 3
const RED_TOP = 3.4

export const SCHREIBWAREN_SCHROETER: PlaceDressing = {
  poi: "Schreibwaren Schröter",
  street: "Adalbert-Stifter-Straße",
  osmBuildingId: 668663477,
  levels: 10.6 / 3,
  facade: "render",
  wallColour: CREAM,
  masses: MASSES,
  parts: [
    { kind: "wallSign", texture: "schroeter-front", edge: WING, u0: 0, u1: 12.65, z0: 0, z1: RED_TOP },
    { kind: "canopy", edge: WING, u0: 0.1, u1: 4.0, z: 3.2, depth: 0.8, colour: WHITE, texture: "schroeter-awning" },
    { kind: "canopy", edge: WING, u0: 4.2, u1: 8.8, z: 3.2, depth: 0.8, colour: WHITE, texture: "schroeter-awning" },
    { kind: "wallSign", texture: "schroeter-sign", edge: WING, u0: 5.2, u1: 7.5, z0: 3.6, z1: 4.45, out: 0.06 },
    { kind: "wallSign", texture: "schroeter-gable", edge: BLOCK_END, u0: 1.3, u1: 4.4, z0: 2.4, z1: 5.6, out: 0.05 },
  ],
}
