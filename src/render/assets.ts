import { Effect, Schema } from "effect"

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

export const CAR_MODELS = 8
export const PEDS = 4
export const TREES = 8

export type Assets = {
  readonly textures: Readonly<Record<TextureName, HTMLImageElement>>
  /** Car sprites, nose pointing right (+x), cropped to the body. */
  readonly cars: ReadonlyArray<HTMLImageElement>
  /** Pedestrian sprites facing right; 0 is the player. */
  readonly peds: ReadonlyArray<HTMLImageElement>
  /** Tree crowns and bushes seen from above; see TREE_KINDS in chunks.ts. */
  readonly trees: ReadonlyArray<HTMLImageElement>
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

export const loadAssets = Effect.all(
  {
    textures: Effect.all(
      {
        grass: sprite("grass"),
        asphalt: sprite("asphalt"),
        pavement: sprite("pavement"),
        roofBrown: sprite("roof-brown"),
        roofAnthracite: sprite("roof-anthracite"),
        roofOrange: sprite("roof-orange"),
        roofFlat: sprite("roof-flat"),
        roofGrey: sprite("roof-grey"),
        forest: sprite("forest"),
        water: sprite("water"),
        farmland: sprite("farmland"),
      },
      { concurrency: "unbounded" },
    ),
    cars: Effect.all(Array.from({ length: CAR_MODELS }, (_, i) => sprite(`car-${i}`)), { concurrency: "unbounded" }),
    peds: Effect.all(Array.from({ length: PEDS }, (_, i) => sprite(`ped-${i}`)), { concurrency: "unbounded" }),
    trees: Effect.all(Array.from({ length: TREES }, (_, i) => sprite(`tree-${i}`)), { concurrency: "unbounded" }),
  },
  { concurrency: "unbounded" },
)

/** Black copy of a sprite's shape, for drop shadows. */
export const silhouette = (img: HTMLImageElement): HTMLCanvasElement => {
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
