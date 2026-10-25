# Stroblume (florist), Sudetenstraße 15 — `stroblume`

| Field | Value |
|---|---|
| POI | #155 "Stroblume", kind `shop` (OSM node 12211219348, shop=florist, Mo–Fr 08:30–14:30 + 17:00–18:00, Sa 08:30–12:30) |
| Map x, y | 3973.7, 4631.2 m (29 m from start) |
| lat, lon | 47.858351, 11.483276 |
| Official | Sudetenstraße 15 (OSM) |
| OSM building | way **127604887** (8 corners, 668 m², bbox x 3953–3993, y 4598–4641), Sudetenstraße 11–15 (VR-Bank, Bodystreet, Stroblume, Dolce Gelato, NW→SE) |
| Engine | levels 2, pitched; DOP wall tints `#987c64` / `#cfb8a0` / `#b99782` |
| Street frame | **Sudetenstraße** (tertiary, 8 m), street bearing 304°; kerb point (3968.7, 4638.5), 8.9 m; NE of the street |
| Position | Middle of way 127604887: between Bodystreet (NW) and Dolce Gelato (SE) |
| Status | **ref-done** |

## Images
| File | What | Source |
|---|---|---|
| reference/stroblume/01-street-front.png | Key: long red awning with white script "Stroblume" and a flower logo, plant tables and pots on the pavement, heart-shaped sign | Google Street View (date not stated by the capture; the Bodystreet pano in stroblume/02 carries a © 2023 Google watermark) |
| reference/stroblume/02-street-side.png | Looking NW: Bodystreet front left, Stroblume awning right | Google Street View, © 2023 Google watermark |
| reference/stroblume/05-crop-bodystreet.png | 2× crop of 02: the Bodystreet EMS gym front (not in the map; see Gyms) | crop of 02 |
| reference/stroblume/04-satellite.png | Shared wide satellite of the start block (zoom 20); pins VR Bank, Bodystreet, Stroblume, Dolce Gelato, HoangAnh, Aktionshaus M&A | Google Maps satellite |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Awning | red fabric awning along the front, white script "Stroblume" and a small flower/sun logo on the valance | `#d25f5e` |
| Wall | beige render above | `#c4bba2` |
| Pavement display | a wooden table/trough full of potted plants and flowers, pots on the ground, a red heart sign on a stand | — |
| Shop windows | dark glass behind the plants | — |
| Neighbour (Bodystreet) | black fascia band with white/red "BODY STREET" logo and "Weil 20 Minuten Training reichen.", maroon scalloped awning, grey stone base | band `#181718` |

## Engine terms
- Awning strip (~10 m, red) with the Stroblume script on the NE edge, middle of way 127604887.
- Props: plant table + pot sprites and a heart sign on the pavement (keep ≥2 m clear).
- facade.ts: POI inside → `shop`.

## In-game
- No hooks. Kind `shop` is not IMPORTANT → **no map label** (overlay.ts: the HUD names it when near).
- Bodystreet (Sudetenstr. 13, NW neighbour) is a gym missing from the map (Gyms / G-1); its front is in 02/05.

## Sources
- OSM node 12211219348 (Overpass 2026-10-25)
- reference/stroblume/SOURCES.md
