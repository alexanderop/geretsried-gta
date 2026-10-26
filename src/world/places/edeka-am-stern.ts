import type { Rgba } from "#/render/scene/mesh.ts"
import type { Part, PlaceDressing } from "./dressing.ts"

/**
 * EDEKA Heininger & Dietz, Breslauer Weg 113: the flat supermarket hall across Breslauer Weg from the Am Stern blocks,
 * its shop front the SW wall (wall 1, u 0 at the W corner on Breslauer Weg) on its own car park. OSM's levels 1 make
 * it a 3.6 m box; the Bavarian LoD2 model (2026, `DEBY_LOD2_4603538`, tile 686_5302) has a hall roof falling gently
 * from 9.4 m over the shop front to 6.2 m over the NE wall, and a low part at 5.9 m in the W corner, 15.9 m along the
 * shop front and 3.4 m deep: the glazed entrance the photos show at that corner. The hall is drawn flat at the shop
 * front's 9.4 m (the 5.5° fall left out, as the police station's canopy), the corner as its own lower volume. The
 * light-grey roof stays the aerial's.
 *
 * The front from Street View (Sep 2023, reference/edeka-am-stern/01–03): glazing under a canopy, the blue-grey panel
 * wall with round porthole windows above it, a white roof edge, the blue Fleischwaren board over the opening hours on
 * the corner. Alex's photo of 2026-10-26 (reference/edeka-am-stern/40, overcast, taken from Breslauer Weg into the car
 * park) corrected the corner and the signs: the entrance corner is grey plaster (#464a4d) with the house number "113"
 * on its Breslauer Weg wall and a white plaster pillar before the glazing; the canopy over the glass front is dark
 * (#17181b); the "Heininger & Dietz" fascia is a box standing on the canopy's front edge; a yellow box sign with a
 * blue bottom stripe and the square blue E logo stands on the corner's roof edge; the yellow pylon stands at the
 * car-park entrance from the street, right of the entry lane, beside a blue P board. The yellow is the photo's dark
 * ochre (#5b4900, the pylon #6e5901), not the brand yellow: the sprites are tinted to it (scripts/process-sprites.py).
 * From 40: all of that, but its metres: the photo has no GPS, so the sizes and spots are read off it against the LoD2
 * heights. Guesses: the heights of the bands and the canopy, how far the fascia box and the glazing run, the portholes'
 * count and spots (one every other bay, as far as 01 and 02 show them), the NW wall's glazing, the boards staying on
 * the (now grey) corner, the pylon's size, the roof box's width, the EDEKA board painted on the hall's roof (no photo
 * shows the roof; kept so the top-down camera reads it). Not built: the gabion wall and the advertising boards in front
 * of the pylon, the "Feuerwehrzufahrt" sign, the bakery Backhupferl and "Hahn im Korb" (no sign seen), the yellow
 * cabinet in 03 (not identified), the seasonal pallets.
 */
const HALL = (9.44 - 0.6) / 3
const CORNER = (5.93 - 0.6) / 3
/** The upper wall's blue-grey panels (#48595c) and the white roof edge (#cacfd2), from 01. */
const PANELS: Rgba = [72, 89, 92, 255]
const EDGE: Rgba = [214, 218, 220, 255]
const WHITE: Rgba = [236, 236, 234, 255]
/** The entrance corner's grey plaster (#464a4d, a plain colour: 40 shows no windows on it) and the canopy's dark slab (#17181b), from 40. */
const GREY: Rgba = [70, 74, 77, 255]
const CANOPY: Rgba = [23, 24, 27, 255]
/** The signs' dark ochre (#5b4900) and the blue of the roof box's bottom stripe, from 40. */
const OCHRE: Rgba = [91, 73, 0, 255]
const BLUE: Rgba = [18, 62, 140, 255]
/** The corner's roof, where the box sign stands, and the canopy's top, where the fascia box stands. */
const CORNER_TOP = CORNER * 3 + 0.6
const CANOPY_Z = 3.75

/** The glazing along the shop front, in strips about 6 m long so the panes keep their size. */
const glazing = (edge: number, u0: number, u1: number): ReadonlyArray<Part> => {
  const n = Math.max(1, Math.round((u1 - u0) / 6))
  return Array.from({ length: n }, (_, i) => ({ kind: "wallSign", texture: "shop-front", edge, u0: u0 + ((u1 - u0) * i) / n, u1: u0 + ((u1 - u0) * (i + 1)) / n, z0: 0, z1: 3.3 }))
}
/** A bay of the panel wall with its porthole and light pilasters, 3.2 m square, its middle at u. */
const porthole = (edge: number, u: number): Part => ({ kind: "wallSign", texture: "edeka-panels", edge, u0: u - 1.6, u1: u + 1.6, z0: 5.55, z1: 8.75, out: 0.05 })

export const EDEKA_AM_STERN: PlaceDressing = {
  poi: "EDEKA",
  street: "Breslauer Weg",
  osmBuildingId: 189042651,
  facade: "render",
  bands: [
    { z0: 0, z1: 3.4, colour: WHITE },
    { z0: 3.4, z1: 3.95, colour: EDGE, plain: true },
    { z0: 3.95, z1: 8.6, colour: PANELS, plain: true },
    { z0: 8.6, z1: HALL * 3 + 0.6, colour: EDGE, plain: true },
  ],
  masses: [
    { pts: [4459.8, 4814.9, 4434.4, 4836.2, 4408.62, 4805.48, 4411.22, 4803.29, 4401.0, 4791.11, 4423.9, 4772], levels: HALL, roof: { pitched: false } },
    // The entrance corner: grey plaster (40) under its own white edge at its lower top.
    {
      pts: [4398.4, 4793.3, 4408.62, 4805.48, 4411.22, 4803.29, 4401.0, 4791.11],
      levels: CORNER,
      roof: { pitched: false },
      bands: [
        { z0: 0, z1: 5.5, colour: GREY, plain: true },
        { z0: 5.5, z1: CORNER_TOP, colour: EDGE, plain: true },
      ],
    },
  ],
  parts: [
    // EDEKA in blue on yellow on the roof near the shop front, past the entrance corner.
    { kind: "roofSign", texture: "roof-edeka", edge: 1, u0: 19, u1: 37, n0: 2.5, n1: 8.5, z0: HALL * 3 + 0.05, z1: HALL * 3 + 0.05 },
    // The shop front: the grey corner with the boards (u 0–4) and the white pillar (u 4.2–5.5), then glass to the SE
    // end, under a dark canopy.
    ...glazing(1, 5.6, 55.6),
    { kind: "canopy", edge: 1, u0: 0.2, u1: 55.8, z: CANOPY_Z, depth: 1.6, colour: CANOPY },
    { kind: "wallSign", texture: "edeka-boards", edge: 1, u0: 1.0, u1: 4.0, z0: 0.9, z1: 3.3, out: 0.06 },
    // Plaster pillar, 1.3 m wide and 0.45 m proud, in wall 1's frame u 4.85, n -0.22 (street frame 17.63, 13.29).
    { kind: "pylon", u: 17.63, n: 13.29, angle: -1.607, w: 1.3, d: 0.45, h: CANOPY_Z, colour: WHITE },
    // "113" on the corner's Breslauer Weg wall by the pillar, 36 x 26 cm.
    { kind: "wallSign", texture: "edeka-113", edge: 2, u0: 32.3, u1: 32.66, z0: 1.3, z1: 1.56 },
    // The "Heininger & Dietz" fascia: a box standing on the canopy's front edge along wall 1's u 0.2–22 (street frame
    // 18.63, 19.58), 1.1 m high, its lettering on both broad faces.
    { kind: "pylon", u: 18.63, n: 19.58, angle: -1.607, w: 21.8, d: 0.3, h: CANOPY_Z + 1.1, base: CANOPY_Z, colour: OCHRE, texture: "edeka-band", z0: CANOPY_Z, z1: CANOPY_Z + 1.1 },
    // The box sign on the corner's roof edge over wall 2's last 3.2 m (street frame 15.89, 8.83): ochre wings with a
    // blue stripe under them, the square E logo in the middle standing taller than they do.
    { kind: "pylon", u: 15.89, n: 8.83, angle: -0.034, w: 3.2, d: 0.5, h: CORNER_TOP + 1.2, base: CORNER_TOP, colour: OCHRE },
    { kind: "pylon", u: 15.89, n: 8.83, angle: -0.034, w: 3.2, d: 0.52, h: CORNER_TOP + 0.2, base: CORNER_TOP, colour: BLUE },
    { kind: "pylon", u: 15.89, n: 8.83, angle: -0.034, w: 1.5, d: 0.6, h: CORNER_TOP + 1.7, base: CORNER_TOP, colour: OCHRE, texture: "edeka-logo", z0: CORNER_TOP + 0.1, z1: CORNER_TOP + 1.6 },
    // Portholes in the panel wall over the hall's front and along Breslauer Weg (every other bay, a guess).
    ...[25, 33, 41, 49].map((u) => porthole(1, u)),
    ...[6, 14, 22].map((u) => porthole(2, u)),
    // The NW wall on Breslauer Weg: glazing, no sign (the capture notes).
    ...glazing(2, 1.0, 29.6),
    // The ochre pylon at the car-park entrance from Breslauer Weg, 3.6 m right of the entry lane's middle (the service
    // road from (4386.6, 4791.8)) and 9 m in, off its carriageway and the sidewalk and short of the parking area; its
    // faces look along the lane, the street and the car park. Beside it, to its right, the blue P board (40).
    { kind: "pylon", u: 28.89, n: 9.24, angle: -0.075, w: 0.8, d: 0.3, h: 4.1, colour: [70, 72, 76, 255], texture: "edeka-pylon", z0: 0.05, z1: 4.05 },
    { kind: "pylon", u: 29.65, n: 9.3, angle: -0.075, w: 0.55, d: 0.1, h: 2.6, colour: [24, 52, 112, 255] },
  ],
}
