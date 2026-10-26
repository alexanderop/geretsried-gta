import type { Rgba } from "#/render/scene/mesh.ts"
import type { Part, PlaceDressing } from "./dressing.ts"

/**
 * Fahrzeugtechnik Manfred Seitz, Breslauer Weg 75: the motorbike and car workshop, a two-storey flat-roofed block on
 * the N side of Breslauer Weg, a little east of the Königsberger Weg corner. Not in OSM as a shop: I-2 adds its POI by
 * hand (src/map/extra-pois.ts) at the centre of the footprint, and the place anchors on it. The footprint is way 128503556 (312 m², 17.6 × 17.8 m); its S wall, edge 3 (from the SE corner to the SW
 * corner, u 0 at the W end as you face it), is the street front. The Bavarian LoD2 model (2026, tile 686_5302) has a
 * flat roof 9.1 m up: 2 storeys, the 8.5 m of wall and 0.6 m parapet below.
 *
 * The front from Alex's photo 40 (2026-10-26, reference/fahrzeugtechnik-seitz/40-alex-front.jpg): a grey ground storey
 * (#8b8f8f) with a thin brown line, a white upper storey (#cbcacf) with grey roller shutters half down, a brown fascia
 * (#73543f) and its overhanging board along the roof edge, the black "Fahrzeug technik SEITZ" board over two dark-framed
 * shop windows (the motorbike brands on the left, the red "PKW SERVICE" panel and the blinds with "Alle Fabrikate!
 * Meisterbetrieb" on the right), and the glass door under a small dark grey (#3b3c43) canopy left of the sign. The
 * photo's front is wider than the OSM way: the aerial (DOP, lean of the 9 m roof taken out) shows the real block
 * reaching about 5 m further W than OSM draws it, which is the "Kosmetikstudio Orchidee" unit left of the canopy in
 * the photo. The way's E end matches the aerial, so everything is laid out from that end and Orchidee (a second business,
 * no POI) is left as plain wall. Right of the block, the aerial shows the white party tent about 5 m past the SE corner.
 *
 * Guesses: the metres of every part along the wall (read off the photo, 82 px per m at the door, perspective ignored;
 * the photo cuts the left end off), the storey heights, the four window positions, the canopy's depth and flat shape
 * (the real one is hipped, a tiled lean-to), the tent's and the motorbike row's spots, the roof colour (the OSM grey; the
 * aerial shows solar panels, not drawn). Not built: the E wall's window strip (seen only edge-on), the bicycle, the red-white
 * chain on posts, the tyre stack, the street lamp, Orchidee's sign, the Benelli logo apart from the window strip.
 */
const GROUND: Rgba = [139, 143, 143, 255]
const LINE: Rgba = [139, 106, 84, 255]
const WHITE: Rgba = [203, 202, 207, 255]
const FASCIA: Rgba = [115, 84, 63, 255]
const CANOPY: Rgba = [59, 60, 67, 255]
const ROOF: Rgba = [153, 161, 165, 255]

/** The street front: the footprint's S wall. */
const FRONT = 3
/** The wall's length (17.59 m) and its E end: u of a part is measured from there, so a "d" is metres in from the E corner. */
const LEN = 17.59
const d = (m: number) => LEN - m

/** Storeys: 8.5 m of wall and the 0.6 m parapet make the LoD2 model's 9.1 m. */
const WALL_TOP = 8.5
/** The ground storey up to its thin brown line, the white storey above to the fascia board. */
const GROUND_TOP = 3.7
const FASCIA_BOTTOM = 8.4

/** The upper storey's four shuttered windows (u0, u1) from the E: photo 40 shows a wide one at the E end, two narrower, a pair at the left edge. */
const UPPER: ReadonlyArray<readonly [number, number]> = [
  [d(4.0), d(1.2)],
  [d(8.4), d(6.0)],
  [d(10.7), d(9.5)],
  [d(15.2), d(13.4)],
]

export const FAHRZEUGTECHNIK_SEITZ: PlaceDressing = {
  poi: "Fahrzeugtechnik Seitz",
  street: "Breslauer Weg",
  osmBuildingId: 128503556,
  levels: WALL_TOP / 3,
  facade: "plaster",
  wallColour: WHITE,
  roof: { pitched: false, colour: ROOF },
  bands: [
    { z0: 0, z1: GROUND_TOP, colour: GROUND, plain: true },
    { z0: GROUND_TOP, z1: GROUND_TOP + 0.12, colour: LINE, plain: true },
    { z0: GROUND_TOP + 0.12, z1: FASCIA_BOTTOM, colour: WHITE, plain: true },
    { z0: FASCIA_BOTTOM, z1: WALL_TOP + 0.6, colour: FASCIA, plain: true },
  ],
  parts: [
    // The brown board overhanging the front along the whole roof edge (photo 40: a wide board on brackets).
    { kind: "deck", edge: FRONT, rect: [0, LEN, -0.4, 0], z: 8.9, thickness: 0.45, colour: FASCIA },
    ...UPPER.map(([u0, u1]): Part => ({ kind: "wallSign", texture: "seitz-window", edge: FRONT, u0, u1, z0: 4.6, z1: 6.1 })),
    // The black sign over the two shop windows (centred on them), 7.3:1 like the board in photo 40.
    { kind: "wallSign", texture: "seitz-sign", edge: FRONT, u0: d(8.2), u1: d(1.8), z0: 2.75, z1: 3.63, out: 0.08 },
    // Shop windows: the motorbike brands, then the PKW service window and the blinds.
    { kind: "wallSign", texture: "seitz-shop", edge: FRONT, u0: d(9.3), u1: d(5.0), z0: 0.9, z1: 2.2 },
    { kind: "wallSign", texture: "seitz-pkw", edge: FRONT, u0: d(4.0), u1: d(1.2), z0: 0.9, z1: 2.2 },
    // The glass door with its side light, left of the sign, under the small canopy.
    { kind: "wallSign", texture: "seitz-door", edge: FRONT, u0: d(11.0), u1: d(9.8), z0: 0, z1: 2.4 },
    { kind: "canopy", edge: FRONT, u0: d(13.5), u1: d(8.5), z: 3.3, depth: 1.4, colour: CANOPY, texture: "roof-tiles", fascia: { h: 0.2, colour: CANOPY } },
    // The party tent past the SE corner (aerial), the motorbikes parked in front of the brand window (photo 40).
    { kind: "sprite", name: "seitz-tent", u: 12.65, n: 12.56, z: 3.0, angle: 0, len: 5 },
    { kind: "sprite", name: "seitz-bikes", u: 3.7, n: 11.4, z: 0.05, angle: 0, len: 6.5 },
  ],
}
