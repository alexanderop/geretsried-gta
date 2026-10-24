import { useEffect, useRef, useState } from "react"
import { DT, newGame, playerPos, speedKmh, step, type Game as GameState } from "#/sim/game.ts"
import type { World } from "#/world/world.ts"
import { makeProjection } from "#/map/project.ts"
import { ChunkCache } from "#/render/chunks.ts"
import { bakeMinimap, drawFrame, drawMinimap, drawPlaces, followCamera, makeSprites, poiIcon, type Camera } from "#/render/draw.ts"
import type { Assets } from "#/render/assets.ts"
import { listenKeyboard } from "./input.ts"

type Hud = { street: string; kmh: number; inCar: boolean; nearCar: boolean; place: string }

declare global {
  interface Window {
    /** Debug handle for agent-browser checks. */
    __gta?: { game: GameState; world: World }
  }
}

/**
 * `?compare=lat,lon,half`: frame exactly the square of `half` meters around a
 * point, the same square `pnpm compare` fetches as an aerial photo.
 */
const compareView = (world: World): Camera | null => {
  const raw = new URLSearchParams(location.search).get("compare")
  if (raw === null) return null
  const [lat, lon, half] = raw.split(",").map(Number)
  if (lat === undefined || lon === undefined || !Number.isFinite(lat) || !Number.isFinite(lon)) return null
  const [x, y] = makeProjection(world.map.bbox).toMeters({ lat, lon })
  return { x, y, zoom: window.innerWidth / (2 * (half ?? 80)) }
}

export function Game({ world, assets }: { readonly world: World; readonly assets: Assets }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hud, setHud] = useState<Hud>({ street: "", kmh: 0, inCar: false, nearCar: false, place: "" })

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d", { alpha: false })
    if (canvas == null || ctx == null) return
    const game = newGame(world, Date.now() % 100_000)
    window.__gta = { game, world }
    const chunks = new ChunkCache(world, assets)
    const sprites = makeSprites(assets)
    const minimap = bakeMinimap(world.map, 220)
    const camera: Camera = { ...playerPos(game), zoom: 7 }
    const compare = compareView(world)
    if (compare !== null) Object.assign(camera, compare)
    const keyboard = listenKeyboard(window)

    const resize = () => {
      canvas.width = window.innerWidth * devicePixelRatio
      canvas.height = window.innerHeight * devicePixelRatio
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
      while (acc >= DT) {
        step(world, game, keyboard.take())
        acc -= DT
      }
      if (compare !== null) {
        // Fixed camera, every chunk baked at once, nothing but the map.
        drawFrame(ctx, chunks, sprites, { ...camera, zoom: camera.zoom * devicePixelRatio }, game, { bakeBudget: 999, entities: false })
        document.body.dataset.ready = "1"
        raf = requestAnimationFrame(frame)
        return
      }
      followCamera(camera, game)
      drawFrame(ctx, chunks, sprites, { ...camera, zoom: camera.zoom * devicePixelRatio }, game)
      drawPlaces(ctx, world.map, camera, devicePixelRatio)
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

  if (new URLSearchParams(location.search).has("compare"))
    return (
      <div className="h-dvh w-dvw overflow-hidden bg-black">
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>
    )
  return (
    <div className="relative h-dvh w-dvw overflow-hidden bg-black font-mono text-white select-none">
      <canvas ref={canvasRef} className="block h-full w-full" />
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
        contributors · Luftbild{" "}
        <a className="underline" href="https://geodaten.bayern.de/opengeodata/" target="_blank" rel="noreferrer">
          © Bayerische Vermessungsverwaltung
        </a>{" "}
        (DOP40, CC BY 4.0)
      </div>
    </div>
  )
}
