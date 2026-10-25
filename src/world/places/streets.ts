/**
 * Street profiles (see world/street-profile.ts): real cross-sections and
 * street furniture for single OSM ways, instead of the class default.
 *
 * S-1, Sudetenstraße at the spawn (docs/places/start-area-streets.md): way
 * 157363825 from the Richard-Wagner-Straße signals (station +168) to past
 * Autohaus Billion (−170). Station 0 is the foot of (3992.8, 4654.8), + runs
 * north-west (the way's node order); offset + is NE (the shop row, "right"),
 * − SW (Autohof Jorde, "left"). Band edges are read off the DOP20 (20 cm,
 * 2024) along the OSM centre line, which runs about 1 m NE of the real one:
 * kerb faces at +5.0 (DOP +5.2) and −7.0 (DOP −7.2). The OSM footprints stay
 * the facades (the LoD2 walls stand 3–4.5 m further back on the NE side), so
 * the NE pavement ends at the OSM front.
 */
import type { Band, StreetProfile } from "../street-profile.ts"

/** The class default of an 8 m tertiary: 4 m lanes, the 0.3 m kerb, the 2.6 m sidewalk (scene.ts). */
const DEFAULT: ReadonlyArray<Band> = [
  { kind: "lanes", to: 4 },
  { kind: "kerb", to: 4.3 },
  { kind: "sidewalk", to: 6.6 },
]

/** Cars parked along both kerbs at the start, granite setts in the gutters, slab pavements to the walls. */
const NE_SHOPS: ReadonlyArray<Band> = [
  { kind: "lanes", to: 3.0 },
  { kind: "parking", to: 4.6 },
  { kind: "gutter", to: 5.0 },
  { kind: "kerb", to: 5.3 },
  { kind: "pavement", to: "facade" },
]
const SW_AUTOHOF: ReadonlyArray<Band> = [
  { kind: "lanes", to: 5.0 },
  { kind: "parking", to: 6.6 },
  { kind: "gutter", to: 7.0 },
  { kind: "kerb", to: 7.3 },
  { kind: "pavement", to: 9.5 },
  { kind: "forecourt", to: "facade" },
]
/** In front of Rehmaus Apotheke: the parking bay and the pavement with its bollards; the lawn behind stays. */
const SW_REHMAUS: ReadonlyArray<Band> = [
  { kind: "lanes", to: 5.0 },
  { kind: "parking", to: 6.6 },
  { kind: "gutter", to: 7.0 },
  { kind: "kerb", to: 7.3 },
  { kind: "pavement", to: 9.5 },
]

/** Where Berliner Weg (node 60383008) joins: the NW kerb rounds into it, the station of the node. */
const BERLINER_WEG_S = -39.9

export const SUDETENSTRASSE: StreetProfile = {
  way: 157363825,
  name: "Sudetenstraße",
  origin: [3992.8, 4654.8],
  direction: 1,
  ranges: [
    // From the Kirchweg mouth (+34) to Berliner Weg: the start.
    { from: 28, to: BERLINER_WEG_S, right: { bands: NE_SHOPS, reach: 10.3 }, left: { bands: SW_AUTOHOF, reach: 17.5 } },
    { from: BERLINER_WEG_S, to: -72, right: { bands: DEFAULT }, left: { bands: SW_REHMAUS } },
  ],
  // SV 01–06: only the dashed centre line, no solid edge lines anywhere in the scope.
  noEdgeLines: [170, -170],
  // A curved-arm lamp on the shop side about every 30 m (SV 02, 06, 10; the spacing is a guess).
  lamps: { side: "right", from: 168, to: -170, every: 30, setback: 0.3 },
  // The player's car (sim/game.ts parks it at the middle of the segment nearest the start, station +3.1, on the NE side,
  // facing NW): free kerb behind it and all the way ahead, so it drives straight off.
  parkingGaps: [
    { side: "right", from: 28, to: -1.5 },
    // Opposite the Berliner Weg mouth: room for cars turning out of it to swing wide (guess; the police cars need it).
    { side: "left", from: -12, to: -40 },
  ],
  // DOP20 crowns: three in pits on the NE pavement, a row of six along the SW pavement.
  trees: [
    { s: 11, n: 6.2, r: 2.6 },
    { s: -1.5, n: 6.2, r: 2.6 },
    { s: -21, n: 6.2, r: 2.4 },
    { s: 8, n: -8.4, r: 2.8 },
    { s: -1.5, n: -8.4, r: 2.8 },
    { s: -9, n: -8.4, r: 2.8 },
    { s: -17, n: -8.4, r: 2.8 },
    { s: -24, n: -8.4, r: 2.6 },
    { s: -31, n: -8.4, r: 2.6 },
  ],
  // Red and white bollards along the SW kerb in front of Rehmaus Apotheke (SV 06).
  bollards: [{ from: -41, to: -66, n: -7.5, every: 1.5 }],
  corners: [{ node: 60383008, side: "right", radii: [6, 6] }],
  // The paved corner from the start building's SE gable (station −24.6) to Berliner Weg (SV 08).
  plazas: [
    [
      [-24.6, 5.0],
      [-24.6, 16.0],
      [-33.6, 16.0],
      [-36.6, 5.0],
    ],
  ],
  // "Sudetenstraße" painted in the SE-bound lane (SV 06), reading for drivers heading SE.
  paint: [{ sprite: "road-name", s: -45, n: -2, length: 7, up: -1 }],
  signs: [
    // S1: VZ 314 with the arrow, "Mo-Sa 8-19 h" and the 2-hour disc plate (SV 09). The listed spot (4017.5, 4660.2) lies
    // inside the OSM footprint of No. 19, so the pole stands just past its SE gable.
    { vz: "314", x: 4018.5, y: 4661.0, facing: 2.164, plates: ["Mo-Sa 8-19 h", "1040-32"] },
    // S2: the zebra's sign and flashing light on the NE side (SV 10), facing the NW-bound traffic.
    { vz: "350", x: 4019.4, y: 4665.6, facing: 0.593, flash: true },
    // S3: its twin on the SW kerb (SV 03/04 from afar), facing the SE-bound traffic.
    { vz: "350", x: 4012.0, y: 4676.3, facing: -2.548, flash: true },
    // S4: VZ 224 on the H poles of both stops (3448196000 SW, 3448196002 NE), where streetProps stands them.
    { vz: "224", x: 3920.0, y: 4611.5, facing: -2.548 },
    { vz: "224", x: 3916.8, y: 4598.7, facing: 0.593 },
  ],
}

export const STREETS: ReadonlyArray<StreetProfile> = [SUDETENSTRASSE]

/**
 * Bus stops OSM tags shelter=no that were checked against Street View / the aerial photo: they get only the H pole.
 * 55 more stops in town carry the tag unchecked and keep their shelters until someone looks.
 */
export const POLE_ONLY_STOPS: ReadonlySet<number> = new Set([3448196000, 2024816308, 3823202158])
