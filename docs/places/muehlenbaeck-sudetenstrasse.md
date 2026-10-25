# Mühlenbäck (Sudetenstraße 19) — `muehlenbaeck-sudetenstrasse`

| Field | Value |
|---|---|
| POI | #48 "Mühlenbäck", kind `bakery` (OSM node 1912667319, addr Sudetenstraße 19) |
| Map x, y | 4005.5, 4651.6 m (**8 m from the start**) |
| lat, lon | 47.858167, 11.483702 |
| Official | Bäckerei Mühlenbäck, Sudetenstraße 19, 82538 Geretsried. OSM hours Mo–Th 05:00–17:00, Fr 05:00–13:00, Sa 06:00–12:30, Su 07:00–11:00 |
| OSM building | way **127604891** (building=yes, no level/roof tags): 37.8 × 18.7 m, 7 nodes, long axis 124°/304° (parallel to Sudetenstraße). The same footprint holds the OSM nodes Angel Nails (4000.2, 4648.4) and HoangAnh (3992.7, 4644.1) |
| Engine | levels **2** (default for building=yes); pitched; DOP roof faces `#cab4a3` / `#84735e` / `#897b6c` |
| Street frame | **Sudetenstraße** (tertiary, 8 m). Closest centreline point (4000.0, 4659.7), 9.8 m from the node; street bearing 304°, n bearing (kerb → shop) 34° |
| Status | **ref-done** (exterior). Levels mismatch noted below |

## Images
| File | What | Source |
|---|---|---|
| reference/muehlenbaeck-sudetenstrasse/01-street-front.png | Front of the block: shopfronts left to right | Street View, **Aug 2022** (a Maps place card is overlaid mid-image) |
| reference/muehlenbaeck-sudetenstrasse/02-street-side.png | Sudetenstraße looking SE; kerb, no bay | same |
| reference/muehlenbaeck-sudetenstrasse/03-street-other.png | Sudetenstraße looking NW; neighbours, red awnings | same |
| reference/muehlenbaeck-sudetenstrasse/04-satellite.png | Roofs (red-brown pitched) | Google Maps satellite, aerial only |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Walls | cream render, **3 storeys** (ground floor of shops + 2 window rows), white window frames, grey roller-shutter boxes | `#edeadf` (sun), `#e9e4d9` |
| Roof | red-brown tiles, pitched, small chimney | SV `#a07c69`; DOP `#84735e`/`#cab4a3` |
| Ground floor (left → right in 01, i.e. NW → SE) | pink sign "…el Nails" (Angel Nails) · white sign "Mühlenbäck" with a red round logo + small "Bäckerei Konditorei" text, white/cream **awning** over the bakery window · a small **red** sign on the next shop (text unreadable) · a shop with a long **red awning** | pink `#ed779b`, awning `#fdf8ee`, red awning `#e06f6d` |
| Shopfront band | light grey fascia band over the shops | `#d4d4d9` |
| Pavement | wide pavement, bikes, sign boards; **no parking bay** in front (02) | — |
| Bakery window detail, sign lettering font, logo exact shape | not readable at this resolution → **needs reference** | — |
| The red-sign shop and red-awning shop (SE of the bakery) | not in OSM; names unreadable → **needs reference** (do not invent names) | — |

## Engine terms
- **Keep** the OSM footprint 127604891. **Levels: 2 in the engine vs 3 in the photo**: set a levels override of 3 via #0b.
- Frame: Sudetenstraße, the SW long edge of the footprint is the shop front.
- Top-down read: a red-brown pitched roof; from the play camera the shop-front strip on the SW edge carries the identity. Paint the "Mühlenbäck" white sign + red logo dot as a wall-sign strip, with the cream awning as a thin flat in front.
- facade.ts already gives this building the `shop` facade (bakery/shop POIs inside).
- Ask first: should the neighbouring Nails / red-awning shops get their own signs? (Nails = seen; others unreadable.)

## In-game
- This is the bakery **next to the start** (Sudetenstraße 19, payphone + start). It is **not** the courier pickup: `town-jobs.ts` `across()` picks the Mühlenbäck branch more than 300 m away = #46 "Bäckerei Mühlenbäck" (2849.3, 2775.7). Do not rename either POI (game.test.ts checks `toContain("Mühlenbäck")`).
- Waldmann is 148 m NW; Rehmaus Apotheke (courier drop) is 45 m SE on the same street side.
