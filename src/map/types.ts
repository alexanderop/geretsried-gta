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
  "playground",
  "track",
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
  /** The OSM way: street profiles (world/places/streets.ts) name the way they dress by it. */
  id: Schema.optionalKey(Schema.Number),
})
export type Road = typeof Road.Type

/**
 * Roof colours read from the aerial photo, as #rrggbb: one per wall, the roof
 * plane rising from it (null for a gable end; see src/map/roof.ts), or a single
 * colour for a flat roof.
 */
export const Roof = Schema.Struct({ colors: Schema.Array(Schema.NullOr(Schema.String)), pitched: Schema.Boolean })
export type Roof = typeof Roof.Type

/**
 * `canopy`: OSM building=roof, a roof on pillars (petrol stations): no walls, nothing solid underneath.
 * `holes`: closed rings of open ground inside `pts`, the courtyards of an OSM multipolygon building (relation inner ways).
 */
export const Building = Schema.Struct({
  id: Schema.Number,
  levels: Schema.Number,
  pts: Points,
  roof: Schema.optionalKey(Roof),
  canopy: Schema.optionalKey(Schema.Boolean),
  holes: Schema.optionalKey(Schema.Array(Points)),
})
export type Building = typeof Building.Type

/**
 * `width`: the area is a line (`pts` a polyline) drawn this many meters wide, not a polygon: the lanes of a
 * leisure=track way without area=yes. `tint`: #rrggbb ground colour read from the aerial photo, for a playground or
 * track whose surface OSM does not give as paved (sand, bark, tartan, or no surface at all).
 */
export const Area = Schema.Struct({ kind: AreaKind, pts: Points, width: Schema.optionalKey(Schema.Number), tint: Schema.optionalKey(Schema.String) })
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
  "church",
  "car_repair",
  "shop",
  "gym",
  "health",
  "kindergarten",
  "care_home",
  "bar",
  "parcel_locker",
  "office",
  "sport",
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

/** A marked pedestrian crossing on OSM node `node` (zebra, or with its own lights). */
export const Crossing = Schema.Struct({ node: Schema.Number, x: Schema.Number, y: Schema.Number, signals: Schema.Boolean })
export type Crossing = typeof Crossing.Type

/** Street furniture OSM maps as points: bus stops and glass bottle banks. */
export const PropKind = Schema.Literals(["bus_stop", "glass"])
export type PropKind = typeof PropKind.Type
/** `node`: the OSM node of a bus stop; `shelter: false` where OSM tags it shelter=no (see streetProps for which are honoured). */
export const Prop = Schema.Struct({ kind: PropKind, x: Schema.Number, y: Schema.Number, node: Schema.optionalKey(Schema.Number), shelter: Schema.optionalKey(Schema.Boolean) })
export type Prop = typeof Prop.Type

/** A part of town with its own name (OSM place=suburb, village, …): where the gangs have their turf. */
export const District = Schema.Struct({ name: Schema.String, x: Schema.Number, y: Schema.Number })
export type District = typeof District.Type

/** Where a bus halts: the stop's name and platform (x, y), and its place on the run's path: `s` meters into path segment `at` (node `at` to node `at + 1`). */
export const BusStop = Schema.Struct({ name: Schema.String, x: Schema.Number, y: Schema.Number, at: Schema.Number, s: Schema.Number })
export type BusStop = typeof BusStop.Type

/**
 * One direction of a bus line (an OSM route=bus relation), cut to the map: `nodes` are OSM nodes of
 * drivable roads in driving order, `pts` the same as [x0, y0, ...] meters, and the stops follow the path.
 */
export const BusRun = Schema.Struct({ to: Schema.String, nodes: Schema.Array(Schema.Number), pts: Points, stops: Schema.Array(BusStop) })
export type BusRun = typeof BusRun.Type

/** A bus line: its number (370), the operator, and the one or two runs a bus drives in turn (there and back). */
export const BusLine = Schema.Struct({ ref: Schema.String, operator: Schema.String, runs: Schema.Array(BusRun) })
export type BusLine = typeof BusLine.Type

/** A stretch of road the aerial photo shows as tree canopy; the renderer draws it in. */
export const Covered = Schema.Struct({ width: Schema.Number, pts: Points })
export type Covered = typeof Covered.Type

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
  crossings: Schema.Array(Crossing),
  props: Schema.Array(Prop),
  districts: Schema.Array(District),
  covered: Schema.Array(Covered),
  buses: Schema.Array(BusLine),
})
export type GameMap = typeof GameMap.Type

/** Meters per pixel of public/ground.png, whose alpha says how much of the ground is paved. */
export const GROUND_M_PER_PX = 2
