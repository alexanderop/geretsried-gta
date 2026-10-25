# Friseurteam Haar Genau, Carl-Maria-von-Weber-Weg 34 — `haar-genau`

| Field | Value |
|---|---|
| POI | #54 "Haar Genau Friseurteam", kind `shop` (OSM node 2330643907, shop=hairdresser, Carl-Maria-von-Weber-Weg 34, check_date 2024-12-17) |
| Map x, y | 3734.1, 4574 m (274 m from start) |
| lat, lon | 47.858865, 11.480063 |
| Official | friseurteam-haargenau.com (active): Carl-Maria-von-Weber-Weg 34, Tue–Fri 8–18, Sat 7:30–13. Moved here in June 2019 (Gelbes Blatt 2021). OSM phone/hours differ from the website |
| OSM building | way **127604894** (Carl-Maria-von-Weber-Weg 34, ~472 m²) |
| LoD2 | DEBY_LOD2_4602880: **flat**, main roof **16.2 m** (275 m²), rooftop box 18.9 m (50 m²), low part 4.1 m (35 m²) |
| Engine | levels 2, flat, roof `#b4aa9b` → **too low** (LoD2 16.2 m ≈ levels 5) |
| Street frame | **Carl-Maria-von-Weber-Weg** (residential, 6.5 m), bearing 106°; kerb point (3738.5, 4558.9), 15.7 m; shop is S of the street |
| Position | Free-standing block S of Carl-Maria-von-Weber-Weg; which side and floor the salon uses is not seen |
| Status | **todo (needs facade reference)**: massing + roof + logo known |

## Images
| File | What | Source |
|---|---|---|
| reference/haar-genau/01-dop20-ortho.jpg | Top-down orthophoto: roof colour, shape, yard | BVV DOP20, CC BY 4.0 |
| reference/haar-genau/02-dop20-osm-outline.jpg | 01 with the OSM outline (red) and the POI node (yellow) | 01 + OSM |
| reference/haar-genau/03-lod2-street-side.png | LoD2 3D massing seen from Carl-Maria-von-Weber-Weg (N) (heights are real; walls are untextured) | BVV LoD2, CC BY 4.0 |
| reference/haar-genau/04-lod2-back.png | LoD2 massing from the opposite side | BVV LoD2, CC BY 4.0 |
| reference/haar-genau/06-web-logo.jpg | Website header logo: "FRISEURTEAM" small caps over "HAAR GENAU", the G drawn as a scissors mark | friseurteam-haargenau.com (Jimdo), reference only |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Massing | flat-roof block 16.2 m (LoD2) ≈ 5 storeys, a rooftop box to 18.9 m, a small 4.1 m low part | — |
| Roof | grey flat roof with a raised box (DOP) | `#aaac9e` |
| Logo (website) | teal-green "HAAR" + dark "GENAU", scissors-G; small "FRISEURTEAM" above | green `#05e49a`, dark `#25170e` |
| Facade, shop front, sign position | not seen (website photos are interior only, not used) | needs reference |

## Engine terms
- Optional now: #0b `levels: 5` on way 127604894 (LoD2 16.2 m = 5×3 + 0.6 parapet); roof stays flat. The 18.9 m box and the 4.1 m part are not modelled.
- No wallSign until a facade photo shows where the sign is. facade.ts: POI inside → `shop`.

## In-game
- No hooks. Kind `shop` is not IMPORTANT → **no map label** (overlay.ts: the HUD names it when near).

## Sources
- https://www.friseurteam-haargenau.com/
- OSM node 2330643907, way 127604894 (OSM API 2026-10-25)
- BVV DOP20 WMS + LoD2 tile 684_5302 (CC BY 4.0)
- reference/haar-genau/SOURCES.md
