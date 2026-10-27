import { BALCONY_DEPTH, WHITE_RENDER, balconies, onRoof } from "./am-stern.ts"
import type { Part, PlaceDressing } from "./dressing.ts"

/**
 * Rossmann, Sudetenstraße 33: the block across the Am Stern car park from Sudetenstraße, its SW front (walls 3 and 4,
 * u 0 at their NW ends; the POI sits at the bend between them) on the car park. The Bavarian LoD2 model (2026,
 * `DEBY_LOD2_107585450`, tile 686_5302) has it with its eaves at 12.3 m on the car-park side and a ridge at 15 m, and a
 * flat strip 3.4 m deep at 5.2 m along the NE side; OSM's levels 4 (12 m) match the eaves, so the photos' "ground floor
 * and two balcony storeys" is a tall shop floor and tall flats, not three storeys of 3 m. The footprint is cut into the
 * block and the strip along the model's wall; the block's stepped shed roof is drawn as a hipped roof with gables at
 * the ends that reaches the model's ridge.
 *
 * The front (B3-3), from Street View (reference/rossmann-am-stern/01, 02) and the aerial (04): the ground floor is a
 * colonnade, white square pillars about every 6.2 m carrying a tall white band under the first balconies; the store's
 * dark-framed glazing with posters fills three bays near the bend, the red ROSSMANN letters (the O the logo's disc) on
 * the band over them; the bays NW and SE of it are closed white wall. Two balcony storeys with grey rails over it.
 * Like denns (am-stern-west.ts) the band, the pillars and the glazing stand on the balconies' front line
 * (BALCONY_DEPTH out of OSM's wall): from the play camera straight down, a front under the balconies is hidden. On the
 * roof four pairs of terracotta chimneys stand just short of the ridge on the car-park plane (04 shows them as dark
 * pairs; 01 their pots over the ridge). Heights read off 01 against the 12.3 m eaves.
 * Guesses: the balcony floors (5.2 and 8.4 m) and depth, the pillars' spacing and thin posts for them, where the
 * glazing starts and ends (wall 3 u 17.2 to wall 4 u 10.2), the letters' spot (01 has them centred a few meters SE of
 * the bend; drawn on wall 4 from its NW end) and size, the chimneys' spots along the roof (from 04, ±1 m), their height
 * and size, the roof sign's place, the strip's roof colour. The entrance door is not resolved in the photos; none drawn.
 *
 * Alex's photo from the car park's W end (reference/rossmann-am-stern/40-alex-parkplatz.jpg, 2026-10-27) adds the
 * red round Rossmann logo discs on the white band: a big one at the NW end of the front, a small one at its SE end, and
 * the blue "Ladestation" sign low at the NW end (OSM's charging station 6356242273 stands in front of it). Guesses: the
 * discs' spots and sizes (1.5 and 0.9 m, read off the photo against the 0.95 m letters), the sign's spot and size.
 */
const EAVES = 12.3
const PITCH = 18

/** The balcony floors over the tall shop storey, read off 01 (the parapets' bottoms at about 5.3 and 8.5 m). */
const BALCONY_FLOORS = [5.2, 8.4] as const

/** The white band over the shop storey, from the glazing's top up under the lowest balcony. */
const SHOP_OUT = BALCONY_DEPTH
const BAND_Z0 = 3
const BAND_TOP = BALCONY_FLOORS[0] - 0.1
/** "ROSSMANN" is 7.26 times as wide as tall (the cropped Codex lettering), 0.95 m tall as in 01. */
const LETTERS_H = 0.95
const LETTERS_Z0 = 3.7

/** The logo discs on the band: [edge, u, z centre, diameter] (photo 40). */
const DISCS: ReadonlyArray<readonly [edge: number, u: number, z: number, d: number]> = [
  [3, 1.9, 4.15, 1.5],
  [4, 26.4, 4.15, 0.9],
]

/** The walls of the car-park front, NW (3) and SE (4), and how far each runs (the balconies' stretch). */
const FRONT = [
  { edge: 3, u0: 0.6, u1: 25.38 },
  { edge: 4, u0: 0, u1: 27.3 },
] as const

/** The store's glazing: bays on wall 3 from u 17.2 to its end and on wall 4 from its start to u 10.2. */
const GLASS: ReadonlyArray<readonly [edge: number, u0: number, u1: number]> = [
  [3, 17.2, 21.3],
  [3, 21.3, 25.38],
  [4, 0, 3.4],
  [4, 3.4, 6.8],
  [4, 6.8, 10.2],
]

/** The chimneys: pairs 0.9 m apart at these spots along the front (u on its wall), 7.6–8.1 m in from it. */
const CHIMNEYS: ReadonlyArray<readonly [edge: number, u: number]> = [
  [3, 6.2],
  [3, 18],
  [4, 4.8],
  [4, 17.2],
]
const CHIMNEY_N = [7.6, 8.1] as const
const CHIMNEY_TOP = onRoof(EAVES, PITCH, CHIMNEY_N[1]) + 0.8
const TERRACOTTA: readonly [number, number, number, number] = [176, 98, 70, 255]
const CHIMNEY_CAP: readonly [number, number, number, number] = [120, 78, 62, 255]

const chimney = (edge: number, u: number): Part => ({
  kind: "tower",
  edge,
  rect: [u - 0.22, u + 0.22, CHIMNEY_N[0], CHIMNEY_N[0] + 0.44],
  h: CHIMNEY_TOP,
  roofH: 0.08,
  colours: { wall: TERRACOTTA, roof: CHIMNEY_CAP },
})

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
    ...FRONT.map(({ edge, u0, u1 }) => balconies(edge, u0, u1, BALCONY_FLOORS)),
    // The colonnade: the white band under the lowest balconies on white pillars, on the balconies' front line.
    ...FRONT.map(({ edge, u0, u1 }): Part => ({
      kind: "canopy",
      edge,
      u0,
      u1,
      z: BAND_TOP,
      depth: SHOP_OUT,
      colour: WHITE_RENDER,
      fascia: { h: BAND_TOP - BAND_Z0, colour: WHITE_RENDER },
      posts: { every: 6.2, colour: WHITE_RENDER },
    })),
    // The store's glazing with posters in the bays by the bend.
    ...GLASS.map(([edge, u0, u1]): Part => ({ kind: "wallSign", texture: "rossmann-front", edge, u0, u1, z0: 0, z1: BAND_Z0, out: SHOP_OUT })),
    // The red ROSSMANN letters on the band over the glazing.
    { kind: "wallSign", texture: "rossmann-letters", edge: 4, u0: 0.2, u1: 0.2 + LETTERS_H * 7.26, z0: LETTERS_Z0, z1: LETTERS_Z0 + LETTERS_H, out: SHOP_OUT + 0.03 },
    // The red logo discs at both ends of the front and the blue Ladestation sign at its NW end.
    ...DISCS.map(([edge, u, z, d]): Part => ({ kind: "wallSign", texture: "rossmann-disc", edge, u0: u - d / 2, u1: u + d / 2, z0: z - d / 2, z1: z + d / 2, out: SHOP_OUT + 0.04 })),
    { kind: "wallSign", texture: "ladestation", edge: 3, u0: 3.4, u1: 4.1, z0: 1.6, z1: 2.3, out: SHOP_OUT + 0.04 },
    // ROSSMANN in red on a white board on the roof over the store, by the POI, for the top-down camera.
    { kind: "roofSign", texture: "roof-rossmann", edge: 4, u0: 2, u1: 22, n0: 0.8, n1: 5.8, z0: onRoof(EAVES, PITCH, 0.8), z1: onRoof(EAVES, PITCH, 5.8) },
    // Four pairs of chimneys just short of the ridge on the car-park plane.
    ...CHIMNEYS.flatMap(([edge, u]) => [chimney(edge, u - 0.45), chimney(edge, u + 0.45)]),
  ],
}
