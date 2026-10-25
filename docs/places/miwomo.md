# miwomo (motorhome rental) / THOMA Reisemobile, Breslauer Weg 9 — `miwomo`

| Field | Value |
|---|---|
| POI | #138 "miwomo", kind `shop` (OSM node 11469126123, shop=caravan, operator THOMA Reisemobile, website thoma-reisemobile.de, addr Breslauer Weg 9) |
| Map x, y | 4126.5, 4435.7 m (248 m from start) |
| lat, lon | 47.860109, 11.485324 |
| Official | **miwomo GmbH** (motorhome rental, Breslauer Weg 9; registered there since 10.01.2024). miwomo.de (© 2022–2026): "Zum Jahresende schließen wir unsere Wohnmobilvermietung" → **the rental closes at the end of 2026**. Same address: **THOMA Reisemobile** (Eberhard Thoma, "Caravan-Doktor": repairs, Truma dealer, gas checks), "Servicestandort Breslauer Weg 9", site © 2026, appointment only |
| OSM building | way **127872177** (Breslauer Weg 9, building=yes, ~335 m², ~25×18 m); ShishaBar next door in way 127872197 (no. 11) |
| LoD2 | DEBY_LOD2_4603062: **flat roof, 7.9 m** high, 307 m² |
| Engine | levels 2, flat, roof `#f5ece5` (matches LoD2 + DOP: no change needed) |
| Street frame | **Tattenkofener Straße** (secondary, 9 m), bearing 99°; kerb point (4130.7, 4408.0), 28.1 m; a service road passes 18.3 m away at (4117.6, 4451.7) |
| Position | Single free-standing block on a yard N of Breslauer Weg; vans/motorhomes parked around it (01) |
| Status | **todo (needs facade reference)**: massing + roof known; no sign seen. **Question for Alex** (rename after the closure?) |

## Images
| File | What | Source |
|---|---|---|
| reference/miwomo/01-dop20-ortho.jpg | Top-down orthophoto: roof colour, shape, yard | BVV DOP20, CC BY 4.0 |
| reference/miwomo/02-dop20-osm-outline.jpg | 01 with the OSM outline (red) and the POI node (yellow) | 01 + OSM |
| reference/miwomo/03-lod2-street-side.png | LoD2 3D massing seen from Tattenkofener Straße (N) (heights are real; walls are untextured) | BVV LoD2, CC BY 4.0 |
| reference/miwomo/04-lod2-back.png | LoD2 massing from the opposite side | BVV LoD2, CC BY 4.0 |
| reference/miwomo/06-web-logo.png | miwomo logo (black/white roundel with a camper van and mountains), website | miwomo.de, © miwomo GmbH, reference only |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Massing | single box, flat roof, 7.9 m (LoD2) ≈ 2 storeys | — |
| Roof | very light, almost white flat roof (DOP) | `#f6ebe5` |
| Yard | paved yard around it with parked white vans/motorhomes (DOP) | — |
| Walls | Street View (Nov 2022, reported by the parent, no capture kept): **grey two-storey workshop with red trim, behind trees, no sign** | needs reference (no hex) |
| Sign | none seen (no miwomo or THOMA sign on the building) | needs reference |

## Engine terms
- Massing is already right (engine levels 2 + flat light roof). Nothing to add until a facade photo exists.
- Do not put the miwomo logo on the wall: it was never seen on the building, and the rental closes at the end of 2026.
- facade.ts: POI inside → `shop`.

## In-game
- No hooks. Kind `shop` is not IMPORTANT → **no map label** (overlay.ts: the HUD names it when near).
- If Alex renames the POI to THOMA Reisemobile, kind stays `shop` (OSM shop=caravan).

## Sources
- https://miwomo.de/ (closure notice, fetched 2026-10-25)
- https://thoma-reisemobile.de/ (Breslauer Weg 9 service site)
- OSM node 11469126123, way 127872177 (OSM API 2026-10-25)
- BVV DOP20 WMS + LoD2 tile 684_5302 (CC BY 4.0)
- reference/miwomo/SOURCES.md
