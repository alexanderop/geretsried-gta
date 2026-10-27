import { readFileSync } from "node:fs"
import { Schema } from "effect"
import { describe, expect, it } from "vitest"
import { GameMap } from "#/map/types.ts"
import { filterSpots, findSpot, slug, spotList, spotNames } from "./teleport.ts"
import { makeWorld } from "./world.ts"

describe("slug", () => {
  it("spells umlauts out and joins words with dashes", () => {
    expect(slug("Königsberger Weg")).toBe("koenigsberger-weg")
    expect(slug("EDEKA Heininger & Dietz")).toBe("edeka-heininger-dietz")
  })
})

describe("?at= on the real map", () => {
  const world = makeWorld(Schema.decodeUnknownSync(GameMap)(JSON.parse(readFileSync("public/geretsried.map.json", "utf8"))))

  it("finds a dressed place by name and stands in front of it, on free ground", () => {
    const spot = findSpot(world, "fahrzeugtechnik-seitz")
    expect(spot?.label).toBe("Fahrzeugtechnik Seitz")
    // Way 128503556's centroid is (4492.4, 4543.8); the spot is on Breslauer Weg's sidewalk south of it.
    expect(Math.hypot((spot?.x ?? 0) - 4492.4, (spot?.y ?? 0) - 4543.8)).toBeLessThan(30)
    expect(world.isSolid(spot?.x ?? 0, spot?.y ?? 0)).toBe(false)
  })

  it("finds a dressed area by name: Spielplatz Breslauer Weg, on the sidewalk in front of it", () => {
    const spot = findSpot(world, "spielplatz-breslauer-weg")
    expect(spot?.label).toBe("Spielplatz Breslauer Weg")
    // The playground's middle is (4303, 4561); its street front is about 24 m N of that.
    expect(Math.hypot((spot?.x ?? 0) - 4303, (spot?.y ?? 0) - 4561)).toBeLessThan(30)
  })

  it("takes a prefix and prefers a dressed place over a POI of the same name", () => {
    expect(findSpot(world, "hochhaus")?.label).toBe("Hochhaus Königsberger Weg")
    expect(findSpot(world, "EDEKA")?.label).toBe("EDEKA")
  })

  it("takes lat,lon and map x,y", () => {
    const ll = findSpot(world, "47.859149,11.490211")
    expect(Math.hypot((ll?.x ?? 0) - 4491.0, (ll?.y ?? 0) - 4542.4)).toBeLessThan(15)
    const xy = findSpot(world, "3997.4,4648")
    expect(Math.hypot((xy?.x ?? 0) - 3997.4, (xy?.y ?? 0) - 4648)).toBeLessThan(5)
  })

  it("returns null for an unknown name and lists the known ones", () => {
    expect(findSpot(world, "gibtsnicht-xyz")).toBeNull()
    expect(spotNames(world)).toContain("cafe-waldmann")
  })
})

describe("the place list (T)", () => {
  const world = makeWorld(Schema.decodeUnknownSync(GameMap)(JSON.parse(readFileSync("public/geretsried.map.json", "utf8"))))
  const list = spotList(world)

  it("lists every name once, the dressed places first", () => {
    expect(new Set(list.map((e) => e.slug)).size).toBe(list.length)
    const firstPoi = list.findIndex((e) => !e.built)
    expect(firstPoi).toBeGreaterThan(5)
    expect(list.slice(firstPoi).every((e) => !e.built)).toBe(true)
    expect(list.find((e) => e.slug === "fahrzeugtechnik-seitz")?.built).toBe(true)
  })

  it("filters by what is typed, umlauts spelled or not, prefix matches first", () => {
    expect(filterSpots(list, "")).toHaveLength(list.length)
    const hits = filterSpots(list, "Bäck")
    expect(hits.length).toBeGreaterThan(1)
    expect(hits[0]?.slug.startsWith("baeck")).toBe(true)
    expect(hits.every((e) => e.slug.includes("baeck"))).toBe(true)
    // Every row teleports somewhere.
    for (const e of hits) expect(findSpot(world, e.slug)).not.toBeNull()
  })
})
