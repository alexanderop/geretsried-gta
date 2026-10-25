import type { PlaceDressing } from "./dressing.ts"

/**
 * Deutsche Post Filiale 571, Sudetenstraße 34: a Post counter in the newsagent
 * GerLTZ (Lotto · Tabak · Zeitschriften), the place of the job that blows up
 * the Post van. The footprint is an L of white render: the long arm along
 * Sudetenstraße (wall 3, 45.8 m, u from its SE end), the short arm down
 * Altvaterstraße. The Bavarian LoD2 model (2026) splits the street arm into
 * three gabled houses, SE to NW at wall-3 u 0–10.3, 10.3–29.5 and 29.5–45.8,
 * eaves 10.0–10.8 m, ridges 12.3–12.9 m at about 22°, a gable at the NW end
 * (wall 5); the neighbour at Nos. 28–32, the same kind of row, is tagged three
 * storeys in OSM. The building passage OSM maps runs under the NW corner
 * (point 4), so the newsagent (the POI at u 36.4, the Post finder's point at
 * u 39.2) is the NW house's shop. Street View (Aug 2022): a continuous glass
 * canopy on steel brackets over the shop row, the sign band Merkur · LOTTO ·
 * GerLTZ · SZ/AZ over the newsagent, a yellow letter box and a brown bin at
 * the kerb. Guesses (docs/places/post-filiale-571.md): where the shops begin
 * and end, the other shops' fronts, the canopy's depth and height, and the
 * yellow Deutsche Post board (no photo shows one; the counter came back to
 * No. 34 after 2022).
 */
const WHITE_RENDER = [250, 250, 248, 255] as const
/** The shop fronts' glazing, the glass canopy's top over them, and the signs over the canopy. */
const FRONT_Z = 2.85
const CANOPY_Z = 3.05
const SIGN_Z0 = 3.15
const SIGN_Z1 = 4.3
const front = (u0: number, u1: number) => ({ kind: "wallSign", texture: "shop-front", edge: 3, u0, u1, z0: 0, z1: FRONT_Z }) as const

export const POST_FILIALE_571: PlaceDressing = {
  poi: "Deutsche Post Filiale 571",
  street: "Sudetenstraße",
  osmBuildingId: 119921780,
  // LoD2 eaves at 10–10.8 m: three storeys with a tall shop floor (OSM's apartments default would be four).
  levels: 3,
  facade: "render",
  wallColour: WHITE_RENDER,
  // The DOP20 shows brown tiles, dark on the NE planes and pale on the sunlit SW ones; the LoD2 planes rise at about 22°.
  roof: { colour: [128, 92, 76, 255], hip: 22, gables: [5] },
  parts: [
    // The SE house and the middle one: shops whose names are not known, glazing only.
    front(0.3, 5.2),
    front(5.2, 10.1),
    front(10.4, 16.7),
    front(16.7, 23.0),
    front(23.0, 29.3),
    // The NW house: the newsagent with the Post counter, the yellow Post board (a guess) and the sign band seen in 2022.
    front(29.6, 34.9),
    front(34.9, 40.2),
    { kind: "wallSign", texture: "post-sign", edge: 3, u0: 29.8, u1: 31.8, z0: SIGN_Z0, z1: SIGN_Z1, out: 0.1 },
    { kind: "wallSign", texture: "gerltz-signs", edge: 3, u0: 32.0, u1: 40.1, z0: SIGN_Z0, z1: SIGN_Z1, out: 0.1 },
    // The next shop (a sonnenklar travel agency in 2022) up to the passage under the NW corner.
    front(40.4, 43.6),
    // One glass canopy along the whole shop row, the passage left open.
    { kind: "canopy", edge: 3, u0: 0.3, u1: 43.6, z: CANOPY_Z, depth: 1.6, colour: [214, 220, 222, 255], texture: "canopy-glass" },
    // The yellow letter box and the brown bin at the kerb by the newsagent, turned by minus the street frame's angle (−2.578 rad) to read upright.
    { kind: "sprite", name: "post-box", u: 5, n: 4.7, z: 1.2, angle: 2.578, len: 0.75 },
    { kind: "sprite", name: "litter-bin", u: 6.3, n: 4.7, z: 0.9, angle: 2.578, len: 0.55 },
  ],
}
