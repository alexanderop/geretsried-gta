import { describe, expect, it } from "vitest"
import { PHOTO_TILE_M, PHOTO_TILE_PAD, PHOTO_TILE_PX, PHOTO_TILE_PX_PER_M, photoSource, photoTileBox, photoTileGrid, photoTileUrl } from "./photo-tiles.ts"

describe("photo tiles", () => {
  it("covers the whole map, partial tiles at the east and south edges included", () => {
    expect(photoTileGrid(5594.1, 6115.7)).toEqual({ cols: 22, rows: 24 })
    expect(photoTileGrid(512, 256)).toEqual({ cols: 2, rows: 1 })
  })

  it("names tiles by column and row", () => {
    expect(photoTileUrl(15, 18)).toBe("/photo/15_18.webp")
  })

  it("holds DOP40 at its native 0.4 m with a one-pixel border from each neighbour", () => {
    expect(PHOTO_TILE_PX).toBe(640)
    const box = photoTileBox(1, 2)
    expect(box.minX).toBeCloseTo(256 - 0.4)
    expect(box.maxY).toBeCloseTo(768 + 0.4)
    // The image is the tile plus its border, one pixel per 0.4 m.
    expect((box.maxX - box.minX) * PHOTO_TILE_PX_PER_M).toBeCloseTo(PHOTO_TILE_PX + 2 * PHOTO_TILE_PAD)
    expect(photoTileBox(0, 0, 8).minX).toBeCloseTo(-9 * 0.4)
  })

  it("finds a 128 m chunk inside its tile, skipping the border", () => {
    expect(photoSource(0, 0, 128)).toEqual({ tx: 0, ty: 0, sx: 1, sy: 1, side: 320 })
    expect(photoSource(3 * 128, 5 * 128, 128)).toEqual({ tx: 1, ty: 2, sx: 321, sy: 321, side: 320 })
  })

  it("lines neighbouring tiles up edge to edge", () => {
    const a = photoTileBox(4, 7)
    const b = photoTileBox(5, 7)
    const pad = PHOTO_TILE_PAD / PHOTO_TILE_PX_PER_M
    expect(a.maxX - pad).toBeCloseTo(b.minX + pad)
    expect(b.minX + pad).toBe(5 * PHOTO_TILE_M)
  })
})
