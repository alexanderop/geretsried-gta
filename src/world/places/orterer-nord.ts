import type { Rgba } from "#/render/scene/mesh.ts"
import type { Part, PlaceDressing } from "./dressing.ts"

/**
 * Orterer Getränkemarkt, Banater Straße 3 (the north one; the Am Stern market is am-stern-west.ts): way 187819175, a
 * drinks-market hall whose long SE front (wall 2, 32.25 m, u 0 at its SW end) faces the paved car park between it and
 * Banater Straße. The street frame hangs on Banater Straße 42 m SE of the POI: u runs NE along the street, wall 2 lies
 * parallel to it at n ≈ 28, the car park's two ways in meet the street at u ≈ -10 and u ≈ +10.
 *
 * The Bavarian LoD2 model (2026, tile 682_5306, `DEBY_LOD2_4467576`, roofType 3200) has it hipped: eaves 6.78 m, ridge
 * 11.03 m, the ridge running NE–SW parallel to the front, and a 3.7 m flat lean-to at the W corner (outside OSM's
 * outline, not built). The model sits 3–4 m W of OSM's outline. OSM's hall is 27.9 m deep, so the roof is drawn at 16.9°
 * on every wall, which gives the model's ridge (the model's hip ends are steeper; the engine has one pitch). It is drawn
 * as one mass over the whole outline, so the map's footprint, storeys and solid stay as they are.
 *
 * Street View (reference/orterer-nord/01 key, 03) and the satellite (04): the red-tile roof is almost fully covered with
 * solar panels on the SE plane; white walls, smooth on the ground floor, light cladding above; wide blue-framed windows
 * with posters SW of the entrance; a glass canopy over the entrance with Orterer's round-topped logo over it; crates and
 * displays in front of the glazing; by the pavement between the car park's two ways in the free-standing arched sign
 * (red rays over a half sun, blue "Orterer", "Getränke-Märkte": the orterer-logo texture from Am Stern) on white legs,
 * and a raised barrier (red housing, white boom with red bands) at each way in.
 *
 * Guesses (photos at an angle, no measure): every part's u and z on the front, the window count and sizes, the small
 * window NE of the entrance, the canopy's depth, the logo's size, where the solar field stops at the hips, the sign's
 * and the barriers' spots (from the service roads), the sign's size, its square top (the texture's arch on a white
 * board). Not built: the light paving and planting strip (map ground), the bushes, the lean-to, the NW/NE/SW sides'
 * details (no reference). The job pickup inside the hall (gelting-1) is out of scope here.
 */
const WHITE: Rgba = [252, 252, 250, 255]
const TILES: Rgba = [204, 132, 103, 255]
const STEEL: Rgba = [196, 202, 205, 255]
const BARRIER_RED: Rgba = [214, 36, 40, 255]

/** The LoD2 eaves, and the pitch that brings OSM's 27.9 m depth to the model's 11.03 m ridge. */
const EAVES = 6.78
const PITCH = 16.9
const TAN = Math.tan((PITCH * Math.PI) / 180)
/** The front (wall 2): its length, the smooth ground floor under the cladding. */
const FRONT = 32.25
const GROUND_Z = 3.6

/** The blue-framed windows SW of the entrance and the small one NE of it (u from the SW end). */
const WINDOWS = [
  [2.2, 7.2],
  [8.6, 13.6],
] as const
const SMALL_WINDOW = [25.2, 27.6] as const
const WIN_Z = [0.5, 2.8] as const
/** The entrance glazing and the glass canopy over it, the round-topped logo above on the cladding. */
const ENTRANCE = [15.4, 21.4] as const
const CANOPY_Z = 3.25
const LOGO_H = 1.4
const LOGO_MID = (ENTRANCE[0] + ENTRANCE[1]) / 2

/** The solar field on the SE plane in wall 2's frame: strips up the plane, each narrower where the hips close in. */
const SOLAR_N = [0.6, 4.3, 8.0, 11.7] as const
const PANEL = 3.6
const roofZ = (n: number) => EAVES + n * TAN + 0.05
const solarStrip = (n0: number, n1: number): Array<Part> => {
  const u0 = n1 + 0.4
  const u1 = FRONT - n1 - 0.4
  const k = Math.max(1, Math.round((u1 - u0) / PANEL))
  return Array.from({ length: k }, (_, i): Part => ({ kind: "roofSign", texture: "solar-field", edge: 2, u0: u0 + ((u1 - u0) * i) / k, u1: u0 + ((u1 - u0) * (i + 1)) / k, n0, n1, z0: roofZ(n0), z1: roofZ(n1) }))
}

/** The arched sign and the two barriers, in the street frame (u NE along Banater Straße, n towards the hall). */
const SIGN = [5.0, 7.0] as const
const BARRIERS = [
  [-7.4, 6.2],
  [7.9, 6.2],
] as const
const barrier = ([u, n]: readonly [number, number]): Array<Part> => [
  { kind: "pylon", u, n, angle: 0, w: 0.32, d: 0.32, h: 1.0, colour: BARRIER_RED },
  { kind: "pylon", u, n, angle: 0, w: 0.09, d: 0.09, h: 5.6, colour: WHITE },
  ...[1.6, 2.8, 4.0, 5.2].map((z): Part => ({ kind: "pylon", u, n, angle: 0, w: 0.11, d: 0.11, h: z + 0.4, base: z, colour: BARRIER_RED })),
]

const sign = (texture: Extract<Part, { kind: "wallSign" }>["texture"], u0: number, u1: number, z0: number, z1: number, out?: number): Part => ({ kind: "wallSign", texture, edge: 2, u0, u1, z0, z1, ...(out === undefined ? {} : { out }) })

export const ORTERER_NORD: PlaceDressing = {
  poi: "Orterer Getränkemarkt",
  street: "Banater Straße",
  osmBuildingId: 187819175,
  facade: "industrial",
  wallColour: WHITE,
  masses: [
    {
      pts: [2285.2, 2064.3, 2307.6, 2041.9, 2327.9, 2061.1, 2305.5, 2084.3, 2303.2, 2082.1],
      levels: EAVES / 3,
      roof: { colour: TILES, hip: PITCH },
      bands: [{ z0: 0, z1: GROUND_Z, colour: WHITE, plain: true }],
    },
  ],
  parts: [
    // The front: blue-framed windows with posters, the entrance glazing with crates under the glass canopy, the logo.
    ...WINDOWS.map(([u0, u1]) => sign("orterer-window", u0, u1, WIN_Z[0], WIN_Z[1])),
    sign("orterer-window", SMALL_WINDOW[0], SMALL_WINDOW[1], WIN_Z[0], WIN_Z[1]),
    sign("orterer-arcade", ENTRANCE[0], LOGO_MID, 0, 3.0),
    sign("orterer-arcade", LOGO_MID, ENTRANCE[1], 0, 3.0),
    { kind: "wallSign", texture: "orterer-pier", edge: 2, u0: ENTRANCE[0] - 0.25, u1: ENTRANCE[0], z0: 0, z1: CANOPY_Z, out: 0.06 },
    { kind: "wallSign", texture: "orterer-pier", edge: 2, u0: ENTRANCE[1], u1: ENTRANCE[1] + 0.25, z0: 0, z1: CANOPY_Z, out: 0.06 },
    { kind: "canopy", edge: 2, u0: ENTRANCE[0] - 0.5, u1: ENTRANCE[1] + 0.5, z: CANOPY_Z, depth: 1.8, colour: STEEL, texture: "canopy-glass", fascia: { h: 0.22, colour: STEEL } },
    sign("orterer-logo", LOGO_MID - (LOGO_H * 0.98) / 2, LOGO_MID + (LOGO_H * 0.98) / 2, CANOPY_Z + 0.4, CANOPY_Z + 0.4 + LOGO_H, 0.06),
    // The solar field over the SE plane, for the play and the top-down camera.
    ...SOLAR_N.slice(1).flatMap((n1, i) => solarStrip(SOLAR_N[i] ?? 0, n1)),
    // The arched sign by the pavement: two white legs, the board with the logo on both faces.
    { kind: "pylon", u: SIGN[0] - 0.72, n: SIGN[1], angle: 0, w: 0.12, d: 0.12, h: 1.3, colour: WHITE },
    { kind: "pylon", u: SIGN[0] + 0.72, n: SIGN[1], angle: 0, w: 0.12, d: 0.12, h: 1.3, colour: WHITE },
    { kind: "pylon", u: SIGN[0], n: SIGN[1], angle: 0, w: 1.6, d: 0.26, h: 3.45, base: 1.3, colour: WHITE, texture: "orterer-logo", z0: 1.35, z1: 3.42 },
    ...BARRIERS.flatMap(barrier),
  ],
}
