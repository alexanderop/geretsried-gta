/**
 * Cuts the DOP40 aerial photo (© Bayerische Vermessungsverwaltung, CC BY 4.0)
 * into the game's ground tiles: public/photo/<tx>_<ty>.webp, 256 m at the
 * native 0.4 m per pixel, lightly stylised (see `stylise`).
 *   pnpm photo
 * Downloads are cached in data/dop40/tiles/, one at a time to spare the server.
 * Needs `cwebp` on the PATH.
 */
import { execFileSync } from "node:child_process"
import { Console, Effect, FileSystem, Schema } from "effect"
import { NodeRuntime, NodeServices } from "@effect/platform-node"
import { encodePng, type Image } from "../src/map/png.ts"
import { makeProjection } from "../src/map/project.ts"
import { OVERVIEW_M_PER_PX, PHOTO_OVERVIEW_URL, PHOTO_TILE_PX, PHOTO_TILE_PAD, PHOTO_TILE_PX_PER_M, photoTileBox, photoTileGrid } from "../src/map/photo-tiles.ts"
import { cachedPng, wmsUrl } from "./dop40.ts"
import { stylise, STYLE_MARGIN } from "./photo-style.ts"

const MAP = "public/geretsried.map.json"
const RAW = "data/dop40/tiles"
const STYLED = "data/dop40/styled"
const OUT = "public/photo"
/** cwebp quality: the photo is soft already, so 72 keeps it while the whole town stays under ~30 MB. */
const QUALITY = 72

const MapHeader = Schema.Struct({
  width: Schema.Number,
  height: Schema.Number,
  bbox: Schema.Struct({ south: Schema.Number, west: Schema.Number, north: Schema.Number, east: Schema.Number }),
})

/** Crop `margin` pixels off every side. */
const crop = (img: Image, margin: number): Image => {
  const width = img.width - 2 * margin
  const height = img.height - 2 * margin
  const rgba = new Uint8Array(width * height * 4)
  for (let y = 0; y < height; y++) {
    const from = ((y + margin) * img.width + margin) * 4
    rgba.set(img.rgba.subarray(from, from + width * 4), y * width * 4)
  }
  return { width, height, rgba }
}

/** Tile pixels per side of one overview pixel: a plain box filter. */
const BIN = OVERVIEW_M_PER_PX * PHOTO_TILE_PX_PER_M
const BINS = PHOTO_TILE_PX / BIN

/** Add a tile's average colour per BIN × BIN block into the overview's sums. */
const addToOverview = (sums: Float64Array, cols: number, tile: Image, tx: number, ty: number) => {
  const width = cols * BINS
  for (let y = 0; y < PHOTO_TILE_PX; y++) {
    for (let x = 0; x < PHOTO_TILE_PX; x++) {
      const from = ((y + PHOTO_TILE_PAD) * tile.width + x + PHOTO_TILE_PAD) * 4
      const to = ((ty * BINS + Math.floor(y / BIN)) * width + tx * BINS + Math.floor(x / BIN)) * 3
      for (let c = 0; c < 3; c++) sums[to + c] = (sums[to + c] ?? 0) + (tile.rgba[from + c] ?? 0)
    }
  }
}

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  const map = yield* Schema.decodeUnknownEffect(Schema.fromJsonString(MapHeader))(yield* fs.readFileString(MAP))
  const projection = makeProjection(map.bbox)
  const { cols, rows } = photoTileGrid(map.width, map.height)
  for (const dir of [RAW, STYLED, OUT]) yield* fs.makeDirectory(dir, { recursive: true })
  const side = PHOTO_TILE_PX + 2 * (PHOTO_TILE_PAD + STYLE_MARGIN)
  yield* Console.log(`photo: ${cols}×${rows} tiles of ${side} px (cached in ${RAW})`)
  let bytes = 0
  const sums = new Float64Array(cols * BINS * rows * BINS * 3)
  for (let ty = 0; ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
      const box = photoTileBox(tx, ty, STYLE_MARGIN)
      const nw = projection.toLatLon(box.minX, box.minY)
      const se = projection.toLatLon(box.maxX, box.maxY)
      const raw = yield* cachedPng(`${RAW}/${tx}_${ty}.png`, wmsUrl(se.lat, nw.lon, nw.lat, se.lon, side, side))
      const png = `${STYLED}/${tx}_${ty}.png`
      const webp = `${OUT}/${tx}_${ty}.webp`
      const styled = crop(stylise(raw), STYLE_MARGIN)
      addToOverview(sums, cols, styled, tx, ty)
      yield* fs.writeFile(png, encodePng(styled))
      execFileSync("cwebp", ["-quiet", "-q", String(QUALITY), "-m", "6", "-sharp_yuv", png, "-o", webp])
      bytes += Number((yield* fs.stat(webp)).size)
    }
    yield* Console.log(`row ${ty + 1}/${rows}: ${(bytes / 1e6).toFixed(1)} MB so far`)
  }
  yield* Console.log(`${OUT}: ${cols * rows} tiles, ${(bytes / 1e6).toFixed(1)} MB`)
  const overview: Image = {
    width: cols * BINS,
    height: rows * BINS,
    rgba: Uint8Array.from({ length: (sums.length / 3) * 4 }, (_, i) => (i % 4 === 3 ? 255 : Math.round((sums[Math.floor(i / 4) * 3 + (i % 4)] ?? 0) / (BIN * BIN)))),
  }
  const overviewPng = `${STYLED}/overview.png`
  const overviewOut = `public${PHOTO_OVERVIEW_URL}`
  yield* fs.writeFile(overviewPng, encodePng(overview))
  execFileSync("cwebp", ["-quiet", "-q", "80", "-m", "6", overviewPng, "-o", overviewOut])
  yield* Console.log(`${overviewOut}: ${overview.width}×${overview.height} px, ${Math.round(Number((yield* fs.stat(overviewOut)).size) / 1000)} KB`)
})

program.pipe(Effect.provide(NodeServices.layer), NodeRuntime.runMain)
