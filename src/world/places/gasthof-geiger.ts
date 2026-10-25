import type { Rgba } from "#/render/scene/mesh.ts"
import type { Part, PlaceDressing } from "./dressing.ts"

/**
 * Gasthof Geiger, Tattenkofener Straße 1, on the E side of the B11 behind the Nikolauskapelle: way 122032724, a long
 * white inn whose W front faces the B11 and the chapel meadow. OSM splits that front into two straight walls on one line
 * (3: 10.7 m at the N end, 4: 22.2 m on to the S end; u 0 at each one's N end). The Bavarian LoD2 model (2026, tile
 * 684_5302) has it as `DEBY_LOD2_4531992`, a hipped roof (roofType 3200) with eaves at 7.13 m and the ridge at 12.67 m,
 * the ridge running N–S 21 m long, the planes at 43.5° over the model's 11.5 m depth. OSM's outline is 12.6 m deep, so
 * the roof is drawn at 41.3°, which gives the model's ridge. The DOP20 shows brown tiles (#c6b099 on the sunlit W plane,
 * the E plane in shade); the 2012 photo has them red-brown, so the roof leans red.
 *
 * Commons photo (reference/gasthof-geiger/05, crop 06, 2012): white render; small square windows with white frames in
 * grey-green baroque surrounds with a scalloped top on both floors; between the floors over the black door (a lantern
 * over it, a small menu board beside it) a dark timber beam with "Gasthof Geiger" in black script under it, and a
 * wrought-iron bracket over the beam with a small white and red blade. The name also goes on the W roof plane, on a
 * cream board reading W to E, for the top-down camera.
 *
 * Guesses (read off one photo taken at an angle, no measure): the door's spot (22 m from the N end; the photo has it
 * right of the middle), the window columns and their sizes and heights, the beam's and lettering's size, the bracket
 * sign, the roof colour, the roof board (no photo of the roof). Not built: the model's 3.8 m porch at the NW corner
 * (outside OSM's outline), the chimneys and the TV aerial, the gravel car park N of the house, the beer garden and the
 * N/E/S facades (no reference).
 */
const WHITE: Rgba = [242, 242, 238, 255]
const ROOF: Rgba = [178, 120, 94, 255]
/** The LoD2 eaves, and the pitch that brings OSM's 12.6 m depth up to the model's 12.67 m ridge. */
const EAVES = 7.13
const PITCH = 41.3
/** Wall 3's length: the W front's u from its N end is wall 3's u up to here, then wall 4's u + WALL_3. */
const WALL_3 = 10.7
/** The window tiles (2.1 m squares of wall round one surround) on both floors, by their centre from the N end. */
const WIN = 2.1
const WIN_Z = [0.3, 3.8] as const
const COLUMNS = [3.4, 6.5, 9.6, 13.2, 16.7, 20.0, 24.35, 27.5, 30.6] as const
/** The door with its lantern and menu board (a 2.1 m tile), from the N end; the beam and lettering over it (5:1). */
const DOOR = 22.15
const DOOR_W = 2.1
const SIGN_W = 4.9
const SIGN_Z0 = 2.75

/** A wall-4 or wall-3 sign, given by its stretch along the whole W front from the N end. */
const front = (texture: "geiger-window" | "geiger-door" | "geiger-sign", a: number, b: number, z0: number, z1: number): Part =>
  a >= WALL_3 ? { kind: "wallSign", texture, edge: 4, u0: a - WALL_3, u1: b - WALL_3, z0, z1 } : { kind: "wallSign", texture, edge: 3, u0: a, u1: b, z0, z1 }
/** z on the W roof plane, n meters in from wall 4, a few centimetres over the tiles. */
const roofZ = (n: number) => EAVES + n * Math.tan((PITCH * Math.PI) / 180) + 0.06
/**
 * The bracket sign in the street frame (the B11's): wall 4 at the door's u runs through (6.35, 8.88), out of it is
 * angle -1.434. A black arm out of the wall over the beam, the white blade under it with its red top.
 */
const OUT_ANGLE = -1.434
const out = (m: number) => [6.35 + 0.136 * m, 8.88 - 0.991 * m] as const

export const GASTHOF_GEIGER: PlaceDressing = {
  poi: "Gasthof Geiger",
  street: "Bundesstraße",
  osmBuildingId: 122032724,
  levels: EAVES / 3,
  facade: "render",
  wallColour: WHITE,
  roof: { colour: ROOF, hip: PITCH },
  parts: [
    // The windows in their baroque surrounds, both floors; none over the door, where the beam and the name are.
    ...COLUMNS.flatMap((c) => WIN_Z.map((z) => front("geiger-window", c - WIN / 2, c + WIN / 2, z, z + WIN))),
    front("geiger-door", DOOR - DOOR_W / 2, DOOR + DOOR_W / 2, 0, DOOR_W),
    front("geiger-sign", DOOR - SIGN_W / 2, DOOR + SIGN_W / 2, SIGN_Z0, SIGN_Z0 + SIGN_W / 5.04),
    // The bracket over the beam: the iron arm, the white blade, its red top.
    { kind: "pylon", u: out(0.34)[0], n: out(0.34)[1], angle: OUT_ANGLE, w: 0.66, d: 0.05, h: 4.62, base: 4.54, colour: [26, 26, 28, 255] },
    { kind: "pylon", u: out(0.48)[0], n: out(0.48)[1], angle: OUT_ANGLE, w: 0.3, d: 0.04, h: 4.5, base: 3.75, colour: [236, 236, 232, 255] },
    { kind: "pylon", u: out(0.48)[0], n: out(0.48)[1], angle: OUT_ANGLE, w: 0.31, d: 0.05, h: 4.5, base: 4.25, colour: [184, 40, 36, 255] },
    // The name on the W roof plane over the door, reading W to E from above (its top towards the N end).
    { kind: "roofSign", texture: "geiger-board", edge: 4, u0: DOOR - WALL_3 - 1.2, u1: DOOR - WALL_3 + 1.2, n0: 0.4, n1: 5.8, z0: roofZ(0.4), z1: roofZ(5.8), up: "u0" },
  ],
}
