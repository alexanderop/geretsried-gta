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
 * The front from Street View (Sep 2023, reference/edeka-am-stern/01–03): glazing under a light canopy band, the
 * blue-grey panel wall with round porthole windows above it, a white roof edge, the yellow band with the blue EDEKA
 * logo and "Heininger & Dietz" from the corner along the front, the blue Fleischwaren board over the opening hours on
 * the white corner, and the yellow Heininger & Dietz pylon in front of it. Guesses: the heights of the bands and the
 * canopy (read off the photos against the LoD2 heights), how far the yellow band and the glazing run, the portholes'
 * count and spots (one every other bay, as far as 01 and 02 show them), the NW wall's glazing, the pylon's size and
 * its spot (between the corner and the entrance, at the edge of the car park), the yellow (#ffe31a, brand-like; the
 * photos clip it), the EDEKA board painted on the roof (no photo shows the roof). Not built: the bakery Backhupferl
 * and "Hahn im Korb" (no sign seen), the yellow cabinet in 03 (not identified), the seasonal pallets.
 */
const HALL = (9.44 - 0.6) / 3
const CORNER = (5.93 - 0.6) / 3
/** The upper wall's blue-grey panels (#48595c) and the white roof edge (#cacfd2), from 01. */
const PANELS: Rgba = [72, 89, 92, 255]
const EDGE: Rgba = [214, 218, 220, 255]
const WHITE: Rgba = [236, 236, 234, 255]
/** The yellow band: the glazed storey up to the canopy, the panels over it, the white roof edge on top. */
const BAND_Z0 = 4.35
const BAND_Z1 = 5.45

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
    // The entrance corner: its own white edge over the panels at its lower top.
    {
      pts: [4398.4, 4793.3, 4408.62, 4805.48, 4411.22, 4803.29, 4401.0, 4791.11],
      levels: CORNER,
      roof: { pitched: false },
      bands: [
        { z0: 0, z1: 3.4, colour: WHITE },
        { z0: 3.4, z1: 3.95, colour: EDGE, plain: true },
        { z0: 3.95, z1: 5.5, colour: PANELS, plain: true },
        { z0: 5.5, z1: CORNER * 3 + 0.6, colour: EDGE, plain: true },
      ],
    },
  ],
  parts: [
    // EDEKA in blue on yellow on the roof near the shop front, past the entrance corner.
    { kind: "roofSign", texture: "roof-edeka", edge: 1, u0: 19, u1: 37, n0: 2.5, n1: 8.5, z0: HALL * 3 + 0.05, z1: HALL * 3 + 0.05 },
    // The shop front: the white corner with the boards (u 0–5.6), then glass to the SE end, under a light canopy.
    ...glazing(1, 5.6, 55.6),
    { kind: "canopy", edge: 1, u0: 0.2, u1: 55.8, z: 3.75, depth: 1.6, colour: EDGE },
    { kind: "wallSign", texture: "edeka-boards", edge: 1, u0: 1.0, u1: 4.0, z0: 0.9, z1: 3.3, out: 0.06 },
    // The yellow band from the corner along the front, "Heininger & Dietz" in its middle, the logo box standing proud
    // of it over the boards; a second logo over the NW wall's corner, seen from Breslauer Weg (01's left edge).
    { kind: "wallSign", texture: "edeka-band", edge: 1, u0: 0.2, u1: 22, z0: BAND_Z0, z1: BAND_Z1, out: 0.1 },
    { kind: "wallSign", texture: "edeka-logo", edge: 1, u0: 4.9, u1: 6.8, z0: 3.95, z1: 5.95, out: 0.16 },
    { kind: "wallSign", texture: "edeka-logo", edge: 2, u0: 30.6, u1: 32.5, z0: 3.95, z1: 5.95, out: 0.06 },
    // Portholes in the panel wall over the hall's front and along Breslauer Weg (every other bay, a guess).
    ...[25, 33, 41, 49].map((u) => porthole(1, u)),
    ...[6, 14, 22].map((u) => porthole(2, u)),
    // The NW wall on Breslauer Weg: glazing, no sign (the capture notes).
    ...glazing(2, 1.0, 29.6),
    // The yellow pylon between the corner and the entrance at the car park's edge (wall 1's u 5.5, 3 m out), its faces
    // to the car park and the store.
    { kind: "pylon", u: 20.38, n: 14.04, angle: -1.607, w: 0.8, d: 0.3, h: 4.1, colour: [70, 72, 76, 255], texture: "edeka-pylon", z0: 0.05, z1: 4.05 },
  ],
}
