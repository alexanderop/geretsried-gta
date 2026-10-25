# Nexial IT-Services, Marienburgweg / Sudetenstraße corner — `nexial`

| Field | Value |
|---|---|
| POI | #114 "Nexial", kind `shop` (OSM node 9018455328: **shop=hairdresser** with description "Computer" — the sign says **IT-Services**, so the OSM shop tag is wrong; do not dress it as a hairdresser) |
| Map x, y | 4159, 4743.5 m (187 m from start) |
| lat, lon | 47.857341, 11.48576 |
| Official | Mo–Fr 08:00–18:00 (OSM). No address tag |
| OSM building | way **127872184** (west complex, B3-0) |
| Engine | levels 2, pitched, DOP roof `#cda887` / `#bd8269` |
| Street frame | **Marienburgweg** (residential, 6.5 m): kerb point (4146.1, 4734.3), 15.8 m; Sudetenstraße is 20.4 m (4147.3, 4760.2) |
| Position | **NW edge** of 127872184, u ≈ 43 m from the N corner, i.e. near the W corner at Sudetenstraße. Paved parking in front (01). Which exact face: **verify** (node position + 01 point to the NW face) |
| Status | **ref-done** |

## Images
| File | What | Source |
|---|---|---|
| reference/nexial/01-street-front.png | Key: white "nexial IT-SERVICES" panel high on the wall; dark fascia "Württembergische Versicherungsagentur Stricker & Reinhart" below; glazing, canopy, hedge, paved parking | Street View |
| reference/nexial/02-street-side.png | Building end: white block with balconies | same |
| reference/nexial/04-satellite.png | West complex from above | Google Maps satellite |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Sign | white panel on the upper wall, "nexial" + "IT-SERVICES" in dark/teal | panel `#b0bdcd` (shade) |
| Second sign | dark fascia below: "Württembergische Versicherungsagentur Stricker & Reinhart" (Württembergische is a separate business, not a POI here) | `#5b7088` |
| Shop front | dark-framed glazing | — |
| Canopy | dark steel canopy over the ground floor | — |
| Building | white render, balconies above | `#95a0ae` (shade) |
| Front | hedge, paved parking | — |

## Engine terms
- Two wall signs on the same unit: high white panel (Nexial) + lower dark fascia (insurance agency).
- Part of the B3-0 west complex.
- facade.ts: POI inside → `shop`.

## In-game
- No hooks; no map label (kind `shop`). HUD name stays "Nexial".
