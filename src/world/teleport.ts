import { makeProjection } from "#/map/project.ts"
import { toWorld } from "./frame.ts"
import type { PoiKind } from "#/map/types.ts"
import type { World } from "./world.ts"

/** Where `?at=` puts the player, and what it matched. */
export type Spot = { readonly x: number; readonly y: number; readonly label: string }

/** "Fahrzeugtechnik Seitz" → "fahrzeugtechnik-seitz", "Königsberger Weg" → "koenigsberger-weg": what you type in a URL. */
export const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

/** Meters from the street's centre line to stand at: on the sidewalk in front of the place. */
const KERB_OUT = 1.5

/** The nearest spot to (x, y) you can stand on: rings every meter out to 60 m, 24 directions each. */
const free = (world: World, x: number, y: number): readonly [number, number] => {
  if (!world.isSolid(x, y) && !world.isWater(x, y)) return [x, y]
  for (let r = 1; r <= 60; r++)
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2
      const px = x + Math.cos(a) * r
      const py = y + Math.sin(a) * r
      if (!world.isSolid(px, py) && !world.isWater(px, py)) return [px, py]
    }
  return [x, y]
}

/** A named target: `built` when it is a dressed place or area (places/), `kind` the POI's kind when there is one. */
type Target = { readonly name: string; readonly x: number; readonly y: number; readonly built: boolean; readonly kind: PoiKind | null }

/** The named targets: every dressed place and area (in front of it, on its street's sidewalk), then every POI. */
const targets = (world: World): ReadonlyArray<Target> => {
  const kinds = new Map(world.map.pois.map((p) => [p.name, p.kind]))
  return [
    ...[...world.places.map((p) => ({ name: p.dressing.poi, frame: p.frame })), ...world.grounds.map((g) => ({ name: g.dressing.name, frame: g.frame }))].map(({ name, frame }) => {
      const half = (world.roadAt(frame.ox, frame.oy, 30)?.road.width ?? 0) / 2
      const [x, y] = toWorld(frame, 0, half + KERB_OUT)
      return { name, x, y, built: true, kind: kinds.get(name) ?? null }
    }),
    ...world.map.pois.map((p) => ({ name: p.name, x: p.x, y: p.y, built: false, kind: p.kind })),
  ]
}

/** One row of the in-game place list (T): a name you can teleport to by its `slug`. */
export type SpotEntry = { readonly name: string; readonly slug: string; readonly built: boolean; readonly kind: PoiKind | null }

/** Every target once per slug, the dressed places first (A to Z), then the POIs (A to Z). */
export const spotList = (world: World): ReadonlyArray<SpotEntry> => {
  const seen = new Map<string, SpotEntry>()
  for (const t of targets(world)) {
    const key = slug(t.name)
    if (key !== "" && !seen.has(key)) seen.set(key, { name: t.name, slug: key, built: t.built, kind: t.kind })
  }
  return [...seen.values()].toSorted((a, b) => Number(b.built) - Number(a.built) || a.slug.localeCompare(b.slug))
}

/** The rows matching what was typed: names starting with it first, then names containing it; all of them for nothing typed. */
export const filterSpots = (list: ReadonlyArray<SpotEntry>, query: string): ReadonlyArray<SpotEntry> => {
  const want = slug(query)
  if (want === "") return list
  return [...list.filter((e) => e.slug.startsWith(want)), ...list.filter((e) => !e.slug.startsWith(want) && e.slug.includes(want))]
}

/** Every name `?at=` knows, as slugs, for the console when nothing matches. */
export const spotNames = (world: World): ReadonlyArray<string> => [...new Set(targets(world).map((t) => slug(t.name)))].toSorted()

/**
 * `?at=` → where to put the player. Three forms:
 * - `lat,lon` (47.859149,11.490211), as `?compare=` and Google Maps give it;
 * - `x,y` in map meters (4491,4542), as the backlog writes them;
 * - a name: a place or POI, by slug ("edeka", "fahrzeugtechnik-seitz"); an exact slug wins, else the first that
 *   starts with it, else the first that contains it. Places (and dressed areas) come before POIs, so a dressed building wins.
 * The spot is moved out of walls and water to the nearest free ground. Null when nothing matches.
 */
export const findSpot = (world: World, query: string): Spot | null => {
  const nums = query.split(",").map((s) => Number(s.trim()))
  const [a, b] = nums
  if (nums.length === 2 && a !== undefined && b !== undefined && Number.isFinite(a) && Number.isFinite(b)) {
    const isLatLon = Math.abs(a) <= 90 && Math.abs(b) <= 180
    const [x, y] = isLatLon ? makeProjection(world.map.bbox).toMeters({ lat: a, lon: b }) : [a, b]
    const [fx, fy] = free(world, x, y)
    return { x: fx, y: fy, label: query }
  }
  const want = slug(query)
  if (want === "") return null
  const all = targets(world)
  const hit = all.find((t) => slug(t.name) === want) ?? all.find((t) => slug(t.name).startsWith(want)) ?? all.find((t) => slug(t.name).includes(want))
  if (hit === undefined) return null
  const [x, y] = free(world, hit.x, hit.y)
  return { x, y, label: hit.name }
}
