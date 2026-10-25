import type { PlaceDressing } from "./dressing.ts"

/**
 * Bäckerei Mühlenbäck, Sudetenstraße 19, where every game starts: a cream
 * block of three storeys (Street View, Aug 2022; OSM has no
 * `building:levels`) with a row of shops along its street front, wall 0
 * (u from its NW end). The Bavarian LoD2 model (2026) splits the footprint
 * into three houses along the street: No. 17 in the NW third (the HoangAnh
 * restaurant), No. 19 in the middle under a gable roof (Angel Nails, then the
 * bakery with its white sign, red round logo and cream awning) and a hipped
 * house in the SE third (a shop with a small red sign, then one with a long
 * red awning). The roof is one hipped roof over the footprint, ending in a
 * gable at the NW wall (5) as the model's NW house does. Guesses
 * (docs/places/muehlenbaeck-sudetenstrasse.md): where one shop ends and the
 * next begins, the sign's lettering and logo, No. 17's front (no photo), and
 * all three houses at one height (the model has the NW one taller). Angel
 * Nails (B6a-1) guesses: how far the box sign and the pillar stand proud, the
 * door's and window's widths, the posters (Street View is too blurred to read).
 */
const CREAM = [252, 249, 237, 255] as const
/** The shop fronts' glazing under the grey fascia, then the signs over it, and the awnings' tops. */
const FRONT_Z = 2.85
const AWNING_Z = 2.55
const AWNING_DEPTH = 1.4
/**
 * Wall 0 in the street frame: its u 0 lies at the frame's u -21.97, the wall runs parallel to the street (0.0007 rad off)
 * 7.14 m out from the centre line. Places the boxes that stand proud of the wall (pylon parts are in the street frame).
 */
const WALL_U0 = -21.97
const WALL_N = 7.14
/** Angel Nails' pink, sampled #ec86a0 off its fascia; the pillar's #9b4668 lifted like the wall's shaded #b5b7b4 to cream. */
const ANGEL_PINK = [236, 134, 160, 255] as const
const ANGEL_PILLAR = [209, 95, 140, 255] as const
/** Its box sign (a guess: 0.3 m deep), its top a pink strip the straight-down play camera sees. */
const ANGEL_SIGN = { u0: 13.4, u1: 18.3, z1: 3.9, depth: 0.3 } as const
const front = (u0: number, u1: number, texture: "shop-front" | "bakery-front" | "angel-nails-front" = "shop-front") => ({ kind: "wallSign", texture, edge: 0, u0, u1, z0: 0, z1: FRONT_Z }) as const

export const MUEHLENBAECK: PlaceDressing = {
  poi: "Mühlenbäck",
  street: "Sudetenstraße",
  osmBuildingId: 127604891,
  levels: 3,
  // The neutral render times this: #edeadf on the plaster.
  facade: "render",
  wallColour: CREAM,
  // The LoD2 planes rise at about 28° (eaves 8.9–9.4 m, ridges 11.5–12.1 m); red-brown tiles between the DOP20's brown
  // middle house and terracotta SE house.
  roof: { colour: [152, 98, 72, 255], hip: 28, gables: [5] },
  parts: [
    // No. 17 (HoangAnh): glazing only, its sign is not known.
    front(0.3, 6.6),
    front(6.6, 12.9),
    // No. 19: Angel Nails (B6a-1, Street View 02/05): its own front, the pink pillar left of the white door, the window
    // with the price list and a face poster under a band of nail photos; over it the pink box sign with "Angel Nails".
    front(13.0, 18.6, "angel-nails-front"),
    // The pillar stands 0.2 m proud (a guess) so its top shows from above.
    { kind: "pylon", u: WALL_U0 + 13.28, n: WALL_N - 0.1, angle: 0, w: 0.56, d: 0.2, h: FRONT_Z, colour: ANGEL_PILLAR },
    {
      kind: "pylon",
      u: WALL_U0 + (ANGEL_SIGN.u0 + ANGEL_SIGN.u1) / 2,
      n: WALL_N - ANGEL_SIGN.depth / 2,
      angle: 0,
      w: ANGEL_SIGN.u1 - ANGEL_SIGN.u0,
      d: ANGEL_SIGN.depth,
      h: ANGEL_SIGN.z1,
      base: FRONT_Z,
      colour: ANGEL_PINK,
    },
    { kind: "wallSign", texture: "angel-nails-sign", edge: 0, u0: ANGEL_SIGN.u0, u1: ANGEL_SIGN.u1, z0: FRONT_Z, z1: ANGEL_SIGN.z1, out: ANGEL_SIGN.depth + 0.02 },
    front(18.6, 25.0, "bakery-front"),
    { kind: "canopy", edge: 0, u0: 18.8, u1: 24.8, z: AWNING_Z, depth: AWNING_DEPTH, colour: [253, 248, 238, 255], texture: "awning" },
    { kind: "wallSign", texture: "muehlenbaeck-sign", edge: 0, u0: 18.9, u1: 24.7, z0: FRONT_Z, z1: 4.2, out: 0.1 },
    // Its sidewalk board in front of its window, turned by minus the street frame's angle (0.596 rad) to read upright on screen.
    { kind: "sprite", name: "bakery-board", u: 0, n: 5.0, z: 0.7, angle: -0.596, len: 0.9 },
    // The SE house: a shop with a small red sign (its name is unreadable on Street View), then one under a long red awning.
    front(25.1, 30.8),
    { kind: "wallSign", texture: "shop-board-red", edge: 0, u0: 26.8, u1: 29.3, z0: FRONT_Z, z1: 3.85, out: 0.1 },
    front(30.8, 37.5),
    { kind: "canopy", edge: 0, u0: 31.0, u1: 37.3, z: AWNING_Z, depth: AWNING_DEPTH, colour: [224, 111, 109, 255], texture: "awning" },
  ],
}
