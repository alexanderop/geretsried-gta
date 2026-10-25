import type { Rgba } from "#/render/scene/mesh.ts"
import type { Part, PlaceDressing } from "./dressing.ts"

/**
 * Sudetenstraße 28–32 in Stein, on the SW side of the street opposite the Am Stern car park: way 119921782, one outline
 * over a row of three gabled houses, its NE front on Sudetenstraße (wall 3, 54.9 m, u 0 at its SE end by the Post
 * block). The Bavarian LoD2 model (2026, tile 684_5302) has them as `DEBY_LOD2_4602788` (SE, wall 3 u 0–16.6),
 * `4602787` (u 16.6–35.2) and `4602786` (NW, u 35.2–55), each with its ridge along the street and gables at the ends:
 * eaves 9.7–9.9 m, ridges 11.85–12.0 m. The model's houses are only 9.6 m deep (OSM's outline is 12.3–13.6 m: the
 * aerial shows the back roof plane running on to OSM's back wall), so the roof is drawn over OSM's depth at 18°, which
 * gives the model's 12 m ridge (the model's own pitch, 24°, would overshoot it). The DOP20 shows brown tiles: the
 * sunlit SW planes #d2beb4, the NE planes in shade #6a6155.
 *
 * Street View (reference/bl-hairstyling/01, 03): the two SE houses are rendered white with plain flat windows, the NW
 * house cream (#9e937f in shade) with a white shop front on the ground floor under a thin dark-red ledge. On it, left
 * to right (SE to NW): the insurance broker Dimitrios Georgiadis (a glass door with a blue "§", a window with blue "GE"
 * and a blue band, a grey board over it), then B&L Hairstyling: two windows with tall white logo panels and a black
 * B&L strip, a glazed bay, the door up two steps under the black B&L HAIRSTYLING board, and two more glazed bays on to
 * the NW end. The two-colour split is the masses' (white SE, cream NW), cut on the model's seam at u 35.2.
 *
 * Guesses (read off the photos, no measure): where the white/cream split falls (the model's seam; 03 shows it under the
 * tree), every bay's, pier's and sign's spot and size along the front, the board's and ledge's heights, the steps, the
 * roof's pitch (fitted to the model's ridge), the B&L board painted on the NW house's street-side roof plane (no
 * photo of the roof; for the top-down camera). The solar panels on the middle house (DOP20) are not drawn.
 */
const WHITE: Rgba = [242, 242, 238, 255]
/** The NW house's cream render, lighter than 01's shaded #9e937f. */
const CREAM: Rgba = [222, 208, 172, 255]
/** The brown tiles: between the DOP20's sunlit #d2beb4 and its shaded #6a6155 (the engine shades the NE planes). */
const ROOF: Rgba = [196, 176, 160, 255]
/** The LoD2 eaves; the roof pitch that brings OSM's 13 m depth up to the model's 12 m ridge. */
const EAVES = 9.8
const PITCH = 18
/** Where the NW (cream, shop) house starts on wall 3, and the seam's back point on wall 1. */
const SEAM = 35.2
const SEAM_FRONT = [4198.57, 4803.05] as const
const SEAM_BACK = [4191.61, 4813.77] as const
/** The shop front: the white surround up to the ledge, the glazing's sill and head, the boards over the ledge. */
const LEDGE = [2.95, 3.1] as const
const SILL = 0.45
const HEAD = 2.85
const BOARD_Z = [3.12, 4.05] as const

const bay = (texture: "bl-window" | "bl-glass" | "ge-window" | "shop-front", u0: number, u1: number, z0 = SILL, z1 = HEAD): Part => ({ kind: "wallSign", texture, edge: 3, u0, u1, z0, z1 })
/** z on the NW house's street-side roof plane, n meters in from wall 3, a few centimetres over the tiles. */
const roofZ = (n: number) => EAVES + n * Math.tan((PITCH * Math.PI) / 180) + 0.06

export const BL_HAIRSTYLING: PlaceDressing = {
  poi: "B&L Hairstyling",
  street: "Sudetenstraße",
  osmBuildingId: 119921782,
  facade: "render",
  masses: [
    // The two white SE houses: gables at the SE end (0) and on the seam (2).
    { pts: [4228.1, 4822.2, 4220.6, 4833.5, ...SEAM_BACK, ...SEAM_FRONT], levels: EAVES / 3, roof: { colour: ROOF, hip: PITCH, gables: [0, 2] }, wallColour: WHITE },
    // The cream NW house with the shops: gables on the seam (0) and at the NW end (2); a white shop surround and the
    // dark-red ledge over it (they go round the whole house; only the street front shows them from the street).
    {
      pts: [...SEAM_FRONT, ...SEAM_BACK, 4175.2, 4802.6, 4182, 4792.3],
      levels: EAVES / 3,
      roof: { colour: ROOF, hip: PITCH, gables: [0, 2] },
      wallColour: CREAM,
      bands: [
        { z0: 0, z1: LEDGE[0], colour: WHITE },
        { z0: LEDGE[0], z1: LEDGE[1], colour: [128, 58, 52, 255], plain: true },
      ],
    },
  ],
  parts: [
    // Versicherungsmakler Georgiadis: the glass door with the "§", the "GE" window, the grey board over them.
    bay("shop-front", SEAM + 0.4, SEAM + 1.6, 0, 2.7),
    bay("ge-window", SEAM + 1.7, SEAM + 4.5),
    { kind: "wallSign", texture: "georgiadis-board", edge: 3, u0: SEAM + 1.2, u1: SEAM + 3.9, z0: BOARD_Z[0] + 0.05, z1: BOARD_Z[0] + 0.95 },
    // B&L: the two logo-panel windows, a glazed bay, the door up two steps under the board, two more glazed bays.
    bay("bl-window", 40.3, 42.4),
    bay("bl-window", 42.6, 44.7),
    bay("bl-glass", 45.3, 47.4),
    bay("shop-front", 47.6, 48.8, 0.3, 2.75),
    { kind: "stairs", edge: 3, u0: 47.4, u1: 49, depth: 0.6, h: 0.3, steps: 2, colour: [168, 168, 164, 255] },
    bay("bl-glass", 49.3, 51.5),
    bay("bl-glass", 51.8, 54.2),
    { kind: "wallSign", texture: "bl-board", edge: 3, u0: 45.6, u1: 48.9, z0: BOARD_Z[0], z1: BOARD_Z[1], out: 0.08 },
    // The board painted on the NW house's street-side roof plane for the top-down camera, its top towards the street
    // (n0) so it reads nearly level on the north-up screen.
    { kind: "roofSign", texture: "bl-board", edge: 3, u0: 41.5, u1: 50.5, n0: 1.2, n1: 4.2, z0: roofZ(1.2), z1: roofZ(4.2), up: "n0" },
  ],
}
