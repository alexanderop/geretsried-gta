import type { Rgba } from "#/render/scene/mesh.ts"
import type { PlaceDressing } from "./dressing.ts"

/**
 * Carglass, Sudetenstraße 50 (B6d-1): the small car-glass kiosk at the N corner of its lot, a red box under a dark grey
 * fascia. Way 772887800 (12.5 × 6.6 m, long side running SW from the street); the Bavarian LoD2 model (2026,
 * `108848825`) has it flat at 3.6 m: one storey, 3 m of wall and the 0.6 m parapet.
 *
 * Front edge: wall 3, the 6.6 m NE end facing Sudetenstraße (u 0 at its E corner), not the 12.5 m SE side. Street View
 * (Sept 2023, reference/carglass/01 and 03) shows the door-and-windows face square to the road and about as wide as it
 * is 1.8 × high (6.1–7.2 m by the fascia height), and the aerial (10/11) has the short end towards the road.
 * Seen there: red walls (#813b3c lit), a dark grey fascia (#5f6060) about 0.75 m deep round the top, on the front the
 * yellow and red arrow blocks and red "CARGLASS", the glass double door on a step plate at the left under a dark visor
 * with a white notice in it, two dark-framed windows to its right; the flat roof light grey in the DOP (#cdc8c4).
 *
 * The lot's other building (way 772887798, SE across the car park) is flat in LoD2 (3.1 / 3.6 m) but drawn as a pitched
 * two-storey house: it becomes one flat storey. Which business uses it is not known: no sign, no colour change.
 *
 * Guesses: the fascia carried round the side and back walls (only the front and the NE corner are seen), the metres of
 * the door, visor and windows (read off photo 01, perspective ignored). Not built: the red pole barrier and the stand on
 * the forecourt, a bay door (none seen), the side and back walls' openings (not seen: plain red).
 */
const RED: Rgba = [129, 59, 60, 255]
const FASCIA: Rgba = [95, 96, 96, 255]
const ROOF: Rgba = [205, 200, 196, 255]

/** The NE end facing Sudetenstraße: 6.55 m, u 0 at the E corner. */
const FRONT = 3
const LEN = 6.55
/** The fascia's bottom; the wall with its parapet ends at 3.6 m. */
const FASCIA_Z = 2.85
const TOP = 3.6

export const CARGLASS: PlaceDressing = {
  poi: "Carglass",
  street: "Sudetenstraße",
  osmBuildingId: 772887800,
  levels: 1,
  facade: "plaster",
  wallColour: RED,
  roof: { pitched: false, colour: ROOF },
  bands: [{ z0: FASCIA_Z, z1: TOP, colour: FASCIA, plain: true }],
  parts: [
    { kind: "wallSign", texture: "carglass-front", edge: FRONT, u0: 0, u1: LEN, z0: 0, z1: FASCIA_Z },
    { kind: "wallSign", texture: "carglass-sign", edge: FRONT, u0: 0, u1: LEN, z0: FASCIA_Z, z1: TOP, out: 0.06 },
  ],
}

/** The second building on the lot: one flat storey as LoD2 has it, nothing else known. */
export const CARGLASS_HALL: PlaceDressing = {
  poi: "Carglass",
  street: "Sudetenstraße",
  osmBuildingId: 772887798,
  levels: 1,
  roof: { pitched: false },
  parts: [],
}
