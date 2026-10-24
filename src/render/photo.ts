import { photoTileUrl } from "#/map/photo-tiles.ts"

/** Decoded tiles kept at once (1.6 MB each): a wide view at full speed plus the ring around it. */
const MAX_TILES = 48
/** Downloads in flight; the rest are asked for again next frame. */
const MAX_LOADING = 6

type Slot = ImageBitmap | "loading" | "missing"

/**
 * The aerial photo tiles (see src/map/photo-tiles.ts), fetched and decoded off
 * the main thread on first request and kept in an LRU. A tile that fails to
 * load is "missing" for good, and the map falls back to the drawn ground there.
 */
export class PhotoTiles {
  private readonly tiles = new Map<string, Slot>()
  private loading = 0

  constructor(
    private readonly cols: number,
    private readonly rows: number,
  ) {}

  /** The tile's image, or null while it loads (or if there is none). Asks for it if needed. */
  get(tx: number, ty: number): ImageBitmap | null {
    const key = `${tx},${ty}`
    const slot = this.tiles.get(key)
    if (slot === undefined) {
      this.want(tx, ty)
      return null
    }
    if (typeof slot === "string") return null
    this.tiles.delete(key)
    this.tiles.set(key, slot)
    return slot
  }

  /** Off the map, or failed to load: draw something else here. */
  missing(tx: number, ty: number): boolean {
    return tx < 0 || ty < 0 || tx >= this.cols || ty >= this.rows || this.tiles.get(`${tx},${ty}`) === "missing"
  }

  /** Start loading a tile that is about to come into view. */
  want(tx: number, ty: number): void {
    const key = `${tx},${ty}`
    if (this.missing(tx, ty) || this.tiles.has(key) || this.loading >= MAX_LOADING) return
    this.tiles.set(key, "loading")
    this.loading++
    fetch(photoTileUrl(tx, ty))
      .then((res) => (res.ok ? res.blob() : Promise.reject(new Error(String(res.status)))))
      .then((blob) => createImageBitmap(blob))
      .then(
        (img) => {
          // Re-insert, so the fresh tile is the newest in the LRU order.
          this.tiles.delete(key)
          this.tiles.set(key, img)
          this.evict()
        },
        () => this.tiles.set(key, "missing"),
      )
      .finally(() => this.loading--)
  }

  private evict() {
    for (const [key, slot] of this.tiles) {
      if (this.tiles.size <= MAX_TILES) return
      if (typeof slot === "string") continue
      slot.close()
      this.tiles.delete(key)
    }
  }
}
