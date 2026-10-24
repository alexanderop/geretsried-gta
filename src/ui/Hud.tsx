import { MAX_WANTED } from "#/sim/wanted.ts"

/** Everything the GTA 2 style HUD shows, refreshed a few times a second. */
export type HudState = {
  readonly money: number
  readonly lives: number
  readonly multiplier: number
  readonly wanted: number
  /** Police in sight: the cop heads flash. */
  readonly chased: boolean
  readonly kmh: number
  readonly inCar: boolean
  readonly nearCar: boolean
  readonly place: string
  /** The street you just entered, with a key that changes on every entry so the fade restarts. */
  readonly street: { readonly name: string; readonly key: number }
  readonly vehicle: { readonly name: string; readonly key: number } | null
  /** BUSTED, WRECKED, … */
  readonly big: string
  readonly mission: string
  /** Seconds left on the job, or null when no clock runs. */
  readonly timer: number | null
  /** The weapon slot under the money, GTA 2 style: an icon and the rounds left (null: no ammo, like fists). */
  readonly weapon: { readonly icon: string; readonly name: string; readonly ammo: number | null }
  /** Money just paid, for the "+$50" flash. */
  readonly paid: { readonly amount: number; readonly key: number } | null
}

export const emptyHud: HudState = {
  money: 0,
  lives: 5,
  multiplier: 1,
  wanted: 0,
  chased: false,
  kmh: 0,
  inCar: false,
  nearCar: false,
  place: "",
  street: { name: "", key: 0 },
  vehicle: null,
  big: "",
  mission: "",
  timer: null,
  weapon: { icon: "👊", name: "Fäuste", ammo: null },
  paid: null,
}

/** A cop's head from above: face, cap with a badge. */
const CopHead = ({ on }: { readonly on: boolean }) => (
  <svg viewBox="0 0 20 20" className={`h-9 w-9 ${on ? "" : "opacity-25 grayscale"}`} aria-hidden="true">
    <circle cx="10" cy="11" r="7" fill="#f2c9a0" stroke="#000" strokeWidth="1.5" />
    <path d="M3 9 Q10 0 17 9 L17 10 L3 10 Z" fill="#1f4e9c" stroke="#000" strokeWidth="1.5" />
    <rect x="8.5" y="5" width="3" height="2.5" fill="#ffd60a" />
  </svg>
)

const HELP = "WASD / Pfeile — laufen, fahren · Shift — sprinten · Leertaste — Handbremse · F — ein-/aussteigen · Strg — Angriff · G — Hupe · H — Hilfe"

export function Hud({ hud, help }: { readonly hud: HudState; readonly help: boolean }) {
  const clock = hud.timer === null ? "" : `${Math.floor(hud.timer / 60)}:${String(Math.max(0, Math.floor(hud.timer % 60))).padStart(2, "0")}`
  return (
    <div className="hud-font pointer-events-none absolute inset-0 text-white select-none">
      <div className="absolute top-3 right-4 flex flex-col items-end gap-1">
        <div data-testid="money" className="text-5xl text-[#9fe3ff] italic">
          ${hud.money.toLocaleString("de-DE")}
        </div>
        <div className="flex items-center gap-2">
          {hud.multiplier > 1 && (
            <span data-testid="multiplier" className="text-2xl text-red-400 italic">
              x{hud.multiplier}
            </span>
          )}
          <span data-testid="lives" className="text-2xl tracking-tighter text-red-500" aria-label={`${hud.lives} Leben`}>
            {"♥".repeat(hud.lives)}
          </span>
        </div>
        <div data-testid="weapon" className="flex items-center gap-2 rounded bg-black/45 px-2 py-1" aria-label={hud.weapon.name}>
          <span className="text-3xl [-webkit-text-stroke:0]">{hud.weapon.icon}</span>
          {hud.weapon.ammo !== null && <span className="text-2xl text-white">{hud.weapon.ammo}</span>}
        </div>
        {hud.paid !== null && (
          <div key={hud.paid.key} className="hud-fade text-2xl text-green-300">
            +${hud.paid.amount}
          </div>
        )}
      </div>

      {/* Cop heads, the job clock and the street name stack at the top centre, clear of the car in the middle. */}
      <div className="absolute top-3 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1">
        <div data-testid="wanted" className={`flex gap-1 ${hud.chased && hud.wanted > 0 ? "hud-blink" : ""}`}>
          {Array.from({ length: MAX_WANTED }, (_, i) => (
            <CopHead key={i} on={i < hud.wanted} />
          ))}
        </div>
        {clock !== "" && (
          <div data-testid="timer" className="text-4xl text-yellow-300">
            {clock}
          </div>
        )}
        {hud.street.name !== "" && (
          <div key={hud.street.key} data-testid="street" className="hud-fade rounded bg-black/55 px-4 py-1 text-2xl whitespace-nowrap text-yellow-300">
            {hud.street.name}
          </div>
        )}
      </div>
      {hud.vehicle !== null && (
        <div key={hud.vehicle.key} data-testid="vehicle" className="hud-fade absolute bottom-[22%] left-1/2 -translate-x-1/2 text-3xl text-white">
          {hud.vehicle.name}
        </div>
      )}
      {hud.big !== "" && (
        <div data-testid="big" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl text-red-500 italic">
          {hud.big}
        </div>
      )}
      {hud.mission !== "" && (
        <div data-testid="mission" className="absolute bottom-16 left-1/2 max-w-[70%] -translate-x-1/2 rounded bg-black/60 px-4 py-2 text-center text-xl text-yellow-200">
          {hud.mission}
        </div>
      )}

      <div className="absolute top-3 left-4 flex flex-col gap-1">
        {hud.inCar && (
          <div data-testid="speed" className="text-3xl">
            {hud.kmh} <span className="text-base">km/h</span>
          </div>
        )}
        {hud.place !== "" && <div data-testid="place" className="text-lg">{hud.place}</div>}
        {!hud.inCar && hud.nearCar && <div className="text-lg text-green-300">F — Auto nehmen</div>}
      </div>

      <div className="absolute bottom-4 left-4 font-mono text-xs font-normal [-webkit-text-stroke:0] [text-shadow:none]">
        {help ? <div className="rounded bg-black/70 px-3 py-2 leading-5">{HELP}</div> : <div className="rounded bg-black/40 px-2 py-1 text-white/80">H — Hilfe</div>}
      </div>
    </div>
  )
}
