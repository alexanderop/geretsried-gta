/**
 * GTA 2's weapons as data, and the player's arsenal: rounds per weapon, the
 * one in hand, and the reload between shots. Pure, no game state.
 */

export type WeaponId = "fists" | "pistol" | "smg" | "shotgun" | "molotov" | "rocket" | "flamer"
export type Gun = Exclude<WeaponId, "fists">

export type WeaponSpec = {
  readonly name: string
  /** How a shot travels: a punch, bullets along a ray, a thrown bottle, a rocket, a cone of flame. */
  readonly kind: "melee" | "bullet" | "thrown" | "rocket" | "flame"
  /** Damage per bullet or punch; per tick for the flamer; at the centre for rockets. */
  readonly damage: number
  /** Seconds between shots. */
  readonly reload: number
  /** Meters. */
  readonly range: number
  /** Total cone (radians) the bullets scatter in. */
  readonly spread: number
  readonly pellets: number
  /** Rounds in one pickup, and the most you can carry. */
  readonly pickup: number
  readonly max: number
}

export const WEAPONS: Readonly<Record<WeaponId, WeaponSpec>> = {
  fists: { name: "Fäuste", kind: "melee", damage: 25, reload: 0.35, range: 1.5, spread: 0, pellets: 1, pickup: 0, max: 0 },
  pistol: { name: "Pistole", kind: "bullet", damage: 34, reload: 0.3, range: 40, spread: 0.03, pellets: 1, pickup: 45, max: 99 },
  smg: { name: "Maschinenpistole", kind: "bullet", damage: 18, reload: 0.085, range: 35, spread: 0.08, pellets: 1, pickup: 150, max: 999 },
  shotgun: { name: "Schrotflinte", kind: "bullet", damage: 17, reload: 0.8, range: 14, spread: 0.42, pellets: 7, pickup: 20, max: 99 },
  molotov: { name: "Molotow", kind: "thrown", damage: 0, reload: 0.7, range: 18, spread: 0, pellets: 1, pickup: 10, max: 30 },
  rocket: { name: "Raketenwerfer", kind: "rocket", damage: 160, reload: 1.1, range: 70, spread: 0, pellets: 1, pickup: 8, max: 30 },
  flamer: { name: "Flammenwerfer", kind: "flame", damage: 3, reload: 0.05, range: 7.5, spread: 0.6, pellets: 1, pickup: 200, max: 999 },
}

/** Cycle order, as GTA 2 lists them. */
export const WEAPON_ORDER: ReadonlyArray<WeaponId> = ["fists", "pistol", "smg", "shotgun", "molotov", "rocket", "flamer"]

export type Arsenal = {
  current: WeaponId
  readonly ammo: Record<Gun, number>
  /** Seconds until the weapon in hand fires again. */
  cooldown: number
}

export const newArsenal = (): Arsenal => ({ current: "fists", ammo: { pistol: 0, smg: 0, shotgun: 0, molotov: 0, rocket: 0, flamer: 0 }, cooldown: 0 })

export const owned = (a: Arsenal, w: WeaponId) => w === "fists" || a.ammo[w] > 0

/** Q / E: the next weapon you have rounds for, round the list; fists are always there. */
export const cycle = (a: Arsenal, dir: 1 | -1): void => {
  const n = WEAPON_ORDER.length
  const at = WEAPON_ORDER.indexOf(a.current)
  for (let k = 1; k <= n; k++) {
    const w = WEAPON_ORDER[(at + dir * k + n * 2) % n] ?? "fists"
    if (!owned(a, w)) continue
    a.current = w
    a.cooldown = Math.min(a.cooldown, 0.15)
    return
  }
}

/** A pickup's rounds, up to the weapon's maximum. Bare-handed, you take it up straight away. Returns false when full. */
export const give = (a: Arsenal, w: Gun): boolean => {
  const { pickup, max } = WEAPONS[w]
  if (a.ammo[w] >= max) return false
  a.ammo[w] = Math.min(max, a.ammo[w] + pickup)
  if (a.current === "fists") a.current = w
  return true
}

export const tickArsenal = (a: Arsenal, dt: number): void => {
  a.cooldown = Math.max(0, a.cooldown - dt)
}

/**
 * Pull the trigger: fires when reloaded, uses a round, and when the last one
 * is gone switches back down the list like GTA 2. Returns what fired, or null.
 */
export const pull = (a: Arsenal): WeaponId | null => {
  if (a.cooldown > 0) return null
  const w = a.current
  a.cooldown = WEAPONS[w].reload
  if (w !== "fists") {
    a.ammo[w] -= 1
    if (a.ammo[w] <= 0) {
      a.ammo[w] = 0
      cycle(a, -1)
    }
  }
  return w
}

/** Directions of one shot's bullets: a single bullet wobbles inside the cone, pellets fan across it evenly with a little jitter. */
export const bulletAngles = (aim: number, spec: Pick<WeaponSpec, "spread" | "pellets">, random: () => number): Array<number> => {
  if (spec.pellets <= 1) return [aim + (random() - 0.5) * spec.spread]
  const step = spec.spread / spec.pellets
  return Array.from({ length: spec.pellets }, (_, i) => aim - spec.spread / 2 + step * (i + 0.5) + (random() - 0.5) * step)
}
