import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { DT, busNear, newGame, playerPos, speedKmh, step, type Game as GameState } from "#/sim/game.ts"
import { direction, nextStop } from "#/sim/transit.ts"
import type { World } from "#/world/world.ts"
import { findSpot, spotList, spotNames } from "#/world/teleport.ts"
import { makeProjection } from "#/map/project.ts"
import { crownCover } from "#/map/crowns.ts"
import { districtAt } from "#/map/districts.ts"
import { addPopup, agePopups, drawPopups, type Popup } from "#/render/popups.ts"
import { bakeMinimap, drawMinimap, drawPlaces, drawPlayerMarker, drawTargetArrow, poiIcon } from "#/render/overlay.ts"
import { isRinging, jobTarget } from "#/sim/mission.ts"
import { multiplier } from "#/sim/score.ts"
import { wantedLevel } from "#/sim/wanted.ts"
import { WEAPONS } from "#/sim/weapons.ts"
import { GANGS } from "#/sim/gangs.ts"
import { SAVE_KEY, applySave, decodeSave, encodeSave, type SaveData } from "#/sim/save.ts"
import { GameAudio } from "./audio.ts"
import { Hud, emptyHud, type HudState } from "./Hud.tsx"
import { followCamera, groundReach, startCamera, towersOf, viewMatrix, type View } from "#/render/camera.ts"
import { Renderer, openGl } from "#/render/gl/renderer.ts"
import type { Assets } from "#/render/assets.ts"
import { listenKeyboard } from "./input.ts"
import { isTouchDevice, mergeInput, newTouchPad } from "./touch.ts"
import { TouchControls } from "./TouchControls.tsx"
import { Places } from "./Places.tsx"

declare global {
  interface Window {
    /** Debug handle for agent-browser checks; `teleport("edeka")` takes the same names as `?at=`. */
    __gta?: { game: GameState; world: World; renderer: Renderer; teleport: (query: string) => string; spots: () => ReadonlyArray<string> }
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

/** The bus you ride, for the HUD: its line and direction, the next stop, and whether it stands. */
const rideInfo = (game: GameState): HudState["ride"] => {
  const ride = game.player.ride
  const trip = ride?.bus.bus
  if (ride === null || trip === undefined) return null
  return { ref: trip.line.ref, to: direction(trip), next: nextStop(trip), stopped: ride.bus.speed < 0.8, getOff: ride.getOff }
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

/**
 * GTA 2's chunky pixels: the town is drawn at RETRO_SCALE of the CSS size and the canvas scaled up with
 * `image-rendering: pixelated`; the HUD and the overlay stay sharp. `?retro=0` draws it at full resolution, and
 * `?compare=` always does (it must line up with the aerial photo).
 */
const RETRO_SCALE = 0.5
const retro = (comparing: boolean) => !comparing && new URLSearchParams(location.search).get("retro") !== "0"

/** Sharper than this costs a phone's GPU four times the pixels for little you can see. */
const MAX_DPR = 2

/**
 * When frames run slow, the town is drawn at fewer pixels: each step multiplies the render scale. A fast
 * machine never leaves the first step, so the desktop looks as before.
 */
const QUALITY = [1, 0.8, 0.65] as const
/** Seconds of frames averaged before the scale may change, and the frame rates that move it down or back up. */
const QUALITY_WINDOW_S = 2
const SLOW_FPS = 40
const FAST_FPS = 57

/** The safe area (notches, rounded corners) in CSS pixels, read from the same CSS the HUD uses. */
const safeArea = (() => {
  let probe: HTMLDivElement | null = null
  return () => {
    if (probe === null) {
      probe = document.createElement("div")
      probe.className = "safe-inset pointer-events-none invisible"
      document.body.append(probe)
    }
    const r = probe.getBoundingClientRect()
    return { left: r.left, top: r.top }
  }
})()

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
  // The place list (T): open stops the game; `go` is the game's teleport once it runs.
  const [places, setPlaces] = useState(false)
  const placesRef = useRef(false)
  const goRef = useRef<((slug: string) => void) | null>(null)
  const releaseRef = useRef<(() => void) | null>(null)
  const spots = useMemo(() => spotList(world), [world])
  useEffect(() => {
    placesRef.current = places
    if (places) releaseRef.current?.()
  }, [places])
  const [muted, setMuted] = useState(readMuted)
  const mutedRef = useRef(muted)
  const audioRef = useRef<GameAudio | null>(null)

  useEffect(() => {
    mutedRef.current = muted
    audioRef.current?.setMuted(muted)
    writeMuted(muted)
  }, [muted])
  const [failure, setFailure] = useState("")
  // Stable, so the memoised touch controls skip the HUD's refreshes.
  const startAudio = useCallback(() => audioRef.current?.start(), [])
  const openPlaces = useCallback(() => setPlaces(true), [])
  const toggleMute = useCallback(() => setMuted((m) => !m), [])
  const toggleHelp = useCallback(() => setHelp((h) => !h), [])
  // Touch controls: on phones and tablets from the start, and anywhere the moment a finger touches the screen.
  const [touch, setTouch] = useState(isTouchDevice)
  const touchRef = useRef(touch)
  const [pad] = useState(newTouchPad)
  useEffect(() => {
    touchRef.current = touch
    if (touch) return
    const first = (e: PointerEvent) => e.pointerType === "touch" && setTouch(true)
    window.addEventListener("pointerdown", first)
    return () => window.removeEventListener("pointerdown", first)
  }, [touch])
  useEffect(() => {
    // iOS Safari pinches and double-tap zooms despite the viewport meta; the game wants every gesture.
    const stop = (e: Event) => e.preventDefault()
    document.addEventListener("gesturestart", stop)
    document.addEventListener("dblclick", stop)
    return () => {
      document.removeEventListener("gesturestart", stop)
      document.removeEventListener("dblclick", stop)
    }
  }, [])

  useEffect(() => {
    const canvas = glRef.current
    const overlay = overlayRef.current
    const gl = canvas === null ? null : openGl(canvas, !isTouchDevice())
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
    // `?at=edeka` (or lat,lon or map x,y): start there instead, for checking a place (teleport.ts).
    const teleport = (query: string): string => {
      const spot = findSpot(world, query)
      if (spot === null) return `?at=${query}: nothing matches. Try one of __gta.spots().`
      Object.assign(game.player, { x: spot.x, y: spot.y, car: null, ride: null })
      return `at ${spot.label} (${spot.x.toFixed(1)}, ${spot.y.toFixed(1)})`
    }
    const at = new URLSearchParams(location.search).get("at")
    if (at !== null) console.info(teleport(at))
    const renderer = new Renderer(gl, world, assets)
    window.__gta = { game, world, renderer, teleport, spots: () => spotNames(world) }
    const minimap = bakeMinimap(world.map, assets.overview)
    const camera = startCamera(game)
    const towers = towersOf(world)
    const compare = compareSpot(world)
    if (compare !== null) Object.assign(camera, { x: compare.x, y: compare.y, height: 100 })
    const audio = new GameAudio()
    audio.setMuted(mutedRef.current)
    audioRef.current = audio
    const keyboard = listenKeyboard(window, { onHelp: () => setHelp((h) => !h), onMute: () => setMuted((m) => !m), onPlaces: () => setPlaces((o) => !o), onAnyKey: () => audio.start() })
    releaseRef.current = keyboard.release
    goRef.current = (slug) => {
      console.info(teleport(slug))
      setPlaces(false)
    }

    let dpr = Math.min(MAX_DPR, devicePixelRatio)
    let quality = 0
    let safe = safeArea()
    const resize = () => {
      dpr = Math.min(MAX_DPR, devicePixelRatio)
      safe = safeArea()
      // The canvas's own box, not the window's: on phones the two differ while the browser bars slide.
      const w = canvas.clientWidth || window.innerWidth
      const h = canvas.clientHeight || window.innerHeight
      overlay.width = Math.round(w * dpr)
      overlay.height = Math.round(h * dpr)
      // The town in GTA 2's chunky pixels: half the CSS size, scaled up without smoothing (the canvas's CSS).
      const scale = (retro(compare !== null) ? RETRO_SCALE : dpr) * (compare === null ? QUALITY[quality] ?? 1 : 1)
      canvas.width = Math.max(1, Math.round(w * scale))
      canvas.height = Math.max(1, Math.round(h * scale))
    }
    resize()
    // Rotating a phone fires resize late or not at all in some browsers; the visual viewport and orientation always tell.
    const resizeSoon = () => requestAnimationFrame(resize)
    window.addEventListener("resize", resize)
    window.addEventListener("orientationchange", resizeSoon)
    window.visualViewport?.addEventListener("resize", resizeSoon)
    screen.orientation?.addEventListener("change", resizeSoon)

    // What the HUD shows besides the game state: announcements and when they end.
    let keys = 0
    let street = ""
    let district = ""
    let shown: HudState = emptyHud
    let bigUntil = 0
    let missionUntil = 0
    const popups: Array<Popup> = []
    let raf = 0
    let last = performance.now()
    let acc = 0
    let hudTimer = 0
    // Frames counted over QUALITY_WINDOW_S, and how many windows in a row ran fast (for stepping back up).
    let windowFrames = 0
    let windowStart = performance.now()
    let fastWindows = 0
    const frame = (now: number) => {
      const gap = (now - last) / 1000
      const elapsed = Math.min(0.1, gap)
      windowFrames += 1
      // A hidden tab or a stall (gap) or the place list says nothing about how fast the town draws.
      if (gap > 0.25 || placesRef.current) {
        windowFrames = 0
        windowStart = now
      } else if (now - windowStart >= QUALITY_WINDOW_S * 1000) {
        const fps = (windowFrames * 1000) / (now - windowStart)
        fastWindows = fps >= FAST_FPS ? fastWindows + 1 : 0
        if (fps < SLOW_FPS && quality < QUALITY.length - 1 && renderer.stats.chunks > 0) {
          quality += 1
          resize()
        } else if (fastWindows >= 3 && quality > 0) {
          quality -= 1
          fastWindows = 0
          resize()
        }
        windowFrames = 0
        windowStart = now
      }
      acc += elapsed
      last = now
      const aspect = canvas.width / canvas.height
      if (compare !== null) {
        // Fixed camera, nothing but the town, every chunk built before it says ready.
        const view: View = { camera, aspect, ortho: compare.half }
        if (renderer.frame(view, null, 1000)) document.body.dataset.ready = "1"
        raf = requestAnimationFrame(frame)
        return
      }
      if (placesRef.current) acc = 0
      while (acc >= DT) {
        step(world, game, mergeInput(keyboard.take(), pad.take()))
        acc -= DT
      }
      followCamera(camera, game, towers)
      const view: View = { camera, aspect, ortho: null }
      // The crowd and traffic live round what the camera shows (game.ts fillCrowd).
      game.view = groundReach(view)
      renderer.frame(view, game, BUILD_BUDGET_MS)
      const matrix = viewMatrix(view)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, overlay.width, overlay.height)
      drawPlayerMarker(ctx, matrix, game, dpr)
      drawPlaces(ctx, world.map, matrix, dpr)
      agePopups(popups, elapsed)
      const target = jobTarget(game.jobs, playerPos(game))
      if (target !== null) drawTargetArrow(ctx, matrix, target, game.time, dpr)
      const p = playerPos(game)
      const here = districtAt(world.map.districts, p.x, p.y)?.name ?? ""
      drawMinimap(ctx, minimap, world.map, game, target, here, game.player.car === null ? 0 : speedKmh(game), dpr, touchRef.current ? { corner: "top-left", ...safe } : undefined)
      const copDist = Math.min(Infinity, ...game.cops.map((c) => Math.hypot(c.car.x - p.x, c.car.y - p.y)))
      const level = wantedLevel(game.wanted)
      audio.effects(game.sounds.splice(0), p)
      audio.update({ speed: game.player.car === null ? (game.player.ride?.bus.speed ?? 0) : speedKmh(game) / 3.6, inCar: game.player.car !== null || game.player.ride !== null, horn: keyboard.horn() || pad.horn(), siren: level > 0 ? Math.max(0, 1 - copDist / 140) : 0 })

      for (const m of game.messages.splice(0)) {
        if (m.kind === "car") shown = { ...shown, vehicle: { name: m.text, key: ++keys } }
        else if (m.kind === "pickup") shown = { ...shown, pickup: { name: m.text, key: ++keys } }
        else if (m.kind === "cash") {
          shown = { ...shown, paid: { amount: m.amount, key: ++keys } }
          if (m.at !== null && m.amount > 0) addPopup(popups, m.amount, m.at)
        }
        else if (m.kind === "mission") {
          shown = { ...shown, mission: m.text }
          missionUntil = game.time + MISSION_S
        } else {
          if (m.kind === "saved" && !writeSave(m.data)) shown = { ...shown, mission: "Speichern ging nicht: der Browser lässt nichts ablegen." }
          shown = { ...shown, big: BIG_TEXT[m.kind] }
          bigUntil = game.time + BIG_S
        }
      }
      drawPopups(ctx, matrix, game, popups, dpr)
      if ((hudTimer += 1) % 6 === 0) {
        const name = world.roadAt(p.x, p.y, 15)?.road.name ?? ""
        // GTA 2 announces each street as you turn into it.
        if (name !== "" && name !== street) shown = { ...shown, street: { name, key: ++keys } }
        if (name !== "") street = name
        // And each part of town, in big letters, when you cross into it.
        if (here !== "" && here !== district) shown = { ...shown, district: { name: here, key: ++keys } }
        district = here
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
          nearCar: game.parked.some((c) => near(c.x, c.y)) || game.npcs.some((n) => n.bus === undefined && near(n.x, n.y)),
          big: game.time < bigUntil ? shown.big : "",
          mission: game.time < missionUntil ? shown.mission : "",
          timer: jobClock(game),
          respect: game.turf.map((t) => ({ id: t.gang, name: GANGS[t.gang].name, color: `rgb(${GANGS[t.gang].color.join(",")})`, value: game.respect[t.gang] })),
          nearBus: busNear(game) !== null,
          ride: rideInfo(game),
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
      window.removeEventListener("orientationchange", resizeSoon)
      window.visualViewport?.removeEventListener("resize", resizeSoon)
      screen.orientation?.removeEventListener("change", resizeSoon)
    }
  }, [world, assets, pad])

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
      <canvas ref={glRef} className={`block h-full w-full ${retro(false) ? "[image-rendering:pixelated]" : ""}`} />
      <canvas ref={overlayRef} className="pointer-events-none absolute inset-0 h-full w-full" />
      {touch && <TouchControls pad={pad} muted={muted} onTouch={startAudio} onPlaces={openPlaces} onMute={toggleMute} onHelp={toggleHelp} />}
      <Hud hud={hud} help={help} muted={muted} touch={touch} onMute={() => setMuted((m) => !m)} onPlaces={() => setPlaces(true)} onCycle={() => pad.cycle(1)} />
      {places && <Places list={spots} onGo={(slug) => goRef.current?.(slug)} onClose={() => setPlaces(false)} />}
      <div className={`absolute text-white/70 ${touch ? "bottom-[max(2px,env(safe-area-inset-bottom))] text-center text-[7px] leading-tight landscape:left-1/2 landscape:w-[34%] landscape:-translate-x-1/2 portrait:inset-x-2" : "right-2 bottom-1 text-[10px]"}`}>
        Karte ©{" "}
        <a className="underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
          OpenStreetMap
        </a>{" "}
        contributors · Dachfarben, Bäume, Minikarte aus dem Luftbild DOP40, Gebäudehöhen aus dem 3D-Gebäudemodell LoD2{" "}
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
