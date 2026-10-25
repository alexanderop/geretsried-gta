import type { PlaceDressing } from "./dressing.ts"

/**
 * EDEKA Heininger & Dietz, Breslauer Weg 113: the flat supermarket hall across Breslauer Weg from the Am Stern blocks,
 * its shop front the SW wall (wall 1, u 0 at the W corner on Breslauer Weg) on its own car park. OSM's levels 1 make
 * it a 3.6 m box; the Bavarian LoD2 model (2026, `DEBY_LOD2_4603538`, tile 686_5302) has a hall roof falling gently
 * from 9.4 m over the shop front to 6.2 m over the NE wall, and a low part at 5.9 m in the W corner, 15.9 m along the
 * shop front and 3.4 m deep: the glazed entrance the photos show at that corner. The hall is drawn flat at the shop
 * front's 9.4 m (the 5.5° fall left out, as the police station's canopy), the corner as its own lower volume. The
 * light-grey roof stays the aerial's. Its fascia, logo, porthole band, Fleischwaren board and the yellow pylon are
 * B3-1's; here only the EDEKA board painted on the roof (a guess: no photo shows the roof) for the top-down camera.
 */
const HALL = (9.44 - 0.6) / 3

export const EDEKA_AM_STERN: PlaceDressing = {
  poi: "EDEKA",
  street: "Breslauer Weg",
  osmBuildingId: 189042651,
  masses: [
    { pts: [4459.8, 4814.9, 4434.4, 4836.2, 4408.62, 4805.48, 4411.22, 4803.29, 4401.0, 4791.11, 4423.9, 4772], levels: HALL, roof: { pitched: false } },
    // The entrance corner.
    { pts: [4398.4, 4793.3, 4408.62, 4805.48, 4411.22, 4803.29, 4401.0, 4791.11], levels: (5.93 - 0.6) / 3, roof: { pitched: false } },
  ],
  parts: [
    // EDEKA in blue on yellow on the roof near the shop front, past the entrance corner.
    { kind: "roofSign", texture: "roof-edeka", edge: 1, u0: 19, u1: 37, n0: 2.5, n1: 8.5, z0: HALL * 3 + 0.05, z1: HALL * 3 + 0.05 },
  ],
}
