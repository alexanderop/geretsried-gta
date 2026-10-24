/** Pixels per meter of the aerial photo raster the importer works on. */
export const PHOTO_PX_PER_M = 1

/** An RGBA image in map space: pixel (x, y) covers meters [x, x+1) × [y, y+1). */
export type Raster = { readonly width: number; readonly height: number; readonly rgba: Uint8Array }
