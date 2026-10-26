import type { PoiKind } from "./types.ts"

/** A place OSM lacks (or maps without a name): added by hand, projected like an OSM place and appended after them. */
export type ExtraPoi = { readonly name: string; readonly kind: PoiKind; readonly lat: number; readonly lon: number }

/** Checked on the web (I-1, 2026-10-25); the note says where each position comes from. */
export const EXTRA_POIS: ReadonlyArray<ExtraPoi> = [
  // OSM node 12824612410 (leisure=fitness_centre) has no name, so the importer drops it. Sudetenstraße 49.
  { name: "Sportstudio Innings", kind: "gym", lat: 47.855834, lon: 11.489942 },
  // Schubertweg 13.
  { name: "BeaFit Frauenfigurstudio", kind: "gym", lat: 47.8544578, lon: 11.4809921 },
  // Haydnweg 28.
  { name: "Lu Jong Yoga Studio", kind: "gym", lat: 47.8548526, lon: 11.478401 },
  // Sudetenstraße 47, a dance school; Carsten Schwarz teaches in the same building.
  { name: "Takt Tanz", kind: "gym", lat: 47.8558943, lon: 11.4890777 },
  { name: "Carsten Schwarz Tanzstudio", kind: "gym", lat: 47.8558943, lon: 11.4890777 },
  // Lerchenweg 1.
  { name: "Muscle & Mind Bodyforming", kind: "gym", lat: 47.8742379, lon: 11.4725497 },
  // Blumenstraße 19: the street geocode, the position is approximate.
  { name: "Elements Yoga und Pilates", kind: "gym", lat: 47.8856908, lon: 11.4611779 },
  // Bürgermeister-Graf-Ring 13, Gelting.
  { name: "Fitness-Studio imPuls", kind: "gym", lat: 47.8879683, lon: 11.4379915 },
]

/**
 * Checked on the web (I-2, 2026-10-25/26): open, and not in OSM. Appended after I-2's OSM places (MoreSources.next),
 * so the ids before them stay. Positions from the address (Nominatim house or building) or the listing's pin, not guessed.
 * Left out on purpose: Indian Palace and Boulevard Bistro (no sign of life for years), Yellow Chilli (in Königsdorf),
 * Café Centrale (= Centrale), Restaurant Ostasien (Pho Viet's old name); Alter Wirth and Servus Gelting lie west of the box.
 */
export const EXTRA_POIS_NEXT: ReadonlyArray<ExtraPoi> = [
  // Neuer Platz 5 (Nominatim house): the former Coffeeholic Café/Bistro, same address and phone, posts as Centrale since May 2026.
  { name: "Centrale Geretsried", kind: "food", lat: 47.8577969, lon: 11.4785523 },
  // Sudetenstraße 47a (Nominatim building, way 1385177375).
  { name: "Café Bar DUO", kind: "bar", lat: 47.8561907, lon: 11.4897066 },
  // Breslauer Weg 75 (motorradseitz.de; Alex's photo 2026-10-26): the centre of way 128503556, the web geocode lands on the street.
  { name: "Fahrzeugtechnik Seitz", kind: "car_repair", lat: 47.859149, lon: 11.490211 },
  // Jeschkenstraße 28 (listing pin; OSM has no no. 28, DLRG 28a is 45 m N). The sign may read "Perle des Ostens".
  { name: "Asien Perle", kind: "food", lat: 47.8511639, lon: 11.4898048 },
  // Sudetenstraße 74 (listing pin: restaurantguru and exa agree; OSM has no no. 74).
  { name: "Club57", kind: "food", lat: 47.8526785, lon: 11.4955387 },
  // Brunnenfeldweg 4, Gelting (the official tourism portal's pin; OSM has no no. 4).
  { name: "Restaurant Akropolis", kind: "food", lat: 47.887615, lon: 11.439643 },
]
