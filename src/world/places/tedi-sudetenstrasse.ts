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
 * blue-framed house door "26" at the NW end of the canopy. The canopy is drawn flat (the engine has no slanted canopy).
 * The model's front of the peach block stands about 2.7 m in front of OSM's wall 6/7; OSM's wall stays the solid, so
 * the canopy, the boxes and the racks hang on it. Guesses (read off the photos, no measure): where the stair strip
 * and the boxes sit along the front and their sizes, the canopy's height and depth, the bays' widths, where the door
 * and the racks stand, the TEDi box on the hall's roof (no photo of the roof; for the top-down camera), the roof
 * colours (DOP20 medians), the hall's split from the block along the model's roof edge. Not built: the orange lower
 * wall parts at the right of 01 (no clean sample).
 *
 * Sun Style and Versicherungsmakler Kafka (B4-7), from Street View (reference/sun-style/01, 02, Sep 2023), both in the
 * white block's ground floor on wall 7 NW of the seam. 01 looks SW at the front, so left is SE: the photo puts Sun Style
 * at the white block's SE end by the seam and Kafka NW of it (OSM's nodes have them the other way round, and the POI
 * lies at u 29; the photo wins, the POI stays where it is). A glass canopy runs along the white block's ground floor; on
 * its front edge hangs Sun Style's black fascia (#363540, gold "Sun Style" with a sun, "Bodystyling Studio") over the
 * studio's white-framed glazing and glass door; Kafka's grey "VERSICHERUNGEN · FINANZIERUNGEN · KREDITE" panel stands on
 * the canopy's edge further NW over his glazing. Over the canopy the white block's bay windows are clad in maroon-brown
 * (#4b3f4a) up to the eaves; the model's footprint steps out 0.4 m for them at u 15.15–18.95 and 25.62–29.4. Where the
 * blocks meet, TEDi's front steps back to OSM's wall in a porch (the model's `105018834`, u 6.1–9.3, a dark metal shed
 * roof falling from 4.23 m at the wall to 2.62 m at its front, drawn flat) on a peach pier at its SE front corner, a
 * blue door in it, and Sun Style's black service board on the porch's NW front under the roof's edge. TEDi's canopy on
 * wall 7 therefore ends short of the porch, its door "26" at its NW end. The fascia is also painted on the white block's
 * street-side roof plane for the top-down camera. Guesses (read off 01 against the model's bay steps, no measure): the
 * glass canopy's run (u 9.5–29.8), height and depth; every bay's, door's and sign's spot and size; the units' split at
 * u 19.9; the porch's door, pier and board spots; the gold (#d4a640: too small in 01 to sample); the roof sign (no photo
 * of the roof). Not built: the third brown bay at u 34–38 (past OSM's wall end and not in a photo), the parking signs
 * and the election poster at the kerb.
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
const DOOR_7 = [3.4, 4.9] as const
/** TEDi's canopy on wall 7 ends at the peach wall SE of the porch. */
const TEDI_CANOPY_7 = 5.0

/** The porch where the blocks meet (LoD2 `105018834`): u 6.1–9.3, 2.4 m deep, its flat top between the model's 2.62 and 4.23 m. */
const PORCH = [6.1, 9.3] as const
const PORCH_Z = 2.95
const PORCH_DEPTH = 2.4
const PORCH_ROOF: Rgba = [86, 74, 84, 255]
/** Sun Style's black service board on the porch's front under the roof's edge (the Codex board's 0.79:1, as 01). */
const BOARD = [7.5, 9.2] as const
const BOARD_Z = [0.55, 2.7] as const

/** The white block's ground floor: the glass canopy, Sun Style SE of u 19.9, Kafka NW of it. */
const GLASS_CANOPY = { u0: SEAM_7 + 0.1, u1: 29.8, z: 3.55, depth: 2 } as const
const SHOP_TOP = 2.5
const UNIT_SPLIT = 19.9
/** Sun Style's fascia (the Codex board's 4.4:1) hangs from the canopy's front edge over the studio's SE half. */
const FASCIA = [9.6, 14.0] as const
const FASCIA_H = (FASCIA[1] - FASCIA[0]) / 4.39
/** Kafka's panel (4.3:1) stands on the canopy's front edge over his glazing. */
const KAFKA = [20.6, 24.4] as const
const KAFKA_H = (KAFKA[1] - KAFKA[0]) / 4.28
/** The maroon-brown bay windows from over the canopy up under the eaves, 0.4 m proud (the model's steps). */
const BAYS = [[15.15, 18.95], [25.62, 29.4]] as const
const BAY_Z = [3.9, NW_EAVES - 0.4] as const
/** The NW block's street-side roof plane: from the eaves at wall 7, rising at the model's 35.6°. */
const NW_PITCH = 35.6
const nwRoofZ = (n: number) => NW_EAVES + n * Math.tan((NW_PITCH * Math.PI) / 180) + 0.06

const bay = (texture: "tedi-front" | "shop-front" | "sunstyle-glass" | "sunstyle-door", edge: number, u0: number, u1: number, z1 = GLASS_Z): Part => ({ kind: "wallSign", texture, edge, u0, u1, z0: 0, z1 })

export const TEDI_SUDETENSTRASSE: PlaceDressing = {
  poi: "TEDi",
  street: "Sudetenstraße",
  osmBuildingId: 120402837,
  facade: "render",
  wallColour: PEACH,
  masses: [
    // The white block at the NW end (Sun Style, Kafka): gables at the NW end (0) and on the seam (2, 3).
    { pts: [4120.7, 4759.6, 4112.7, 4772.1, 4136.2, 4787.22, 4137.4, 4785.01, 4143.31, 4774.05], levels: NW_EAVES / 3, roof: { colour: ROOF_NW, hip: NW_PITCH, gables: [0, 2, 3] }, wallColour: WHITE },
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
    { kind: "canopy", edge: 7, u0: 0, u1: TEDI_CANOPY_7, z: CANOPY_Z, depth: CANOPY_DEPTH, colour: CANOPY_GREY, fascia: { h: CANOPY_FASCIA, colour: CANOPY_GREY } },
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
    bay("tedi-front", 7, 0.1, DOOR_7[0] - 0.1),
    // The blue-framed house door "26" (the generic glazed door; its blue frame is not drawn).
    bay("shop-front", 7, DOOR_7[0], DOOR_7[1], 2.6),
    // Racks of goods on the pavement in front of the glazing, just out from under the canopy's edge so the top-down
    // camera sees them (street frame: the front runs along u at n 12.9–13.6; the racks 3.4 m out of it).
    ...[-6.6, -3.6, 0.1, 3.1, 6.2].map((u): Part => ({ kind: "sprite", name: "goods-rack", u, n: 9.5 + (u + 9.35) * 0.018, z: 1.1, angle: 0, len: 2.5 })),
    // TEDi's blue box painted on the hall's flat roof by its SE wall (wall 4), for the top-down camera: the image's top
    // towards the wall's NNE end, so the letters run ESE and read nearly level on the north-up screen.
    { kind: "roofSign", texture: "tedi-sign", edge: 4, u0: 2.5, u1: 10, n0: 2, n1: 12, z0: HALL_ROOF + 0.05, z1: HALL_ROOF + 0.05, up: "u1" },

    // B4-7. The porch where the blocks meet: its dark metal roof, the peach pier at its SE front corner (street frame:
    // wall 7 u 6.35, 2.2 m out), the blue door on the wall in it, Sun Style's service board on its NW front.
    { kind: "canopy", edge: 7, u0: PORCH[0], u1: PORCH[1], z: PORCH_Z, depth: PORCH_DEPTH, colour: PORCH_ROOF, fascia: { h: 0.2, colour: PORCH_ROOF } },
    { kind: "pylon", u: 9.01, n: 11.33, angle: 0, w: 0.5, d: 0.4, h: PORCH_Z - 0.2, colour: PEACH },
    bay("shop-front", 7, 6.7, 7.7, 2.4),
    { kind: "wallSign", texture: "sunstyle-board", edge: 7, u0: BOARD[0], u1: BOARD[1], z0: BOARD_Z[0], z1: BOARD_Z[1], out: PORCH_DEPTH + 0.05 },
    // The glass canopy along the white block's ground floor.
    { kind: "canopy", edge: 7, u0: GLASS_CANOPY.u0, u1: GLASS_CANOPY.u1, z: GLASS_CANOPY.z, depth: GLASS_CANOPY.depth, colour: [214, 220, 222, 255], texture: "canopy-glass" },
    // Sun Style: white-framed glazing with the glass door SE of the middle; the black fascia on the canopy's front edge.
    bay("sunstyle-glass", 7, 9.8, 12.8, SHOP_TOP),
    bay("sunstyle-door", 7, 12.9, 14.1, SHOP_TOP),
    bay("sunstyle-glass", 7, 14.2, 17.0, SHOP_TOP),
    bay("sunstyle-glass", 7, 17.0, UNIT_SPLIT - 0.1, SHOP_TOP),
    { kind: "wallSign", texture: "sunstyle-fascia", edge: 7, u0: FASCIA[0], u1: FASCIA[1], z0: GLASS_CANOPY.z - FASCIA_H, z1: GLASS_CANOPY.z, out: GLASS_CANOPY.depth + 0.03 },
    // Kafka: his door at the SE end, glazing on NW under the canopy; his panel standing on the canopy's front edge.
    bay("sunstyle-door", 7, UNIT_SPLIT + 0.1, UNIT_SPLIT + 1.3, SHOP_TOP),
    bay("sunstyle-glass", 7, UNIT_SPLIT + 1.4, 24.1, SHOP_TOP),
    bay("sunstyle-glass", 7, 24.1, 26.9, SHOP_TOP),
    bay("sunstyle-glass", 7, 26.9, 29.6, SHOP_TOP),
    { kind: "wallSign", texture: "kafka-sign", edge: 7, u0: KAFKA[0], u1: KAFKA[1], z0: GLASS_CANOPY.z, z1: GLASS_CANOPY.z + KAFKA_H, out: GLASS_CANOPY.depth + 0.03 },
    // The maroon-brown bay windows over the canopy.
    ...BAYS.map(([u0, u1]): Part => ({ kind: "wallSign", texture: "sunstyle-bay", edge: 7, u0, u1, z0: BAY_Z[0], z1: BAY_Z[1], out: 0.4 })),
    // Sun Style's fascia painted on the street-side roof plane, its top towards the street (n0) so it reads nearly level.
    { kind: "roofSign", texture: "sunstyle-fascia", edge: 7, u0: 11, u1: 20, n0: 1.0, n1: 3.05, z0: nwRoofZ(1.0), z1: nwRoofZ(3.05), up: "n0" },
  ],
}
