/**
 * One damage model for everything that can be hurt: the player, pedestrians
 * and cars. Hits name their source, so weapons can join later as more
 * sources without a second health system.
 */

export type DamageSource = "wall" | "car" | "police"

export type Vitals = {
  hp: number
  /** Soaks up damage before hp does. */
  armour: number
  /** What hit last: decides WRECKED (and later WASTED) messages. */
  lastHit: DamageSource | null
}

export const CAR_HP = 100
export const PERSON_HP = 100

export const vitals = (hp: number, armour = 0): Vitals => ({ hp, armour, lastHit: null })

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
