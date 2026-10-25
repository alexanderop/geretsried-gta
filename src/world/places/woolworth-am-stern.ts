import type { Part, PlaceDressing } from "./dressing.ts"

/**
 * Woolworth, Sudetenstraße 27 in Stein, on the NE side of Sudetenstraße at the Marienburgweg corner: way 1385222318,
 * a long single-storey store in front of the taller blocks of Sudetenstraße 27 (`DEBY_LOD2_4603011`/`4603012`), its
 * long SW front (wall 2, 52.6 m, u 0 at its NW end) facing the car park between it and Sudetenstraße. The Bavarian LoD2
 * model (2026, tile 684_5302, `DEBY_LOD2_4603010`, roof type 1000) has it flat at 4.46 m; the DOP20 shows the roof
 * white. Street View (reference/woolworth-am-stern/01, 02): red WOOLWORTH channel letters on the white band at the E end
 * of the front, full glazing with goods and sale placards under it, a white pier at the corner. Guesses (no measure):
 * the letters' spot and size along the band, the glazing's run to the NW (01 shows only its E part) and its bays, the
 * entrance's spot, WOOLWORTH on the roof (no photo of the roof; for the top-down camera). The exact brand red is a
 * guess too (01's sunlit #fe635f; drawn deeper).
 */
const WHITE = [246, 246, 244, 255] as const
/** The LoD2 roof at 4.46 m: the flat roof under the engine's 0.6 m parapet. */
const ROOF_Z = 4.46 - 0.6
/** The front: wall 2's length, the glazing's top under the white band, the white pier at the Marienburgweg corner. */
const FRONT = 52.59
const GLASS_Z = 2.9
const PIER = 3
/** The red letters on the band, near its E end (their aspect is the texture's, 7.0). */
const LETTERS_H = 0.92
const LETTERS_U1 = FRONT - PIER - 1.2
const LETTERS_Z0 = GLASS_Z + 0.32
/** The entrance under the letters. */
const DOOR = [44.6, 47] as const

/** Glazing bays of about 4 m from the NW end up to the entrance, then on to the pier. */
const bays = (u0: number, u1: number): Array<Part> => {
  const n = Math.max(1, Math.round((u1 - u0) / 4))
  return Array.from({ length: n }, (_, i): Part => ({ kind: "wallSign", texture: "woolworth-front", edge: 2, u0: u0 + ((u1 - u0) * i) / n, u1: u0 + ((u1 - u0) * (i + 1)) / n, z0: 0, z1: GLASS_Z }))
}

export const WOOLWORTH_AM_STERN: PlaceDressing = {
  poi: "Woolworth",
  street: "Sudetenstraße",
  osmBuildingId: 1385222318,
  levels: ROOF_Z / 3,
  facade: "plaster",
  wallColour: WHITE,
  roof: { pitched: false, colour: [240, 240, 238, 255] },
  parts: [
    // The store's glazing along the car-park front, the entrance under the letters.
    ...bays(1, DOOR[0]),
    { kind: "wallSign", texture: "shop-front", edge: 2, u0: DOOR[0], u1: DOOR[1], z0: 0, z1: GLASS_Z },
    ...bays(DOOR[1], FRONT - PIER),
    // The red WOOLWORTH letters on the white band.
    { kind: "wallSign", texture: "woolworth-letters", edge: 2, u0: LETTERS_U1 - LETTERS_H * 7.02, u1: LETTERS_U1, z0: LETTERS_Z0, z1: LETTERS_Z0 + LETTERS_H, out: 0.06 },
    // WOOLWORTH in red on the white roof by the E end, for the top-down camera, reading from the car park.
    { kind: "roofSign", texture: "woolworth-letters", edge: 2, u0: 28, u1: 48, n0: 2.2, n1: 5.05, z0: ROOF_Z + 0.05, z1: ROOF_Z + 0.05 },
  ],
}
