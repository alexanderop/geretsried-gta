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
 * Coordinates (world/frame.ts): free-standing parts (tower, pylon, sprite) are in
 * the street frame, u along the street, n from its centre line towards the
 * place (the POI, or the footprint's middle when no POI marks it). Wall
 * parts (wallSign, arcade, balcony, canopy, gable, stairs, ramp, roofSign) sit on one wall of the footprint, `edge` i
 * running from point i to i + 1 of its `pts`: u in meters from the wall's
 * left end as you face it from outside, z up from the ground.
 */
import type { GameMap } from "#/map/types.ts"
import type { Facade } from "#/render/scene/facade.ts"
import type { MaterialName, PropName, Rgba } from "#/render/scene/mesh.ts"
import { streetFrame, wallFrame, type Frame, type Rect } from "../frame.ts"

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
   * A stack of balconies on wall `edge` from u0 to u1, one with its floor at
   * each height in `z`: a slab `depth` meters deep (in `slab`, else `colour`)
   * with a solid 1 m parapet in `colour` round its front and ends. Overhead
   * (places.test.ts keeps the lowest above head height), so never in the way.
   */
  | { readonly kind: "balcony"; readonly edge: number; readonly u0: number; readonly u1: number; readonly z: ReadonlyArray<number>; readonly depth: number; readonly colour: Rgba; readonly slab?: Rgba }
  /**
   * A flat slab over a door on wall `edge` from u0 to u1, its top at `z`,
   * standing `depth` meters out of the wall. Overhead like a balcony
   * (places.test.ts keeps it, and the bottom of its fascia, above head height). With `texture` its top is
   * that material times `colour` (an awning's fabric), repeated every
   * `depth` meters along the wall, the image's top at the wall. `fascia` hangs a board `h` meters deep round its
   * three outer sides (a free-standing shop canopy's; a wallSign with `out` = depth puts lettering on its front);
   * `posts` stand under its outer corners and about every `every` meters along its front, `side` meters square (thin
   * steel posts without it), never solid.
   */
  | {
      readonly kind: "canopy"
      readonly edge: number
      readonly u0: number
      readonly u1: number
      readonly z: number
      readonly depth: number
      readonly colour: Rgba
      readonly texture?: MaterialName
      readonly fascia?: { readonly h: number; readonly colour: Rgba }
      readonly posts?: { readonly every: number; readonly colour: Rgba; readonly side?: number }
    }
  /**
   * A sign painted on the roof, for the top-down camera to tell shops apart: the material over the rectangle u0..u1
   * by n0..n1 in wall `edge`'s frame (n into the building), at height z0 along its n0 side and z1 along its n1 side
   * (so it can lie on a roof plane rising from that wall), the image's top towards `up` (default "n1": letters read
   * from outside that wall). It must lie over the footprint (places.test.ts checks); a few centimetres over the roof.
   */
  | {
      readonly kind: "roofSign"
      readonly texture: MaterialName
      readonly edge: number
      readonly u0: number
      readonly u1: number
      readonly n0: number
      readonly n1: number
      readonly z0: number
      readonly z1: number
      readonly up?: "n0" | "n1" | "u0" | "u1"
    }
  /**
   * A free-standing sign post at (u, n) in the street frame, turned `angle` (radians, like a sprite's) from u: a box
   * `w` wide along it, `d` deep, `h` high in `colour`, with the material on both broad faces from `z0` to `z1` (the
   * stacked panels of a shopping-centre pylon). Never solid.
   */
  | { readonly kind: "pylon"; readonly u: number; readonly n: number; readonly angle: number; readonly w: number; readonly d: number; readonly h: number; readonly colour: Rgba; readonly texture: MaterialName; readonly z0: number; readonly z1: number }
  /**
   * A cross gable on wall `edge` from u0 to u1: a gabled roof with its eaves at `z` rising at `pitch` degrees to a
   * ridge over the stretch's middle that runs `depth` meters into the building, ending at the wall in a gable
   * (`colours.gable`) over a strip of wall (`colours.wall`) from `z0` up to the eaves. Under the building's own roof
   * it is hidden by it, so `depth` only has to reach that roof; the building's walls and roof stay as they are.
   */
  | {
      readonly kind: "gable"
      readonly edge: number
      readonly u0: number
      readonly u1: number
      readonly z0: number
      readonly z: number
      readonly pitch: number
      readonly depth: number
      readonly colours: { readonly wall: Rgba; readonly gable: Rgba; readonly roof: Rgba }
    }
  /**
   * A square tower on `rect` (street frame, inside the footprint): walls up
   * to `h`, a pyramid roof `roofH` high, corner quoins in `trim`, a post with
   * a cross bar on top in `finial`, lettering or a clock on its faces. With
   * `edge`, `rect` is in that wall's frame instead (u from its left end, n
   * into the building), so the tower stands square to a wall the street
   * does not run along; side 0 then faces out of that wall.
   */
  | {
      readonly kind: "tower"
      readonly rect: Rect
      readonly edge?: number
      readonly h: number
      readonly roofH: number
      readonly colours: { readonly wall: Rgba; readonly roof: Rgba; readonly trim?: Rgba; readonly finial?: Rgba }
      readonly faces?: ReadonlyArray<TowerFace>
    }
  /**
   * A flat roof on posts over the building (a solar canopy): a slab on `rect` in wall `edge`'s frame (u from its left
   * end, n into the building, so negative n overhangs that wall), its top at `z`, `thickness` deep, the edges in
   * `colour`. Its top shows `texture` (times `colour`'s tint `top`, white without) repeated `repeat` [along u, along n]
   * times over the slab. With `posts`, square steel posts stand on the footprint's walls (one at each corner and about
   * every `every` meters between) from `z0` up to the slab. Overhead and never solid.
   */
  | {
      readonly kind: "deck"
      readonly edge: number
      readonly rect: Rect
      readonly z: number
      readonly thickness: number
      readonly colour: Rgba
      readonly texture?: MaterialName
      readonly top?: Rgba
      readonly repeat?: readonly [number, number]
      readonly posts?: { readonly z0: number; readonly every: number; readonly colour: Rgba }
    }
  /**
   * A flight of `steps` steps on wall `edge` from u0 to u1, climbing from the ground `depth` meters out to `h` at the
   * wall, the top step a landing. Relief only: walked and driven through like an arcade.
   */
  | { readonly kind: "stairs"; readonly edge: number; readonly u0: number; readonly u1: number; readonly depth: number; readonly h: number; readonly steps: number; readonly colour: Rgba }
  /**
   * A ramp along wall `edge` from u0 to u1, `depth` meters out from it: a slab whose top rises from the ground at the
   * `low` end (u0 or u1) to `h` at the other, with a rail along its outer edge in `rail`. Relief only, like stairs.
   */
  | { readonly kind: "ramp"; readonly edge: number; readonly u0: number; readonly u1: number; readonly depth: number; readonly h: number; readonly low: "u0" | "u1"; readonly colour: Rgba; readonly rail?: Rgba }
  /** A prop sprite lying flat at (u, n) and height z, its long side `len` meters along frame angle `angle` (radians, 0 = +u), on a pole from the ground when `pole` gives its colour. */
  | { readonly kind: "sprite"; readonly name: PropName; readonly u: number; readonly n: number; readonly z: number; readonly angle: number; readonly len: number; readonly pole?: Rgba }

/**
 * One volume of a footprint OSM maps as one outline over several buildings (two blocks and the low link between
 * them): a ring of map points (x, y, …, open) with its own storeys and roof, and optionally its own wall colour and
 * bands (else the place's). A place with `masses` is drawn as them instead of as its footprint; they must tile the
 * footprint (places.test.ts checks), whose outline stays the solid and carries the wall parts.
 */
export type Mass = {
  readonly pts: ReadonlyArray<number>
  readonly levels: number
  readonly roof?: PlaceDressing["roof"]
  readonly wallColour?: Rgba
  readonly bands?: ReadonlyArray<WallBand>
}

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
  /**
   * Both roof planes in one colour (the shaded one darker), and/or pitched or flat with a parapet. `hip` (degrees)
   * raises a pitched roof into a hipped one: a plane rising from every wall at that pitch, ridges along the wings,
   * valleys in the inner corners (render/scene/hip-roof.ts), instead of the flat roof at the eaves. With `hip`,
   * `eaves` gives the listed walls (`edges`) their own eave height `z` (meters; the rest keep `levels` × 3), and
   * `gables` ends the roof in a gable at those walls instead of a hip: there each wall's top follows the roof.
   */
  readonly roof?: {
    readonly colour?: Rgba
    readonly pitched?: boolean
    readonly hip?: number
    readonly eaves?: ReadonlyArray<{ readonly edges: ReadonlyArray<number>; readonly z: number }>
    readonly gables?: ReadonlyArray<number>
  }
  /** The footprint as several volumes with their own heights and roofs (see Mass), instead of one. */
  readonly masses?: ReadonlyArray<Mass>
  readonly parts: ReadonlyArray<Part>
}

/** A dressing found on the map: the index of its footprint in `map.buildings` and its street frame. */
export type Place = { readonly dressing: PlaceDressing; readonly building: number; readonly frame: Frame }

/** The frame a tower's `rect` is in: its wall's with `edge`, else the place's street frame; null for a wall the footprint lacks. */
export const towerFrame = (place: Place, pts: ReadonlyArray<number>, tower: Extract<Part, { kind: "tower" }>): Frame | null =>
  tower.edge === undefined ? place.frame : (wallFrame(pts, tower.edge)?.frame ?? null)

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
