# Gaststätte Isarwinkel (restaurant + hotel), Richard-Wagner-Straße 14 — `gaststaette-isarwinkel`

| Field | Value |
|---|---|
| POI | #177 "Gaststätte Isarwinkel", kind `food` (OSM way 119894071, amenity=restaurant, building; Mo–Su 10:00–14:00 + 17:00–22:30) |
| Map x, y | 3890.5, 4793.3 m (180 m from start) |
| lat, lon | 47.856893, 11.482160 |
| Official | **Richard-Wagner-Straße 14** (OSM), not Sudetenstraße. isarwinkel-geretsried.de: since 1963, restaurant + hotel; a **new hotel wing with 10 rooms opens 10 March 2027** (site text), so the building may change |
| OSM building | way **119894071** (7 corners, 298 m², bbox x 3877–3903, y 4782–4804); NW neighbour 119894069 = Sportschule Kubis / PT-Kubis dojo (satellite pin) |
| Engine | levels 2, **flat**, DOP `#97a099` (photos: pitched roof edge not visible; keep) |
| Street frame | **Richard-Wagner-Straße** (tertiary, 8 m), bearing 159°: kerb point (3871.6, 4800.4), 20.2 m; restaurant is E of the street (n bearing 69°); open car park on its S/E side (02) |
| Position | Street-facing W/SW front with the lettering; car park to the right in 02 |
| Status | **ref-done (partial)**: brewery logo on the pole sign unreadable |

## Images
| File | What | Source |
|---|---|---|
| reference/gaststaette-isarwinkel/01-street-front.png | Key: pale yellow-beige 3-storey house, lettering "GASTSTÄTTE ISARWINKEL", painted landscape mural, terracotta tile canopy over the entrance, red awnings, planters | Google Street View (date not stated by the capture; the Bodystreet pano in stroblume/02 carries a © 2023 Google watermark) |
| reference/gaststaette-isarwinkel/02-street-side.png | Wider: whole front, hedge, car park, pole sign right | Google Street View (date not stated by the capture; the Bodystreet pano in stroblume/02 carries a © 2023 Google watermark) |
| reference/gaststaette-isarwinkel/04-satellite.png | Own zoom-19 satellite: roofs between Richard-Wagner-Straße and Beethovenweg; pins Gaststätte Isarwinkel, Sportschule Kubis, Rehmaus Apotheke | Google Maps satellite |
| reference/gaststaette-isarwinkel/05-crop-pole-sign.png | 4× crop of 02: pole sign, brewery roundel (unreadable) over "Restaurant Isarwi[nkel]" | crop of 02 |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Wall | pale yellow-beige render, 3 storeys of white windows | `#b89a86` |
| Lettering | dark capitals "GASTSTÄTTE ISARWINKEL" on the wall above the awnings | — |
| Mural | painted landscape panel (mountains/meadow) upper right of the lettering | — |
| Entrance canopy | small terracotta tiled lean-to roof over the door | `#c8886f` |
| Awnings | red/pink fabric awnings along the ground floor | `#fbb2b0` (sun-bleached) |
| Garden | hedge, potted shrubs, wooden trellis screens in front; lanterns on the wall | — |
| Pole sign | round brewery sign (white with blue/red emblem, **unreadable → needs reference**) over a white board "Restaurant Isarwinkel" | — |

## Engine terms
- wallSign (lettering) + mural panel + tile lean-to + awning strip on the W (street) edge of way 119894071.
- Props: hedge strip, planters, pole-sign sprite at the car-park entrance (generic white board; brewery logo left out).
- Engine roof is flat; the photos don't show the roof: leave it.
- facade.ts: POI inside → `food`.

## In-game
- No hooks. Kind `food` is not IMPORTANT → **no map label** (overlay.ts: the HUD names it when near). New hotel wing from 2027 (website) is not in the photos: ignore.

## Sources
- https://www.isarwinkel-geretsried.de/
- OSM way 119894071
- reference/gaststaette-isarwinkel/SOURCES.md
