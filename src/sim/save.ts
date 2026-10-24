/**
 * GTA 2's "Jesus Saves": what a save keeps (money, lives, guns, the jobs done,
 * the gangs' respect) and the round trip through text for localStorage.
 * Pure: the UI does the storing, inside try/catch.
 */
import { Schema } from "effect"
import type { Game } from "./state.ts"
import { GANG_IDS } from "./gangs.ts"

const Count = Schema.Finite

export const SaveData = Schema.Struct({
  version: Schema.Literal(1),
  money: Count,
  lives: Count,
  ammo: Schema.Struct({ pistol: Count, smg: Count, shotgun: Count, molotov: Count, rocket: Count, flamer: Count }),
  done: Schema.Array(Schema.String),
  respect: Schema.Struct({ gartenberg: Count, stein: Count, gelting: Count }),
})
export type SaveData = typeof SaveData.Type

export const SAVE_KEY = "geretsried-gta.save"

export const toSave = (game: Game): SaveData => ({
  version: 1,
  money: game.score.money,
  lives: game.lives,
  ammo: { ...game.player.arsenal.ammo },
  done: [...game.jobs.done],
  respect: { ...game.respect },
})

export const encodeSave = (data: SaveData): string => JSON.stringify(data)

/** The save in `text`, or null when it is missing, not JSON or not a save. */
export const decodeSave = (text: string | null): SaveData | null => {
  if (text === null) return null
  try {
    return Schema.decodeUnknownSync(SaveData)(JSON.parse(text))
  } catch {
    return null
  }
}

/** Carry on from a save: its money, lives, guns, jobs and respect, standing at the save point `at`. */
export const applySave = (game: Game, data: SaveData, at: { readonly x: number; readonly y: number } | null): void => {
  game.score.money = data.money
  game.lives = Math.max(1, data.lives)
  Object.assign(game.player.arsenal.ammo, data.ammo)
  game.jobs.done.splice(0, game.jobs.done.length, ...data.done)
  for (const g of GANG_IDS) game.respect[g] = data.respect[g]
  if (at !== null) Object.assign(game.player, { x: at.x, y: at.y })
}
