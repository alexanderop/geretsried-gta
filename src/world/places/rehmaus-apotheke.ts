import type { PlaceDressing } from "./dressing.ts"

/**
 * Rehmaus Apotheke, Sudetenstraße 14 (the old Arkaden Apotheke, renamed in
 * 2025): the courier job's first drop-off. A three-storey block in light
 * grey-blue render (OSM has no `building:levels`) with a ground-floor arcade
 * of round arches on white pillars along its car-park front (walls 8 and 9,
 * both facing the street), the red serif "REHMAUS APOTHEKE" over the
 * pharmacy's four arches, and the red pharmacy "A" on its post in front.
 * The POI sits behind the right end of wall 8, so the pharmacy has that
 * wall's right four arches; the two on its left are the other shop's.
 */
const PILLAR = [232, 222, 210, 255] as const
const GLAZING = [110, 108, 104, 255] as const

export const REHMAUS_APOTHEKE: PlaceDressing = {
  poi: "Rehmaus Apotheke",
  street: "Sudetenstraße",
  osmBuildingId: 120402845,
  levels: 3,
  // The neutral render times this: about #a9b3c4 on the plaster.
  facade: "render",
  wallColour: [180, 190, 208, 255],
  parts: [
    { kind: "arcade", edge: 8, u0: 0.3, u1: 19.05, arches: 6, h: 2.7, depth: 0.5, pillar: PILLAR, glazing: GLAZING },
    { kind: "arcade", edge: 9, u0: 0.02, u1: 18.8, arches: 6, h: 2.7, depth: 0.5, pillar: PILLAR, glazing: GLAZING },
    // Over the pharmacy's arches (wall 8, u 6.3 to 18.4 with their pillars): letters 1 m tall on the render above the arcade's band.
    { kind: "wallSign", texture: "rehmaus-sign", edge: 8, u0: 7.4, u1: 17.4, z0: 3.2, z1: 4.2 },
    // The free-standing pharmacy sign on the green in front of its arches, clear of the kerb trees, turned to read upright on screen.
    { kind: "sprite", name: "pharmacy-a", u: 2.5, n: 9, z: 2.6, angle: 2.54, len: 1.3, pole: [150, 152, 156, 255] },
  ],
}
