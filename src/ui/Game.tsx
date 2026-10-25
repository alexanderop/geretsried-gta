import { useEffect, useRef, useState } from "react"
import { DT, newGame, playerPos, speedKmh, step, type Game as GameState } from "#/sim/game.ts"
import type { World } from "#/world/world.ts"
import { makeProjection } from "#/map/project.ts"
import { crownCover } from "#/map/crowns.ts"
import { bakeMinimap, drawMinimap, drawPlaces, drawPlayerMarker, drawTargetArrow, poiIcon } from "#/render/overlay.ts"
import { isRinging, jobTarget } from "#/sim/mission.ts"
import { multiplier } from "#/sim/score.ts"
import { wantedLevel } from "#/sim/wanted.ts"
import { WEAPONS } from "#/sim/weapons.ts"
import { GANGS } from "#/sim/gangs.ts"
import { SAVE_KEY, applySave, decodeSave, encodeSave, type SaveData } from "#/sim/save.ts"
import { GameAudio } from "./audio.ts"
import { Hud, emptyHud, type HudState } from "./Hud.tsx"
import { followCamera, startCamera, viewMatrix, type View } from "#/render/camera.ts"
import { Renderer, openGl } from "#/render/gl/renderer.ts"
import type { Assets } from "#/render/assets.ts"
import { listenKeyboard } from "./input.ts"

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

/** The HUD's weapon slot: the weapon in hand and its rounds. */
const weaponSlot = (game: GameState): HudState["weapon"] => {
  const { current, ammo } = game.player.arsenal
  return { id: current, name: WEAPONS[current].name, ammo: current === "fists" ? null : ammo[current] }
}

/** The job clock: running from the pickup (or, for a car to wreck, from the call). */
const jobClock = (game: GameState): number | null => {
  const a = game.jobs.active
  if (a === null) return null
  return a.stage === "deliver" || a.job.goal.kind === "destroy" ? a.timeLeft : null
}

/** Milliseconds a frame may spend building chunks while you play. */
const BUILD_BUDGET_MS = 4

/** Seconds the big banners and mission texts stay up. */
const BIG_S = 3
const MISSION_S = 7
const BIG_TEXT = { busted: "BUSTED", wasted: "WASTED", gameOver: "GAME OVER", saved: "SAVED" } as const

/** localStorage can be missing, full or blocked (private windows): a save that cannot be read is no save. */
const readSave = (): SaveData | null => {
  try {
    return decodeSave(localStorage.getItem(SAVE_KEY))
  } catch {
    return null
  }
}

/** Sound on or off, remembered in this browser; on when storage is blocked. */
const MUTED_KEY = "geretsried-gta:muted"
const readMuted = (): boolean => {
  try {
    return localStorage.getItem(MUTED_KEY) === "1"
  } catch {
    return false
  }
}
const writeMuted = (muted: boolean) => {
  try {
    localStorage.setItem(MUTED_KEY, muted ? "1" : "0")
  } catch {
    // Not remembered: it still applies until the page reloads.
  }
}

const writeSave = (data: SaveData): boolean => {
  try {
    localStorage.setItem(SAVE_KEY, encodeSave(data))
    return true
  } catch {
    return false
  }
}

export function Game({ world, assets }: { readonly world: World; readonly assets: Assets }) {
  const glRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const [hud, setHud] = useState<HudState>(emptyHud)
  const [help, setHelp] = useState(false)
  const [muted, setMuted] = useState(readMuted)
  const mutedRef = useRef(muted)
  const audioRef = useRef<GameAudio | null>(null)

  useEffect(() => {
    mutedRef.current = muted
    audioRef.current?.setMuted(muted)
    writeMuted(muted)
  }, [muted])
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
    const game = newGame(world, Date.now() % 100_000, crownCover(assets.crowns))
    // Carry on from the last church you saved at (GTA 2 wakes you there).
    const saved = readSave()
    if (saved !== null) {
      const church = game.shops.find((sh) => sh.kind === "save") ?? null
      applySave(game, saved, church === null ? null : { x: church.x + 3, y: church.y })
    }
    const renderer = new Renderer(gl, world, assets)
    window.__gta = { game, world, renderer }
    const minimap = bakeMinimap(world.map, assets.overview, Math.round(180 * devicePixelRatio))
    const camera = startCamera(game)
    const compare = compareSpot(world)
    if (compare !== null) Object.assign(camera, { x: compare.x, y: compare.y, height: 100 })
    const audio = new GameAudio()
    audio.setMuted(mutedRef.current)
    audioRef.current = audio
    const keyboard = listenKeyboard(window, { onHelp: () => setHelp((h) => !h), onMute: () => setMuted((m) => !m), onAnyKey: () => audio.start() })

    const resize = () => {
      for (const c of [canvas, overlay]) {
        c.width = Math.round(window.innerWidth * devicePixelRatio)
        c.height = Math.round(window.innerHeight * devicePixelRatio)
      }
    }
    resize()
    window.addEventListener("resize", resize)

    // What the HUD shows besides the game state: announcements and when they end.
    let keys = 0
    let street = ""
    let shown: HudState = emptyHud
    let bigUntil = 0
    let missionUntil = 0
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
      const target = jobTarget(game.jobs, playerPos(game))
      if (target !== null) drawTargetArrow(ctx, matrix, target, game.time, devicePixelRatio)
      drawMinimap(ctx, minimap, world.map, game)

      const p = playerPos(game)
      const copDist = Math.min(Infinity, ...game.cops.map((c) => Math.hypot(c.car.x - p.x, c.car.y - p.y)))
      const level = wantedLevel(game.wanted)
      audio.effects(game.sounds.splice(0), p)
      audio.update({ speed: game.player.car === null ? 0 : speedKmh(game) / 3.6, inCar: game.player.car !== null, horn: keyboard.horn(), siren: level > 0 ? Math.max(0, 1 - copDist / 140) : 0 })

      for (const m of game.messages.splice(0)) {
        if (m.kind === "car") shown = { ...shown, vehicle: { name: m.text, key: ++keys } }
        else if (m.kind === "pickup") shown = { ...shown, pickup: { name: m.text, key: ++keys } }
        else if (m.kind === "cash") shown = { ...shown, paid: { amount: m.amount, key: ++keys } }
        else if (m.kind === "mission") {
          shown = { ...shown, mission: m.text }
          missionUntil = game.time + MISSION_S
        } else {
          if (m.kind === "saved" && !writeSave(m.data)) shown = { ...shown, mission: "Speichern ging nicht: der Browser lässt nichts ablegen." }
          shown = { ...shown, big: BIG_TEXT[m.kind] }
          bigUntil = game.time + BIG_S
        }
      }
      if ((hudTimer += 1) % 6 === 0) {
        const name = world.roadAt(p.x, p.y, 15)?.road.name ?? ""
        // GTA 2 announces each street as you turn into it.
        if (name !== "" && name !== street) shown = { ...shown, street: { name, key: ++keys } }
        if (name !== "") street = name
        const place = world.map.pois.find((poi) => Math.hypot(poi.x - p.x, poi.y - p.y) < 30)
        const near = (x: number, y: number) => Math.hypot(x - p.x, y - p.y) < 4
        shown = {
          ...shown,
          money: game.score.money,
          lives: game.lives,
          health: game.player.vitals.hp,
          armour: game.player.vitals.armour,
          weapon: weaponSlot(game),
          multiplier: multiplier(game.score),
          wanted: level,
          chased: copDist < 45,
          kmh: Math.round(speedKmh(game)),
          inCar: game.player.car !== null,
          place: place === undefined ? "" : `${poiIcon(place.kind)} ${place.name}`,
          nearCar: game.parked.some((c) => near(c.x, c.y)) || game.npcs.some((n) => near(n.x, n.y)),
          big: game.time < bigUntil ? shown.big : "",
          mission: game.time < missionUntil ? shown.mission : "",
          timer: jobClock(game),
          respect: game.turf.map((t) => ({ id: t.gang, name: GANGS[t.gang].name, color: `rgb(${GANGS[t.gang].color.join(",")})`, value: game.respect[t.gang] })),
          ringing: game.jobs.phones.some((ph, i) => isRinging(game.jobs, i) && Math.hypot(ph.x - p.x, ph.y - p.y) < 70),
        }
        setHud(shown)
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      keyboard.dispose()
      audio.dispose()
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
    <div className="relative h-dvh w-dvw overflow-hidden bg-black text-white select-none">
      <canvas ref={glRef} className="block h-full w-full" />
      <canvas ref={overlayRef} className="pointer-events-none absolute inset-0 h-full w-full" />
      <Hud hud={hud} help={help} muted={muted} onMute={() => setMuted((m) => !m)} />
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
