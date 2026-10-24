import { Effect, Schema } from "effect"
import { decodeCrowns, type Crowns } from "#/map/crowns.ts"

/** Seamless textures and how many meters one tile covers in the world. */
export const TEXTURES = {
  grass: 32,
  asphalt: 16,
  pavement: 8,
  roofBrown: 8,
  roofAnthracite: 8,
  roofOrange: 8,
  roofFlat: 16,
  roofGrey: 12,
  forest: 40,
  water: 32,
  farmland: 40,
} as const
export type TextureName = keyof typeof TEXTURES

const TEXTURE_FILES: Readonly<Record<TextureName, string>> = {
  grass: "grass",
  asphalt: "asphalt",
  pavement: "pavement",
  roofBrown: "roof-brown",
  roofAnthracite: "roof-anthracite",
  roofOrange: "roof-orange",
  roofFlat: "roof-flat",
  roofGrey: "roof-grey",
  forest: "forest",
  water: "water",
  farmland: "farmland",
}

export const CAR_MODELS = 8
export const PEDS = 4
export const TREES = 8

/** Textures whose tile detail is laid over the roof colour measured in the aerial photo. */
export const ROOF_TEXTURES = ["roofOrange", "roofFlat"] as const
export type RoofTexture = (typeof ROOF_TEXTURES)[number]

export type Assets = {
  readonly textures: Readonly<Record<TextureName, HTMLCanvasElement>>
  /** Grey copies of roof textures centred on 50 % grey, for the "overlay" blend. */
  readonly roofDetail: Readonly<Record<RoofTexture, HTMLCanvasElement>>
  /** Alpha = how much of each GROUND_M_PER_PX square is paved (from the aerial photo). */
  readonly ground: HTMLImageElement
  /** Tree crowns found in the aerial photo, outside forests. */
  readonly crowns: Crowns
  /** Car sprites, nose pointing right (+x), cropped to the body. */
  readonly cars: ReadonlyArray<HTMLImageElement>
  /** Pedestrian sprites facing right; 0 is the player. */
  readonly peds: ReadonlyArray<HTMLImageElement>
  /** Tree crowns and bushes seen from above: sprite s in tone t is `s * TREE_TONES.length + t`. */
  readonly trees: ReadonlyArray<HTMLCanvasElement>
}

export class AssetLoadError extends Schema.TaggedError<AssetLoadError>()("AssetLoadError", { url: Schema.String }) {}

const loadImage = (url: string) =>
  Effect.callback<HTMLImageElement, AssetLoadError>((resume) => {
    const img = new Image()
    img.addEventListener("load", () => resume(Effect.succeed(img)), { once: true })
    img.addEventListener("error", () => resume(Effect.fail(new AssetLoadError({ url }))), { once: true })
    img.src = url
  })

const sprite = (name: string) => loadImage(`/sprites/${name}.webp`)

const loadCrowns = (url: string) =>
  Effect.tryPromise({
    try: () => fetch(url).then((res) => (res.ok ? res.arrayBuffer() : Promise.reject(new Error(String(res.status))))),
    catch: () => new AssetLoadError({ url }),
  }).pipe(Effect.map(decodeCrowns))

type Rgb = readonly [number, number, number]

/**
 * The painted sprites are greener and more saturated than the town looks from
 * the air. These are the median colours the importer measured in the DOP40
 * photo (sunlit lawn, tree crowns, paved ground), slightly toned so roads stay
 * darker than yards.
 */
const PHOTO_TONES: Partial<Record<TextureName, readonly [Rgb, number]>> = {
  grass: [[128, 136, 92], 1],
  asphalt: [[192, 188, 181], 0.35],
  pavement: [[205, 199, 189], 0.3],
}
/** Every tree sprite comes in these tones (dark green, olive, blue-green), so crowns vary like real ones. */
export const TREE_TONES: ReadonlyArray<Rgb> = [
  [62, 76, 46],
  [84, 92, 56],
  [58, 72, 50],
]

const canvasOf = (img: HTMLImageElement): readonly [HTMLCanvasElement, CanvasRenderingContext2D | null] => {
  const c = document.createElement("canvas")
  c.width = img.width
  c.height = img.height
  const ctx = c.getContext("2d")
  ctx?.drawImage(img, 0, 0)
  return [c, ctx]
}

/**
 * Shift an image's mean colour to `tone` (opaque pixels only) and scale its
 * detail by `contrast`: the photo's paving is smooth, the painted one speckled.
 */
export const retint = (img: HTMLImageElement, look: readonly [Rgb, number] | undefined): HTMLCanvasElement => {
  const [c, ctx] = canvasOf(img)
  if (ctx === null || look === undefined) return c
  const [tone, contrast] = look
  const data = ctx.getImageData(0, 0, c.width, c.height)
  const px = data.data
  const sum = [0, 0, 0]
  let n = 0
  for (let i = 0; i < px.length; i += 4) {
    if ((px[i + 3] ?? 0) < 128) continue
    for (let k = 0; k < 3; k++) sum[k] = (sum[k] ?? 0) + (px[i + k] ?? 0)
    n++
  }
  for (let i = 0; i < px.length; i += 4) {
    for (let k = 0; k < 3; k++) px[i + k] = (tone[k] ?? 0) + ((px[i + k] ?? 0) - (sum[k] ?? 0) / Math.max(1, n)) * contrast
  }
  ctx.putImageData(data, 0, 0)
  return c
}

/** Grey luminance detail around 50 % grey: "overlay" with it keeps the colour underneath. */
const detail = (img: HTMLCanvasElement, strength: number): HTMLCanvasElement => {
  const c = document.createElement("canvas")
  c.width = img.width
  c.height = img.height
  const ctx = c.getContext("2d")
  const src = img.getContext("2d")
  if (ctx === null || src === null) return c
  const data = src.getImageData(0, 0, c.width, c.height)
  const px = data.data
  const luma = (i: number) => 0.3 * (px[i] ?? 0) + 0.59 * (px[i + 1] ?? 0) + 0.11 * (px[i + 2] ?? 0)
  let mean = 0
  for (let i = 0; i < px.length; i += 4) mean += luma(i)
  mean /= px.length / 4
  for (let i = 0; i < px.length; i += 4) {
    const v = 128 + (luma(i) - mean) * strength
    px[i] = v
    px[i + 1] = v
    px[i + 2] = v
    px[i + 3] = 255
  }
  ctx.putImageData(data, 0, 0)
  return c
}

const tone = (name: TextureName) => Effect.map(sprite(TEXTURE_FILES[name]), (img) => retint(img, PHOTO_TONES[name]))

const loadTextures = Effect.all(
  {
    grass: tone("grass"),
    asphalt: tone("asphalt"),
    pavement: tone("pavement"),
    roofBrown: tone("roofBrown"),
    roofAnthracite: tone("roofAnthracite"),
    roofOrange: tone("roofOrange"),
    roofFlat: tone("roofFlat"),
    roofGrey: tone("roofGrey"),
    forest: tone("forest"),
    water: tone("water"),
    farmland: tone("farmland"),
  },
  { concurrency: "unbounded" },
)

export const loadAssets = Effect.all(
  {
    textures: loadTextures,
    ground: loadImage("/ground.png"),
    crowns: loadCrowns("/trees.bin"),
    cars: Effect.all(Array.from({ length: CAR_MODELS }, (_, i) => sprite(`car-${i}`)), { concurrency: "unbounded" }),
    peds: Effect.all(Array.from({ length: PEDS }, (_, i) => sprite(`ped-${i}`)), { concurrency: "unbounded" }),
    trees: Effect.all(Array.from({ length: TREES }, (_, i) => sprite(`tree-${i}`)), { concurrency: "unbounded" }).pipe(
      Effect.map((trees) => trees.flatMap((img) => TREE_TONES.map((treeTone) => retint(img, [treeTone, 1])))),
    ),
  },
  { concurrency: "unbounded" },
).pipe(
  Effect.map(
    (loaded): Assets => ({
      ...loaded,
      roofDetail: { roofOrange: detail(loaded.textures.roofOrange, 0.8), roofFlat: detail(loaded.textures.roofFlat, 2) },
    }),
  ),
)

/** Black copy of a sprite's shape, for drop shadows. */
export const silhouette = (img: HTMLImageElement | HTMLCanvasElement): HTMLCanvasElement => {
  const c = document.createElement("canvas")
  c.width = img.width
  c.height = img.height
  const ctx = c.getContext("2d")
  if (ctx === null) return c
  ctx.drawImage(img, 0, 0)
  ctx.globalCompositeOperation = "source-in"
  ctx.fillStyle = "#000"
  ctx.fillRect(0, 0, c.width, c.height)
  return c
}
