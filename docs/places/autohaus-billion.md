# Autohaus Billion (VW / Audi / Seat / Škoda), Sudetenstraße 25 — `autohaus-billion`

| Field | Value |
|---|---|
| POI | #178 "Audi;Seat;Škoda;Volkswagen", kind `shop` (OSM way 120402846, shop=car, **name "Autohaus Billion"**, brand "Audi;Seat;Škoda;Volkswagen", operator Florian Billion, Mo–Fr 08–18, Sa 09–12) |
| Naming | The POI shows the brand list because build.ts uses `brand ?? name`. Real name **Autohaus Billion Geretsried GmbH** (website, OSM name, side sign). "Autohaus Jorde(n)" is a different business on Kirchweg (satellite pin), not this one. Capture note said "Sudetenstr. 18"; website + OSM say **Sudetenstraße 25** |
| Map x, y | 4071.5, 4676.3 m (79 m from start) |
| lat, lon | 47.857945, 11.484587 |
| Official | Sudetenstraße 25, VW Servicepartner, since 1969 (autohaus-billion.de) |
| OSM building | way **120402846** (14 corners, 1987 m², bbox x 4034–4108, y 4650–4702); the POI is the building centre |
| Engine | levels 2, pitched; DOP tints `#ada691` / `#eee9e7` / `#c7a992` |
| Street frame | **Sudetenstraße** (tertiary, 8 m), street bearing 304°; kerb point (4056.5, 4698.1), 26.5 m (deep forecourt); NE of the street |
| Position | Long showroom block along Sudetenstraße, SE of the Mühlenbäck building, cars parked on a paved forecourt; VW pylon + flags at the NW end |
| Status | **ref-done** (name question open) |

## Images
| File | What | Source |
|---|---|---|
| reference/autohaus-billion/01-street-front.png | Key: white 2-storey block, terracotta awnings over the showroom windows, white plate "Autohaus B…" (tree hides the rest), VW pylon "Service", 3 flagpoles, cars on the forecourt | Google Street View (date not stated by the capture; the Bodystreet pano in stroblume/02 carries a © 2023 Google watermark) |
| reference/autohaus-billion/02-street-side.png | Wider: whole frontage, forecourt with cars, delivery van | Google Street View (date not stated by the capture; the Bodystreet pano in stroblume/02 carries a © 2023 Google watermark) |
| reference/autohaus-billion/03-street-other.png | Close side view: blue-grey sign "Autohaus Billion" on the side, glass showroom entrance | Google Street View |
| reference/autohaus-billion/05-crop-side-sign.png | 4× crop of 03: the "Autohaus Billion" side sign | crop of 03 |
| reference/autohaus-billion/04-satellite.png | Shared wide satellite of the start block (zoom 20); pins VR Bank, Bodystreet, Stroblume, Dolce Gelato, HoangAnh, Aktionshaus M&A | Google Maps satellite |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Wall | white render, two storeys, small upper windows | `#fefefe` |
| Awnings | terracotta/salmon fabric awnings, one per showroom bay, over the whole front | `#f5bb95` (in sun) |
| Name plate | white plate with grey "Autohaus B[illion]" on the upper wall, right part | `#fdfdfe` |
| Side sign | blue-grey panel with darker "Autohaus Billion" lettering | `#3d5673` |
| Showroom | ground floor glass between grey pillars, cars inside | pillars `#6f7477` |
| VW pylon | free-standing light-grey pylon with VW roundel and "Service" | `#d7d7d6` |
| Flags | 3 white/blue flagpoles at the NW end | — |
| Forecourt | paved, 4–6 cars parked nose-in | — |

## Engine terms
- Awning strip (terracotta, segmented) + name plate wallSign on the SW (street) edge of way 120402846; showroom glass at ground level.
- Props: VW pylon sprite + 3 flag sprites at the NW end of the forecourt; parked-car decals or static cars on the forecourt (no traffic collision changes).
- facade.ts: POI inside → `shop`. If Alex wants the real name, that is an import/name change (prefer `name` for shop=car), outside this exterior item.

## In-game
- No hooks. Kind `shop` is not IMPORTANT → **no map label** (overlay.ts: the HUD names it when near).

## Sources
- https://autohaus-billion.de/ (home, /kontakt/, /impressum: Sudetenstraße 25)
- OSM way 120402846
- reference/autohaus-billion/SOURCES.md
