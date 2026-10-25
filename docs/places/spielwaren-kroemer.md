# Spielwaren Krömer, Sudetenstraße 20 — `spielwaren-kroemer`

| Field | Value |
|---|---|
| POI | #170 "Spielwaren Krömer", kind `shop` (OSM node 13180338083, shop=toys, addr Sudetenstraße 20). Spelling on the sign: **Krömer** |
| Map x, y | 4094.6, 4741.4 m (134 m from start) |
| lat, lon | 47.85736, 11.484897 |
| Official | Sudetenstraße 20; Mo–Fr 09–12:30 + 13–18, Sa 09–16 (OSM) |
| OSM building | way **120402849**: 899 m², NE edge (4117.4, 4755) → (4066.7, 4720.5), 61.4 m, bearing 304° |
| Engine | levels 2, pitched, DOP roof `#dfb594` / `#786252` |
| Street frame | **Sudetenstraße** (tertiary, 8 m): kerb point (4102.6, 4729.8), 14.1 m; street bearing 304°, n bearing 214° (SW side) |
| Position | NE frontage, u ≈ 26 m from the E corner (middle of the row) |
| Status | **ref-done** |

## Images
| File | What | Source |
|---|---|---|
| reference/spielwaren-kroemer/01-street-front.png | Key: white sign "Spielwaren Krömer" on the glass canopy, blue-framed windows, goods outside | Street View, **Sep 2023** |
| reference/spielwaren-kroemer/02-street-side.png | Looking along Sudetenstraße | same |
| reference/spielwaren-kroemer/04-satellite.png | Roofs + pins (identical file to sun-style/04) | Google Maps satellite |

(03 was removed: it showed the opposite side of the street.)

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Sign | white sign, "Spielwaren" in blue script + "Krömer", coloured swoosh | white; blue text small → **needs reference** for hex |
| Building | white render, blue window frames and **blue vertical stripes** on the facade, **yellow lintels** over the upper windows | wall `#cdd1d4`, stripe ≈ `#59779d`, lintel ≈ `#b5a955` |
| Canopy | glass canopy on blue steel struts along the ground floor | — |
| Shop front | blue-framed shop windows, door, toys and goods outside | — |
| Height | ground + at least 3 window rows (top cut in 01) — engine 2 | — |

## Engine terms
- White wall-sign panel on the canopy edge, middle of the NE frontage; glass canopy strip with blue struts.
- Facade texture: white with blue vertical stripes and yellow lintels (new texture, ask before adding).
- facade.ts: POI inside/near → `shop`.

## In-game
- No hooks; no map label (kind `shop`).
