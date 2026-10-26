# Carglass (Sudetenstraße 50) — `carglass`

| Field | Value |
|---|---|
| POI | #218 "Carglass", kind `car_repair` (OSM way 772887800, shop=car_repair, brand Carglass) |
| Map x, y | 4444.2, 4972.1 m (552 m from the start) |
| lat, lon | 47.855285, 11.489584 |
| Official | **Sudetenstraße 50** (standorte.carglass.de; OSM has no housenumber). Mo–Fr 8:00–12:15, 13:00–17:00; Sa/Su closed (OSM still lists Sa 9–13) |
| OSM building | way **772887800** (82 m², 12.5 × 6.6 m). Edges: 0 = 12.5 m facing 301°, 1 = 6.6 m facing 211°, 2 = 12.5 m facing 121°, 3 = 6.6 m facing 31° (nearest Sudetenstraße, 12 m). Car park 772887799 (operator Carglass GmbH). 2nd building on the lot: way 772887798 (159 m², 20 × 11 m) |
| LoD2 | 108848825 flat 3.6 m. 772887798 = 4602021 flat 3.1 m + 108848826 flat 3.6 m |
| Engine | 772887800: levels 2, flat `#c8c6c2` → too tall. 772887798: levels 2, **pitched** → wrong (LoD2 flat) |
| Status | **ref-done**: front, sign and colours seen (SV Sept 2023); front edge (2 or 3) needs a screenshot check |

## Images (reference/carglass/)
| File | What | Source |
|---|---|---|
| 01-street-front.png | Red kiosk at left, grey fascia with "CARGLASS", Opel garage behind | Street View, Sept 2023 |
| 02-side.png | Neighbour: 3-storey white house with dark timber gable trim (context only) | SV, Sept 2023 |
| 03-front-angle.png | Kiosk frontal from the road: red walls, fascia sign, red pole/barrier, cobbled forecourt | SV, Sept 2023 |
| 10 / 11 | DOP20 ortho / with OSM outline | BVV, CC BY 4.0 |

## Look spec (only what's seen)
| Element | Seen | Hex |
|---|---|---|
| Body | single-storey box, **red walls** | SV `#813b3c` (lit) / `#651a20` (shade) |
| Fascia | flat roof edge with a **dark grey fascia band** all round | SV `#5f6060` |
| Sign | **"CARGLASS"** in red capitals on the grey fascia, **yellow/red arrow blocks** at the left end (one letter hidden by a map pin in the capture) | letters ≈ wall red |
| Front | glass double door + 2 windows; door notice approx. "WIR HABEN GEOEFFNET" | — |
| Forecourt | cobbles; red pole/barrier in front; Opel garage with yellow Opel sign behind (a neighbour) | — |
| Roof | flat, light grey | DOP `#bcb8b3` / `#cdc8c4` / `#cdcdcd` |
| Bay door / workshop | not seen → **needs reference** | — |

Hex note (SV shade bias): the red wall and grey fascia are dark already and sample reliably; any light surface (roof edge, white trim) sampled from SV would read too dark/bluish: take the DOP or engine tone instead.

## Engine terms
- #0b on 772887800: `levels: 1`, `roof: { pitched: false, colour: '#cdc8c4' }`, `wallColour: '#813b3c'` (stays inside the dark palette).
- wallSign "CARGLASS" (red on grey `#5f6060`, arrow blocks left) as a fascia strip, z 2.6–3.2, full length of the front edge.
  **Front edge 3 (6.6 m, 31°) or 2 (12.5 m, 121°)**: check in a screenshot before writing the entry.
- 772887798 (same lot): `levels: 1`, `pitched: false` (LoD2 flat 3.1–3.6 m). Which business uses it: **needs reference**.
- Dark style: red is a hue fix on a small box; no lighter ground or roof tone.

Credits: DOP20 / LoD2 © Bayerische Vermessungsverwaltung – www.geodaten.bayern.de (CC BY 4.0); © OpenStreetMap contributors (ODbL). Street View and website images: reference only, never shipped.
