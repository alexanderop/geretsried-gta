# Karl-Lederer-Grundschule, Johann-Sebastian-Bach-Straße 4 — `karl-lederer-grundschule`

| Field | Value |
|---|---|
| POI | #228 "Karl-Lederer-Grundschule Geretsried", kind `school` (OSM relation 2014408: type=multipolygon, building=yes, amenity=school, J.-S.-Bach-Straße 4) |
| Map x, y | 3800.4, 4825.3 m (265 m from start) |
| lat, lon | 47.856605, 11.480952 |
| Official | Primary school, J.-S.-Bach-Straße 4. City (geretsried.de/hochbauschulen): general refurbishment 2004–2007 with a new break hall (Pausenhalle) and an extension; the two-storey extension got an extra **timber-frame storey** (planned mid-2018); G+O Architekten. gs-karl-lederer.de answered 502 (2026-10-25) |
| OSM building | relation **2014408**: outer way 127604842 (~2494 m², bbox x 3772–3829, y 4796–4855), inner courtyard way 156041502 (~413 m²). Turnhalle N of it: way 127872149 (building, leisure=sports_centre) |
| **Engine gap** | **The school building is not in the game.** scripts/import-osm.ts fetches only `way["building"]`, so multipolygon buildings (relations) are dropped. The POI (3800.4, 4825.3) sits in the courtyard of a building that does not exist in-game |
| LoD2 | 3 parts: DEBY_LOD2_4602864 (flat, main roofs 10.4 m + 9.5 m, small 12.2 m top, 1484 m²), 4602863 (low-pitch gable 9.7→10.3 m, 417 m²), 4602862 (flat 9.8 m, 142 m²). Turnhalle (4603333): flat 5.8 m |
| Engine | not built (see Engine gap) |
| Street frame | nearest named road Richard-Wagner-Straße is 75 m away; a service road S of the school at (3803.9, 4885.1), 59.9 m. Address street J.-S.-Bach-Straße runs S/SW |
| Position | Ring-shaped block around a courtyard, E of the Mittelschule; Turnhalle with a green roof directly N (01) |
| Status | **todo (needs facade reference + import fix)** |

## Images
| File | What | Source |
|---|---|---|
| reference/karl-lederer-grundschule/01-dop20-ortho.jpg | Top-down orthophoto: roof colour, shape, yard | BVV DOP20, CC BY 4.0 |
| reference/karl-lederer-grundschule/02-dop20-osm-outline.jpg | 01 with the OSM outline (red) and the POI node (yellow) | 01 + OSM |
| reference/karl-lederer-grundschule/03-lod2-street-side.png | LoD2 3D massing seen from the south (service road) (heights are real; walls are untextured) | BVV LoD2, CC BY 4.0 |
| reference/karl-lederer-grundschule/04-lod2-back.png | LoD2 massing from the opposite side | BVV LoD2, CC BY 4.0 |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Massing | ring around a courtyard, 3 parts, ~9.5–10.4 m (LoD2) ≈ 3 storeys | — |
| Roof | light grey flat roofs, one low gable wing (DOP + LoD2) | `#c0b8ab` (median; `#a6a392`–`#d1d1d1`) |
| Neighbours | Turnhalle N with a **green (planted) roof**; flat roof with **PV panels** E of the ring (DOP) | — |
| Walls, windows, entrance, timber storey | not seen | needs reference |

## Engine terms
- Blocked: first the import must keep multipolygon buildings (relation 2014408 with its courtyard hole). Fold this into I-1 or a small import item; then levels 3 (LoD2 ~10 m), flat light-grey roof.
- No wall colour, no signs: needs reference.
- facade.ts: POI inside → `school`.

## In-game
- No hooks. Kind `school` is not IMPORTANT → no map label; pickups.ts skips schools (no pickup spot).

## Sources
- https://www.geretsried.de/hochbauschulen
- OSM relation 2014408, ways 127604842 / 156041502 / 127872149 (OSM API 2026-10-25)
- scripts/import-osm.ts QUERY (way["building"] only), clone e1fcf8e
- BVV DOP20 WMS + LoD2 tile 684_5302 (CC BY 4.0)
- reference/karl-lederer-grundschule/SOURCES.md
