# Bistro Malor (restaurant/bistro/bar), Sudetenstraße 10 — `bistro-malor`

| Field | Value |
|---|---|
| POI | #120 "Bistro Malor", kind `food` (OSM node 9161424552, amenity=restaurant, cuisine pizza;burger;bistro) |
| Map x, y | 3929.9, 4632.5 m (69 m from start) |
| lat, lon | 47.858339, 11.482688 |
| Official | **Open**: bistro-malor.de (© 2026, menu PDF 2025): Sudetenstr. 10, 82538 Geretsried, +49 8171 911707; Mo–Sa 11:00–21:30, Su closed (site; OSM hours differ). Owner per Impressum: Amel Ramadanovic |
| OSM building | way **538512734** (6 corners, 742 m², bbox x 3913–3953, y 4626–4663), Sudetenstraße 10, SW side, W corner of Sudetenstraße/Kirchweg (Optik Kind + Bistro Malor). Same house as Optik Kind |
| Engine | levels 2, pitched; DOP tints `#b0aea6` / `#9b8c7d` / `#c4baae` / `#cab5a1` |
| Street frame | **Sudetenstraße** (tertiary, 8 m), street bearing 304°; kerb point (3939.0, 4618.6), 16.6 m; SW of the street |
| Position | NW part of way 538512734, **next to the KIND corner**: its terrace sits beside the KIND sign (website photo shows the KIND band behind the terrace; SV shows a terrace roof just past the KIND corner) |
| Status | **ref-done (partial)**: terrace + logo seen; the facade sign/lettering of the restaurant itself **needs reference** |

## Images
| File | What | Source |
|---|---|---|
| reference/bistro-malor/05-web-terrace.jpg | Key (web): terrace under a dark steel frame, wood tables with white runners, brown rattan chairs with tan cushions, white facade with tall glazed doors, the "KIND" band visible behind; no people | bistro-malor.de /de/restaurant/ (img_6189), date not stated |
| reference/bistro-malor/06-web-logo.png | Logo: dark-grey "B" block + red "ISTRO MALOR" wordmark | bistro-malor.de theme logo |
| reference/bistro-malor/07-crop-sv-terrace.png | 3× crop of optik-kind/01: past the KIND corner, a dark-red terrace roof/awning, hedges, a motorbike | crop of Street View (date not stated) |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Logo | dark-grey "B" block + red "ISTRO MALOR" (web logo; whether it hangs on the facade: **needs reference**) | red `#a82b1c`, grey `#464140` |
| Terrace | paved terrace with wood tables (white runners, flower vase) and brown rattan armchairs with tan cushions | — |
| Terrace roof | web photo: dark grey/black steel frame; SV: dark-red roof/awning. Differ in date/angle; **which is current needs reference** | — |
| Facade | white render, tall glazed double doors | — |
| Planting | low hedges/boxes around the terrace | — |

## Engine terms
- Terrace part (~8×5 m) on the NW part of way 538512734, street side (SW of Sudetenstraße): table + chair sprites, low hedge strip.
- No restaurant wallSign until a photo shows one. facade.ts: POI inside → `food`.

## In-game
- No hooks. Kind `food` is not IMPORTANT → **no map label** (overlay.ts: the HUD names it when near).

## Sources
- https://bistro-malor.de/ (hours), /de/kontakt/ (address), /de/impressum/, /de/restaurant/ (photos)
- OSM node 9161424552
- reference/bistro-malor/SOURCES.md
