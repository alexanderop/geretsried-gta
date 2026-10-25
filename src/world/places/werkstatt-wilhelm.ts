import type { Part, PlaceDressing } from "./dressing.ts"

/**
 * Automobilwerkstatt Wilhelm, Wallensteinstraße 4: Robert Wilhelm's car
 * repair shop, the spray shop and the Mercedes G job's drop-off. A long, low
 * workshop hall (way 128266487, 59.7 × 12.8 m along NE–SW). The Bavarian LoD2
 * model (2026, `DEBY_LOD2_4667533`, a commercial building) gives it a flat
 * roof 4.8 m up; the DOP20 shows that roof light brown with a faint seam down
 * the middle, the customers' cars nosed in along the NW wall at its NE end, the
 * car park beyond the service lane there, and gardens behind the SE wall. So
 * the front is wall 0 (NW, u 0 at its NE end), where the OSM node sits 3.8 m
 * inside and 11 m from the NE end. Street View (Sep 2023, places doc): smooth
 * slate-grey cladding, a long frosted window strip at 2–4 m and the navy
 * "AUTO MOBIL robert wilhelm" sign at the NE end of the long wall, a big "4" on
 * the glass. Guesses (docs/places/werkstatt-wilhelm.md): how far the window
 * strip runs, where the sign and the "4" sit along it, the logo's orange and
 * the colour of the "4". No doors are built: none were seen.
 */
/** The frosted window band: from the sign to the SW end of wall 0 in nine equal strips (how far it really runs is a guess). */
const BAND_U0 = 6.6
const BAND_U1 = 59.3
const STRIPS = 9
const band: ReadonlyArray<Part> = Array.from({ length: STRIPS }, (_, i) => ({
  kind: "wallSign",
  texture: "werkstatt-windows",
  edge: 0,
  u0: BAND_U0 + ((BAND_U1 - BAND_U0) * i) / STRIPS,
  u1: BAND_U0 + ((BAND_U1 - BAND_U0) * (i + 1)) / STRIPS,
  z0: 2.0,
  z1: 3.9,
}))

export const WERKSTATT_WILHELM: PlaceDressing = {
  poi: "Automobilwerkstatt Wilhelm",
  street: "Wallensteinstraße",
  osmBuildingId: 128266487,
  // One tall storey: 4.2 m of wall and the 0.6 m parapet make the LoD2 model's 4.8 m.
  levels: 1.4,
  facade: "industrial",
  // Slate grey with a blue-violet cast (#4b4d60 in shade): the target colour over the metal facade's own grey.
  wallColour: [150, 146, 178, 255],
  // Flat (LoD2 roof type 1000), light brown as in the DOP20 (#c3a689), instead of the engine's clay tiles.
  roof: { pitched: false, colour: [196, 170, 140, 255] },
  parts: [
    // The navy board at the top of the long wall's NE end, as 01 shows it ("top-left" seen from the car park).
    { kind: "wallSign", texture: "werkstatt-sign", edge: 0, u0: 0.4, u1: 6.2, z0: 2.5, z1: 4.5 },
    ...band,
    // The big "4" on the glass next to the sign (02; its colour is a guess).
    { kind: "wallSign", texture: "werkstatt-4", edge: 0, u0: 7.3, u1: 8.3, z0: 2.2, z1: 3.7, out: 0.1 },
  ],
}
