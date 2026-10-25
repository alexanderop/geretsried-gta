import { WHITE_RENDER, balconies, onRoof } from "./am-stern.ts"
import type { PlaceDressing } from "./dressing.ts"

/**
 * Rossmann, Sudetenstraße 33: the block across the Am Stern car park from Sudetenstraße, its SW front (walls 3 and 4,
 * u 0 at their NW ends; the POI sits at the bend between them) on the car park. The Bavarian LoD2 model (2026,
 * `DEBY_LOD2_107585450`, tile 686_5302) has it with its eaves at 12.3 m on the car-park side and a ridge at 15 m, and a
 * flat strip 3.4 m deep at 5.2 m along the NE side; OSM's levels 4 (12 m) match the eaves, so the photos' "ground floor
 * and two balcony storeys" is a tall shop floor and tall flats, not three storeys of 3 m. The footprint is cut into the
 * block and the strip along the model's wall; the block's stepped shed roof is drawn as a hipped roof with gables at
 * the ends that reaches the model's ridge. Guesses: the two balcony storeys' floors and depth (reference/ was not on
 * disk), the roof sign's place over the store, the strip's roof colour. The chimneys (B3-3) are left out.
 */
const EAVES = 12.3
const PITCH = 18

export const ROSSMANN_AM_STERN: PlaceDressing = {
  poi: "Rossmann",
  street: "Sudetenstraße",
  osmBuildingId: 293545707,
  facade: "render",
  wallColour: WHITE_RENDER,
  masses: [
    // The block: gables at the SE (0) and NW (2) ends.
    { pts: [4271.2, 4790.4, 4280.5, 4775.9, 4235.7, 4747, 4226.4, 4761.5, 4247.7, 4775.3], levels: EAVES / 3, roof: { hip: PITCH, gables: [0, 2] } },
    // The low strip along the NE side.
    { pts: [4280.5, 4775.9, 4282, 4773.6, 4237.2, 4744.7, 4235.7, 4747], levels: (5.24 - 0.6) / 3, roof: { pitched: false, colour: [150, 150, 146, 255] } },
  ],
  parts: [
    // Two storeys of balconies along the car-park front, both walls of it.
    balconies(3, 0.6, 25.2, [4.8, 8.2]),
    balconies(4, 0.2, 27.3, [4.8, 8.2]),
    // ROSSMANN in red on a white board on the roof over the store, by the POI, for the top-down camera.
    { kind: "roofSign", texture: "roof-rossmann", edge: 4, u0: 2, u1: 22, n0: 0.8, n1: 5.8, z0: onRoof(EAVES, PITCH, 0.8), z1: onRoof(EAVES, PITCH, 5.8) },
  ],
}
