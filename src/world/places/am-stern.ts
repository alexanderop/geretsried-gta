import type { Rgba } from "#/render/scene/mesh.ts"
import type { Part } from "./dressing.ts"

/**
 * What the Am Stern shopping hub off Sudetenstraße in Stein shares (B3-0): three white balcony blocks under terracotta
 * roofs round one car park (am-stern-west.ts, rossmann-am-stern.ts, penny-sudetenstrasse.ts) and the EDEKA hall across
 * Breslauer Weg (edeka-am-stern.ts). OSM maps each block with the low parts beside it as one outline; the Bavarian
 * LoD2 model (2026, tiles 684_5302 and 686_5302) has them as separate buildings with their own heights, so each place
 * splits its footprint into `masses` along the model's walls and takes their eaves and ridges from it (the plan and
 * the heights in each file). Each shop unit's own signs (B3-1…B3-7, B4-4…B4-6) go into the file of its block.
 */

/** The blocks' white render (#e2e2e3 in Street View's shade, near white in sun). */
export const WHITE_RENDER: Rgba = [248, 248, 246, 255]

/** The balconies: a white slab under a grey railing (the photos' grey steel rails, drawn solid). */
const BALCONY_SLAB: Rgba = [232, 232, 228, 255]
const BALCONY_RAIL: Rgba = [112, 116, 122, 255]

/**
 * A stack of continuous balconies on wall `edge` from u0 to u1, one per upper storey, their floors at `z`. Where they
 * start and how deep they are is a guess: the places docs only say "continuous balconies with grey steel railings".
 */
export const balconies = (edge: number, u0: number, u1: number, z: ReadonlyArray<number>): Part => ({ kind: "balcony", edge, u0, u1, z, depth: 1.4, colour: BALCONY_RAIL, slab: BALCONY_SLAB })

/** Balcony floors over a tall shop storey: a ground floor and four balcony storeys, as the photos show the blocks. */
export const FOUR_BALCONY_STOREYS = [4.5, 7.5, 10.5, 13.5] as const

/** The roof sign's height over a roof plane `n` meters in from its eave at `h` rising at `pitch` degrees, a little over it. */
export const onRoof = (h: number, pitch: number, n: number) => h + n * Math.tan((pitch * Math.PI) / 180) + 0.1
