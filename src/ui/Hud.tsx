import { MAX_WANTED } from "#/sim/wanted.ts"
import type { WeaponId } from "#/sim/weapons.ts"

/** Everything the GTA 2 style HUD shows, refreshed a few times a second. */
export type HudState = {
  readonly money: number
  readonly lives: number
  /** Hp, shown as GTA 2's hearts, and armour as a blue shield beside them. */
  readonly health: number
  readonly armour: number
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
  /** The part of town you just crossed into, announced big like GTA 2's district names. */
  readonly district: { readonly name: string; readonly key: number }
  readonly vehicle: { readonly name: string; readonly key: number } | null
  /** BUSTED, WASTED, … */
  readonly big: string
  readonly mission: string
  /** Seconds left on the job, or null when no clock runs. */
  readonly timer: number | null
  /** GTA 2's respect meters: each gang's colour, name and respect (-100 … 100). */
  readonly respect: ReadonlyArray<{ readonly id: string; readonly name: string; readonly color: string; readonly value: number }>
  /** A payphone rings near you: GTA 2's ringing phone icon. */
  readonly ringing: boolean
  /** The weapon slot under the money, GTA 2 style: an icon and the rounds left (null: no ammo, like fists). */
  readonly weapon: { readonly id: WeaponId; readonly name: string; readonly ammo: number | null }
  /** What you just picked up, for the name flash. */
  readonly pickup: { readonly name: string; readonly key: number } | null
  /** Money just paid, for the "+$50" flash. */
  readonly paid: { readonly amount: number; readonly key: number } | null
}

export const emptyHud: HudState = {
  money: 0,
  lives: 5,
  health: 100,
  armour: 0,
  multiplier: 1,
  wanted: 0,
  chased: false,
  kmh: 0,
  inCar: false,
  nearCar: false,
  place: "",
  street: { name: "", key: 0 },
  district: { name: "", key: 0 },
  vehicle: null,
  big: "",
  mission: "",
  timer: null,
  ringing: false,
  respect: [],
  weapon: { id: "fists", name: "Fäuste", ammo: null },
  pickup: null,
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

const HELP =
  "WASD / Pfeile — laufen, fahren · Shift — sprinten · Strg (zu Fuß auch Leertaste) — schießen · Q / E — Waffe wechseln · Leertaste — Handbremse · F — ein-/aussteigen · G — Hupe · M — Ton an/aus · H — Hilfe"

const ICON: Readonly<Record<WeaponId, string>> = {
  fists: "fist",
  pistol: "pistol",
  smg: "smg",
  shotgun: "shotgun",
  molotov: "molotov",
  rocket: "rocket",
  flamer: "flamer",
}

/** Five hearts of 20 hp each: full, half or empty. */
const Hearts = ({ hp }: { readonly hp: number }) => (
  <span data-testid="health" className="flex gap-0.5" aria-label={`${Math.round(hp)} Gesundheit`}>
    {Array.from({ length: 5 }, (_, i) => {
      const fill = Math.max(0, Math.min(1, (hp - i * 20) / 20))
      return (
        <svg key={i} viewBox="0 0 20 18" className="h-6 w-6" aria-hidden="true">
          <defs>
            <clipPath id={`heart-${i}`}>
              <rect x="0" y="0" width={20 * (fill > 0.75 ? 1 : fill > 0.25 ? 0.5 : 0)} height="18" />
            </clipPath>
          </defs>
          <path d="M10 17 L2 9 A4.5 4.5 0 0 1 10 3 A4.5 4.5 0 0 1 18 9 Z" fill="#3a0a0a" stroke="#000" strokeWidth="1.5" />
          <path d="M10 17 L2 9 A4.5 4.5 0 0 1 10 3 A4.5 4.5 0 0 1 18 9 Z" fill="#ff2d2d" clipPath={`url(#heart-${i})`} />
        </svg>
      )
    })}
  </span>
)

const Shield = ({ armour }: { readonly armour: number }) => (
  <span data-testid="armour" className="flex items-center gap-1 text-xl text-[#7fd1ff]" aria-label={`${Math.round(armour)} Panzerung`}>
    <svg viewBox="0 0 20 22" className="h-6 w-6" aria-hidden="true">
      <path d="M10 1 L18 4 L18 11 Q18 18 10 21 Q2 18 2 11 L2 4 Z" fill="#1d6fe0" stroke="#000" strokeWidth="1.5" />
      <path d="M10 4 L15 6 L15 11 Q15 15.5 10 18 Z" fill="#7fd1ff" />
    </svg>
    {Math.round(armour)}
  </span>
)

/** One gang's meter, GTA 2 style: a head in their colour, then a bar that fills right of the middle as they like you, left as they hate you. */
const RespectMeter = ({ name, color, value }: { readonly name: string; readonly color: string; readonly value: number }) => {
  const k = Math.max(-1, Math.min(1, value / 100))
  return (
    <div className="flex items-center gap-2" aria-label={`${name}: ${Math.round(value)} Respekt`}>
      <svg viewBox="0 0 20 20" className="h-7 w-7" aria-hidden="true">
        <circle cx="10" cy="10" r="8" fill={color} stroke="#000" strokeWidth="1.5" />
        <circle cx="7" cy="9" r="1.4" fill="#000" />
        <circle cx="13" cy="9" r="1.4" fill="#000" />
        <path d={k >= 0 ? "M6 13 Q10 16 14 13" : "M6 15 Q10 12 14 15"} fill="none" stroke="#000" strokeWidth="1.5" />
      </svg>
      <div className="relative h-3.5 w-28 rounded-sm border-2 border-black bg-black/60">
        <div className="absolute top-0 left-1/2 h-full w-px bg-white/50" />
        <div
          className="absolute top-0 h-full"
          style={{ background: k >= 0 ? color : "#ff3b30", left: k >= 0 ? "50%" : `${50 + k * 50}%`, width: `${Math.abs(k) * 50}%` }}
        />
      </div>
    </div>
  )
}

export function Hud({ hud, help, muted, onMute }: { readonly hud: HudState; readonly help: boolean; readonly muted: boolean; readonly onMute: () => void }) {
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
          <span data-testid="lives" className="text-xl text-yellow-300" aria-label={`${hud.lives} Leben`}>
            {hud.lives}×
          </span>
          <Hearts hp={hud.health} />
        </div>
        {hud.armour > 0 && <Shield armour={hud.armour} />}
        <div data-testid="weapon" className="flex h-14 items-center gap-2 rounded bg-black/45 px-2 py-1" aria-label={hud.weapon.name}>
          <img src={`/sprites/icon-${ICON[hud.weapon.id]}.webp`} alt="" className="h-12 w-16 object-contain" />
          {hud.weapon.ammo !== null && (
            <span data-testid="ammo" className="min-w-[2ch] text-3xl text-white">
              {hud.weapon.ammo}
            </span>
          )}
        </div>
        {hud.pickup !== null && (
          <div key={hud.pickup.key} data-testid="pickup" className="hud-fade text-xl text-yellow-200">
            {hud.pickup.name}
          </div>
        )}
        {hud.paid !== null && (
          <div key={hud.paid.key} className={`hud-fade text-2xl ${hud.paid.amount >= 0 ? "text-green-300" : "text-red-300"}`}>
            {hud.paid.amount >= 0 ? `+$${hud.paid.amount}` : `-$${-hud.paid.amount}`}
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
      {hud.district.name !== "" && (
        <div key={hud.district.key} data-testid="district" className="hud-fade absolute top-[28%] left-1/2 -translate-x-1/2 text-6xl whitespace-nowrap text-white uppercase italic">
          {hud.district.name}
        </div>
      )}
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
        {hud.respect.length > 0 && (
          <div data-testid="respect" className="mb-1 flex flex-col gap-1">
            {hud.respect.map((g) => (
              <RespectMeter key={g.id} {...g} />
            ))}
          </div>
        )}
        {hud.inCar && (
          <div data-testid="speed" className="text-3xl">
            {hud.kmh} <span className="text-base">km/h</span>
          </div>
        )}
        {hud.place !== "" && <div data-testid="place" className="text-lg">{hud.place}</div>}
        {!hud.inCar && hud.nearCar && <div className="text-lg text-green-300">F — Auto nehmen</div>}
        {hud.ringing && (
          <div data-testid="ringing" className="hud-blink flex items-center gap-2 text-2xl text-yellow-300">
            <span aria-hidden="true">☎</span> Telefon klingelt!
          </div>
        )}
      </div>

      <div className="absolute bottom-4 left-4 flex items-end gap-2 font-mono text-xs font-normal [-webkit-text-stroke:0] [text-shadow:none]">
        {help ? <div className="rounded bg-black/70 px-3 py-2 leading-5">{HELP}</div> : <div className="rounded bg-black/40 px-2 py-1 text-white/80">H — Hilfe</div>}
        <button
          type="button"
          data-testid="mute"
          aria-pressed={muted}
          aria-label={muted ? "Ton an" : "Ton aus"}
          onClick={onMute}
          // Never takes focus: Space is fire and handbrake, and must not click it again.
          onMouseDown={(e) => e.preventDefault()}
          tabIndex={-1}
          className="pointer-events-auto rounded bg-black/40 px-2 py-1 text-white/80 hover:bg-black/60"
        >
          {muted ? "🔇" : "🔊"} M — Ton {muted ? "aus" : "an"}
        </button>
      </div>
    </div>
  )
}
