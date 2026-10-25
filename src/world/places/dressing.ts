/**
 * Place dressing: what makes one real building recognisable from the play
 * camera, declared as data (one file per place, listed in index.ts) instead
 * of another hard-wired one-off. Exterior only: no interiors, no roof fade.
 *
 * An entry names its place by the exact POI name and the street it faces;
 * the OSM footprint (`osmBuildingId`) stays the building and the solid, and
 * gets the overrides (storeys, facade, wall colours, roof). The parts are
 * drawn on top and are never solid: towers stay inside the footprint
 * (places.test.ts checks), signs and arcades on its walls.
 *
 * Coordinates (world/frame.ts): free-standing parts (tower, sprite) are in
 * the street frame, u along the street, n from its centre line towards the
 * place (the POI, or the footprint's middle when no POI marks it). Wall
 * parts (wallSign, arcade) sit on one wall of the footprint, `edge` i
 * running from point i to i + 1 of its `pts`: u in meters from the wall's
 * left end as you face it from outside, z up from the ground.
 */
import type { GameMap } from "#/map/types.ts"
import type { Facade } from "#/render/scene/facade.ts"
import type { MaterialName, PropName, Rgba } from "#/render/scene/mesh.ts"
import { streetFrame, type Frame, type Rect } from "../frame.ts"

/**
 * A horizontal band of the walls, z0..z1 meters above the ground, in its own
 * colour: the facade texture times the colour, or `plain` just the colour
 * (a timber fascia). Later bands win where they overlap.
 */
export type WallBand = { readonly z0: number; readonly z1: number; readonly colour: Rgba; readonly plain?: boolean }

/** Lettering on one face of a tower: side 0 faces the street (n0), 1 the u1 end, 2 away (n1), 3 the u0 end. */
export type TowerFace = { readonly texture: MaterialName; readonly side: 0 | 1 | 2 | 3; readonly u0: number; readonly u1: number; readonly z0: number; readonly z1: number }

export type Part =
  /**
   * A sign on wall `edge`, u0..u1 by z0..z1, `out` meters proud of it (0.04;
   * more to hang it on an arcade's band). The texture (a material, square,
   * the sign stretched to fill it) covers the rectangle; where it is
   * transparent the wall shows, so it can be loose letters or a board.
   */
  | { readonly kind: "wallSign"; readonly texture: MaterialName; readonly edge: number; readonly u0: number; readonly u1: number; readonly z0: number; readonly z1: number; readonly out?: number }
  /**
   * A ground-floor arcade on wall `edge` from u0 to u1: `arches` round arches
   * up to `h`, on square pillars standing `depth` proud of the wall, a band
   * over them, dark glazing in the openings. Relief on the wall: the
   * footprint behind it stays solid.
   */
  | { readonly kind: "arcade"; readonly edge: number; readonly u0: number; readonly u1: number; readonly arches: number; readonly h: number; readonly depth: number; readonly pillar: Rgba; readonly glazing: Rgba }
  /**
   * A square tower on `rect` (street frame, inside the footprint): walls up
   * to `h`, a pyramid roof `roofH` high, corner quoins in `trim`, a post with
   * a cross bar on top in `finial`, lettering or a clock on its faces.
   */
  | {
      readonly kind: "tower"
      readonly rect: Rect
      readonly h: number
      readonly roofH: number
      readonly colours: { readonly wall: Rgba; readonly roof: Rgba; readonly trim?: Rgba; readonly finial?: Rgba }
      readonly faces?: ReadonlyArray<TowerFace>
    }
  /** A prop sprite lying flat at (u, n) and height z, its long side `len` meters along frame angle `angle` (radians, 0 = +u), on a pole from the ground when `pole` gives its colour. */
  | { readonly kind: "sprite"; readonly name: PropName; readonly u: number; readonly n: number; readonly z: number; readonly angle: number; readonly len: number; readonly pole?: Rgba }

export type PlaceDressing = {
  /** The POI's exact name, or the building's OSM name when no POI marks it. With several POIs of that name, the one nearest the footprint. */
  readonly poi: string
  /** The exact OSM name of the street the place faces: its frame hangs on it. */
  readonly street: string
  /** The OSM way of the footprint: it keeps its outline and stays the solid. */
  readonly osmBuildingId: number
  /** Storeys (3 m each), applied when the map loads (and baked by `pnpm map`). */
  readonly levels?: number
  /** The facade texture, instead of the one facade.ts picks. */
  readonly facade?: Facade
  /** Multiplies the facade texture on every wall (without the random tint other buildings get). */
  readonly wallColour?: Rgba
  readonly bands?: ReadonlyArray<WallBand>
  /** Both roof planes in one colour (the shaded one darker), and/or pitched or flat with a parapet. */
  readonly roof?: { readonly colour?: Rgba; readonly pitched?: boolean }
  readonly parts: ReadonlyArray<Part>
}

/** A dressing found on the map: the index of its footprint in `map.buildings` and its street frame. */
export type Place = { readonly dressing: PlaceDressing; readonly building: number; readonly frame: Frame }

/** How far from the footprint's middle the named POI may be and still be this place's. */
const POI_REACH_M = 80

/** The footprints' storeys as the dressings set them; the same map when none changes. */
export const dressMap = (map: GameMap, dressings: ReadonlyArray<PlaceDressing>): GameMap => {
  const levels = new Map(dressings.flatMap((d) => (d.levels === undefined ? [] : [[d.osmBuildingId, d.levels] as const])))
  if (!map.buildings.some((b) => (levels.get(b.id) ?? b.levels) !== b.levels)) return map
  return { ...map, buildings: map.buildings.map((b) => ((levels.get(b.id) ?? b.levels) === b.levels ? b : { ...b, levels: levels.get(b.id) ?? b.levels })) }
}

/** Every dressing whose footprint and street are on the map, with its frame. */
export const resolvePlaces = (map: GameMap, dressings: ReadonlyArray<PlaceDressing>): Array<Place> =>
  dressings.flatMap((dressing) => {
    const building = map.buildings.findIndex((b) => b.id === dressing.osmBuildingId)
    const pts = map.buildings[building]?.pts
    if (pts === undefined) return []
    // The footprint's middle: the mean of its corners, without the closing repeat.
    const closed = pts.length >= 4 && pts[0] === pts[pts.length - 2] && pts[1] === pts[pts.length - 1]
    const n = pts.length / 2 - (closed ? 1 : 0)
    let mx = 0
    let my = 0
    for (let i = 0; i < n; i++) {
      mx += (pts[i * 2] ?? 0) / n
      my += (pts[i * 2 + 1] ?? 0) / n
    }
    const poi = map.pois
      .filter((p) => p.name === dressing.poi && Math.hypot(p.x - mx, p.y - my) <= POI_REACH_M)
      .reduce<{ x: number; y: number } | null>((best, p) => (best === null || Math.hypot(p.x - mx, p.y - my) < Math.hypot(best.x - mx, best.y - my) ? p : best), null)
    const frame = streetFrame(map, dressing.street, poi?.x ?? mx, poi?.y ?? my)
    return frame === null ? [] : [{ dressing, building, frame }]
  })
