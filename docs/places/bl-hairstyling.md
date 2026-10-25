# B&L Hairstyling, Sudetenstraße 28 — `bl-hairstyling`

| Field | Value |
|---|---|
| POI | #134 "B&L Hairstyling", kind `shop` (OSM node 10840276624, shop=hairdresser, addr Sudetenstraße 28) |
| Map x, y | 4196.7, 4804.3 m (253 m from start) |
| lat, lon | 47.856794, 11.486265 |
| Official | Sudetenstraße 28; Mo–Th 09–19, Fr 09–20, Sa 09–18 (OSM); website https://www.hairstyling-beni-leo.de/ |
| OSM building | way **119921782**: rectangle 54.9 × 13.6 m, NE edge (4182, 4792.3) → (4228.1, 4822.2) on Sudetenstraße |
| Engine | levels 3, pitched, DOP roof `#cab9ad` / `#6b6155` |
| Street frame | **Sudetenstraße** (tertiary, 8 m): kerb point (4201.7, 4796.6), 9.2 m; street bearing 303°, n bearing 213° (SW side, opposite the Am Stern car park) |
| Position | NE frontage, NW part; neighbour unit to the left (NW) is "Versicherungsmakler Dimitrios Georgiadis" |
| Status | **implemented (partial)** (B4-3, `src/world/places/bl-hairstyling.ts`): white SE houses and the cream NW house at the LoD2 9.8 m eaves, Georgiadis' GE window and board, B&L's logo-panel windows, glazing and black board over the door, the board on the roof. Guesses: see BACKLOG B4-3 "As built" |

## Images
| File | What | Source |
|---|---|---|
| reference/bl-hairstyling/01-street-front.png | Key: black B&L HAIRSTYLING board, logo panels in the windows, Georgiadis unit | Street View, Sudetenstraße |
| reference/bl-hairstyling/02-street-side.png | Context only: street + the neighbouring unit, **no B&L sign** | same |
| reference/bl-hairstyling/03-street-other.png | Same front from further away (white and cream parts) | same |
| reference/bl-hairstyling/04-satellite.png | Roofs, B&L pin | Google Maps satellite |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Sign | black board, white serif "B&L" + "HAIRSTYLING" | board `#212529`, text white |
| Window panels | "B&L" logo panels in the shop windows (black panel low in the window, white panel higher) | — |
| Shop front | white-framed glazing, door | — |
| Wall | cream render, white window frames | `#9e937f` (shaded) |
| Neighbour | "Versicherungsmakler Dimitrios Georgiadis" board + blue "GE" window graphics, in a **white** part of the frontage | — |
| Height | ground + 3 window rows = 4 storeys (03) — engine 3 | — |

## Engine terms
- Black wall-sign board on the NE frontage; second unit sign (Georgiadis) is optional.
- Whether the white and cream parts are one OSM outline or two: the outline is one rectangle → per-part wall colour **needs a decision** (#0b).
- facade.ts: POI inside → `shop`.

## In-game
- No hooks; no map label (kind `shop`).
