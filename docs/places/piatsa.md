# Piatsa (Lausitzer Straße 12) — `piatsa`

| Field | Value |
|---|---|
| POI | #79 "Piatsa", kind `food` (OSM node 3528911943, amenity=pub, outdoor_seating) |
| Map x, y | 4646.3, 4763.3 m (659 m from the start) |
| lat, lon | 47.857163, 11.492293 |
| Official | "Cafe Bar Piatsa", Lausitzer Str. 12, tel. 08171 529107; listed open. Same address: "Vegas Casino" (node 3528911971) |
| OSM building | way **189043196** (1154 m², 60.4 × 21.8 m). Front = edge 4 (60.4 m, faces 51°, towards Wallensteinstraße) |
| LoD2 | 4667505 gable ridge 8.1, eave 3.0 (779 m²); 4667415 gable 6.7 / 4.6 (223 m²); 108158757 flat 2.8 m (canopy, 83 m²) |
| Engine | levels 2, pitched, roof colours from the map (red/grey) → eave too high |
| Status | **ref-done (partial)**: building, roof, awning seen (SV Sept 2023); **sign text not legible → needs reference** |
| Which building | **Piatsa = the long single-storey restaurant in way 189043196 with the red tile roof, cream awning and green terrace screens (SV 01, Wallensteinstraße side, edge 4).** The OSM node sits in it and the terrace fits `outdoor_seating`. Photo 30 may show a **different unit** (see below) |

## Images (reference/piatsa/)
| File | What | Source |
|---|---|---|
| 01-street-front.png | Single-storey restaurant, red tile hip roof, cream awning, green terrace screens, pole sign | Street View, Sept 2023 |
| 02-side.png | Wallensteinstraße looking S; red roof behind hedge/fence and pole sign | SV, Sept 2023 |
| 30-web-gmaps-streetview-building.jpg | Google's Street View thumbnail on the Piatsa listing ("12 Lausitzer Str."): small **white** single-storey building, white timber-clad gable, red-brown tile edge, two roller shutters, small dark board (illegible). **May be a different unit** (e.g. the Lausitzer Straße face, Vegas Casino, or a neighbour), not the restaurant front in 01. Not used for the look | Google SV via the listing, Sept 2023 |
| 10 / 11 | DOP20 ortho / with OSM outline | BVV, CC BY 4.0 |

## Look spec (only what's seen)
| Element | Seen | Hex |
|---|---|---|
| Body | **single storey**, dark brick-brown lower facade | SV `#3f3a34` |
| Roof | **red/orange clay tiles, hipped** (engine: gable) | SV `#a67362`, DOP `#a67763` / `#b47c62` |
| NW part | light grey/white roof | DOP `#e3dee1` |
| Awning | cream/white awning along the front | SV `#e9dcc6` |
| Terrace | green screens at the right end | SV `#536b45` |
| Pole sign | dark round-top pole sign in front; small "M…" logo at the roof edge; **text not legible → needs reference** | — |

Hex note: the SV samples above come from Street View in mixed sun/shade; light surfaces (awning) read darker/greyer than they are. Use them as the dark-style tone, not as true colour.
| Listing photo (30) | white rendered part with white timber gable and roller shutters. Google's listing thumbnail is placed by address, not by a sign, so it **may be a different unit**; the look spec uses 01 only | — |
| Which unit is Piatsa vs Vegas Casino | taken as the red-roofed restaurant front (01); a photo with the Piatsa sign would confirm it: **needs reference** | — |

## Engine terms
- #0b on 189043196: `levels: 1` (main eave 3.0 m), `pitched: true` stays (no hip roof in the engine), keep the map roof colours.
- Optional: cream awning strip as a plain wallSign on edge 4, z 2.3–2.7, `out` 0.6; u range **needs a screenshot**.
- No sign until the text is readable. Dark style: no lighter tone added (the awning is a thin strip only).

Credits: DOP20 / LoD2 © Bayerische Vermessungsverwaltung – www.geodaten.bayern.de (CC BY 4.0); © OpenStreetMap contributors (ODbL). Street View and website images: reference only, never shipped.
