/**
 * The DOP40 aerial photo cut into square WebP tiles (public/photo/<tx>_<ty>.webp)
 * on a grid in map meters, origin at the map's north-west corner, and the
 * overview the minimap shows.
 */
import type { Box } from "#/world/geometry.ts"

/** Side of one photo tile in meters: two 128 m map chunks. */
export const PHOTO_TILE_M = 256
/** DOP40's native resolution, 0.4 m per pixel. */
export const PHOTO_TILE_PX_PER_M = 2.5
export const PHOTO_TILE_PX = PHOTO_TILE_M * PHOTO_TILE_PX_PER_M
/**
 * Each tile carries this many pixels of its neighbours on every side, so
 * smooth upscaling at a tile edge blends into the next tile instead of a seam.
 */
export const PHOTO_TILE_PAD = 1

/** The whole tile grid shrunk to OVERVIEW_M_PER_PX, for the minimap. */
export const PHOTO_OVERVIEW_URL = "/photo/overview.webp"
export const OVERVIEW_M_PER_PX = 8

/** Tiles needed to cover a map of `width` × `height` meters. */
export const photoTileGrid = (width: number, height: number) => ({
  cols: Math.ceil(width / PHOTO_TILE_M),
  rows: Math.ceil(height / PHOTO_TILE_M),
})

/** Map-space square a tile's image covers, padding pixels plus `margin` extra ones included. */
export const photoTileBox = (tx: number, ty: number, margin = 0): Box => {
  const pad = (PHOTO_TILE_PAD + margin) / PHOTO_TILE_PX_PER_M
  return {
    minX: tx * PHOTO_TILE_M - pad,
    minY: ty * PHOTO_TILE_M - pad,
    maxX: (tx + 1) * PHOTO_TILE_M + pad,
    maxY: (ty + 1) * PHOTO_TILE_M + pad,
  }
}
