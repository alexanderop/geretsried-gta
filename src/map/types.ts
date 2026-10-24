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
})
export type Road = typeof Road.Type

export const Building = Schema.Struct({ id: Schema.Number, levels: Schema.Number, pts: Points })
export type Building = typeof Building.Type

export const Area = Schema.Struct({ kind: AreaKind, pts: Points })
export type Area = typeof Area.Type

export const Waterway = Schema.Struct({ width: Schema.Number, pts: Points })
export type Waterway = typeof Waterway.Type

export const GameMap = Schema.Struct({
  width: Schema.Number,
  height: Schema.Number,
  origin: Schema.Struct({ lat: Schema.Number, lon: Schema.Number }),
  roads: Schema.Array(Road),
  buildings: Schema.Array(Building),
  areas: Schema.Array(Area),
  waterways: Schema.Array(Waterway),
})
export type GameMap = typeof GameMap.Type
