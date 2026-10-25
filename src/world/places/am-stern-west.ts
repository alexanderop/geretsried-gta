import { FOUR_BALCONY_STOREYS, WHITE_RENDER, balconies, onRoof } from "./am-stern.ts"
import type { PlaceDressing } from "./dressing.ts"

/**
 * The west block of Am Stern, Sudetenstraße 29a–c: denns BioMarkt, Takko and the Orterer drinks market along
 * Sudetenstraße (wall 0, the SW front, u 0 at its NW end on Marienburgweg), GG Radsport, Aphrodite Aesthetic and Nexial
 * on the Marienburgweg side (wall 5, u 0 at the N corner). Way 127872184 is one outline over three buildings: the
 * Bavarian LoD2 model (2026, tile 684_5302) has the Sudetenstraße block (`DEBY_LOD2_107585905`, eaves 15.8–16.9 m, a
 * low ridge at 19.3 m), a single-storey link with a flat roof at 5.7 m (`107585897`, the skylights in the aerial), the
 * north block (`107585906` with the slope of `107585904`, eaves 12.1–13.2 m, ridge 15.3 m) and a flat strip at 6.8 m
 * along the NE side (`107585904`). The footprint is cut into those four along the model's walls (lines parallel to
 * wall 0); the model's roofs are low shed roofs stepped at the ridge, drawn as hipped roofs with gables at the short
 * ends at a pitch that reaches the model's ridge. The aerial (DOP20) shows the terracotta planes, the grey-green link
 * and the dark strip. Guesses: the balconies' depth and storeys (the photos say four balcony storeys over the shops;
 * reference/ was not on disk), where denns' roof sign sits, and the link's and strip's roof colours.
 */
const SOUTH_H = 16
const SOUTH_PITCH = 22

export const AM_STERN_WEST: PlaceDressing = {
  poi: "Takko Fashion",
  street: "Sudetenstraße",
  osmBuildingId: 127872184,
  facade: "render",
  wallColour: WHITE_RENDER,
  masses: [
    // The Sudetenstraße block: walls 0 and 2 the long sides, gables at the NW (3) and SE (1) ends.
    { pts: [4149.3, 4748, 4185.3, 4772.5, 4194.3, 4759.3, 4157.7, 4735.7], levels: SOUTH_H / 3, roof: { hip: SOUTH_PITCH, gables: [1, 3] } },
    // The single-storey link with skylights between the blocks.
    { pts: [4194.3, 4759.3, 4203.3, 4746, 4210.6, 4751, 4211.4, 4749.8, 4167.4, 4721.4, 4157.7, 4735.7], levels: (5.68 - 0.6) / 3, roof: { pitched: false, colour: [128, 134, 122, 255] } },
    // The north block, gables at its SE (0) and NW (2) ends.
    { pts: [4211.4, 4749.8, 4220.4, 4736.5, 4176.4, 4708.2, 4167.4, 4721.4], levels: 12.6 / 3, roof: { hip: 19, gables: [0, 2] } },
    // The low strip along the NE side.
    { pts: [4220.4, 4736.5, 4222, 4734.2, 4178.8, 4704.7, 4176.4, 4708.2], levels: (6.78 - 0.6) / 3, roof: { pitched: false, colour: [150, 150, 146, 255] } },
  ],
  parts: [
    // Four storeys of balconies along the Sudetenstraße front, over the shops.
    balconies(0, 0.6, 42.9, FOUR_BALCONY_STOREYS),
    // "denns" in green on the roof over the NW third of the front (the store's unit), for the top-down camera.
    { kind: "roofSign", texture: "roof-denns", edge: 0, u0: 2, u1: 12.5, n0: 1, n1: 4.5, z0: onRoof(SOUTH_H, SOUTH_PITCH, 1), z1: onRoof(SOUTH_H, SOUTH_PITCH, 4.5) },
  ],
}
