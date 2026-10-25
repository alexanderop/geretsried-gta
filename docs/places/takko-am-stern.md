# Takko Fashion, Sudetenstraße 29b — `takko-am-stern`

| Field | Value |
|---|---|
| POI | #81 "Takko Fashion", kind `shop` (OSM node 3634202113, shop=clothes, addr Sudetenstraße 29b) |
| Map x, y | 4195.3, 4751.3 m (223 m from start) |
| lat, lon | 47.857271, 11.486247 |
| Official | Sudetenstraße 29b, Mo–Sa 09:00–20:00 (koomio, golocal listings). No store photo on takko.com |
| OSM building | way **127872184** (west complex, shared with Denns and Orterer; see denns-biomarkt.md) |
| Engine | levels 2, pitched, terracotta DOP roof `#cda887` / `#bd8269` |
| Street frame | **Sudetenstraße** (tertiary, 8 m): kerb point (4176.6, 4780.5), 34.6 m from the node; street bearing 303°, n bearing 33° |
| Position | **middle unit** of the SW frontage (between Denns NW and Orterer SE), from takko/01–02 and denns/01 |
| Status | **ref-done** |

## Images
| File | What | Source |
|---|---|---|
| reference/takko-am-stern/01-street-front.png | Key: yellow-orange TAKKO panel on the white band, glazed front; Orterer logo right (= orterer/02) | Street View, Sudetenstraße |
| reference/takko-am-stern/02-street-side.png | Looking NW: Orterer arcade in front, TAKKO further on | same |
| reference/takko-am-stern/03-street-other.png | SE corner with arcade and crates (= orterer/03) | same |
| reference/takko-am-stern/04-satellite.png | West complex from above | Google Maps satellite |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Sign | rectangular **yellow-orange panel** with dark "TAKKO" lettering, on the white band | `#e9cb76` (sunlit, slightly washed) |
| Shop front | glazing with window displays | — |
| Block above | white balcony block (same as Denns) | `#fcfcfe` |
| Exact lettering colour / logo detail | small at this resolution → **needs reference** | — |

## Engine terms
- Wall-sign panel (square-ish, not a full-width strip) on the middle of the SW frontage; glass strip under it.
- Same footprint/levels caveat as Denns (B3-0).
- facade.ts: POI inside → `shop`.

## In-game
- No hooks. Kind `shop` is not IMPORTANT → **no map label** (overlay.ts: "the HUD names the rest when you are near"). From above, the panel and the HUD name are the only cues.
