/**
 * One damage model for everything that can be hurt: the player, pedestrians,
 * police and cars. Hits name their source, so walls, cars and every weapon
 * share one health system.
 */

export type DamageSource = "wall" | "car" | "police" | "fist" | "bullet" | "fire" | "explosion"

export type Vitals = {
  hp: number
  /** Soaks up damage before hp does. */
  armour: number
  /** What hit last: decides WASTED messages and who gets the blame. */
  lastHit: DamageSource | null
  /** People: seconds left on fire. Cars: seconds left on the fuse once burnt out. */
  fire: number
}

export const CAR_HP = 100
export const PERSON_HP = 100
export const MAX_ARMOUR = 100

export const vitals = (hp: number, armour = 0): Vitals => ({ hp, armour, lastHit: null, fire: 0 })

/** Take `amount` damage, armour first; returns the hp lost. */
export const hurt = (v: Vitals, amount: number, source: DamageSource): number => {
  if (amount <= 0) return 0
  const soaked = Math.min(v.armour, amount)
  v.armour -= soaked
  const lost = Math.min(v.hp, amount - soaked)
  v.hp -= lost
  v.lastHit = source
  return lost
}

export const isDead = (v: Vitals) => v.hp <= 0

/** A car catches fire below this many hp, as in GTA 2, and burns down on its own. */
export const FIRE_HP = 25
/** Hp a burning car loses per second: from FIRE_HP to the bang in about four seconds. */
export const BURN_HP_S = 6
/** Seconds from a car's last hp to its explosion: short, so a row of cars goes up one after another. */
export const FUSE_S = 0.4

export const isBurning = (v: Vitals) => v.hp < FIRE_HP

/** One step of a car's fire; true on the step it explodes. */
export const burnCar = (v: Vitals, dt: number): boolean => {
  if (v.hp >= FIRE_HP) return false
  if (v.hp > 0) {
    v.hp = Math.max(0, v.hp - BURN_HP_S * dt)
    if (v.hp === 0) v.fire = FUSE_S
    return false
  }
  // Knocked straight to 0 by a hit: the fuse starts now.
  if (v.fire <= 0) v.fire = FUSE_S
  v.fire -= dt
  return v.fire <= 0
}

/** Seconds a person burns once set alight, and hp per second while they do: enough to finish anyone without armour. */
export const IGNITE_S = 4
const PERSON_BURN_HP_S = 28

export const ignite = (v: Vitals) => {
  v.fire = Math.max(v.fire, IGNITE_S)
}

/** One step of a burning person. */
export const burnPerson = (v: Vitals, dt: number): void => {
  if (v.fire <= 0) return
  v.fire = Math.max(0, v.fire - dt)
  hurt(v, PERSON_BURN_HP_S * dt, "fire")
}
