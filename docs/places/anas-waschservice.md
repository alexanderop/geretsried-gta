# Ana's Waschservice / Wäscheservice, Händelstraße 2 — `anas-waschservice`

| Field | Value |
|---|---|
| POI | #16 "Ana’s Waschservice", kind `shop` (OSM node 370891567, shop=laundry, **no address in OSM**) |
| Map x, y | 3638.9, 4610.8 m (360 m from start) |
| lat, lon | 47.858534, 11.478787 |
| Official | Listings (golocal, firmenkatalog; undated/old): **"Ana's Wäscheservice", Händelstraße 2**, tel. 08171 380649. **zerowash.de (ZER-O-WASH, laundry pickup/delivery, "Jetzt neu in Geretsried, Wolfratshausen und Umgebung") gives Kontakt: Geretsried, Händelstraße 2** (awards 2024/2025 on the page). Whether ZER-O-WASH replaced Ana's or is the same operator: **unknown** |
| OSM building | way **127604869** (~550 m², ~27×46 m); the OSM address node **Händelstraße 2** (2330652840) sits on its outline → the address matches this building |
| LoD2 | DEBY_LOD2_4602766: **hipped roof, eave 20.4 m, ridge 21.9 m** (≈ 7 storeys) + a **4.6 m single-storey part** (72 m²) |
| Engine | levels 2, pitched, DOP roof colours → **far too low** (eave 20.4 m ≈ levels 7) |
| Street frame | **Künnekeweg** (residential, 6.5 m), bearing 109°; kerb point (3653.3, 4628.2), 22.6 m; building is NW of Künnekeweg, W of Neuer Platz |
| Position | Tall block W of the Neuer Platz plaza; where the laundry is (tower ground floor or the low part) is not seen |
| Status | **todo (needs reference; ask Alex)**: business identity unclear; massing known |

## Images
| File | What | Source |
|---|---|---|
| reference/anas-waschservice/01-dop20-ortho.jpg | Top-down orthophoto: roof colour, shape, yard | BVV DOP20, CC BY 4.0 |
| reference/anas-waschservice/02-dop20-osm-outline.jpg | 01 with the OSM outline (red) and the POI node (yellow) | 01 + OSM |
| reference/anas-waschservice/03-lod2-street-side.png | LoD2 3D massing seen from Künnekeweg (SE) (heights are real; walls are untextured) | BVV LoD2, CC BY 4.0 |
| reference/anas-waschservice/04-lod2-back.png | LoD2 massing from the opposite side | BVV LoD2, CC BY 4.0 |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Massing | ~7-storey block, hipped roof (eave 20.4 m, ridge 21.9 m) + 4.6 m low part (LoD2) | — |
| Roof | brown hipped roof (DOP) | `#a39179` (`#93856b`–`#ae9d83`) |
| Shop front, sign (Ana's or ZER-O-WASH) | not seen; zerowash.de images are stock photos (not kept) | needs reference |

## Engine terms
- Optional now (independent of the name question): #0b `levels: 7` on way 127604869 (LoD2 eave 20.4 m). The 4.6 m low part is not modelled.
- No sign until Alex decides the name and a photo exists.
- facade.ts: POI inside → `shop`.

## In-game
- No hooks. Kind `shop` is not IMPORTANT → **no map label** (overlay.ts: the HUD names it when near).

## Sources
- https://www.golocal.de/geretsried/heissmangeln/anas-waescheservice-M38Dw/
- https://zerowash.de/ (Kontakt: Händelstraße 2, fetched 2026-10-25)
- OSM node 370891567, way 127604869, address node 2330652840 (OSM API 2026-10-25)
- BVV DOP20 WMS + LoD2 tile 684_5302 (CC BY 4.0)
- reference/anas-waschservice/SOURCES.md
