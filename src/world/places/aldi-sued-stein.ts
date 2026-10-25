import type { PlaceDressing } from "./dressing.ts"

/**
 * Aldi Süd, Sudetenstraße 68 in Stein: the store where the Steinböcke's VW Bus waits for the Krachlederne's
 * "gartenberg-1" job, its car park on the ESE side towards Bunsenweg. Way 1385213575 (50.8 × 30.6 m along NNE–SSW)
 * says `roof:shape=flat`, which is wrong: the Bavarian LoD2 model (2026, `DEBY_LOD2_4667297`, roof type 3100, gabled)
 * and the DOP20 show a dark grey gable roof at about 22° along the long axis, its eaves 5.6 m and its ridge 10.7 m up,
 * 12.6 m in from the WNW wall (wall 2); two cross gables, 15 m wide with their ridges at 8.6 m, ending in gables at the
 * ESE wall to the car park (wall 8, u 0 at its SSW end); and a small gabled annex in the SSW corner (walls 3 and 4,
 * ridge 7.4 m). The DOP20 also shows a 2 m strip of dark panes in a grid along wall 8 (a glass canopy), a light flat roof in front
 * of wall 6 by the corner (the trolley shelter) and two blue disabled bays in front of the SSW gable. Street View (Sep
 * 2023, places doc): white render, grey clad gables, the ALDI SÜD logo on a navy panel in the gable over the porch.
 * Guesses (docs/places/aldi-sued-stein.md): that the logo is on the SSW gable only and the entrance doors under it,
 * that the strip is a glass canopy and its height, the shelter's size and height. The DHL Packstation (finder: against
 * wall 8 about 5.5 m from its SSW end) is left out: no photo shows it, and there it would stand under the canopy.
 */
const WHITE = [240, 240, 238, 255] as const
/** Dark grey roof tiles: the DOP20's lit plane #8a8a8a, the shaded one #4a4d55 (the engine shades by the way a plane faces). */
const ROOF = [124, 122, 130, 255] as const
/** The grey vertical cladding of the gables (#a6a9a1 in Street View). */
const CLADDING = [166, 169, 161, 255] as const
/** The LoD2 eaves (5.6 m) and the cross gables' eaves, ridges and pitch. */
const LEVELS = 5.6 / 3
const PITCH = 22
/** The ESE wall's own eave: the main roof's plane through the LoD2 eave line 5.4 m inside wall 8 (the cross gables stand over it). */
const EAVE_8 = 3.42
const gable = (u0: number, u1: number) =>
  ({ kind: "gable", edge: 8, u0, u1, z0: EAVE_8 - 0.1, z: LEVELS * 3, pitch: PITCH, depth: 13.5, colours: { wall: WHITE, gable: CLADDING, roof: ROOF } }) as const

export const ALDI_SUED_STEIN: PlaceDressing = {
  poi: "Aldi Süd",
  street: "Bunsenweg",
  osmBuildingId: 1385213575,
  // One tall sales floor: the LoD2 eaves at 5.6 m.
  levels: LEVELS,
  facade: "plaster",
  wallColour: WHITE,
  // The gable roof: hipped at the LoD2 pitch, gables at the NNE end (walls 9, 0, 1), the SSW end (5) and the annex (3),
  // where the walls' tops follow the roof. Wall 8's eave is lowered so the ESE plane is the model's main plane and the
  // ridge lies 12.6 m from wall 2 as in the model; wall 6 (3.3 m further in) a hair under that plane, so it owns its
  // stretch; wall 7, between them, a gable. Wall 4's own plane gives the annex its low ridge.
  roof: {
    colour: ROOF,
    hip: PITCH,
    eaves: [
      { edges: [8], z: EAVE_8 },
      { edges: [6], z: 4.72 },
    ],
    gables: [9, 0, 1, 3, 5, 7],
  },
  parts: [
    // The two cross gables on the car-park wall, SSW and NNE, 15 m each as in the LoD2 model.
    gable(0.05, 14.85),
    gable(14.85, 29.65),
    // The ALDI SÜD logo on its navy panel in the SSW gable, over the entrance.
    { kind: "wallSign", texture: "aldi-logo", edge: 8, u0: 6.3, u1: 8.6, z0: 5.75, z1: 8.05, out: 0.1 },
    // The entrance doors at the SSW end, by the disabled bays and the trolley shelter (where along the wall is a guess).
    { kind: "wallSign", texture: "shop-front", edge: 8, u0: 0.4, u1: 5.6, z0: 0, z1: 2.85 },
    // The glass canopy along the car-park front: the DOP20's strip under the gables, dark panes in a grid of steel.
    { kind: "canopy", edge: 8, u0: 0.3, u1: 29.4, z: 3.1, depth: 2, colour: [150, 158, 160, 255], texture: "canopy-glass" },
    // The trolley shelter's light flat roof in front of wall 6 by the corner (DOP20).
    { kind: "canopy", edge: 6, u0: 10, u1: 16.4, z: 2.6, depth: 3.2, colour: [214, 214, 210, 255] },
    // Two blue disabled bays in front of the SSW gable, at right angles to the wall (Bunsenweg runs along it): flat on
    // the asphalt, just over the ground's shadow layer.
    { kind: "sprite", name: "disabled-bay", u: -4.1, n: 22.25, z: 0.12, angle: -Math.PI / 2, len: 4.6 },
    { kind: "sprite", name: "disabled-bay", u: -1.3, n: 22.25, z: 0.12, angle: -Math.PI / 2, len: 4.6 },
  ],
}
