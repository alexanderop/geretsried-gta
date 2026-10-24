import { useEffect, useRef, useState } from "react"
import { DT, newGame, playerPos, speedKmh, step, type Game as GameState } from "#/sim/game.ts"
import type { World } from "#/world/world.ts"
import { makeProjection } from "#/map/project.ts"
import { bakeMinimap, drawMinimap, drawPlaces, drawPlayerMarker, poiIcon } from "#/render/overlay.ts"
import { followCamera, startCamera, viewMatrix, type View } from "#/render/camera.ts"
import { Renderer, openGl } from "#/render/gl/renderer.ts"
import type { Assets } from "#/render/assets.ts"
import { listenKeyboard } from "./input.ts"

type Hud = { street: string; kmh: number; inCar: boolean; nearCar: boolean; place: string }

declare global {
  interface Window {
    /** Debug handle for agent-browser checks. */
    __gta?: { game: GameState; world: World; renderer: Renderer }
  }
}

/**
 * `?compare=lat,lon,half`: frame exactly the square of `half` meters around a
 * point, straight down and without perspective, the same square `pnpm compare`
 * fetches as an aerial photo.
 */
const compareSpot = (world: World): { x: number; y: number; half: number } | null => {
  const raw = new URLSearchParams(location.search).get("compare")
  if (raw === null) return null
  const [lat, lon, half] = raw.split(",").map(Number)
  if (lat === undefined || lon === undefined || !Number.isFinite(lat) || !Number.isFinite(lon)) return null
  const [x, y] = makeProjection(world.map.bbox).toMeters({ lat, lon })
  return { x, y, half: half ?? 80 }
}

/** Milliseconds a frame may spend building chunks while you play. */
const BUILD_BUDGET_MS = 4

export function Game({ world, assets }: { readonly world: World; readonly assets: Assets }) {
  const glRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const [hud, setHud] = useState<Hud>({ street: "", kmh: 0, inCar: false, nearCar: false, place: "" })
  const [failure, setFailure] = useState("")

  useEffect(() => {
    const canvas = glRef.current
    const overlay = overlayRef.current
    const gl = canvas === null ? null : openGl(canvas)
    const ctx = overlay?.getContext("2d") ?? null
    if (canvas === null || overlay === null || gl === null || ctx === null) {
      setFailure("WebGL2 fehlt in diesem Browser.")
      return
    }
    const game = newGame(world, Date.now() % 100_000)
    const renderer = new Renderer(gl, world, assets)
    window.__gta = { game, world, renderer }
    const minimap = bakeMinimap(world.map, assets.overview, 220)
    const camera = startCamera(game)
    const compare = compareSpot(world)
    if (compare !== null) Object.assign(camera, { x: compare.x, y: compare.y, height: 100 })
    const keyboard = listenKeyboard(window)

    const resize = () => {
      for (const c of [canvas, overlay]) {
        c.width = Math.round(window.innerWidth * devicePixelRatio)
        c.height = Math.round(window.innerHeight * devicePixelRatio)
      }
    }
    resize()
    window.addEventListener("resize", resize)

    let raf = 0
    let last = performance.now()
    let acc = 0
    let hudTimer = 0
    const frame = (now: number) => {
      acc += Math.min(0.1, (now - last) / 1000)
      last = now
      const aspect = canvas.width / canvas.height
      if (compare !== null) {
        // Fixed camera, nothing but the town, every chunk built before it says ready.
        const view: View = { camera, aspect, ortho: compare.half }
        if (renderer.frame(view, null, 1000)) document.body.dataset.ready = "1"
        raf = requestAnimationFrame(frame)
        return
      }
      while (acc >= DT) {
        step(world, game, keyboard.take())
        acc -= DT
      }
      followCamera(camera, game)
      const view: View = { camera, aspect, ortho: null }
      renderer.frame(view, game, BUILD_BUDGET_MS)
      const matrix = viewMatrix(view)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, overlay.width, overlay.height)
      drawPlayerMarker(ctx, matrix, game, devicePixelRatio)
      drawPlaces(ctx, world.map, matrix, devicePixelRatio)
      drawMinimap(ctx, minimap, world.map, game)
      if ((hudTimer += 1) % 6 === 0) {
        const p = playerPos(game)
        const near = (x: number, y: number) => Math.hypot(x - p.x, y - p.y) < 4
        const place = world.map.pois.find((poi) => Math.hypot(poi.x - p.x, poi.y - p.y) < 30)
        setHud({
          street: world.roadAt(p.x, p.y, 15)?.road.name ?? "",
          kmh: Math.round(speedKmh(game)),
          inCar: game.player.car !== null,
          place: place === undefined ? "" : `${poiIcon(place.kind)} ${place.name}`,
          nearCar: game.parked.some((c) => near(c.x, c.y)) || game.npcs.some((n) => near(n.x, n.y)),
        })
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      keyboard.dispose()
      window.removeEventListener("resize", resize)
    }
  }, [world, assets])

  if (failure !== "") return <div className="grid h-dvh place-items-center bg-black font-mono text-yellow-300">{failure}</div>
  if (new URLSearchParams(location.search).has("compare"))
    return (
      <div className="relative h-dvh w-dvw overflow-hidden bg-black">
        <canvas ref={glRef} className="block h-full w-full" />
        <canvas ref={overlayRef} className="hidden" />
      </div>
    )
  return (
    <div className="relative h-dvh w-dvw overflow-hidden bg-black font-mono text-white select-none">
      <canvas ref={glRef} className="block h-full w-full" />
      <canvas ref={overlayRef} className="pointer-events-none absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute top-4 left-4 flex flex-col gap-1">
        <div data-testid="street" className="text-2xl font-black tracking-wide text-yellow-300 [text-shadow:2px_2px_0_#000]">
          {hud.street || "Geretsried"}
        </div>
        {hud.place !== "" && (
          <div data-testid="place" className="text-lg font-bold text-white [text-shadow:2px_2px_0_#000]">
            {hud.place}
          </div>
        )}
        {hud.inCar && (
          <div data-testid="speed" className="text-4xl font-black [text-shadow:2px_2px_0_#000]">
            {hud.kmh} <span className="text-lg">km/h</span>
          </div>
        )}
        {!hud.inCar && hud.nearCar && <div className="text-lg text-green-300 [text-shadow:2px_2px_0_#000]">F — Auto nehmen</div>}
      </div>
      <div className="pointer-events-none absolute bottom-4 left-4 rounded bg-black/60 px-3 py-2 text-xs leading-5">
        WASD / Pfeile — laufen, fahren · Shift — sprinten · Leertaste — Handbremse · F — ein-/aussteigen
      </div>
      <div className="absolute right-2 bottom-1 text-[10px] text-white/70">
        Karte ©{" "}
        <a className="underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
          OpenStreetMap
        </a>{" "}
        contributors · Dachfarben, Bäume, Minikarte aus dem Luftbild DOP40{" "}
        <a className="underline" href="https://geodaten.bayern.de/opengeodata/" target="_blank" rel="noreferrer">
          © Bayerische Vermessungsverwaltung (www.geodaten.bayern.de)
        </a>
        ,{" "}
        <a className="underline" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">
          CC BY 4.0
        </a>
        , bearbeitet
      </div>
    </div>
  )
}
