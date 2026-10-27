import { memo, useEffect, useRef, useState, type ReactNode } from "react"
import type { TouchHold, TouchPad } from "./touch.ts"

/** The stick's travel in CSS pixels, and where its base rests until a thumb lands. */
const RADIUS = 56
const REST = 28 + RADIUS

/**
 * A floating thumb stick: it centres wherever the thumb lands in the left part of the screen and pushes
 * the knob up to RADIUS out. Written straight to the DOM, no React render per move.
 */
function Stick({ pad, onTouch }: { readonly pad: TouchPad; readonly onTouch: () => void }) {
  const zone = useRef<HTMLDivElement>(null)
  const base = useRef<HTMLDivElement>(null)
  const knob = useRef<HTMLDivElement>(null)
  const active = useRef<{ id: number; x: number; y: number } | null>(null)

  const place = (bx: number, by: number, kx: number, ky: number) => {
    base.current?.style.setProperty("transform", `translate(${bx - RADIUS}px, ${by - RADIUS}px)`)
    knob.current?.style.setProperty("transform", `translate(${bx + kx - 26}px, ${by + ky - 26}px)`)
  }
  const rest = () => {
    const h = zone.current?.clientHeight ?? 0
    place(REST, h - REST, 0, 0)
    base.current?.style.setProperty("opacity", "0.45")
    pad.stick(0, 0)
  }
  // Back to the corner when the screen turns: the zone's height changed under the resting base.
  useEffect(() => {
    const reset = () => requestAnimationFrame(() => active.current === null && rest())
    reset()
    window.addEventListener("resize", reset)
    return () => window.removeEventListener("resize", reset)
  })
  const local = (e: React.PointerEvent) => {
    const r = zone.current?.getBoundingClientRect()
    return { x: e.clientX - (r?.left ?? 0), y: e.clientY - (r?.top ?? 0) }
  }

  return (
    <div
      ref={zone}
      data-testid="touch-stick"
      className="pointer-events-auto absolute bottom-0 left-0 h-[70%] w-[45%] touch-none"
      onPointerDown={(e) => {
        onTouch()
        if (active.current !== null) return
        e.currentTarget.setPointerCapture(e.pointerId)
        const p = local(e)
        // Keep the whole base on screen when the thumb lands near an edge.
        const h = zone.current?.clientHeight ?? 0
        const x = Math.max(RADIUS, p.x)
        const y = Math.min(h - RADIUS, Math.max(RADIUS, p.y))
        active.current = { id: e.pointerId, x, y }
        base.current?.style.setProperty("opacity", "0.8")
        place(x, y, p.x - x, p.y - y)
      }}
      onPointerMove={(e) => {
        const a = active.current
        if (a === null || a.id !== e.pointerId) return
        const p = local(e)
        const dx = p.x - a.x
        const dy = p.y - a.y
        const k = Math.min(1, RADIUS / Math.max(1, Math.hypot(dx, dy)))
        place(a.x, a.y, dx * k, dy * k)
        pad.stick((dx * k) / RADIUS, (dy * k) / RADIUS)
      }}
      onPointerUp={(e) => {
        onTouch()
        if (active.current?.id !== e.pointerId) return
        active.current = null
        rest()
      }}
      onPointerCancel={(e) => {
        if (active.current?.id !== e.pointerId) return
        active.current = null
        rest()
      }}
    >
      <div ref={base} className="absolute top-0 left-0 rounded-full border-4 border-black/70 bg-white/10" style={{ width: RADIUS * 2, height: RADIUS * 2 }} />
      <div ref={knob} className="absolute top-0 left-0 h-[52px] w-[52px] rounded-full border-4 border-black bg-yellow-300/80" />
    </div>
  )
}

/** A round button held down for as long as the finger stays on it (fire, handbrake, horn) or tapped once (in/out). */
function PadButton({ label, size, className, onDown, onUp, onTouch, testId }: { readonly label: ReactNode; readonly size: number; readonly className: string; readonly onDown: () => void; readonly onUp?: () => void; readonly onTouch: () => void; readonly testId: string }) {
  const [held, setHeld] = useState(false)
  const release = () => {
    setHeld(false)
    onUp?.()
  }
  return (
    <button
      type="button"
      tabIndex={-1}
      data-testid={testId}
      className={`hud-font pointer-events-auto absolute grid touch-none place-items-center rounded-full border-4 border-black text-white italic select-none ${held ? "scale-95 brightness-150" : ""} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.2 }}
      onPointerDown={(e) => {
        onTouch()
        e.currentTarget.setPointerCapture(e.pointerId)
        setHeld(true)
        onDown()
      }}
      onPointerUp={() => {
        onTouch()
        release()
      }}
      onPointerCancel={release}
      onLostPointerCapture={() => setHeld(false)}
    >
      {label}
    </button>
  )
}

/** A small square button for things outside the game step (places, sound, fullscreen, help). */
const Small = ({ children, onClick, label, testId }: { readonly children: ReactNode; readonly onClick: () => void; readonly label: string; readonly testId: string }) => (
  <button type="button" tabIndex={-1} aria-label={label} data-testid={testId} onClick={onClick} className="pointer-events-auto grid h-10 min-w-10 touch-none place-items-center rounded border-2 border-black bg-black/55 px-2 font-mono text-sm text-white/90 active:bg-black/80">
    {children}
  </button>
)

const canFullscreen = () => typeof document.documentElement.requestFullscreen === "function"

const toggleFullscreen = () => {
  if (document.fullscreenElement !== null) {
    void document.exitFullscreen()
    return
  }
  void document.documentElement
    .requestFullscreen({ navigationUI: "hide" })
    // Phones play best sideways; browsers that cannot lock just keep the orientation you hold.
    .then(() => (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.("landscape"))
    .catch(() => undefined)
}

/**
 * On-screen controls for phones and tablets: a thumb stick on the left (walk, or gas, brake and steer),
 * fire, handbrake, horn and in/out on the right, and the place list, sound, fullscreen and help as small buttons.
 */
export const TouchControls = memo(function TouchControls({ pad, muted, onTouch, onPlaces, onMute, onHelp }: { readonly pad: TouchPad; readonly muted: boolean; readonly onTouch: () => void; readonly onPlaces: () => void; readonly onMute: () => void; readonly onHelp: () => void }) {
  const hold = (key: TouchHold) => ({ onDown: () => pad.hold(key, true), onUp: () => pad.hold(key, false), onTouch })
  return (
    <div data-testid="touch-controls" className="safe-inset pointer-events-none touch-none" onContextMenu={(e) => e.preventDefault()}>
      <Stick pad={pad} onTouch={onTouch} />
      {/* Right thumb: fire in the corner, the rest round it. */}
      <div className="absolute right-3 bottom-6 h-[176px] portrait:bottom-12 w-[176px]">
        <PadButton testId="touch-fire" label="FEUER" size={84} className="right-0 bottom-0 bg-[#d3202a]/80" {...hold("attack")} />
        <PadButton testId="touch-use" label="F" size={62} className="right-[96px] bottom-0 bg-[#1d6fe0]/75 !text-2xl" onDown={pad.use} onTouch={onTouch} />
        <PadButton testId="touch-handbrake" label="BREMSE" size={62} className="right-0 bottom-[96px] bg-black/60" {...hold("handbrake")} />
        <PadButton testId="touch-horn" label="HUPE" size={46} className="right-[92px] bottom-[86px] bg-black/50" {...hold("horn")} />
      </div>
      <div className="absolute flex gap-2 landscape:top-2 landscape:right-[170px] portrait:top-1/3 portrait:right-2 portrait:flex-col">
        <Small testId="touch-places" label="Orte" onClick={onPlaces}>
          📍
        </Small>
        <Small testId="touch-mute" label={muted ? "Ton an" : "Ton aus"} onClick={onMute}>
          {muted ? "🔇" : "🔊"}
        </Small>
        {canFullscreen() && (
          <Small testId="touch-fullscreen" label="Vollbild" onClick={toggleFullscreen}>
            ⛶
          </Small>
        )}
        <Small testId="touch-help" label="Hilfe" onClick={onHelp}>
          ?
        </Small>
      </div>
      <div className="hud-font hud-fade pointer-events-none absolute top-[40%] left-1/2 hidden -translate-x-1/2 text-center text-lg whitespace-nowrap text-yellow-300 portrait:block">
        ↻ Quer spielt sich's besser
      </div>
    </div>
  )
})
