import { Schema } from "effect"

/** Road classes the game knows. Everything else from OSM is dropped. */
export const RoadKind = Schema.Literals([
  "primary",
  "secondary",
  "tertiary",
  "residential",
  "living_street",
  "service",
  "track",
  "footway",
])
export type RoadKind = typeof RoadKind.Type

export const AreaKind = Schema.Literals([
  "water",
  "forest",
  "grass",
  "farmland",
  "residential",
  "industrial",
  "park",
  "pitch",
  "parking",
])
export type AreaKind = typeof AreaKind.Type

/** Flat [x0, y0, x1, y1, ...] in meters, origin top-left, y pointing south. */
const Points = Schema.Array(Schema.Number)

export const Road = Schema.Struct({
  kind: RoadKind,
  name: Schema.String,
  width: Schema.Number,
  oneway: Schema.Boolean,
  pts: Points,
  nodes: Schema.Array(Schema.Number),
  /** A parking lot aisle (OSM service=parking_aisle): bays on both sides. */
  aisle: Schema.optionalKey(Schema.Boolean),
})
export type Road = typeof Road.Type

/**
 * Roof colours read from the aerial photo, as #rrggbb: one per wall, the roof
 * plane rising from it (null for a gable end; see src/map/roof.ts), or a single
 * colour for a flat roof.
 */
export const Roof = Schema.Struct({ colors: Schema.Array(Schema.NullOr(Schema.String)), pitched: Schema.Boolean })
export type Roof = typeof Roof.Type

export const Building = Schema.Struct({ id: Schema.Number, levels: Schema.Number, pts: Points, roof: Schema.optionalKey(Roof) })
export type Building = typeof Building.Type

export const Area = Schema.Struct({ kind: AreaKind, pts: Points })
export type Area = typeof Area.Type

export const Waterway = Schema.Struct({ width: Schema.Number, pts: Points })
export type Waterway = typeof Waterway.Type

export const PoiKind = Schema.Literals([
  "supermarket",
  "drugstore",
  "bakery",
  "fuel",
  "pharmacy",
  "bank",
  "food",
  "police",
  "post",
  "school",
  "doctor",
  "civic",
  "shop",
])
export type PoiKind = typeof PoiKind.Type

/** A named place worth showing: shops, fuel, police, … */
export const Poi = Schema.Struct({ name: Schema.String, kind: PoiKind, x: Schema.Number, y: Schema.Number })
export type Poi = typeof Poi.Type

/** A traffic light on OSM node `node`. `direction` is relative to the way(s) through that node. */
export const Signal = Schema.Struct({
  node: Schema.Number,
  x: Schema.Number,
  y: Schema.Number,
  direction: Schema.Literals(["forward", "backward", "both"]),
})
export type Signal = typeof Signal.Type

export const GameMap = Schema.Struct({
  width: Schema.Number,
  height: Schema.Number,
  /** Degrees; north-west is (0, 0) in meters. */
  bbox: Schema.Struct({ south: Schema.Number, west: Schema.Number, north: Schema.Number, east: Schema.Number }),
  roads: Schema.Array(Road),
  buildings: Schema.Array(Building),
  areas: Schema.Array(Area),
  waterways: Schema.Array(Waterway),
  pois: Schema.Array(Poi),
  signals: Schema.Array(Signal),
})
export type GameMap = typeof GameMap.Type

/** Meters per pixel of public/ground.png, whose alpha says how much of the ground is paved. */
export const GROUND_M_PER_PX = 2
