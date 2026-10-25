import type { Rgba } from "#/render/scene/mesh.ts"
import type { Part, PlaceDressing } from "./dressing.ts"

/**
 * Sudetenstraße 24–26 in Stein, on the SW side of the street opposite the Am Stern west block: way 120402837 is one
 * outline over three buildings, the shops' units along its NE front on Sudetenstraße (wall 7, u 0 at its SE end by
 * the POI; wall 6 the short stretch SE of it, u 0 at the corner). The Bavarian LoD2 model (2026, tile 684_5302) has
 * them as `DEBY_LOD2_4602689`, the white block at the NW end (Sun Style, Versicherungsmakler Kafka: a gable roof along
 * the street, eaves 11.8–12.2 m, ridge 17.3 m, gables at both ends), `DEBY_LOD2_4602690`, the peach block at the SE
 * end (TEDi: eaves 10.6 m, its main ridge at 15.8 m running from the street front back to the SW, so a gable on
 * Sudetenstraße) and, behind that, the store's hall under a flat roof at 4.6 m that the aerial (DOP20) shows white.
 * The footprint is cut into those three along the model's walls (the seam between the blocks meets wall 7 at u 9.37,
 * where the model's wall lies on OSM's). Each unit's own signs go in here: TEDi (B4-1) now, Sun Style and Kafka
 * (B4-7) on wall 7 NW of u 9.4.
 *
 * TEDi (B4-1), from Street View (reference/tedi-am-stern/01, 02; sun-style/01, 02): a grey slanted canopy along the
 * whole shop front of the peach block, the two blue TEDi boxes on its front at the SE end under a full-height glazed
 * stairwell strip with blue spandrel panels, the store's glazing behind racks of goods on the pavement, and the
 * blue-framed house door "26" at the NW end of the unit. The canopy is drawn flat (the engine has no slanted canopy).
 * The model's front of the peach block stands about 2.7 m in front of OSM's wall 6/7; OSM's wall stays the solid, so
 * the canopy, the boxes and the racks hang on it. Guesses (read off the photos, no measure): where the stair strip
 * and the boxes sit along the front and their sizes, the canopy's height and depth, the bays' widths, where the door
 * and the racks stand, the TEDi box on the hall's roof (no photo of the roof; for the top-down camera), the roof
 * colours (DOP20 medians), the hall's split from the block along the model's roof edge. Not built: the orange lower
 * wall parts at the right of 01 (no clean sample), the second, lower canopy over the junction to the white block
 * (the model's `105018834`, Sun Style's board under it: B4-7).
 */
/** The peach render of the TEDi block (#afa187 in 01's shade; warmer in the sun of sun-style/01). */
const PEACH: Rgba = [236, 198, 160, 255]
const WHITE: Rgba = [244, 244, 242, 255]
/** The brown tiles of both blocks: the DOP20's lit planes #cdb297 (NW block) and #907a66 (TEDi block). */
const ROOF_NW: Rgba = [192, 164, 134, 255]
const ROOF_TEDI: Rgba = [160, 132, 108, 255]
/** The LoD2 heights: the NW block's eaves and ridge, the TEDi block's eaves, the hall's flat roof under its 0.6 m parapet. */
const NW_EAVES = 12
const TEDI_EAVES = 10.6
const HALL_ROOF = 4.63 - 0.6
/** TEDi's front: all of wall 6 and wall 7 up to the seam with the white block. */
const SEAM_7 = 9.37
const WALL_6 = 11.9
/** The grey canopy along it (#575f62 in 01): its top, its fascia and how far it reaches out. */
const CANOPY_Z = 3.3
const CANOPY_FASCIA = 0.35
const CANOPY_DEPTH = 2.4
const CANOPY_GREY: Rgba = [96, 104, 106, 255]
/** The stairwell strip over the entrance near the SE corner, and the two blue boxes under it on the canopy's front. */
const STAIR = [1.8, 3.9] as const
const BOX_W = 1.15
const BOX_Z = [CANOPY_Z - 0.25, CANOPY_Z + 0.62] as const
/** The store's glazing under the canopy, the entrance under the boxes, the house door "26" near the seam. */
const GLASS_Z = 2.8
const DOOR_7 = [6.6, 8.4] as const

const bay = (texture: "tedi-front" | "shop-front", edge: number, u0: number, u1: number, z1 = GLASS_Z): Part => ({ kind: "wallSign", texture, edge, u0, u1, z0: 0, z1 })

export const TEDI_SUDETENSTRASSE: PlaceDressing = {
  poi: "TEDi",
  street: "Sudetenstraße",
  osmBuildingId: 120402837,
  facade: "render",
  wallColour: PEACH,
  masses: [
    // The white block at the NW end (Sun Style, Kafka): gables at the NW end (0) and on the seam (2, 3).
    { pts: [4120.7, 4759.6, 4112.7, 4772.1, 4136.2, 4787.22, 4137.4, 4785.01, 4143.31, 4774.05], levels: NW_EAVES / 3, roof: { colour: ROOF_NW, hip: 35.6, gables: [0, 2, 3] }, wallColour: WHITE },
    // The peach TEDi block: its ridge runs from the street front (gables on 3, 4) back to the hall (gable on 1), the
    // planes rising from the seam (0) and the SE wall (2) to the model's 15.8 m.
    { pts: [4143.31, 4774.05, 4137.4, 4785.01, 4154.59, 4795.86, 4161.2, 4785.6, 4151.2, 4779.1], levels: TEDI_EAVES / 3, roof: { colour: ROOF_TEDI, hip: 26, gables: [1, 3, 4] } },
    // The store's hall behind it under a white flat roof.
    {
      pts: [4137.4, 4785.01, 4136.2, 4787.22, 4139.9, 4789.6, 4129.7, 4805.5, 4142.9, 4814, 4153.6, 4797.4, 4154.59, 4795.86],
      levels: HALL_ROOF / 3,
      roof: { pitched: false, colour: [238, 236, 234, 255] },
    },
  ],
  parts: [
    // The grey canopy along TEDi's whole front, round the slight bend at the POI.
    { kind: "canopy", edge: 6, u0: 0, u1: WALL_6, z: CANOPY_Z, depth: CANOPY_DEPTH, colour: CANOPY_GREY, fascia: { h: CANOPY_FASCIA, colour: CANOPY_GREY } },
    { kind: "canopy", edge: 7, u0: 0, u1: SEAM_7 - 0.2, z: CANOPY_Z, depth: CANOPY_DEPTH, colour: CANOPY_GREY, fascia: { h: CANOPY_FASCIA, colour: CANOPY_GREY } },
    // The glazed stairwell strip with blue spandrels from the canopy up under the eaves.
    { kind: "wallSign", texture: "tedi-stair", edge: 6, u0: STAIR[0], u1: STAIR[1], z0: CANOPY_Z + 0.1, z1: TEDI_EAVES - 0.6, out: 0.05 },
    // The two blue TEDi boxes side by side on the canopy's front, under the strip.
    ...[0, 1].map((i): Part => {
      const u0 = (STAIR[0] + STAIR[1]) / 2 - BOX_W + i * BOX_W
      return { kind: "wallSign", texture: "tedi-sign", edge: 6, u0: u0 + 0.03, u1: u0 + BOX_W - 0.03, z0: BOX_Z[0], z1: BOX_Z[1], out: CANOPY_DEPTH + 0.05 }
    }),
    // The store's glazing: the entrance under the boxes, bays of goods either side of it and on to the house door.
    bay("tedi-front", 6, 0.3, STAIR[0] - 0.1),
    bay("shop-front", 6, STAIR[0] - 0.1, STAIR[1] + 0.1),
    bay("tedi-front", 6, STAIR[1] + 0.1, 7.9),
    bay("tedi-front", 6, 7.9, WALL_6 - 0.1),
    bay("tedi-front", 7, 0.1, 3.4),
    bay("tedi-front", 7, 3.4, DOOR_7[0] - 0.1),
    // The blue-framed house door "26" (the generic glazed door; its blue frame is not drawn).
    bay("shop-front", 7, DOOR_7[0], DOOR_7[1], 2.6),
    // Racks of goods on the pavement in front of the glazing, just out from under the canopy's edge so the top-down
    // camera sees them (street frame: the front runs along u at n 12.9–13.6; the racks 3.4 m out of it).
    ...[-6.6, -3.6, 0.1, 3.1, 6.2].map((u): Part => ({ kind: "sprite", name: "goods-rack", u, n: 9.5 + (u + 9.35) * 0.018, z: 1.1, angle: 0, len: 2.5 })),
    // TEDi's blue box painted on the hall's flat roof by its SE wall (wall 4), for the top-down camera: the image's top
    // towards the wall's NNE end, so the letters run ESE and read nearly level on the north-up screen.
    { kind: "roofSign", texture: "tedi-sign", edge: 4, u0: 2.5, u1: 10, n0: 2, n1: 12, z0: HALL_ROOF + 0.05, z1: HALL_ROOF + 0.05, up: "u1" },
  ],
}
