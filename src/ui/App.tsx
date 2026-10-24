import { Effect, Exit } from "effect"
import { useEffect, useState } from "react"
import { loadMap } from "#/map/load.ts"
import { makeWorld, type World } from "#/world/world.ts"
import { loadAssets, type Assets } from "#/render/assets.ts"
import { Game } from "./Game.tsx"

type State = { readonly status: "loading" } | { readonly status: "ready"; readonly world: World; readonly assets: Assets } | { readonly status: "failed"; readonly message: string }

export function App() {
  const [state, setState] = useState<State>({ status: "loading" })

  useEffect(() => {
    const controller = new AbortController()
    void Effect.runPromiseExit(Effect.all({ world: loadMap("/geretsried.map.json").pipe(Effect.map(makeWorld)), assets: loadAssets }, { concurrency: "unbounded" }), { signal: controller.signal }).then((exit) => {
      if (controller.signal.aborted) return
      setState(
        Exit.isSuccess(exit) ? { status: "ready", ...exit.value } : { status: "failed", message: String(exit.cause) },
      )
    })
    return () => controller.abort()
  }, [])

  if (state.status === "ready") return <Game world={state.world} assets={state.assets} />
  return (
    <div className="grid h-dvh place-items-center bg-black font-mono text-yellow-300">
      {state.status === "loading" ? "Lade Geretsried…" : `Fehler: ${state.message}`}
    </div>
  )
}
