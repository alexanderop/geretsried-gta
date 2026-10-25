# Munzur Kebap (Neuer Platz 3) — `munzur-kebap`

| Field | Value |
|---|---|
| POI | #57 "Munzur Kebap", kind `food` (OSM node 2599419101; old_name Metzgerei Knöbl) |
| Map x, y | 3607.4, 4689.2 m (393 m from the start) |
| lat, lon | 47.857829, 11.478365 |
| Official | Munzur Kebap & Imbiss, Neuer Platz 3, 82538 Geretsried, tel. +49 8171 9977088, Mo–Fr 8–18:30, Sa 9–16:30 |
| OSM building | way **127604896** (shared with Feinkost Christos #160) |
| Engine | levels 1, pitched = true → wrong (flat roof, see feinkost-christos.md) |
| Street frame | Neuer Platz (the car-park side, S). Front = **edge 4** (16.5 m, faces 202°) and probably the corner to edge 3 (8.1 m, faces 112°) |
| Status | **ref-done (partial)**: front seen; unit width and exact edge need a screenshot check |

## Images (reference/munzur-kebap/)
| File | What | Source |
|---|---|---|
| 01-street-front.png | Munzur's glazed corner pavilion from the car park | Street View |
| 02-side.png | Whole low complex from the car park: HUK-Coburg pavilion left, Munzur right, bollards | SV |
| 03-street-context.png | Händelstraße looking at J.-S.-Bach-Straße: Sparkasse, **Italy** pavilion in the background (see italy.md) | SV |
| 04-satellite.png | Complex from above (Google POI labels) | Google satellite |
| 10 / 11 | DOP20 ortho / with OSM outline | BVV, CC BY 4.0 |

## Look spec (only what's seen)
| Element | Seen | Hex (SV sample) |
|---|---|---|
| Body | single storey; floor-to-fascia glazing in **dark brown frames**; plain render wall left of the glazing; beige stone-clad corner pier | frame `#372c2e`, pier `#998665` |
| Roof edge | **flat roof**, deep **white/light grey fascia** band | `#d3d6df` |
| Sign | **black panel with yellow-green "MUNZUR"** and white curly ornaments, hanging behind the glass at the corner; a small coloured LED "open" sign in the next window | panel ≈ black, letters ≈ `#c8d040` (by eye) |
| Terrace | white parasols in front, yellow parasols of the neighbour further right | — |
| Front | cars parked nose-in directly in front (car park), grey bollards along the walk | — |

## Engine terms
- Roof flat via the 127604896 entry (feinkost-christos.md); no extra levels.
- wallSign "MUNZUR" (yellow-green on black, ~2.0 × 0.5 m) on edge 4 near its SE end (u ≈ 11–13 m), z 2.0–2.5.
- Optional: one white parasol sprite in front of the glazing.
- Hex of the letters is by eye (small in SV) → **needs a closer reference** before painting the sprite.

Credits: DOP20 / LoD2 © Bayerische Vermessungsverwaltung – www.geodaten.bayern.de (CC BY 4.0); © OpenStreetMap contributors (ODbL). Street View / satellite / website images: reference only, never shipped.
