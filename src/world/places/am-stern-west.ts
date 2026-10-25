import { BALCONY_DEPTH, FOUR_BALCONY_STOREYS, WHITE_RENDER, balconies, onRoof } from "./am-stern.ts"
import type { Part, PlaceDressing } from "./dressing.ts"

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
 *
 * denns BioMarkt (B3-2), the NW unit of wall 0, from Street View (reference/denns-biomarkt/01–03): at the NW end a
 * stretch of white cladding with grey vertical grooves and narrow poster windows under a thin grey ledge, then the
 * store's dark-framed glazing with posters, the green "denns BioMarkt" letters straight on the white wall over it and
 * under the first balconies; TAKKO follows SE. 01 shows no soffit between the white band and the first balconies, so
 * the shop storey's front is drawn flush with the balconies' fronts (BALCONY_DEPTH out of OSM's wall): the white band
 * is a canopy's fascia under the lowest balconies, the glazing and the cladding stand on that line. That also keeps
 * them in sight: straight down from the play camera's 54 m, anything under a balcony 1.4 m deep is hidden. Guesses (read off the photos, no measure): where the cladding ends and
 * the glazing starts (u 9.4) and how far denns' glazing runs (to u 21.6, three 4 m bays; Takko's B3-4 takes it from
 * there), the letters' spot and size, the ledge's depth and height, the cladding's windows (three), the shop
 * storey standing flush with the balconies. The entrance door
 * is not seen in the photos, so none is drawn.
 *
 * Takko Fashion (B3-4), the middle unit of wall 0, from Street View (reference/takko-am-stern/01–02, denns/01): the
 * dark-framed glazing runs on from denns' without a break, under the same white band, and the yellow-orange TAKKO panel
 * with dark letters sits on that band over the unit's middle bay; SE of the glazing a white pier carries Orterer's round
 * logo before the open arcade (B3-5). Guesses: where the glazing ends (u 31.2, three 3.2 m bays; Orterer's pier takes it
 * from there), the panel's spot over the middle bay and its size (2.4 × 0.9 m, read off 01 against the 3 m glazing).
 */
const SOUTH_H = 16
const SOUTH_PITCH = 22

/** denns' unit on wall 0: the striped cladding from the NW end, then the glazing (both guesses, see above). */
const DENNS_CLAD = [0.6, 9.4] as const
const DENNS_GLASS = [9.6, 21.6] as const
/** "denns BioMarkt" is 8.3 times as wide as tall (the cropped Codex lettering); 6.6 m long like the photo's. */
const DENNS_LETTERS_W = 6.6
const DENNS_LETTERS_Z0 = 3.45

/** Takko's glazing on wall 0, on from denns' (its end a guess), and the TAKKO panel over its middle bay (a guess). */
const TAKKO_GLASS = [DENNS_GLASS[1], 31.2] as const
/** The cropped Codex panel is 2.67 times as wide as tall; 0.9 m tall on the 1.2 m band (a guess, read off 01). */
const TAKKO_SIGN_H = 0.9
const TAKKO_SIGN_W = TAKKO_SIGN_H * 2.67
const TAKKO_SIGN_Z0 = 3.35
const TAKKO_SIGN_MID = (TAKKO_GLASS[0] + TAKKO_GLASS[1]) / 2

/** The shop storey's front: flush with the balconies' fronts. The white band over it, up under the lowest balcony. */
const SHOP_OUT = BALCONY_DEPTH
const BAND_Z0 = 3.2
const BAND_TOP = FOUR_BALCONY_STOREYS[0] - 0.1

/** `n` wallSigns of `texture` side by side on wall 0 from u0 to u1, from the ground up to z1, on the shop front's line. */
const row = (texture: "denns-front" | "denns-cladding" | "takko-front", [u0, u1]: readonly [number, number], n: number, z1: number): ReadonlyArray<Part> =>
  Array.from({ length: n }, (_, i) => ({ kind: "wallSign", texture, edge: 0, u0: u0 + ((u1 - u0) * i) / n, u1: u0 + ((u1 - u0) * (i + 1)) / n, z0: 0, z1, out: SHOP_OUT }))

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
    // denns BioMarkt and Takko: the white band (a fascia under the lowest balconies) over both units; denns' striped
    // cladding with its poster windows under a thin grey ledge at the NW end, its glazing in three bays, the green
    // letters on the band over it.
    { kind: "canopy", edge: 0, u0: DENNS_CLAD[0], u1: TAKKO_GLASS[1], z: BAND_TOP, depth: SHOP_OUT, colour: WHITE_RENDER, fascia: { h: BAND_TOP - BAND_Z0, colour: WHITE_RENDER } },
    ...row("denns-cladding", DENNS_CLAD, 3, BAND_Z0),
    { kind: "canopy", edge: 0, u0: DENNS_CLAD[0], u1: DENNS_CLAD[1], z: BAND_Z0 + 0.15, depth: SHOP_OUT + 0.5, colour: [150, 154, 158, 255] },
    ...row("denns-front", DENNS_GLASS, 3, BAND_Z0),
    {
      kind: "wallSign",
      texture: "denns-letters",
      edge: 0,
      u0: DENNS_GLASS[0] + 0.3,
      u1: DENNS_GLASS[0] + 0.3 + DENNS_LETTERS_W,
      z0: DENNS_LETTERS_Z0,
      z1: DENNS_LETTERS_Z0 + DENNS_LETTERS_W / 8.3,
      out: SHOP_OUT + 0.03,
    },
    // Takko: its glazing on from denns', the yellow-orange TAKKO panel on the band over the middle bay.
    ...row("takko-front", TAKKO_GLASS, 3, BAND_Z0),
    {
      kind: "wallSign",
      texture: "takko-sign",
      edge: 0,
      u0: TAKKO_SIGN_MID - TAKKO_SIGN_W / 2,
      u1: TAKKO_SIGN_MID + TAKKO_SIGN_W / 2,
      z0: TAKKO_SIGN_Z0,
      z1: TAKKO_SIGN_Z0 + TAKKO_SIGN_H,
      out: SHOP_OUT + 0.03,
    },
  ],
}
