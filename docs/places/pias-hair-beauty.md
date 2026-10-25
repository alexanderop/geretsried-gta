# Pia's Hair & Beauty, Johann-Sebastian-Bach-Straße 11a — `pias-hair-beauty`

| Field | Value |
|---|---|
| POI | #161 "Pia's Hair & Beauty", kind `shop` (OSM node 12430682959, check_date 2025-08-07) |
| Map x, y | 3756.8, 4910.1 m (356 m from start) |
| lat, lon | 47.855842, 11.480368 |
| Official | **Pia's Hair & Beauty GmbH**, J.-S.-Bach-Str. 11a (registered 28.01.2025, HRB 149343). OSM address node "Johann-Sebastian-Bach-Straße 11 a" sits on the building outline |
| OSM building | way **127604860** (building=yes, ~276 m²) |
| LoD2 | DEBY_LOD2_4602885: **gable, eave 6.8 m, ridge 10.0 m**, 244 m² |
| Engine | levels 2, pitched, DOP roof colours (matches LoD2) |
| Street frame | **Haydnweg** (residential, 6.5 m), bearing 68°; kerb point (3761.7, 4922.5), 13.3 m; building is N of Haydnweg |
| Position | Corner of Haydnweg / J.-S.-Bach-Straße; flat-roofed buildings W of it (01) |
| Status | **todo (needs facade reference)**: massing + roof known; no sign seen |

## Images
| File | What | Source |
|---|---|---|
| reference/pias-hair-beauty/01-dop20-ortho.jpg | Top-down orthophoto: roof colour, shape, yard | BVV DOP20, CC BY 4.0 |
| reference/pias-hair-beauty/02-dop20-osm-outline.jpg | 01 with the OSM outline (red) and the POI node (yellow) | 01 + OSM |
| reference/pias-hair-beauty/03-lod2-street-side.png | LoD2 3D massing seen from Haydnweg (S) (heights are real; walls are untextured) | BVV LoD2, CC BY 4.0 |
| reference/pias-hair-beauty/04-lod2-back.png | LoD2 massing from the opposite side | BVV LoD2, CC BY 4.0 |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Massing | 2 storeys + pitched roof, eave 6.8 m, ridge 10.0 m (LoD2) | — |
| Roof | red/orange tiled gable roof with several roof windows/dormers (DOP) | `#d8a384` (`#8c7160` shade – `#e3ad8b`) |
| Walls | Street View (reported by the parent, no capture kept): **cream residential block, red roof, no sign** on the Haydnweg side | needs reference (no hex) |
| Sign, shop entrance (11a) | not seen | needs reference |

## Engine terms
- Massing already right (levels 2, pitched, DOP roof). Nothing to add until a photo shows the salon entrance/sign.
- facade.ts: POI inside → `shop`.

## In-game
- No hooks. Kind `shop` is not IMPORTANT → **no map label** (overlay.ts: the HUD names it when near).

## Sources
- Handelsregister HRB 149343 (Pia's Hair & Beauty GmbH, 28.01.2025), via the parent research
- OSM node 12430682959, way 127604860, address node 2330673928 (OSM API 2026-10-25)
- BVV DOP20 WMS + LoD2 tile 684_5302 (CC BY 4.0)
- reference/pias-hair-beauty/SOURCES.md
