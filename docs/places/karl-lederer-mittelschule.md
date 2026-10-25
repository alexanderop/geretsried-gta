# Karl-Lederer-Mittelschule (OSM: Karl-Lederer-Hauptschule), J.-S.-Bach-Straße — `karl-lederer-mittelschule`

| Field | Value |
|---|---|
| POI | #186 "Karl-Lederer-Hauptschule Geretsried", kind `school` (OSM way 127604843, amenity=school, building=yes, check_date 2025-08-07, website hs-geretsried.de) |
| Map x, y | 3740.9, 4830.9 m (315 m from start) |
| lat, lon | 47.856555, 11.480154 |
| Official | Now **Karl-Lederer-Mittelschule** ("Hauptschule" is the old name). City + SZ: it is being **merged into the Adalbert-Stifter-Mittelschule** (new site on Adalbert-Stifter-Straße; extension by Aug 2029, everything by mid-2031). hs-geretsried.de answered 500 / no connection (2026-10-25) |
| OSM building | way **127604843** (~1412 m², ~72×38 m, x 3705–3777, y 4812–4850) + N wing way **188651575** (building=yes). Sportplatz way 127872275; school grounds 1271753004 / 149415484 |
| LoD2 | one building DEBY_LOD2_4602861 over both ways: **low-pitch gable**, main roofs 12.8→14.1 m (528 m²) and 13.1→14.1 m (417 m²), wings 9.6–11.1 m and 6.4–7.2 m; annex 105019381 (Pultdach 6.5 m, 26 m²) |
| Engine | 127604843: levels 2, flat, roof `#d3cfcd`; 188651575: levels 2, pitched → **too low** (LoD2 main ~13 m ≈ levels 4, N wing ~10 m ≈ 3) |
| Street frame | **Johann-Sebastian-Bach-Straße** (residential, 6.5 m), bearing 117°; kerb point (3721.3, 4870.1), 43.9 m; school is N of the street |
| Position | Long block W of the Grundschule; trees on its S side hide much of the roof (01) |
| Status | **ref-done (partial)**: massing + roof known (B6b-4 applies levels 4 / 3); facade needs reference. Name kept (Alex 2026-10-25) |

## Images
| File | What | Source |
|---|---|---|
| reference/karl-lederer-mittelschule/01-dop20-ortho.jpg | Top-down orthophoto: roof colour, shape, yard | BVV DOP20, CC BY 4.0 |
| reference/karl-lederer-mittelschule/02-dop20-osm-outline.jpg | 01 with the OSM outline (red) and the POI node (yellow) | 01 + OSM |
| reference/karl-lederer-mittelschule/03-lod2-street-side.png | LoD2 3D massing seen from J.-S.-Bach-Straße (SW) (heights are real; walls are untextured) | BVV LoD2, CC BY 4.0 |
| reference/karl-lederer-mittelschule/04-lod2-back.png | LoD2 massing from the opposite side | BVV LoD2, CC BY 4.0 |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Massing | long block ~13–14 m with a lower N wing (~10–11 m) and low wings (LoD2) | — |
| Roof | light grey, very low-pitch (DOP + LoD2: 1.3 m rise) | `#d0cfcb` (median, trees excluded by eye) |
| Walls | Street View (reported by the parent): a **light multi-storey block seen through trees** from J.-S.-Bach-Str. 11; no capture kept | needs reference (no hex) |
| Entrance, windows, school sign | not seen | needs reference |

## Engine terms
- Do now (Alex 2026-10-25): #0b `levels: 4` on way 127604843 and `levels: 3` on 188651575 (LoD2 heights). Roof stays flat (1.3 m rise is close to flat).
- No wallColour, no signs: needs reference.
- Name: keep the current POI name "Karl-Lederer-Hauptschule Geretsried" (Alex 2026-10-25). Note: the school is being merged into the Adalbert-Stifter-Mittelschule by 2029–2031; look at the name again then.
- facade.ts: POI inside → `school`.

## In-game
- No hooks. Kind `school` is not IMPORTANT → no map label; pickups.ts skips schools.

## Sources
- https://www.geretsried.de/hochbauschulen
- SZ reporting on the Mittelschule merger (summarised in the parent research)
- OSM way 127604843, 188651575 (OSM API 2026-10-25)
- BVV DOP20 WMS + LoD2 tile 684_5302 (CC BY 4.0)
- reference/karl-lederer-mittelschule/SOURCES.md
