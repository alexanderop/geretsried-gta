# Bäckerei Manfred Burger (Benzweg 2) — `baeckerei-burger`

| Field | Value |
|---|---|
| POI | #106 "Bäckerei Manfred Burger", kind `bakery` (OSM node 7372551532) |
| Map x, y | 4384.4, 5254.9 m (720 m from the start) |
| lat, lon | 47.852742, 11.488782 |
| Official | burger-baeckerei.de: Benzweg 2, "Produktion mit Drive-In und Café" (OSM: Mo–Fr 5:30–17, Sa 5:30–12, Su 6:30–12) |
| OSM building | way **191449964** (building=retail, 570 m², 32.1 × 17.8 m). Front = edge 0 (32 m, faces 22°, Benzweg) |
| LoD2 | 107394164 "flat", ridge 8.4, eave 5.1 (452 m²); 108848883 flat 4.3 m (annex) |
| Engine | levels 1, pitched terracotta (`#a67868`…) |
| Status | **ref-done**: SV Sept 2023 settles the roof (**shallow pitched**, LoD2 "flat" is wrong) and shows **2 storeys**; drive-in not seen |

## Images (reference/baeckerei-burger/)
| File | What | Source |
|---|---|---|
| 01-street-front.png | 2 storeys: timber upper floor, white ground floor, pergola terrace, hanging sign | Street View, Sept 2023 |
| 02-side.png | Same from the corner: pergola, sign, lamp, construction fence | SV, Sept 2023 |
| 20-web-front-dusk.jpg | Small dusk shot: timber gable over glazing, white flat wing with "Burger" | burger-baeckerei.de (reference only) |
| 10 / 11 | DOP20 ortho / with OSM outline | BVV, CC BY 4.0 |

## Look spec (only what's seen)
| Element | Seen | Hex |
|---|---|---|
| Upper floor | **light-brown timber board cladding** | SV `#796255` |
| Ground floor | **white render**, glazing | no clean sample |
| Roof | **shallow pitched, wide overhang**, dark in SV; red-brown tiles from above | DOP `#a27969` / `#ab8569` / `#b88877` |
| Terrace | timber **pergola** with benches in front of edge 0; balcony with dark railing, external staircase | — |
| Sign | hanging cream board on the pergola: **"Bäckerei & Konditorei / Manfred Burger"** (pretzel logo, "Burger" large in brown script) + **"www.burger-baeckerei.de"** | SV `#958a81` (shade, reads cream) |
| Other | A-frame chalkboard at the right | — |
| Annex | white flat wing with "Burger" lettering (web photo) | — |
| Drive-in lane | **needs reference** | — |

Hex note (SV shade bias): the ground-floor render and sign board were sampled in shade (`#414153`, `#9d948c`) and read darker/bluer than they are (white render, cream board). Use engine off-white for the render; 20-web is a dusk photo, so it does not fix the colours either.

## Engine terms
- #0b on 191449964: `levels: 2`, `roof: { pitched: true, colour: '#a27969' }` (DOP, darkest quartile).
- bands: z 0–3 white render (use the engine's existing off-white, not lighter), z 3–6 timber `#796255`.
- wallSign "Bäckerei & Konditorei Manfred Burger" (brown on cream) on edge 0, z 2.2–2.9, `out` 0.4, at the W end
  (right in the SV, u ≈ 20–25 m of 32 by eye): **screenshot check**.
- Optional sprite: pergola posts/benches in front of edge 0.

Credits: DOP20 / LoD2 © Bayerische Vermessungsverwaltung – www.geodaten.bayern.de (CC BY 4.0); © OpenStreetMap contributors (ODbL). Street View and website images: reference only, never shipped.
