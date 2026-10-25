import { describe, expect, it } from "vitest"
import { districtAt } from "./districts.ts"

describe("districtAt", () => {
  const districts = [
    { name: "Stein", x: 0, y: 0 },
    { name: "Gelting", x: 1000, y: 0 },
  ]

  it("picks the nearest place", () => {
    expect(districtAt(districts, 200, 50)?.name).toBe("Stein")
    expect(districtAt(districts, 800, -50)?.name).toBe("Gelting")
  })

  it("has none without places", () => {
    expect(districtAt([], 0, 0)).toBeNull()
  })
})
