import type { PlaceDressing } from "./dressing.ts"

/**
 * Pflegeheim St. Ursula, Sudetenstraße 5, next to Cafe Waldmann (OSM tags the building way
 * amenity=social_facility: a care_home POI since I-1). Four storeys on Street View (OSM has no
 * `building:levels`), its own facade of ochre and cream vertical bands
 * (scripts/facade-ursula.py), and the brown timber fascia under the eaves.
 */
export const ST_URSULA: PlaceDressing = {
  poi: "Pflegeheim St. Ursula",
  street: "Sudetenstraße",
  osmBuildingId: 127604847,
  levels: 4,
  facade: "ursula",
  // The fascia: the top 0.9 m of the 12 m walls (the roof is pitched, so the walls end at the eaves).
  bands: [{ z0: 12 - 0.9, z1: 12, colour: [104, 66, 40, 255], plain: true }],
  parts: [],
}
