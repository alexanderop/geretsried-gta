import type { Rgba } from "#/render/scene/mesh.ts"
import type { PlaceDressing } from "./dressing.ts"

/**
 * Arztpraxis Lewke, Adalbert-Stifter-Straße 43 (B6d-3): Dorothea Lewke's general practice, a white two-storey house
 * under a dark grey roof (way 188590009). Street View (Sept 2023, reference/arztpraxis-lewke/01) shows two full storeys
 * and roof windows, so the map's massing (2 storeys, pitched) and the engine's white render stay. The roof gets the
 * darker DOP tone (#767460) as one colour: the map's own colours drew it terracotta, 01 shows dark grey tiles.
 *
 * The sign: a dark aubergine board (#2f1d29) on the street wall (SW, walls 2–4 in a line), left of the ground-floor
 * windows, near the NW corner: beige "Arzt-Praxis", a thin orange rule, white "Dorothea" (the photo's first name is too
 * blurred; OSM's operator gives it), a white stethoscope and "Lewke", a small family pictogram. It hangs on wall 4 (the
 * NW 5.03 m of the street wall, u 0 at the NW corner), 1.1–2.9 m from the corner and 1.75–2.65 m up: measured in 01 with
 * the wall's perspective taken out (the NW end is nearer the camera), 1.8 × 0.9 m as the board's 2:1.
 *
 * Guesses: the board's place to about ±0.5 m. Left out: the three small lines at its bottom left (illegible), the glass
 * door canopy and the red plate by the door, the fence and hedge.
 */
const ROOF: Rgba = [118, 116, 96, 255]

export const ARZTPRAXIS_LEWKE: PlaceDressing = {
  poi: "Arztpraxis Lewke",
  street: "Adalbert-Stifter-Straße",
  osmBuildingId: 188590009,
  roof: { colour: ROOF },
  parts: [{ kind: "wallSign", texture: "lewke-sign", edge: 4, u0: 1.1, u1: 2.9, z0: 1.75, z1: 2.65 }],
}
