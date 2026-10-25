import type { Rgba } from "#/render/scene/mesh.ts"
import type { Mass, Part, PlaceDressing } from "./dressing.ts"

/**
 * Kaufland, Bayerwaldstraße 2: way 121822645, the shopping hall between Blumenstraße (NW), Thüringer-Wald-Straße (SW
 * and SE) and the Kaufland car park (NE). OSM gives it one level and a flat roof. In the hall's own frame (s along the
 * SW wall from the W corner, t along the NW wall on Blumenstraße) the outline is nearly a rectangle, 106 m by 50 m,
 * with the Deichmann wing reaching 75.7 m up the NW side.
 *
 * The Bavarian LoD2 model (2026, tile 682_5306, `DEBY_LOD2_4467611` plus the parts 105019004/5 and 108848885) lines up
 * with OSM within a metre. It has, from NW to SE: three gable roofs with ridges along s (the mall shops; eaves about
 * 9.2 m, ridges 11.84 m), a 4 m flat link at 9.2 m, two gable roofs with ridges along t (eaves 9.76, ridges 11.66),
 * a 4 m flat strip at 8.2 m, and the Kaufland hall itself: three gable roofs with ridges along s (eaves 8.0–8.4,
 * ridges 10.83). Along the NE side the Deichmann wing (gable along t, eaves 8.34, ridge 11.07), a saw-tooth part up to
 * 8.06 m beside it and a low 6.35 m strip under the mall entrance. Each is drawn as its own mass, every gable at one
 * pitch (17.6–18.6°) that gives the model's ridge over its width. Masses only: the map's outline, level and solid stay.
 *
 * Street View (reference/kaufland/02) shows the hall's long eave with a solar-covered roof plane rising behind it and
 * the white band with the red K logo and "Kaufland" under it; the Google satellite (04) has solar panels on the
 * Kaufland hall's SW-facing planes and on one plane of the middle roofs. The band is on the hall's SW wall (OSM wall 7),
 * which is the side 02 can see with that roof; a second band faces the car park (OSM wall 12, no photo: a guess) and
 * the same board lies on the low entrance strip's roof for the top-down camera (a guess).
 *
 * Guesses: which wall 02 shows (the doc says Blumenstraße; the solar roof and the eave say the hall's SW side), the
 * bands' size and height, the NE band, the roof board, the solar extent (whole planes, the satellite shows patches),
 * the single pitch per roof, the saw-tooth part drawn flat, the wall and roof colours. Not built: the glass rotunda at
 * the E corner (outside OSM's outline, over the walkway), the mall shop signs (Ihle, Deichmann, Vinzenzmurr, Dönerworks,
 * An Nhien: no photo), trolley bays, the charging station, the low wall along the car park. The BMW job is out of scope.
 */
const WALL: Rgba = [228, 224, 214, 255]
const ROOF: Rgba = [198, 200, 198, 255]

/** The LoD2 heights: gables at their eaves (a pitched mass's walls stop there), flat parts at their top less the parapet. */
const NW_EAVES = 9.2
const MID_EAVES = 9.76
const HALL_EAVES = 8.1
const WING_EAVES = 8.34
const flat = (top: number) => (top - 0.6) / 3
const gable = (pts: ReadonlyArray<number>, eaves: number, hip: number, gables: ReadonlyArray<number>): Mass => ({ pts, levels: eaves / 3, roof: { colour: ROOF, hip, gables } })
const slab = (pts: ReadonlyArray<number>, top: number): Mass => ({ pts, levels: flat(top), roof: { colour: ROOF, pitched: false } })

/** The Kaufland hall's three bays across t (from the SW wall): their eaves lines, and their pitch. */
const HALL_BAYS = [
  [0, 16.8],
  [16.8, 31.9],
  [31.9, 50.48],
] as const
const HALL_PITCH = 18
const TAN = Math.tan((HALL_PITCH * Math.PI) / 180)
/** OSM wall 7's start on the SW wall, at s 72.05: the hall's gables are at s 59.85 and 106.2. */
const WALL7_S = 72.05
const HALL_S = [59.85, 106.2] as const

/** The solar field on each bay's SW-facing plane, strips about 4 m long up the slope, in wall 7's frame (n = t). */
const solar = (t0: number, t1: number): Array<Part> => {
  const ridge = (t1 - t0) / 2
  const n0 = t0 + 0.6
  const n1 = t0 + ridge - 0.5
  const u0 = HALL_S[0] - WALL7_S + 0.8
  const u1 = HALL_S[1] - WALL7_S - 0.8
  const k = Math.round((u1 - u0) / 4)
  const z = (n: number) => HALL_EAVES + (n - t0) * TAN + 0.05
  return Array.from({ length: k }, (_, i): Part => ({ kind: "roofSign", texture: "solar-field", edge: 7, u0: u0 + ((u1 - u0) * i) / k, u1: u0 + ((u1 - u0) * (i + 1)) / k, n0, n1, z0: z(n0), z1: z(n1) }))
}

/** The middle roofs' SE-facing plane of the second gable (s 49.47 → 55.7) in wall 9's frame (u = t, n = 106.2 - s). */
const MID_SOLAR: ReadonlyArray<Part> = Array.from({ length: 10 }, (_, i): Part => {
  const tan = Math.tan((18.6 * Math.PI) / 180)
  const n0 = 106.2 - 55.7 + 0.5
  const n1 = 106.2 - 49.47 - 0.5
  return { kind: "roofSign", texture: "solar-field", edge: 9, u0: 1 + i * 4.7, u1: 1 + (i + 1) * 4.7, n0, n1, z0: MID_EAVES + 0.5 * tan + 0.05, z1: MID_EAVES + (n1 - (106.2 - 55.7)) * tan + 0.05 }
})

/** The band: the K logo and "Kaufland" on white, 3:1. */
const BAND_Z = [4.6, 7.7] as const
const BAND_W = (BAND_Z[1] - BAND_Z[0]) * 3
const band = (edge: number, mid: number): Part => ({ kind: "wallSign", texture: "kaufland-band", edge, u0: mid - BAND_W / 2, u1: mid + BAND_W / 2, z0: BAND_Z[0], z1: BAND_Z[1], out: 0.1 })

/** The low entrance strip's roof (flat, top 6.35 m) in wall 15's frame (u = 70.72 - s, n = 57.21 - t). */
const STRIP_TOP = 6.35
const ROOF_BOARD: Part = { kind: "roofSign", texture: "kaufland-band", edge: 15, u0: 12, u1: 30, n0: 0.9, n1: 6.9, z0: STRIP_TOP - 0.55, z1: STRIP_TOP - 0.55 }

export const KAUFLAND: PlaceDressing = {
  poi: "Kaufland",
  street: "Thüringer-Wald-Straße",
  osmBuildingId: 121822645,
  facade: "industrial",
  wallColour: WALL,
  roof: { colour: ROOF },
  masses: [
    // The mall shops: three gables along s, the gable ends on Blumenstraße (wall 3 of each) and on the link (wall 1).
    gable([2190.2, 1865.7, 2208.9, 1886.81, 2221.69, 1875.51, 2203.02, 1854.38], NW_EAVES, 18, [1, 3]),
    gable([2203.02, 1854.38, 2221.69, 1875.51, 2232.93, 1865.57, 2214.27, 1844.46], NW_EAVES, 18, [1, 3]),
    gable([2214.27, 1844.46, 2232.93, 1865.57, 2245.82, 1854.18, 2227.19, 1833.11], NW_EAVES, 18, [1, 3]),
    slab([2208.9, 1886.81, 2211.75, 1890.03, 2248.66, 1857.4, 2245.82, 1854.18], NW_EAVES),
    // The middle: two gables along t, the gable ends on the SW wall and towards the entrance strip.
    gable([2211.75, 1890.03, 2219.24, 1898.49, 2256.15, 1865.87, 2248.66, 1857.4], MID_EAVES, 18.6, [0, 2]),
    gable([2219.24, 1898.49, 2227.1, 1907.42, 2264.03, 1874.79, 2256.15, 1865.87], MID_EAVES, 18.6, [0, 2]),
    slab([2227.1, 1907.42, 2229.84, 1910.54, 2266.78, 1877.9, 2264.03, 1874.79], 8.2),
    // The Kaufland hall: three gables along s, gable ends at the middle strip and on Thüringer-Wald-Straße (SE).
    gable([2229.84, 1910.54, 2260.5, 1945.3, 2273.14, 1934.18, 2242.42, 1899.42], HALL_EAVES, HALL_PITCH, [1, 3]),
    gable([2242.42, 1899.42, 2273.14, 1934.18, 2284.48, 1924.2, 2253.74, 1889.42], HALL_EAVES, HALL_PITCH, [1, 3]),
    gable([2253.74, 1889.42, 2284.48, 1924.2, 2298.4, 1911.9, 2290.6, 1903.1, 2278.8, 1889.8, 2274.8, 1885.2, 2267.66, 1877.11], HALL_EAVES, HALL_PITCH, [1, 6]),
    // Along the NE side: the Deichmann wing (gable along t), the saw-tooth part (flat here), the low entrance strip.
    gable([2227.19, 1833.11, 2238.56, 1845.98, 2258.32, 1828.51, 2247.0, 1815.6], WING_EAVES, 17.6, [0, 2]),
    slab([2238.56, 1845.98, 2246.43, 1854.88, 2252.4, 1849.6, 2266.2, 1837.4, 2258.32, 1828.51], 8.06),
    slab([2246.43, 1854.88, 2266.78, 1877.9, 2267.66, 1877.11, 2274.8, 1885.2, 2279.9, 1880.8, 2262.0, 1860.5, 2252.4, 1849.6], STRIP_TOP),
  ],
  parts: [
    // The band under the hall's SW eave (seen in 02) and one over the car park (guess).
    band(7, 10.6),
    band(12, 94.51 - (HALL_S[0] + HALL_S[1]) / 2 - 2),
    // The solar field on the hall's SW-facing planes and on the middle roofs, for the play and the top-down camera.
    ...HALL_BAYS.flatMap(([t0, t1]) => solar(t0, t1)),
    ...MID_SOLAR,
    ROOF_BOARD,
  ],
}
