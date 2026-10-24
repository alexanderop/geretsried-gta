import type { RoadKind } from "#/map/types.ts"

export const GROUND = "#5f8a3e"
/** Between the median colours of town and forest in the stylised photo: the ground shown while a tile loads. */
export const PHOTO_GROUND = "#6b7556"

export const ROAD_COLORS: Readonly<Record<RoadKind, string>> = {
  primary: "#38383d",
  secondary: "#3b3b40",
  tertiary: "#404045",
  residential: "#46464b",
  living_street: "#58565a",
  service: "#4e4d50",
  track: "#9b8259",
  footway: "#c8b993",
}

