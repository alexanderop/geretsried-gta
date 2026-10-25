import { describe, expect, it } from "vitest"
import type { Building, Poi } from "#/map/types.ts"
import { ST_URSULA, facadeFor } from "./facade.ts"

const box = (w: number, h: number, levels: number): Building => ({ id: 1, levels, pts: [0, 0, w, 0, w, h, 0, h, 0, 0] })
const poi = (kind: Poi["kind"], x: number, y: number): Poi => ({ name: "x", kind, x, y })

describe("facadeFor", () => {
  it("gives a shop front to a building with a shop inside or at its wall", () => {
    expect(facadeFor(box(20, 10, 4), [poi("drugstore", 5, 5)])).toBe("shop")
    expect(facadeFor(box(20, 10, 2), [poi("bakery", 22, 5)])).toBe("shop")
    expect(facadeFor(box(20, 10, 2), [poi("bakery", 26, 5)])).toBe("house")
  })

  it("does not count places without a shop window", () => {
    expect(facadeFor(box(20, 10, 2), [poi("police", 5, 5)])).toBe("house")
  })

  it("clads big low halls in metal, blocks from three storeys, houses otherwise", () => {
    expect(facadeFor(box(40, 30, 1), [])).toBe("industrial")
    expect(facadeFor(box(40, 30, 3), [])).toBe("block")
    expect(facadeFor(box(30, 12, 4), [])).toBe("block")
    expect(facadeFor(box(12, 10, 2), [])).toBe("house")
  })

  it("paints St. Ursula in its own bands", () => {
    expect(facadeFor({ ...box(40, 15, 4), id: ST_URSULA }, [])).toBe("ursula")
  })
})
