import type { Rgba } from "#/render/scene/mesh.ts"
import type { PlaceDressing } from "./dressing.ts"

/**
 * Occasione Mode & Lifestyle, Adalbert-Stifter-Straße 39 (B6d-9): the clothes shop in the single-storey annex in front of
 * Schröter's block (schreibwaren-schroeter.ts), its own OSM way 668663478 (10 × 8 m). The Bavarian LoD2 model (2026,
 * `DEBY_LOD2_4604132`) has it flat at 3.9 m: one storey of 3.3 m and the 0.6 m parapet; the DOP roof is dark (#7f7f6a).
 * Its shop front is wall 1 (10.18 m, faces 315°, the forecourt towards St.-Hubertus-Straße), u 0 at its NE end.
 *
 * Street View (July 2022, reference/occasione/01 key; 02 the name on the block's gable): a white front with two wide
 * two-pane windows and the glass door with its transom at the SW end, under the flat roof running out as a wide canopy
 * with a dark grey edge (#54555d); over the door, under the canopy, the grey-beige board (#796e60) "OCCASIONE" with a
 * red tick over the I and a red underline, "Mode & Lifestyle" below. Metres along the wall: the door 2.2 m high gives the
 * scale (37 px/m), the front's SW end the origin; heights scaled so the canopy's top is the model's 3.9 m.
 *
 * The POI is spelled "Livestyle" in OSM; the shop's signs and website say "Lifestyle". The importer fixes it by OSM id
 * (NAME_FIXES in src/map/build.ts), so the place anchors on its POI (#217, 0.3 m from the footprint's middle).
 *
 * Guesses: the canopy's 1 m depth (its soffit is seen, its depth not), the openings to about ±0.3 m. Not seen: the first
 * 2 m of the front from the NE end (behind a tree) and the other walls: the engine's facade. Not built: the goods outside
 * (purple sofa, rail, plants).
 */
const ROOF: Rgba = [127, 127, 106, 255]
const EDGE: Rgba = [84, 85, 93, 255]

const FRONT = 1
const LEN = 10.18

export const OCCASIONE: PlaceDressing = {
  poi: "Occasione Mode & Lifestyle",
  street: "St.-Hubertus-Straße",
  osmBuildingId: 668663478,
  levels: 3.3 / 3,
  roof: { pitched: false, colour: ROOF },
  parts: [
    { kind: "wallSign", texture: "occasione-front", edge: FRONT, u0: 2.0, u1: LEN, z0: 0, z1: 2.7 },
    { kind: "wallSign", texture: "occasione-sign", edge: FRONT, u0: 7.95, u1: 9.95, z0: 2.65, z1: 3.4 },
    { kind: "canopy", edge: FRONT, u0: 0, u1: LEN, z: 3.9, depth: 1.0, colour: ROOF, fascia: { h: 0.3, colour: EDGE } },
  ],
}
