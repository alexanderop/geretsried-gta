/**
 * The Bavarian DOP40 aerial photo (© Bayerische Vermessungsverwaltung, CC BY 4.0)
 * as one RGBA raster in map space: 1 pixel = 1 m, (0, 0) = the map's north-west corner.
 * Tiles are cached under data/dop40/ so `pnpm map` only downloads once.
 */
import { Console, Effect, FileSystem, Schema } from "effect"
import { decodePng } from "../src/map/png.ts"
import { makeProjection, type Bbox } from "../src/map/project.ts"
import { PHOTO_PX_PER_M, type Raster } from "../src/map/photo.ts"

const DIR = "data/dop40"
const WMS = "https://geoservices.bayern.de/od/wms/dop/v1/dop40"
/** Meters per tile side; at 1 px/m one tile is a 1000×1000 PNG (about 2.7 MB). */
const TILE_M = 1000

class Dop40Error extends Schema.TaggedError<Dop40Error>()("Dop40Error", { url: Schema.String, status: Schema.Number }) {}

const tileUrl = (bbox: Bbox, tx: number, ty: number) => {
  const projection = makeProjection(bbox)
  const nw = projection.toLatLon(tx * TILE_M, ty * TILE_M)
  const se = projection.toLatLon((tx + 1) * TILE_M, (ty + 1) * TILE_M)
  const size = TILE_M * PHOTO_PX_PER_M
  return wmsUrl(se.lat, nw.lon, nw.lat, se.lon, size, size)
}

/** A WMS PNG, downloaded once and then read from `path`. */
export const cachedPng = (path: string, url: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    if (yield* fs.exists(path)) return decodePng(yield* fs.readFile(path))
    const res = yield* Effect.tryPromise(() => fetch(url))
    if (!res.ok || res.headers.get("content-type") !== "image/png") return yield* new Dop40Error({ url, status: res.status })
    const bytes = new Uint8Array(yield* Effect.tryPromise(() => res.arrayBuffer()))
    yield* fs.writeFile(path, bytes)
    return decodePng(bytes)
  })

/** WMS GetMap for a lat/lon box. EPSG:4326 keeps the image linear in lat and lon, like the map's projection. */
export const wmsUrl = (south: number, west: number, north: number, east: number, width: number, height: number) => {
  const box = [south, west, north, east].map((n) => n.toFixed(8)).join(",")
  return `${WMS}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=by_dop40c&STYLES=&CRS=EPSG:4326&BBOX=${box}&WIDTH=${width}&HEIGHT=${height}&FORMAT=image/png`
}

const tile = (bbox: Bbox, tx: number, ty: number) => cachedPng(`${DIR}/${bbox.north},${bbox.west}-${tx}-${ty}.png`, tileUrl(bbox, tx, ty))

export const loadPhoto = (bbox: Bbox) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.makeDirectory(DIR, { recursive: true })
    const projection = makeProjection(bbox)
    const width = Math.ceil(projection.width * PHOTO_PX_PER_M)
    const height = Math.ceil(projection.height * PHOTO_PX_PER_M)
    const cols = Math.ceil(projection.width / TILE_M)
    const rows = Math.ceil(projection.height / TILE_M)
    yield* Console.log(`DOP40: ${cols * rows} tiles (cached in ${DIR})`)
    const rgba = new Uint8Array(width * height * 4)
    const side = TILE_M * PHOTO_PX_PER_M
    const jobs = Array.from({ length: cols * rows }, (_, i) => [i % cols, Math.floor(i / cols)] as const)
    yield* Effect.forEach(
      jobs,
      ([tx, ty]) =>
        Effect.map(tile(bbox, tx, ty), (img) => {
          for (let y = 0; y < img.height; y++) {
            const my = ty * side + y
            if (my >= height) break
            const w = Math.min(img.width, width - tx * side)
            rgba.set(img.rgba.subarray(y * img.width * 4, (y * img.width + w) * 4), (my * width + tx * side) * 4)
          }
        }),
      { concurrency: 4, discard: true },
    )
    const raster: Raster = { width, height, rgba }
    return raster
  })
