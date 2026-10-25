# Hair & Style Bellini, Neuer Platz 22 — `bellini`

| Field | Value |
|---|---|
| POI | #159 "Bellini", kind `shop` (OSM node 12427142627, shop=hairdresser, check_date 2024-12-17) |
| Map x, y | 3668.4, 4674.7 m (330 m from start) |
| lat, lon | 47.857959, 11.479182 |
| Official | **Hair & Style Bellini** (Margot Bellini), **Neuer Platz 22**, friseur-maryrose.de, Tue–Fri 9–18, Sat 7–12. **Not the same place as Restaurant Ammos** (Neuer Platz 9, ~33 m NNW, own building); the Street View photosphere labelled "Restaurant 'Ammos'" that the Bellini coords hit was misleading |
| OSM building | way **127604892** (L-shaped block, ~2441 m², bbox ~121×119 m) along the E side of Neuer Platz; one mapper put several other business nodes in it. Address node Neuer Platz 22 sits on its **E** outline at (3681, 4669) |
| LoD2 | 11 segments; Bellini's DEBY_LOD2_4602775: **gable, eave 12.2 m, ridge 14.4 m** + a **3.9 m single-storey flat part** (33 m²). Whole block: eaves 12.2–13.6 m, ridges 14.4–16.0 m, gable + 2 hipped ends |
| Engine | levels 2, pitched, DOP roof colours → **too low** (eave ~12.5 m ≈ levels 4) |
| Street frame | **Neuer Platz** (residential, 6.5 m), bearing 111°; kerb point (3648.9, 4666.8), 21.0 m; a service road runs on the E side, 16.1 m, at (3683.6, 4669.5) |
| Position | Long block with the pedestrian Neuer Platz (fountain, trees) on its W side and a car park on the E side. **Which side the salon faces is not seen** |
| Status | **todo (needs facade reference)**: massing + roof + logo known. **Question for Alex** (POI name) |

## Images
| File | What | Source |
|---|---|---|
| reference/bellini/01-dop20-ortho.jpg | Top-down orthophoto: roof colour, shape, yard | BVV DOP20, CC BY 4.0 |
| reference/bellini/02-dop20-osm-outline.jpg | 01 with the OSM outline (red) and the POI node (yellow) | 01 + OSM |
| reference/bellini/03-lod2-street-side.png | LoD2 3D massing seen from the E (car-park side) (heights are real; walls are untextured) | BVV LoD2, CC BY 4.0 |
| reference/bellini/04-lod2-back.png | LoD2 massing from the opposite side | BVV LoD2, CC BY 4.0 |
| reference/bellini/06-web-logo.png | Website logo: "HAIR&STYLE" thin light-grey capitals + purple script "Bellini" (transparent PNG) | friseur-maryrose.de, reference only |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Massing | 4-storey-high block (eave ~12.2 m), shallow gable, ridge 14.4 m; small single-storey part 3.9 m at this segment (LoD2) | — |
| Roof | brown pitched roof (DOP) | `#a29078` (`#887962`–`#b09e88`) |
| Logo (website) | "HAIR&STYLE" light grey + purple script "Bellini" | grey `#d3cfcf`, purple `#86639b` |
| Shop front, sign, which side | not seen | needs reference |

## Engine terms
- Optional now: #0b `levels: 4` on way 127604892 (affects the whole block, also its other tenants; LoD2 eaves 12.2–13.6 m).
- No wallSign until a photo shows the salon front (plaza W side or car-park E side).
- facade.ts: POI inside → `shop`.

## In-game
- No hooks. Kind `shop` is not IMPORTANT → **no map label** (overlay.ts: the HUD names it when near).

## Sources
- https://www.friseur-maryrose.de/
- OSM node 12427142627, way 127604892, address node 2330656356 (OSM API 2026-10-25)
- BVV DOP20 WMS + LoD2 tile 684_5302 (CC BY 4.0)
- reference/bellini/SOURCES.md
