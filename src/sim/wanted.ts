/**
 * Wanted level, GTA 2 style: offences add heat, every whole point of heat is
 * one cop head (up to four), and heat only cools while no police car sees you.
 */

export const MAX_WANTED = 4

/** Heat each offence adds. */
export const OFFENCE = {
  /** Ramming another car. */
  crash: 0.35,
  /** Knocking someone down. */
  pedestrian: 0.6,
  /** Driving into a junction on red. */
  redLight: 0.5,
  /** Taking a car while a police car is watching. */
  theft: 1.2,
  /** Killing someone, whoever sees it. */
  kill: 0.5,
  /** Killing a police officer: a whole cop head at once. */
  copKill: 1,
  /** Shooting or burning while the police watch. */
  gunfire: 0.3,
} as const
export type Offence = keyof typeof OFFENCE

export type Wanted = {
  heat: number
  /** Seconds since a police car last had you in sight. */
  unseen: number
}

export const noHeat = (): Wanted => ({ heat: 0, unseen: 0 })

export const wantedLevel = (w: Wanted): number => Math.min(MAX_WANTED, Math.floor(w.heat))

export const commit = (w: Wanted, offence: Offence): void => {
  w.heat = Math.min(MAX_WANTED + 0.99, w.heat + OFFENCE[offence])
}

/** Seconds out of sight before heat starts to cool, and how fast it then cools (heat per second). */
const HIDE_S = 8
const COOL = 0.12

export const coolDown = (w: Wanted, seen: boolean, dt: number): void => {
  w.unseen = seen ? 0 : w.unseen + dt
  if (w.unseen > HIDE_S) w.heat = Math.max(0, w.heat - COOL * dt)
}

/**
 * What the police do at a wanted level, as in GTA 2: from two heads they get
 * out and come after you on foot with pistols; from three they also shoot
 * from their cars when close.
 */
export const tactics = (level: number) => ({ onFoot: level >= 2, shootFromCar: level >= 3 })
