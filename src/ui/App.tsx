import { Effect, Exit } from "effect"
import { useEffect, useState } from "react"
import { loadMap } from "#/map/load.ts"
import { makeWorld, type World } from "#/world/world.ts"
import { Game } from "./Game.tsx"

type State = { readonly status: "loading" } | { readonly status: "ready"; readonly world: World } | { readonly status: "failed"; readonly message: string }

export function App() {
  const [state, setState] = useState<State>({ status: "loading" })

  useEffect(() => {
    const controller = new AbortController()
    void Effect.runPromiseExit(loadMap("/geretsried.map.json").pipe(Effect.map(makeWorld)), { signal: controller.signal }).then((exit) => {
      if (controller.signal.aborted) return
      setState(
        Exit.isSuccess(exit) ? { status: "ready", world: exit.value } : { status: "failed", message: String(exit.cause) },
      )
    })
    return () => controller.abort()
  }, [])

  if (state.status === "ready") return <Game world={state.world} />
  return (
    <div className="grid h-dvh place-items-center bg-black font-mono text-yellow-300">
      {state.status === "loading" ? "Lade Geretsried…" : `Fehler: ${state.message}`}
    </div>
  )
}
