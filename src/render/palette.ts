import type { AreaKind, RoadKind } from "#/map/types.ts"

export const GROUND = "#5f8a3e"

export const AREA_COLORS: Readonly<Record<AreaKind, string>> = {
  water: "#3a7bbf",
  forest: "#3c6b2f",
  grass: "#6e9b48",
  farmland: "#8fa556",
  residential: "#7c8c62",
  industrial: "#8b8579",
  park: "#5c9446",
  pitch: "#4f9a4a",
}

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

export const SIDEWALK = "#a9a397"
export const WATERWAY = "#3a7bbf"

const ROOFS = ["#9c4a3a", "#7d3c32", "#a8645a", "#6b6f78", "#5a5e66", "#8a7b6a", "#b3a48c", "#7a5a4a"]

/** Stable roof color per building id. */
export const roofColor = (id: number) => ROOFS[Math.abs(id * 2654435761) % ROOFS.length] ?? "#888"
