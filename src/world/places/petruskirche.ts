import type { Rgba } from "#/render/scene/mesh.ts"
import type { Part, PlaceDressing } from "./dressing.ts"

/**
 * Petruskirche (evang.-luth.), Egerlandstraße 39: Franz Lichtblau's 1960 "concrete tent", way 121436739, on a lawn W of
 * Egerlandstraße, and its free-standing bell tower 21 m to the N, way 188048958 (OSM's "Kirchturm Petruskirche"). Two
 * footprints, so two entries: the tower is dressed as its own building, anchored on its footprint (no POI has its name).
 *
 * The Bavarian LoD2 model (2026, tile 684_5304) has the church as `DEBY_LOD2_4533422` (function 3041, church): a pitched
 * roof whose ridge runs NW–SE and rises from 12.52 m at the NW gable to 15.42 m at the SE one, the eaves along both long
 * walls at 4.1–4.2 m, the planes at 48.5° (NW end) to 56.7° (SE end) over its 14.7 m width; the SE end is a shallow prow.
 * The engine's roof has one ridge height, so it is drawn at 53° over OSM's 14.4 m width with gables on the NW and SE
 * walls (0 and 2): ridge 13.73 m, between the model's two ends. The tower is `DEBY_LOD2_4534328`: 3.8 × 4.1 m, eaves
 * 27.67 m, a gabled cap to 29.36 m with its ridge NW–SE, so its gables face NW and SE (walls 0 and 2 of OSM's square).
 *
 * Photos (reference/petruskirche/05 key, 06, 08, 02): peach render on church and tower, the steep dark slate roof almost
 * to the ground, tall glass strips between narrow pale pillars in the gable ends, a round white emblem with a cross and
 * a barred window on the NE wall to Egerlandstraße; the tower with a big dark louvre under its cap, a clock painted on
 * the wall under it (red hour bars and hands, no dial), small square windows, a door at its foot and a cross on top.
 *
 * Guesses: the glass strips' count, widths and heights (06 shows glass high in the NW gable, 02/05 strips at the SE
 * end; drawn alike on both, stepped under the rake), the emblem's and barred window's spots along the NE wall (read off
 * 02 and 05), the louvre, clock and windows' sizes and heights on the tower, the door on the tower's NE face, the cross's
 * size, the colours. Not built: the mosaic, the bronze portal and the entrance's front (no reference), the SE prow.
 */
const PEACH: Rgba = [255, 212, 174, 255]
const TOWER_PEACH: Rgba = [255, 220, 190, 255]
const SLATE: Rgba = [70, 69, 72, 255]

/** The LoD2 eaves on the long walls, and the pitch that brings OSM's 14.4 m width to a 13.73 m ridge. */
const EAVES = 4.2
const PITCH = 53
const SLOPE = Math.tan((PITCH * Math.PI) / 180)
/** The gable walls (0 NW, 2 SE), each square to the long walls, so the rake over u is EAVES + SLOPE × the run to the nearer corner. */
const GABLES = [
  { edge: 0, length: 14.35 },
  { edge: 2, length: 14.43 },
] as const
/** Seven glass strips 1.2 m wide side by side, centred on each gable, each up to 0.5 m under the rake over its outer side. */
const STRIP = 1.2
const STRIPS = 7
/** How tall one glass tile is at most: a strip taller than this is cut into equal tiles, so the bars don't stretch. */
const TILE = 3.6

const glassStrips = (edge: number, length: number): ReadonlyArray<Part> => {
  const start = (length - STRIP * STRIPS) / 2
  return Array.from({ length: STRIPS }, (_, i) => {
    const u0 = start + i * STRIP
    const u1 = start + (i + 1) * STRIP
    const top = EAVES + Math.min(u0, length - u1) * SLOPE - 0.5
    const tiles = Math.ceil((top - 0.3) / TILE)
    const h = (top - 0.3) / tiles
    return Array.from({ length: tiles }, (_tile, k): Part => ({ kind: "wallSign", texture: "petrus-glass", edge, u0, u1, z0: 0.3 + k * h, z1: 0.3 + (k + 1) * h }))
  }).flat()
}

export const PETRUSKIRCHE: PlaceDressing = {
  poi: "Petruskirche",
  street: "Egerlandstraße",
  osmBuildingId: 121436739,
  levels: EAVES / 3,
  facade: "plaster",
  wallColour: PEACH,
  roof: { colour: SLATE, hip: PITCH, gables: GABLES.map((g) => g.edge) },
  parts: [
    ...GABLES.flatMap((g) => glassStrips(g.edge, g.length)),
    // The NE wall to Egerlandstraße (wall 1, u 0 at its S end): the round emblem under the eaves, the barred window N of it.
    { kind: "wallSign", texture: "petrus-emblem", edge: 1, u0: 11.6, u1: 12.4, z0: 3.0, z1: 3.8 },
    { kind: "wallSign", texture: "petrus-window", edge: 1, u0: 16.8, u1: 18.1, z0: 1.5, z1: 2.8 },
  ],
}

/** The tower's eaves and ridge (LoD2); its cap rises across OSM's 4.4 m gable walls to the model's ridge. */
const TOWER_EAVES = 27.67
const TOWER_RIDGE = 29.36
const TOWER_PITCH = 37.5
/** The tower's centre in its street frame (Egerlandstraße's, anchored on the footprint: u 0), and the gable walls' direction in it. */
const TOWER_N = 17.34
const GABLE_ANGLE = -1.44
const DARK: Rgba = [46, 46, 48, 255]

/** One gable face of the tower (wall 0 NW, 2 SE): the louvre under the cap, the clock under it, two small windows. */
const gableFace = (edge: number, length: number): ReadonlyArray<Part> => {
  const c = length / 2
  return [
    { kind: "wallSign", texture: "petrus-louvre", edge, u0: c - 1.3, u1: c + 1.3, z0: 23.6, z1: 27.3 },
    { kind: "wallSign", texture: "petrus-clock", edge, u0: c - 1.3, u1: c + 1.3, z0: 20.0, z1: 22.6 },
    { kind: "wallSign", texture: "petrus-window", edge, u0: c + 0.5, u1: c + 1.2, z0: 18.4, z1: 19.1 },
    { kind: "wallSign", texture: "petrus-window", edge, u0: c + 0.5, u1: c + 1.2, z0: 7.6, z1: 8.3 },
  ]
}

export const PETRUSKIRCHE_TOWER: PlaceDressing = {
  poi: "Kirchturm Petruskirche",
  street: "Egerlandstraße",
  osmBuildingId: 188048958,
  levels: TOWER_EAVES / 3,
  facade: "plaster",
  wallColour: TOWER_PEACH,
  roof: { colour: [92, 90, 90, 255], hip: TOWER_PITCH, gables: [0, 2] },
  parts: [
    ...gableFace(0, 4.42),
    ...gableFace(2, 4.34),
    // The NE face to the street (wall 1): the door at its foot, a small window halfway up.
    { kind: "wallSign", texture: "petrus-door", edge: 1, u0: 1.8, u1: 2.9, z0: 0, z1: 2.3 },
    { kind: "wallSign", texture: "petrus-window", edge: 1, u0: 2.0, u1: 2.7, z0: 13.0, z1: 13.7 },
    // The cross over the ridge: a post and a bar across it in the gables' plane.
    { kind: "pylon", u: 0, n: TOWER_N, angle: GABLE_ANGLE, w: 0.12, d: 0.12, h: TOWER_RIDGE + 1.7, base: TOWER_RIDGE - 0.2, colour: DARK },
    { kind: "pylon", u: 0, n: TOWER_N, angle: GABLE_ANGLE, w: 0.9, d: 0.1, h: TOWER_RIDGE + 1.25, base: TOWER_RIDGE + 1.1, colour: DARK },
  ],
}
