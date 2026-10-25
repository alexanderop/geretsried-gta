import type { PlaceDressing } from "./dressing.ts"

/**
 * The Sparkasse's Stein branch at the corner of Händelstraße and
 * Johann-Sebastian-Bach-Straße (OSM gives the POI no address; Street View
 * labels it 1 Händelstraße). Four storeys on Street View (OSM has no
 * `building:levels`): the bank's grey ground floor, two storeys of white
 * render, a grey top storey under the eaves. Tall bank windows with red bands
 * and the red "Sparkasse" on the Händelstraße face (wall 4, u from the S
 * corner) and the corner face (wall 3), grey metal balconies at the N end,
 * the red flag and a yield sign at the corner, and a solar array on the
 * street side of the roof's S half, where the DOP40 photo shows a dark strip.
 * The single-storey podium at the corner is not modelled: its extent needs a
 * photo (docs/places/sparkasse-stein.md).
 */
const WINDOW_Z = [0, 3] as const
// Each strip is two windows and a lamp, 6 m wide (or the corner face's half); the render shows where there are none.
const windows = (edge: number, u0: number, u1: number) => ({ kind: "wallSign", texture: "sparkasse-windows", edge, u0, u1, z0: WINDOW_Z[0], z1: WINDOW_Z[1] }) as const
// Turned by minus the frame's angle (-0.907 rad), so the flag's logo reads upright and the yield sign points down on screen.
const UPRIGHT = 0.907

export const SPARKASSE_STEIN: PlaceDressing = {
  poi: "Sparkasse",
  street: "Händelstraße",
  osmBuildingId: 128271967,
  levels: 4,
  // The neutral render: white upper storeys (#f0f0f0 lit); the bands give the grey base (#c0bcb5) and top storey (#75757b).
  facade: "render",
  wallColour: [255, 255, 255, 255],
  bands: [
    { z0: 0, z1: 3, colour: [204, 200, 193, 255] },
    { z0: 9, z1: 12, colour: [124, 124, 131, 255] },
  ],
  parts: [
    windows(4, 0.3, 6.3),
    windows(4, 6.3, 12.3),
    windows(4, 12.3, 18.3),
    windows(4, 18.3, 24.3),
    windows(3, 0.05, 5.9),
    windows(3, 5.95, 11.8),
    // The lettering over the windows' tops, near the corner on the long face and centred on the corner face: 1.7 m
    // tall (4:1), reaching a little into the white storey, because a wall leans only about 8 px per meter into view.
    { kind: "wallSign", texture: "sparkasse-sign", edge: 4, u0: 0.8, u1: 7.6, z0: 1.9, z1: 3.6, out: 0.1 },
    { kind: "wallSign", texture: "sparkasse-sign", edge: 3, u0: 2.55, u1: 9.35, z0: 1.9, z1: 3.6, out: 0.1 },
    { kind: "balcony", edge: 4, u0: 30.5, u1: 36.5, z: [3, 6, 9], depth: 1.3, colour: [82, 100, 113, 255], slab: [117, 117, 123, 255] },
    // On the corner's paving, clear of both streets: the flag on its pole, and the yield sign where Händelstraße meets Johann-Sebastian-Bach-Straße.
    { kind: "sprite", name: "sparkasse-flag", u: -4, n: 8.5, z: 7, angle: UPRIGHT, len: 2.4, pole: [205, 207, 210, 255] },
    { kind: "sprite", name: "yield-sign", u: -8, n: 4.9, z: 2.1, angle: UPRIGHT, len: 0.8, pole: [150, 152, 156, 255] },
    // Along the ridge, on the street-side plane, just over the eaves-height roof. The ridge runs at +0.302 rad from u
    // towards n, but a sprite's angle turns the other way (n is u turned clockwise on the map), hence -0.302.
    { kind: "sprite", name: "solar-panels", u: 11.8, n: 14.7, z: 12.08, angle: -0.302, len: 11 },
  ],
}
