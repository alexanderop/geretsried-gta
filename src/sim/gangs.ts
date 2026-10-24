/**
 * Three gangs with their turf in Geretsried's parts of town, GTA 2 style:
 * each has a respect meter for you from -100 to 100. Their jobs raise it and
 * cost you with their rival; killing their people costs you with them. Low
 * respect and they come at you on their turf. Pure numbers and geometry.
 */
import type { District } from "#/map/types.ts"

export const GANG_IDS = ["gartenberg", "stein", "gelting"] as const
export type GangId = (typeof GANG_IDS)[number]

export type GangInfo = {
  readonly name: string
  /** The OSM place their turf is around. */
  readonly district: string
  /** Their jackets, and their meter in the HUD. */
  readonly color: readonly [number, number, number]
  /** Who they are at war with: their jobs cost you respect there. */
  readonly rival: GangId
}

export const GANGS: Readonly<Record<GangId, GangInfo>> = {
  gartenberg: { name: "Gartenberger Krachlederne", district: "Gartenberg", color: [70, 190, 80], rival: "stein" },
  stein: { name: "Steiner Steinböcke", district: "Stein", color: [80, 140, 255], rival: "gelting" },
  gelting: { name: "Geltinger Bauernmafia", district: "Gelting", color: [255, 150, 30], rival: "gartenberg" },
}

export type Respect = Record<GangId, number>

export const MAX_RESPECT = 100
/** A job for a gang, and what it costs you with its rival. */
export const JOB_RESPECT = { for: 25, against: 15 } as const
/** Killing one of theirs. */
export const KILL_RESPECT = 4
/** At or below this they attack you on their turf; at or above FRIENDLY they leave you be even if you hit them. */
export const HOSTILE = -25
export const FRIENDLY = 40

export const newRespect = (): Respect => ({ gartenberg: 0, stein: 0, gelting: 0 })

const clamp = (v: number) => Math.max(-MAX_RESPECT, Math.min(MAX_RESPECT, v))

export const gangJobDone = (r: Respect, gang: GangId, rival: GangId): void => {
  r[gang] = clamp(r[gang] + JOB_RESPECT.for)
  r[rival] = clamp(r[rival] - JOB_RESPECT.against)
}

/** One of theirs killed by you: they like you less, their rival a little more. */
export const memberKilled = (r: Respect, gang: GangId): void => {
  r[gang] = clamp(r[gang] - KILL_RESPECT)
  const rival = GANGS[gang].rival
  r[rival] = clamp(r[rival] + KILL_RESPECT / 2)
}

export const isHostile = (r: Respect, gang: GangId): boolean => r[gang] <= HOSTILE

export type Turf = { readonly gang: GangId; readonly x: number; readonly y: number }

/** Each gang's turf centre: its OSM place. Gangs whose place the map lacks have no turf. */
export const turfs = (districts: ReadonlyArray<District>): Array<Turf> =>
  GANG_IDS.flatMap((gang) => {
    const d = districts.find((o) => o.name === GANGS[gang].district)
    return d === undefined ? [] : [{ gang, x: d.x, y: d.y }]
  })

/** Whose turf (x, y) is: the nearest gang's place, so the town splits between them. */
export const turfAt = (turf: ReadonlyArray<Turf>, x: number, y: number): GangId | null => {
  let best: Turf | null = null
  for (const t of turf) if (best === null || Math.hypot(t.x - x, t.y - y) < Math.hypot(best.x - x, best.y - y)) best = t
  return best?.gang ?? null
}
