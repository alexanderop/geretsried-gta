import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { Schema } from "effect"
import { GameMap } from "#/map/types.ts"
import { makeWorld } from "#/world/world.ts"
import { newGame } from "./game.ts"
import { applySave, decodeSave, encodeSave, toSave } from "./save.ts"
import { stepShop, type Shop } from "./shops.ts"

const map = Schema.decodeUnknownSync(GameMap)(JSON.parse(readFileSync("public/geretsried.map.json", "utf8")))
const world = makeWorld(map)

describe("a save", () => {
  it("round-trips money, lives, guns, jobs done and respect through text", () => {
    const game = newGame(world, 3)
    game.score.money = 4321
    game.lives = 3
    game.player.arsenal.ammo.smg = 77
    game.jobs.done.push("brezn", "mercedes")
    game.respect.stein = 40
    const pkg = game.packages[2]
    if (pkg !== undefined) pkg.found = true
    const text = encodeSave(toSave(game))
    const fresh = newGame(world, 4)
    const data = decodeSave(text)
    expect(data).not.toBeNull()
    if (data === null) return
    applySave(fresh, data, { x: 10, y: 20 })
    expect(toSave(fresh)).toEqual(toSave(game))
    expect([fresh.player.x, fresh.player.y]).toEqual([10, 20])
  })

  it("reads nothing from a missing, broken or foreign save", () => {
    expect(decodeSave(null)).toBeNull()
    expect(decodeSave("{not json")).toBeNull()
    expect(decodeSave(JSON.stringify({ version: 2, money: 1 }))).toBeNull()
  })
})

const pad = (kind: Shop["kind"]): Shop => ({ kind, name: "Maria Hilf", x: 0, y: 0, armed: true })

describe("a save point or spray shop pad", () => {
  it("saves on foot only, once until you leave the pad, and says when you cannot pay", () => {
    const church = pad("save")
    expect(stepShop(church, { x: 0.5, y: 0 }, true, 9999)).toBeNull()
    expect(stepShop(church, { x: 0.5, y: 0 }, false, 9999)?.kind).toBe("save")
    expect(stepShop(church, { x: 0.5, y: 0 }, false, 9999)).toBeNull()
    stepShop(church, { x: 20, y: 0 }, false, 0)
    expect(stepShop(church, { x: 0, y: 0 }, false, 10)?.kind).toBe("broke")
  })

  it("resprays in a car only", () => {
    const shop = pad("spray")
    expect(stepShop(shop, { x: 1, y: 1 }, false, 9999)).toBeNull()
    expect(stepShop(shop, { x: 1, y: 1 }, true, 9999)?.kind).toBe("spray")
  })
})
