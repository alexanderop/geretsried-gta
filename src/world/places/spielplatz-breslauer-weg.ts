import type { Rgba } from "#/render/scene/mesh.ts"
import type { GroundDressing } from "./dressing.ts"

/**
 * Spielplatz Breslauer Weg (docs/places/spielplatz-breslauer-weg.md): the wooded playground on the S side of Breslauer
 * Weg, OSM way 1271723892, a `playground` area since I-2 (dark canopy tint, leaf-covered earth, no sand pit). No
 * building to hang the equipment on, so it is a ground dressing on the area. In the street frame at the area's middle
 * (u 0 at the foot on Breslauer Weg's centre line, u runs W, n S into the playground) the area spans u −16.4..16.0 and
 * n 2.6..45.5; the road and its sidewalk reach n 5.85, so everything stands S of that.
 *
 * The layout is read off Alex's photo 40 (2026-10-26, reference/spielplatz-breslauer-weg/40-alex-spielplatz.jpg), taken
 * at the street fence by the green sign and looking SSW, so its left is E (low u) and its right W (high u): the wooden
 * A-frame hut at the back left with a bench in front of it, the green spring rider in the middle, the wooden tower with
 * the yellow slide off its E side middle right, the seesaw (yellow beam, black tyre seats) right, a bench in front of
 * the tower and the green bin on its pole right of it; the dark metal bar fence along the street with its green sign,
 * the brown wooden privacy fence along the back. Benches and the bin face the street, the hut's ridge runs along the
 * view, the seesaw's beam across it.
 *
 * Guesses: every metre (no GPS; depths from where each thing meets the ground in the photo, camera 1.6 m up at about
 * u −4, a 70° lens), kept between the crowns in public/trees.bin (no trunks are drawn); the sizes; the spring rider's
 * shape (a dark green figure in the photo); the sign's spot on the fence. Not built: the gate (drawn as fence), the
 * dog-bag dispenser at the back left, the fences on the E and W sides (hedges and garden fences of the neighbours).
 */
const FENCE: Rgba = [52, 56, 60, 255]
const SIGN: Rgba = [31, 94, 74, 255]
const BOARDS: Rgba = [112, 86, 62, 255]
const POLE: Rgba = [150, 152, 156, 255]

/** The back of Breslauer Weg's sidewalk: half its 6.5 m and the 2.6 m sidewalk. */
const SIDEWALK_BACK = 5.85
/** Turned to face the photo's camera (u turned 25° towards the street): benches, bin, seesaw and rider stand square to the view. */
const FACING = 0.44
/** The hut's ridge points along the view, away from the camera. */
const ALONG_VIEW = FACING - Math.PI / 2

export const SPIELPLATZ_BRESLAUER_WEG: GroundDressing = {
  name: "Spielplatz Breslauer Weg",
  street: "Breslauer Weg",
  area: "playground",
  at: [4303, 4561],
  parts: [
    // The street fence on the sidewalk's back from the E to the W edge of the area, its sign by the gate.
    { kind: "pylon", u: -0.2, n: SIDEWALK_BACK + 0.15, angle: 0, w: 32.2, d: 0.05, h: 1.0, colour: FENCE },
    { kind: "pylon", u: -3, n: SIDEWALK_BACK + 0.2, angle: 0, w: 0.6, d: 0.04, h: 1.1, base: 0.5, colour: SIGN },
    // The wooden privacy fence just inside the back edge (it runs from u 16.2, n 43.1 to u −17.3, n 45.5).
    { kind: "pylon", u: -0.5, n: 44.0, angle: 0.07, w: 33.2, d: 0.06, h: 1.8, colour: BOARDS },
    // Left to right in photo 40.
    { kind: "sprite", name: "spielplatz-hut", u: -7, n: 40, z: 2.2, angle: ALONG_VIEW, len: 2.8 },
    { kind: "sprite", name: "spielplatz-bench", u: -3.5, n: 37.3, z: 0.8, angle: FACING, len: 2 },
    { kind: "sprite", name: "spielplatz-rider", u: 0.5, n: 31, z: 0.8, angle: FACING, len: 1.1 },
    // The tower stands at the sprite's W end (u 4.5), the slide runs E from it.
    { kind: "sprite", name: "spielplatz-tower", u: 2.95, n: 24, z: 2.8, angle: 0, len: 4.6 },
    { kind: "sprite", name: "spielplatz-seesaw", u: 11, n: 25, z: 0.5, angle: FACING, len: 3.6 },
    { kind: "sprite", name: "spielplatz-bench", u: 3, n: 14, z: 0.8, angle: FACING, len: 2 },
    { kind: "sprite", name: "spielplatz-bin", u: 7, n: 12.5, z: 0.9, angle: FACING, len: 0.5, pole: POLE },
  ],
}
