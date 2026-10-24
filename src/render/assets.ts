import { Effect, Schema } from "effect"
import { decodeCrowns, type Crowns } from "#/map/crowns.ts"
import { PHOTO_OVERVIEW_URL } from "#/map/photo-tiles.ts"
import { MATERIAL_FILES } from "./scene/mesh.ts"

export const CAR_MODELS = 8
export const PEDS = 4
export const TREES = 8

/** Everything the renderer needs, loaded before the game starts. */
export type Assets = {
  /** Car sprites, nose pointing right (+x), cropped to the body. */
  readonly cars: ReadonlyArray<HTMLImageElement>
  /** Pedestrian sprites facing right; 0 is the player. */
  readonly peds: ReadonlyArray<HTMLImageElement>
  /** Tree crowns and bushes seen from above (see FOREST_TREES in scene.ts for which is which). */
  readonly trees: ReadonlyArray<HTMLImageElement>
  /** Seamless ground, facade and roof textures, in `MATERIAL_FILES` order. */
  readonly materials: ReadonlyArray<HTMLImageElement>
  /** Alpha = how much of each GROUND_M_PER_PX square is paved (from the aerial photo). */
  readonly ground: HTMLImageElement
  /** Tree crowns found in the aerial photo, outside forests. */
  readonly crowns: Crowns
  /** The whole town from the air, for the minimap (see `PHOTO_OVERVIEW_URL`). */
  readonly overview: HTMLImageElement
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
const sprites = (prefix: string, n: number) => Effect.all(Array.from({ length: n }, (_, i) => sprite(`${prefix}-${i}`)), { concurrency: "unbounded" })

const loadCrowns = (url: string) =>
  Effect.tryPromise({
    try: () => fetch(url).then((res) => (res.ok ? res.arrayBuffer() : Promise.reject(new Error(String(res.status))))),
    catch: () => new AssetLoadError({ url }),
  }).pipe(Effect.map(decodeCrowns))

export const loadAssets: Effect.Effect<Assets, AssetLoadError> = Effect.all(
  {
    cars: sprites("car", CAR_MODELS),
    peds: sprites("ped", PEDS),
    trees: sprites("tree", TREES),
    materials: Effect.all(MATERIAL_FILES.map(sprite), { concurrency: "unbounded" }),
    ground: loadImage("/ground.png"),
    crowns: loadCrowns("/trees.bin"),
    overview: loadImage(PHOTO_OVERVIEW_URL),
  },
  { concurrency: "unbounded" },
)
