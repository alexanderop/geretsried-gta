import { describe, expect, it } from "vitest"
import { pointInPolygon } from "#/world/geometry.ts"
import { band, bridgeHoles, clipHalfPlane, dashes, keepIntervals, openRing, polylineLength, signedArea, subPolyline, triangulate } from "./geometry.ts"

/** Total area of triangles given as index triples into a ring. */
const trianglesArea = (ring: ReadonlyArray<number>, tris: ReadonlyArray<number>) => {
  let sum = 0
  for (let t = 0; t + 2 < tris.length; t += 3) {
    const tri = [tris[t], tris[t + 1], tris[t + 2]].flatMap((i) => [ring[(i ?? 0) * 2] ?? 0, ring[(i ?? 0) * 2 + 1] ?? 0])
    sum += Math.abs(signedArea(tri))
  }
  return sum
}

describe("bridgeHoles", () => {
  it("roofs a block round a courtyard and leaves the courtyard open, whichever way the rings run", () => {
    const outline = [0, 0, 20, 0, 20, 20, 0, 20]
    for (const hole of [[6, 6, 14, 6, 14, 14, 6, 14], [6, 14, 14, 14, 14, 6, 6, 6]]) {
      const ring = bridgeHoles(outline, [hole])
      const tris = triangulate(ring, true)
      expect(trianglesArea(ring, tris)).toBeCloseTo(400 - 64)
      for (let t = 0; t + 2 < tris.length; t += 3) {
        const [cx, cy] = [0, 1].map((k) => [tris[t], tris[t + 1], tris[t + 2]].reduce<number>((s, i) => s + (ring[(i ?? 0) * 2 + k] ?? 0) / 3, 0))
        expect(pointInPolygon(cx ?? 0, cy ?? 0, hole)).toBe(false)
      }
    }
  })
})

describe("triangulate", () => {
  it("covers a convex footprint exactly, in either winding", () => {
    const square = [0, 0, 10, 0, 10, 10, 0, 10]
    expect(triangulate(square)).toHaveLength(6)
    expect(trianglesArea(square, triangulate(square))).toBeCloseTo(100)
    const reversed = [0, 10, 10, 10, 10, 0, 0, 0]
    expect(trianglesArea(reversed, triangulate(reversed))).toBeCloseTo(100)
  })

  it("keeps an L-shaped block's notch empty", () => {
    const l = [0, 0, 20, 0, 20, 8, 8, 8, 8, 20, 0, 20]
    const tris = triangulate(l)
    expect(tris).toHaveLength(12)
    expect(trianglesArea(l, tris)).toBeCloseTo(Math.abs(signedArea(l)))
    expect(Math.abs(signedArea(l))).toBeCloseTo(20 * 8 + 8 * 12)
  })

  it("drops OSM's repeated closing point first", () => {
    expect(openRing([0, 0, 1, 0, 1, 1, 0, 0])).toEqual([0, 0, 1, 0, 1, 1])
    expect(openRing([0, 0, 1, 0, 1, 1])).toEqual([0, 0, 1, 0, 1, 1])
  })
})

describe("clipHalfPlane", () => {
  it("splits a roof triangle along the ridge into two parts that add up", () => {
    const tri = [0, 0, 10, 0, 0, 10]
    const a = clipHalfPlane(tri, 0, 1, 4)
    const b = clipHalfPlane(tri, 0, -1, -4)
    expect(Math.abs(signedArea(a)) + Math.abs(signedArea(b))).toBeCloseTo(50)
    expect(Math.abs(signedArea(a))).toBeCloseTo(18)
  })

  it("keeps all or nothing of a triangle on one side", () => {
    expect(clipHalfPlane([0, 0, 1, 0, 0, 1], 1, 0, -5)).toHaveLength(6)
    expect(clipHalfPlane([0, 0, 1, 0, 0, 1], 1, 0, 5)).toHaveLength(0)
  })
})

describe("polylines", () => {
  const road = [0, 0, 10, 0, 10, 10]

  it("measures and cuts by arc length, across a bend", () => {
    expect(polylineLength(road)).toBe(20)
    expect(subPolyline(road, 5, 15)).toEqual([5, 0, 10, 0, 10, 5])
  })

  it("cuts junctions out of a road's markings", () => {
    expect(keepIntervals(100, [[-5, 6], [40, 50], [95, 105]])).toEqual([
      [6, 40],
      [50, 95],
    ])
  })

  it("dashes 3 m on, 6 m off, in phase from the road's start", () => {
    const line = [0, 0, 30, 0]
    expect(dashes(line, 0, 30, 3, 6).map((d) => d[0])).toEqual([0, 9, 18, 27])
    // A cut-out start does not shift the dashes after it.
    expect(dashes(line, 5, 30, 3, 6).map((d) => d[0])).toEqual([9, 18, 27])
  })

  it("offsets a band's edges by the same distance on straights and bends", () => {
    const { left, right } = band(road, 2)
    expect(left.slice(0, 2)).toEqual([0, 2])
    expect(right.slice(0, 2)).toEqual([0, -2])
    // On the 90° bend the miter reaches the corner of both offset lines.
    expect(left[2]).toBeCloseTo(8)
    expect(left[3]).toBeCloseTo(2)
    expect(right[2]).toBeCloseTo(12)
    expect(right[3]).toBeCloseTo(-2)
  })
})
