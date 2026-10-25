import { BALCONY_DEPTH, FOUR_BALCONY_STOREYS, WHITE_RENDER, balconies, onRoof } from "./am-stern.ts"
import type { MaterialName, Rgba } from "#/render/scene/mesh.ts"
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
 *
 * Orterer Getränkemarkt (B3-5), the S corner, from Street View (reference/orterer-am-stern/01–03, takko/01): SE of
 * Takko's glazing a plain white pier carries the round-topped Orterer board (red rays over a half sun, blue "Orterer",
 * "Getränke-Märkte") at the height of the TAKKO panel; then the corner is open, an arcade under the upper storeys with
 * a grey square pillar at the corner, drink crates stacked inside. The arcade turns the corner and runs along the SE
 * end (wall 1, u 0 at the S corner, the passage to the car park): grey square pillars about 4 m apart under a white
 * beam with a small Orterer board, the shop's glazing set back behind them with crates in front (03). Drawn on the same
 * line as denns and Takko on wall 0 (BALCONY_DEPTH out); the solid stays OSM's outline, so the arcade is relief: the
 * pillars are canopy posts (never solid) and the recess behind them a texture on the wall. On wall 1 the beam stands
 * only 0.6 m out: the synthetic building -156 (a 3.9 × 12.6 m flat box the map puts 0.7–1.2 m off wall 1, where 03
 * shows open pavement) is left as it is (B3-0: "don't dress it"), and the posts stay clear of it. Guesses: the pier's
 * width (u 31.2–35.4) and so the corner opening's (to the corner, 8.1 m), the board's size (1.27 × 1.3 m) and height,
 * the wall-1 arcade's length (the Sudetenstraße block's 16 m end), pillar size (0.45 m) and spacing, the beam's depth on
 * wall 1, the small board's spot, the crate rows' spots. Not built: the blue "1880" box and the poster column on the
 * verge (street furniture, not the shop's), the door (not seen).
 *
 * The Marienburgweg face (wall 5, u 0 at the N corner, 52.4 m to the W corner; B4-4…B4-6), from Street View
 * (reference/gg-radsport/01–03, aphrodite-aestetic/01, nexial/01): a white ground floor under one dark steel canopy with
 * glass panes on cantilevered brackets that runs from GG Radsport's glazing past Nexial's, at about 4.4 m. Along the
 * wall (u) it crosses the masses: the NE strip to u 4.2, the north block's NW end to u 20.2, the link to u 37.5, the
 * Sudetenstraße block's NW end to the W corner. The shop floor stands a few steps over the pavement (a hedge in front).
 * Aphrodite (B4-5) and Nexial (B4-6) add only their own fronts and signs under it.
 *
 * GG Radsport (B4-4), the N unit in the north block's end (the POI at u 11.6): left to right in 01 a blue wall box, three
 * dark-framed glazed bays, the door bay with the red "Verkauf & Reparatur" panel and the red "Eingang" sticker, the red
 * #8c2027 fascia with the white italic "GG Radsport" over them, then the steps up to the door and the house entrance
 * Aphrodite's 01 shows from the other side. Three bikes in a stand and the green A-board on the pavement in front (02).
 * Guesses (read off the photos against a 2.2 m door, no measure): the floor's 0.6 m over the pavement, every bay's,
 * the box's and the fascia's spot and size, the canopy's height, depth and run (u 7–51.5), the steps' spot, depth and
 * count (one flight, shared with the house door), the bikes' and the board's spots.
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

/** Orterer: the white pier SE of Takko's glazing, then the open corner of the arcade to the S corner (both guesses). */
const ORTERER_PIER = [TAKKO_GLASS[1], 35.4] as const
const ORTERER_CORNER = [ORTERER_PIER[1], 43.5] as const
/** The round-topped board on the pier, 0.98 times as wide as tall (the cropped Codex board), at the TAKKO panel's height. */
const ORTERER_LOGO_H = 1.3
const ORTERER_LOGO_W = ORTERER_LOGO_H * 0.98
const ORTERER_LOGO_Z0 = 2.95
const ORTERER_LOGO_MID = (ORTERER_PIER[0] + ORTERER_PIER[1]) / 2
/** The arcade along wall 1: the Sudetenstraße block's SE end, its beam 0.6 m out (clear of building -156), grey pillars. */
const ARCADE_1 = [0, 15.9] as const
const ARCADE_1_OUT = 0.6
const PILLAR: Rgba = [150, 152, 155, 255]
const PILLAR_SIDE = 0.45

/** The Marienburgweg face (wall 5): the shared dark steel canopy over the three units (a guess, see above). */
const MARIENBURG = 5
const MB_FLOOR = 0.6
const MB_CANOPY = { u0: 7, u1: 51.5, z: 4.4, depth: 1.6 } as const
const MB_STEEL: Rgba = [62, 66, 72, 255]

/** GG Radsport: three glazed bays and the door bay, the fascia over them, the blue box left of them (guesses). */
const GG_GLASS = [8.4, 12.0] as const
const GG_DOOR = [GG_GLASS[1], 13.3] as const
const GG_GLASS_TOP = 3.2
/**
 * The Codex fascia is 7 times as wide as tall (stretched square, the wallSign gives it back): 4.9 × 0.7 m. In 01 it is
 * on the wall over the glazing, under the canopy; the play camera looks straight down, so nothing under a canopy 1.6 m
 * deep shows. It hangs on the canopy's front instead (as PENNY's board does), the glazing and door stay on the wall.
 */
const GG_FASCIA_H = (GG_DOOR[1] - GG_GLASS[0]) / 7
const GG_STEPS = [14.6, 17.2] as const

/** The shop storey's front: flush with the balconies' fronts. The white band over it, up under the lowest balcony. */
const SHOP_OUT = BALCONY_DEPTH
const BAND_Z0 = 3.2
const BAND_TOP = FOUR_BALCONY_STOREYS[0] - 0.1

/** `n` wallSigns of `texture` side by side on wall `edge` from u0 to u1, from z0 (the ground) up to z1, `out` off the wall (the shop front's line). */
const row = (texture: MaterialName, [u0, u1]: readonly [number, number], n: number, z1: number, edge = 0, out = SHOP_OUT, z0 = 0): ReadonlyArray<Part> =>
  Array.from({ length: n }, (_, i) => ({ kind: "wallSign", texture, edge, u0: u0 + ((u1 - u0) * i) / n, u1: u0 + ((u1 - u0) * (i + 1)) / n, z0, z1, out }))

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
    // Orterer: the white pier under the band with the round-topped board on it, then the open corner: the band runs on
    // as the beam over the opening on a grey pillar at the corner, the shaded arcade with its crates behind.
    { kind: "canopy", edge: 0, u0: ORTERER_PIER[0], u1: ORTERER_PIER[1], z: BAND_TOP, depth: SHOP_OUT, colour: WHITE_RENDER, fascia: { h: BAND_TOP - BAND_Z0, colour: WHITE_RENDER } },
    { kind: "wallSign", texture: "orterer-pier", edge: 0, u0: ORTERER_PIER[0], u1: ORTERER_PIER[1], z0: 0, z1: BAND_Z0, out: SHOP_OUT },
    {
      kind: "wallSign",
      texture: "orterer-logo",
      edge: 0,
      u0: ORTERER_LOGO_MID - ORTERER_LOGO_W / 2,
      u1: ORTERER_LOGO_MID + ORTERER_LOGO_W / 2,
      z0: ORTERER_LOGO_Z0,
      z1: ORTERER_LOGO_Z0 + ORTERER_LOGO_H,
      out: SHOP_OUT + 0.05,
    },
    {
      kind: "canopy",
      edge: 0,
      u0: ORTERER_CORNER[0],
      u1: ORTERER_CORNER[1],
      z: BAND_TOP,
      depth: SHOP_OUT,
      colour: WHITE_RENDER,
      fascia: { h: BAND_TOP - BAND_Z0, colour: WHITE_RENDER },
      posts: { every: ORTERER_CORNER[1] - ORTERER_CORNER[0], colour: PILLAR, side: PILLAR_SIDE },
    },
    ...row("orterer-arcade", ORTERER_CORNER, 2, BAND_Z0 + 0.4, 0, 0.04),
    // Round the corner along the passage (wall 1): the beam on grey pillars about 4 m apart, the small board on it, the
    // set-back glazing with crates in four bays.
    { kind: "canopy", edge: 1, u0: ARCADE_1[0], u1: ARCADE_1[1], z: BAND_TOP, depth: ARCADE_1_OUT, colour: WHITE_RENDER, fascia: { h: BAND_TOP - BAND_Z0, colour: WHITE_RENDER }, posts: { every: 4, colour: PILLAR, side: PILLAR_SIDE } },
    ...row("orterer-arcade", ARCADE_1, 4, BAND_Z0 + 0.4, 1, 0.04),
    { kind: "wallSign", texture: "orterer-logo", edge: 1, u0: 9.6, u1: 9.6 + 0.85 * 0.98, z0: 3.3, z1: 4.15, out: ARCADE_1_OUT + 0.03 },
    // Crate rows on pallets in the corner opening, half out from under the beam so the play camera sees them (01, 03).
    { kind: "sprite", name: "crate-stack", u: -2.4, n: 9.8, z: 1.1, angle: -0.027, len: 2.2 },
    { kind: "sprite", name: "crate-stack", u: 0.6, n: 9.8, z: 1.1, angle: -0.027, len: 2.2 },
    // The Marienburgweg face (wall 5): the dark steel canopy with its glass panes over all three units (B4-4…B4-6).
    { kind: "canopy", edge: MARIENBURG, u0: MB_CANOPY.u0, u1: MB_CANOPY.u1, z: MB_CANOPY.z, depth: MB_CANOPY.depth, colour: MB_STEEL, texture: "canopy-glass", fascia: { h: 0.18, colour: MB_STEEL } },
    // GG Radsport: three glazed bays and the door bay on the raised floor, the red fascia over them on the canopy's front, the blue wall box,
    // the steps up to the door; the bikes in their stand and the green A-board on the pavement in front.
    ...row("gg-glass", GG_GLASS, 3, GG_GLASS_TOP, MARIENBURG, 0.04, MB_FLOOR),
    { kind: "wallSign", texture: "gg-door", edge: MARIENBURG, u0: GG_DOOR[0], u1: GG_DOOR[1], z0: MB_FLOOR, z1: GG_GLASS_TOP, out: 0.04 },
    { kind: "wallSign", texture: "gg-fascia", edge: MARIENBURG, u0: GG_GLASS[0], u1: GG_DOOR[1], z0: MB_CANOPY.z - GG_FASCIA_H, z1: MB_CANOPY.z, out: MB_CANOPY.depth + 0.03 },
    { kind: "pylon", u: -39.36, n: 57.35, angle: 1.599, w: 0.55, d: 0.16, h: 1.75, base: 1.05, colour: [38, 92, 168, 255] },
    { kind: "stairs", edge: MARIENBURG, u0: GG_STEPS[0], u1: GG_STEPS[1], depth: 1.6, h: MB_FLOOR, steps: 4, colour: [196, 194, 188, 255] },
    { kind: "sprite", name: "bike-rack", u: -42.95, n: 54.45, z: 0.5, angle: 0.027, len: 1.9 },
    { kind: "sprite", name: "gg-aboard", u: -43.9, n: 56.88, z: 0.6, angle: 1.599, len: 0.9 },
  ],
}
