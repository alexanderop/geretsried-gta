import type { Building, Poi, PoiKind } from "#/map/types.ts"
import { polygonArea } from "#/map/build.ts"
import { distToSegmentSq, pointInPolygon } from "#/world/geometry.ts"

/** Wall textures: the four facadeFor picks, and the ones only a place dressing (world/places) asks for. */
export type Facade = "block" | "house" | "shop" | "industrial" | "ursula" | "render"

/** Places with a shop front; police, schools, doctors and town halls look like any other block. */
const SHOP_FRONTS: ReadonlySet<PoiKind> = new Set(["supermarket", "drugstore", "bakery", "pharmacy", "bank", "food", "post", "shop", "fuel"])

/** How far outside a footprint a shop's OSM node may sit and still belong to it. */
const SHOP_REACH_M = 3

const nearOutline = (x: number, y: number, pts: ReadonlyArray<number>, reach: number) => {
  for (let i = 0; i + 3 < pts.length; i += 2) {
    if (distToSegmentSq(x, y, pts[i] ?? 0, pts[i + 1] ?? 0, pts[i + 2] ?? 0, pts[i + 3] ?? 0) <= reach * reach) return true
  }
  return false
}

/**
 * Which wall texture a building gets: a shop front where a shop is inside or
 * at the wall, corrugated metal for big low halls, an apartment block from
 * three storeys, a Bavarian house otherwise. `pois` are the places near it.
 */
export const facadeFor = (b: Building, pois: ReadonlyArray<Poi>): Facade => {
  const shop = pois.some((p) => SHOP_FRONTS.has(p.kind) && (pointInPolygon(p.x, p.y, b.pts) || nearOutline(p.x, p.y, b.pts, SHOP_REACH_M)))
  if (shop) return "shop"
  if (polygonArea(b.pts) > 800 && b.levels <= 2) return "industrial"
  return b.levels >= 3 ? "block" : "house"
}
