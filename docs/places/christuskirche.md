# Christuskirche (Jeschkenstraße 125) — `christuskirche`

| Field | Value |
|---|---|
| POI | #233 "Christuskirche", kind `church` |
| Map x, y | 4193.1, 5389.8 m (767 m from the start) |
| lat, lon | 47.851528, 11.486217 |
| Official | Evangelisch-Freikirchliche Gemeinde (Baptisten) Geretsried, baptisten-geretsried.de; OSM check_date 2024-07-20 |
| OSM building | way **127872148** (building=church, 501 m², L-shape 32 × 21 m). Street front = edge 3 (20.8 m, faces 30°); edge 0 (12.3 m, faces 210°) |
| LoD2 | 4602043 gable ridge 9.4, eave 4.9 (church, 259 m²); 4602042 gable 7.5 / 4.9 (103 m²); small gables 4.0 and 4.8 m |
| Engine | levels 2, pitched `#7a6a59` |
| Status | **ref-done (partial)**: front seen (SV Sept 2023 + web photos agree); **bell turret position/height needs reference** |

## Images (reference/christuskirche/)
| File | What | Source |
|---|---|---|
| 01-street-front.png | White hall, six arched windows, tiled roof, white turret with cross, glazed porch | Street View, Sept 2023 |
| 02-side.png | Along Jeschkenstraße: turret, tiled roof, street trees | SV, Sept 2023 |
| 20-web-front.jpg | Street front: white hall, round-arched windows, glazed double door, brown tile roofs, cream side wing | baptisten-geretsried.de (reference only) |
| 21-web-innenhof.jpg | Courtyard: white gable, 4 tall lattice windows, small white tower with cross | same |
| 22 / 23 | Garden: timber pergola, swing, climbing tower | same |
| 10 / 11 | DOP20 ortho / with OSM outline | BVV, CC BY 4.0 |

## Look spec (only what's seen)
| Element | Seen | Hex |
|---|---|---|
| Walls | **white render**, single tall storey | SV `#9fa2ac` (shade, reads white) |
| Windows | **six round-arched windows**, dark frames | SV `#595d4e` |
| Roof | **red-brown tiles, hipped**, skylights; several gables from above | SV `#6b5958`; DOP `#544334` / `#695b4b` / `#9f7f6f` |
| Turret | small **white bell turret with a cross**, behind the ridge | SV `#8894aa` (shade, reads white) |
| Entrance | glazed, timber braces, under a porch roof; notice board in a wooden frame beside it | — |
| Name sign | **none seen** | — |
| Side wing | cream-yellow with a glass-block window (web 20) | — |

Hex note (SV shade bias): the SV wall/turret samples are shaded and read bluish (`#9fa2ac`, `#8894aa`) although the render is white. Use the engine off-white; the daylight web photos (reference/christuskirche/20–23) are the better colour reference for the walls.

## Engine terms
- #0b on 127872148: levels 2 stay (eave 4.9 m: 2 levels = 6 m is closer than 1 = 3 m), pitched, roof colour `#695b4b` (DOP; darker
  than today's `#7a6a59`). wallColour white (the engine's off-white, not lighter).
- No wallSign (no name sign). Arched windows: not modelled.
- Turret: a `tower` part fits (white, cross), but **position and height need reference** (LoD2 has no separate part) → leave out.

Credits: DOP20 / LoD2 © Bayerische Vermessungsverwaltung – www.geodaten.bayern.de (CC BY 4.0); © OpenStreetMap contributors (ODbL). Street View and website images: reference only, never shipped.
