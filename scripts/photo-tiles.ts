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
import { PHOTO_TILE_PX, PHOTO_TILE_PAD, photoTileBox, photoTileGrid } from "../src/map/photo-tiles.ts"
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

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  const map = yield* Schema.decodeUnknownEffect(Schema.fromJsonString(MapHeader))(yield* fs.readFileString(MAP))
  const projection = makeProjection(map.bbox)
  const { cols, rows } = photoTileGrid(map.width, map.height)
  for (const dir of [RAW, STYLED, OUT]) yield* fs.makeDirectory(dir, { recursive: true })
  const side = PHOTO_TILE_PX + 2 * (PHOTO_TILE_PAD + STYLE_MARGIN)
  yield* Console.log(`photo: ${cols}×${rows} tiles of ${side} px (cached in ${RAW})`)
  let bytes = 0
  for (let ty = 0; ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
      const box = photoTileBox(tx, ty, STYLE_MARGIN)
      const nw = projection.toLatLon(box.minX, box.minY)
      const se = projection.toLatLon(box.maxX, box.maxY)
      const raw = yield* cachedPng(`${RAW}/${tx}_${ty}.png`, wmsUrl(se.lat, nw.lon, nw.lat, se.lon, side, side))
      const png = `${STYLED}/${tx}_${ty}.png`
      const webp = `${OUT}/${tx}_${ty}.webp`
      yield* fs.writeFile(png, encodePng(crop(stylise(raw), STYLE_MARGIN)))
      execFileSync("cwebp", ["-quiet", "-q", String(QUALITY), "-m", "6", "-sharp_yuv", png, "-o", webp])
      bytes += Number((yield* fs.stat(webp)).size)
    }
    yield* Console.log(`row ${ty + 1}/${rows}: ${(bytes / 1e6).toFixed(1)} MB so far`)
  }
  yield* Console.log(`${OUT}: ${cols * rows} tiles, ${(bytes / 1e6).toFixed(1)} MB`)
})

program.pipe(Effect.provide(NodeServices.layer), NodeRuntime.runMain)
