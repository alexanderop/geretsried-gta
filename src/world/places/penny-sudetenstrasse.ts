import { BALCONY_DEPTH, WHITE_RENDER, balconies } from "./am-stern.ts"
import type { MaterialName, Rgba } from "#/render/scene/mesh.ts"
import type { Part, PlaceDressing } from "./dressing.ts"

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
 *
 * Ahorn Apotheke (B3-6), the W corner unit, from Street View (reference/ahorn-apotheke/01–03, penny/01): on the car-park
 * front (wall 1, u 0 at its NE end, the corner at u 11.4) the light-green "Ahorn-Apotheke" letters with a maple leaf
 * straight on the white band under the first balconies, over a glazed shop front set back behind a white pier (by da
 * Daniele) and a square white pillar at the corner; window film with the green name along the glass' foot and red
 * pharmacy "A"s at its top. On the end wall to Sudetenstraße (wall 0, u 0 at that corner, no balconies): a glazed bay
 * behind the corner pillar, a white pier, a second bay under the framed white "Ahorn Apotheke" light box, a plain
 * stretch with the downpipes, then the long glazing with the green film under the PENNY. board (01 and penny/01 both
 * put the board there, at the S end, not over the corner as B3-0 guessed). The red-and-white "A" light box sticks out
 * of the end wall by the corner, above the band. As on the west block the shop storey on wall 1 stands flush with the
 * balconies' fronts (BALCONY_DEPTH out), so the play camera, looking straight down, sees the band and the letters;
 * the glass sits 0.5 m behind it. Guesses (read off the photos, no measure): where the unit starts on wall 1 (u 2.4),
 * the bays' and piers' widths on wall 0, the letters' and boards' sizes and heights, the pillars' size, the glass'
 * set-back, the "A" box's size, height and reach. Not built: the door (behind the corner pillar, not drawn apart).
 *
 * Bar Café da Daniele (B3-7) and Schlüsseldienst Geyer, the units between Penny and the Ahorn Apotheke, from Street View
 * (reference/da-daniele/01–03): the same white band as Ahorn's, flush with the balconies' fronts on white piers, from
 * the end of Penny's glass (wall 2, u 18.1) round the slight bend (wall 2's end is wall 1's u 0) to Ahorn's pier. Under
 * the café's part the crimson "Bar Café da Daniele" board hangs at the band's foot over the glazing, the grey script
 * "da Daniele Bar·Café" with the cup on the white band above it. Geyer's stretch NE of the café stays plain (its only
 * sign is the pylon's panel; 01 shows a small grey board there, not drawn). At the SW end of the café's parking bays,
 * on the kerb by the island before Ahorn, stands the car park's raised barrier: a grey housing, the white boom
 * standing upright with red bands, and next to it a post with the "Schrankenöffnungszeiten" sign and the blue
 * "2 Std." parking-disc panel (02, 03). Never solid and off the aisle, so the bays and the aisle stay drivable.
 * Guesses: the units' split (the pier at u 23.9), the board's and script's sizes and heights (read off 01 against
 * Ahorn's band), the barrier's spot (off 02/03, 5.5 m out from wall 1 at its u 2.4), the boom's height and bands, the
 * sign's size. Not built: the second raised boom in 01's foreground (its spot is not clear from the photos), the
 * café's outdoor seating (the website mentions it, no photo shows it).
 */
const SLAB_H = 15
const SLAB_PITCH = 16.5
/** The hall's flat roof (its parapet 0.6 m over it), the LoD2 model's 6.9 m. */
const HALL_ROOF = 6.3
/** The balcony floors over the tall shop storey, the lowest clear of the canopy's top. */
const STOREYS = [5.0, 7.8, 10.6, 13.4] as const
const PENNY_RED = [216, 50, 60, 255] as const
/** The Ahorn Apotheke's unit on wall 1, from the pier by da Daniele to the W corner (its start a guess). */
const AHORN_1 = [2.4, 11.37] as const
/** The shop storey on wall 1 flush with the balconies' fronts, the white band over it up under the lowest balcony. */
const SHOP_OUT = BALCONY_DEPTH
const BAND_Z0 = 3.2
const BAND_TOP = STOREYS[0] - 0.1
/** "Ahorn-Apotheke" is 8.15 times as wide as tall (the cropped Codex lettering), 6.4 m long. */
const AHORN_LETTERS_W = 6.4
const AHORN_LETTERS_Z0 = 3.65
/** The framed light box on the end wall (the Codex board is 4 : 1), and the long glazing at the S end under PENNY.'s board. */
const AHORN_BOARD = [4.1, 7.1] as const
const AHORN_BOARD_Z0 = 3.75
const SOUTH_GLASS = [9.9, 17.6] as const
const PIER: Rgba = [236, 236, 233, 255]
/** Geyer and da Daniele on wall 2 from Penny's glass to the bend, the pier between them; the café runs on to Ahorn's pier. */
const DANIELE_2 = [18.1, 29.68] as const
const DANIELE_PIER = (DANIELE_2[0] + DANIELE_2[1]) / 2
/**
 * Their band reaches lower than Ahorn's: the crimson board hangs at its foot over the glazing. 01 puts its foot at about
 * 2.2 m; it stays at 2.5 m, the lowest a canopy's fascia may hang (places.test), the board 0.95 m deep on it.
 */
const DANIELE_Z0 = 2.5
const DANIELE_FASCIA = [25.0, 28.6] as const
const DANIELE_SCRIPT = [25.3, 28.3, 3.75, 4.55] as const
/** The raised barrier on the kerb at the bays' SW end (street frame; 5.5 m out from wall 1 at its u 2.4). */
const BARRIER = [-8.04, 20.44] as const
const BARRIER_RED: Rgba = [204, 40, 44, 255]
const BARRIER_GREY: Rgba = [168, 172, 174, 255]
/** `n` wallSigns of `texture` side by side on wall `edge` from u0 to u1, from the ground up to z1, `out` off the wall. */
const row = (texture: MaterialName, edge: number, [u0, u1]: readonly [number, number], n: number, z1: number, out = 0.04): ReadonlyArray<Part> =>
  Array.from({ length: n }, (_, i) => ({ kind: "wallSign", texture, edge, u0: u0 + ((u1 - u0) * i) / n, u1: u0 + ((u1 - u0) * (i + 1)) / n, z0: 0, z1, out }))

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
    // The PENNY. board on the end wall to Sudetenstraße, over the long glazing at its S end (01, penny/01).
    { kind: "wallSign", texture: "penny-sign", edge: 0, u0: SOUTH_GLASS[0] + 0.5, u1: SOUTH_GLASS[0] + 4.7, z0: 3.6, z1: 5.0, out: 0.06 },
    // Ahorn Apotheke on the car-park front: the white band on a pier by da Daniele and a pillar at the corner, the green
    // letters on it, the glazing with its window film set back 0.5 m behind.
    {
      kind: "canopy",
      edge: 1,
      u0: AHORN_1[0],
      u1: AHORN_1[1],
      z: BAND_TOP,
      depth: SHOP_OUT,
      colour: WHITE_RENDER,
      fascia: { h: BAND_TOP - BAND_Z0, colour: WHITE_RENDER },
      posts: { every: AHORN_1[1] - AHORN_1[0], colour: PIER, side: 0.5 },
    },
    ...row("ahorn-front", 1, [AHORN_1[0] + 0.3, AHORN_1[1] - 0.3], 3, BAND_Z0, SHOP_OUT - 0.5),
    {
      kind: "wallSign",
      texture: "ahorn-letters",
      edge: 1,
      u0: AHORN_1[0] + 1.2,
      u1: AHORN_1[0] + 1.2 + AHORN_LETTERS_W,
      z0: AHORN_LETTERS_Z0,
      z1: AHORN_LETTERS_Z0 + AHORN_LETTERS_W / 8.15,
      out: SHOP_OUT + 0.03,
    },
    // Round the corner on the end wall: the bay behind the corner pillar, the pier, the bay under the light box, the
    // plain stretch with the downpipes, the long glazing with the green film.
    ...row("ahorn-front", 0, [0.3, 3.4], 1, 3.0),
    ...row("ahorn-front", 0, AHORN_BOARD, 1, 3.0),
    ...row("ahorn-front", 0, SOUTH_GLASS, 2, 3.0),
    { kind: "wallSign", texture: "ahorn-board", edge: 0, u0: AHORN_BOARD[0], u1: AHORN_BOARD[1], z0: AHORN_BOARD_Z0, z1: AHORN_BOARD_Z0 + (AHORN_BOARD[1] - AHORN_BOARD[0]) / 4, out: 0.1 },
    // The red pharmacy "A" light box held out from the end wall by the corner (wall 0 at u 1.2, 0.3–1.2 m out), its
    // faces looking along Sudetenstraße; in the street frame, which runs 0.6° off wall 0.
    { kind: "pylon", u: -1.15, n: 10.85, angle: -Math.PI / 2, w: 0.9, d: 0.3, h: 5.0, base: 4.1, colour: [238, 238, 236, 255], texture: "ahorn-a", z0: 4.15, z1: 4.95 },
    // Schlüsseldienst Geyer and Bar Café da Daniele: the white band on piers flush with the balconies, set-back glazing
    // under it, round the bend to Ahorn's pier (wall 1, after Ahorn's own band so that stays wall 1's first canopy).
    {
      kind: "canopy",
      edge: 2,
      u0: DANIELE_2[0],
      u1: DANIELE_2[1],
      z: BAND_TOP,
      depth: SHOP_OUT,
      colour: WHITE_RENDER,
      fascia: { h: BAND_TOP - DANIELE_Z0, colour: WHITE_RENDER },
      posts: { every: DANIELE_PIER - DANIELE_2[0], colour: PIER, side: 0.5 },
    },
    { kind: "canopy", edge: 1, u0: 0, u1: AHORN_1[0], z: BAND_TOP, depth: SHOP_OUT, colour: WHITE_RENDER, fascia: { h: BAND_TOP - DANIELE_Z0, colour: WHITE_RENDER } },
    ...row("shop-front", 2, [DANIELE_2[0] + 0.3, DANIELE_PIER - 0.3], 2, DANIELE_Z0, SHOP_OUT - 0.5),
    ...row("shop-front", 2, [DANIELE_PIER + 0.3, DANIELE_2[1]], 2, DANIELE_Z0, SHOP_OUT - 0.5),
    ...row("shop-front", 1, [0, AHORN_1[0] - 0.3], 1, DANIELE_Z0, SHOP_OUT - 0.5),
    { kind: "wallSign", texture: "daniele-fascia", edge: 2, u0: DANIELE_FASCIA[0], u1: DANIELE_FASCIA[1], z0: DANIELE_Z0, z1: DANIELE_Z0 + 0.95, out: SHOP_OUT + 0.03 },
    { kind: "wallSign", texture: "daniele-script", edge: 2, u0: DANIELE_SCRIPT[0], u1: DANIELE_SCRIPT[1], z0: DANIELE_SCRIPT[2], z1: DANIELE_SCRIPT[3], out: SHOP_OUT + 0.03 },
    // The raised barrier: grey housing, the upright white boom with red bands, the sign post beside it facing the
    // aisle's way in (SW), "Schrankenöffnungszeiten" over the blue "2 Std." panel.
    { kind: "pylon", u: BARRIER[0], n: BARRIER[1], angle: 0, w: 0.4, d: 0.4, h: 1.15, colour: BARRIER_GREY },
    { kind: "pylon", u: BARRIER[0], n: BARRIER[1], angle: 0, w: 0.1, d: 0.1, h: 6.6, colour: WHITE_RENDER },
    ...[1.6, 2.8, 4.0, 5.2, 6.2].map((z): Part => ({ kind: "pylon", u: BARRIER[0], n: BARRIER[1], angle: 0, w: 0.12, d: 0.12, h: z + 0.4, base: z, colour: BARRIER_RED })),
    { kind: "pylon", u: BARRIER[0] + 0.55, n: BARRIER[1] + 0.05, angle: 0, w: 0.07, d: 0.07, h: 2.7, colour: BARRIER_GREY },
    { kind: "pylon", u: BARRIER[0] + 0.55, n: BARRIER[1], angle: 0, w: 0.74, d: 0.03, h: 2.6, base: 0.9, colour: WHITE_RENDER, texture: "daniele-parking", z0: 0.95, z1: 2.55 },
    // PENNY on the store's own flat roof behind the block, by its NE wall (wall 6), the image's top towards that wall
    // (NNE) so it reads from the top-down camera; on the block's roof the plane up to the ridge is too narrow for it.
    { kind: "roofSign", texture: "penny-sign", edge: 6, u0: 1, u1: 14.2, n0: 2.4, n1: 6.8, z0: HALL_ROOF + 0.05, z1: HALL_ROOF + 0.05, up: "n0" },
    // The red Am Stern pylon by the corner, between the car-park entrance and the building, its panels facing along
    // Sudetenstraße: PENNY Am Stern, ROSSMANN, Ahorn Apotheke, Schlüsseldienst GEYER.
    { kind: "pylon", u: -6.0, n: 9.5, angle: -Math.PI / 2, w: 2.0, d: 0.4, h: 7.6, colour: [184, 50, 58, 255], texture: "am-stern-pylon", z0: 1.8, z1: 7.4 },
  ],
}
