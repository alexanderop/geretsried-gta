import { Effect, Schema } from "effect"
import { GameMap } from "./types.ts"

export class MapLoadError extends Schema.TaggedError<MapLoadError>()("MapLoadError", { message: Schema.String }) {}

/** Fetch and validate the baked town map from /public. */
export const loadMap = (url: string) =>
  Effect.gen(function* () {
    const res = yield* Effect.tryPromise({
      try: () => fetch(url),
      catch: () => new MapLoadError({ message: `could not reach ${url}` }),
    })
    if (!res.ok) return yield* new MapLoadError({ message: `${url} answered ${res.status}` })
    const json = yield* Effect.tryPromise({
      try: () => res.json(),
      catch: () => new MapLoadError({ message: `${url} is not JSON` }),
    })
    return yield* Schema.decodeUnknownEffect(GameMap)(json).pipe(
      Effect.mapError((e) => new MapLoadError({ message: e.message })),
    )
  })
