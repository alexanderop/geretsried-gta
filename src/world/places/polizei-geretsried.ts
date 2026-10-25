import type { PlaceDressing } from "./dressing.ts"

/**
 * Polizeiinspektion Geretsried, Jeschkenstraße 31: where the Steinböcke want the stolen taxi ("stein-1"). Way
 * 127717998 is a 16.7 × 31.8 m rectangle along N–S; wall 0 is the N gable towards Jeschkenstraße (u 0 at its E end),
 * wall 1 the E side, 2 the S gable, 3 and 4 the W side (4 the N 23.9 m of it, u 0 at the N corner). The Bavarian LoD2
 * model (2026, `DEBY_LOD2_4667037`, ALKIS function 3071 "Polizei") has the walls on 12.5 × 28.6 m only, flush with OSM's
 * W and N walls (OSM's E wall stands 5.3 m and its S wall 3.5 m outside them), under a very low gable roof along the
 * long axis, eaves 8.7 m and ridge 9.3 m, which is the laser-scanned top of the solar canopy. The DOP20 shows that
 * canopy as a 15.2 × 30.6 m field of dark panels in a light frame, 1.35 m past the model's long walls and 1 m past its
 * gables, in 2 × 4 fields, and a stepped, light structure off the W wall 7–15 m from the N corner (read as the stairs
 * and ramp). Kept from the backlog: the OSM footprint and 2 storeys. Guesses (docs/places/polizei-geretsried.md; the
 * photos were not on disk): the plinth's height, the door, the stairs, the ramp and the metal canopy over them (the
 * aerial only shows that something stands there), where the POLIZEI sign hangs on the N gable and its size (made 0.8 m
 * to read from the play camera), the posts' spacing, and the canopy flattened at 9 m (the model's 5° gable left out).
 */
const WHITE_RENDER = [243, 243, 240, 255] as const
/** The grey render plinth (#606674 in shade), under the ground-floor sills of the facade texture. */
const PLINTH = [138, 144, 156, 255] as const
const CONCRETE = [196, 194, 188, 255] as const
const STEEL = [96, 100, 108, 255] as const
/** The ground floor sits a little over the ground: what the stairs and the ramp climb (a guess). */
const FLOOR = 0.9
/** The walls' top, 2 storeys plus the flat roof's parapet, where the canopy's posts stand. */
const WALL_TOP = 6.6

export const POLIZEI_GERETSRIED: PlaceDressing = {
  poi: "Polizeiinspektion Geretsried",
  street: "Jeschkenstraße",
  osmBuildingId: 127717998,
  facade: "civic",
  wallColour: WHITE_RENDER,
  bands: [{ z0: 0, z1: 0.55, colour: PLINTH, plain: true }],
  // The flat roof under the canopy, only seen at its edges: dark, like the panels over it.
  roof: { pitched: false, colour: [70, 76, 93, 255] },
  parts: [
    // The solar canopy: the LoD2 top at 9 m, overhanging the long walls 1.35 m and the gables 1 m as in the DOP20, its
    // panels in 2 × 4 fields, on steel posts standing on the walls.
    {
      kind: "deck",
      edge: 0,
      rect: [-1.35, 18.05, -1.0, 32.8],
      z: 9,
      thickness: 0.35,
      colour: [62, 64, 70, 255],
      texture: "solar-field",
      repeat: [2, 4],
      posts: { z0: WALL_TOP, every: 4, colour: STEEL },
    },
    // The entrance on the W side, where the DOP20 shows the stepped structure: a ramp along the wall up from the N, the
    // stairs and the door at its top under a flat metal canopy.
    { kind: "ramp", edge: 4, u0: 5, u1: 11.5, depth: 1.4, h: FLOOR, low: "u0", colour: CONCRETE, rail: STEEL },
    { kind: "stairs", edge: 4, u0: 11.5, u1: 14.5, depth: 2.4, h: FLOOR, steps: 5, colour: CONCRETE },
    { kind: "wallSign", texture: "shop-front", edge: 4, u0: 11.9, u1: 14.1, z0: FLOOR, z1: FLOOR + 2.4 },
    { kind: "canopy", edge: 4, u0: 10.6, u1: 15.4, z: 3.7, depth: 2.8, colour: [150, 155, 160, 255] },
    // The blue POLIZEI star sign on the N gable, towards Jeschkenstraße, near the W corner.
    { kind: "wallSign", texture: "polizei-sign", edge: 0, u0: 14.8, u1: 15.6, z0: 2.2, z1: 3.0, out: 0.06 },
  ],
}
