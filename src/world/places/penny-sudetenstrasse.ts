import { WHITE_RENDER, balconies } from "./am-stern.ts"
import type { PlaceDressing } from "./dressing.ts"

/**
 * PENNY Am Stern, Sudetenstraße 39–43: the balcony block on the SE side of the Am Stern car park. Its NW front on the
 * car park (walls 1, 2 and 3, u 0 at each one's NE end) holds, NE to SW, PENNY, da Daniele, Schlüsseldienst Geyer and
 * the Ahorn Apotheke on the corner to Sudetenstraße (wall 0, the SW end wall, u 0 at that corner). Way 822461881 is
 * one outline over three buildings: the Bavarian LoD2 model (2026, tile 686_5302) has the block along the car park
 * (`DEBY_LOD2_107585443`, a gable roof along it, eaves 14.9–15.2 m, ridge 17.5 m, gables at both ends), the east block
 * round the plaza (part of `107585444`, eaves 15.6–16.8 m, ridge 19.4 m) and between them a flat roof at 6.9 m that the
 * aerial (DOP20) shows green: the store's hall behind the block. The footprint is cut into those three along the
 * model's walls; the E block's narrow 7 m strip on the plaza side is left in the E block. The model's `51009_1610`
 * roof (`105019147`) is the free-standing canopy over Penny's entrance: 12.2 × 5.4 m in front of wall 2 at u 5.5–17.7,
 * 4.6 m high, standing 3.9 m out from OSM's wall, which lies 1.5 m in front of the model's. The car-park aisle runs
 * 8.5 m out from the wall, so the canopy and its posts stay clear of it. Guesses (docs/places/penny-sudetenstrasse.md;
 * reference/ was not on disk): the canopy's posts and fascia depth, where the PENNY lettering sits on it, the shop
 * fronts' extent, where the trolleys stand, the board on the end wall (its height, its spot over the corner), the
 * balconies, the pylon's size and spot (by the corner, between the car-park entrance and the building, as the
 * backlog places it from the photos), the hall's green, the PENNY board painted on the hall's roof (no photo of it).
 */
const SLAB_H = 15
const SLAB_PITCH = 16.5
/** The hall's flat roof (its parapet 0.6 m over it), the LoD2 model's 6.9 m. */
const HALL_ROOF = 6.3
/** The balcony floors over the tall shop storey, the lowest clear of the canopy's top. */
const STOREYS = [5.0, 7.8, 10.6, 13.4] as const
const PENNY_RED = [216, 50, 60, 255] as const
const front = (edge: number, u0: number, u1: number) => ({ kind: "wallSign", texture: "shop-front", edge, u0, u1, z0: 0, z1: 3.2 }) as const

export const PENNY_SUDETENSTRASSE: PlaceDressing = {
  poi: "PENNY",
  street: "Sudetenstraße",
  osmBuildingId: 822461881,
  facade: "render",
  wallColour: WHITE_RENDER,
  masses: [
    // The block along the car park: walls 1–3 of the footprint its NW side, gables at the SW (0) and NE (4) ends.
    { pts: [4286.4, 4837.3, 4270.7, 4827.3, 4276.8, 4817.7, 4292.8, 4792.7, 4298.3, 4784.2, 4312.6, 4793.4, 4298.4, 4818.6], levels: SLAB_H / 3, roof: { hip: SLAB_PITCH, gables: [0, 4] } },
    // The store's hall behind it under a green roof.
    {
      pts: [4312.6, 4793.4, 4315.2, 4789.4, 4327.7, 4797.4, 4330.2, 4795.3, 4332.2, 4797.8, 4340.7, 4790.8, 4341.5, 4791.8, 4303.4, 4821.8, 4298.4, 4818.6],
      levels: HALL_ROOF / 3,
      roof: { pitched: false, colour: [122, 134, 92, 255] },
    },
    // The E block round the plaza: gables at its NE (0, 3) and SW (5) ends.
    { pts: [4341.5, 4791.8, 4348.7, 4800.6, 4347.2, 4801.9, 4345.5, 4803.2, 4349.8, 4808.5, 4316.9, 4835.3, 4308.6, 4825.1, 4303.4, 4821.8], levels: 16.2 / 3, roof: { hip: 26, gables: [0, 3, 5] } },
  ],
  parts: [
    // Four storeys of balconies along the car-park front.
    balconies(1, 0.3, 11.1, STOREYS),
    balconies(2, 0.2, 29.5, STOREYS),
    balconies(3, 0.3, 9.9, STOREYS),
    // Penny's glass front at the NE end of the car-park front, behind and beside the canopy.
    front(3, 0.4, 5.1),
    front(3, 5.1, 9.8),
    front(2, 0.3, 6.2),
    front(2, 6.2, 12.1),
    front(2, 12.1, 18.0),
    // The free-standing canopy over the entrance: a light roof inside a red fascia on grey posts, PENNY on its front.
    {
      kind: "canopy",
      edge: 2,
      u0: 5.5,
      u1: 17.7,
      z: 4.6,
      depth: 3.9,
      colour: [206, 196, 184, 255],
      fascia: { h: 1.1, colour: PENNY_RED },
      posts: { every: 6, colour: [96, 100, 106, 255] },
    },
    { kind: "wallSign", texture: "penny-sign", edge: 2, u0: 9.9, u1: 13.3, z0: 3.55, z1: 4.65, out: 3.93 },
    // Trolleys under the canopy, along the glass (street frame: the wall runs along n at u −1.4).
    { kind: "sprite", name: "trolley-row", u: -2.9, n: 39.5, z: 1, angle: -Math.PI / 2, len: 5 },
    { kind: "sprite", name: "trolley-row", u: -3.9, n: 41, z: 1, angle: -Math.PI / 2, len: 5 },
    // The PENNY. board on the end wall to Sudetenstraße, over the pharmacy's glass corner.
    { kind: "wallSign", texture: "penny-sign", edge: 0, u0: 1.0, u1: 5.2, z0: 3.6, z1: 5.0, out: 0.06 },
    // PENNY on the store's own flat roof behind the block, by its NE wall (wall 6), the image's top towards that wall
    // (NNE) so it reads from the top-down camera; on the block's roof the plane up to the ridge is too narrow for it.
    { kind: "roofSign", texture: "penny-sign", edge: 6, u0: 1, u1: 14.2, n0: 2.4, n1: 6.8, z0: HALL_ROOF + 0.05, z1: HALL_ROOF + 0.05, up: "n0" },
    // The red Am Stern pylon by the corner, between the car-park entrance and the building, its panels facing along
    // Sudetenstraße: PENNY Am Stern, ROSSMANN, Ahorn Apotheke, Schlüsseldienst GEYER.
    { kind: "pylon", u: -6.0, n: 9.5, angle: -Math.PI / 2, w: 2.0, d: 0.4, h: 7.6, colour: [184, 50, 58, 255], texture: "am-stern-pylon", z0: 1.8, z1: 7.4 },
  ],
}
