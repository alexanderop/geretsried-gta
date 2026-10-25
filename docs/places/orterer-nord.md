# Orterer Getränkemarkt, Banater Straße 3 — `orterer-nord`

| Field | Value |
|---|---|
| POI | #195 "Orterer Getränkemarkt", kind `shop` (OSM: building=commercial, shop=beverages) — the one with y < 3000 (north); the Am Stern market is a different POI (`orterer-am-stern`) |
| Map x, y | 2306.5, 2063.1 m (3089 m from start) |
| lat, lon | 47.881446, 11.460927 |
| Official | Banater Straße 3, 82538 Geretsried; Mo–Sa 08:00–20:00 (OSM); chain site https://www.orterer.de/ |
| OSM building | way **187819175** (5 corners, 903 m²): (2285,2064) (2308,2042) (2328,2061) (2306,2084) (2303,2082) |
| Engine | levels 2, **flat** `#a49e8e` — **wrong**: photos show a single-storey hall with a pitched red-tile roof covered in solar panels |
| Street frame | **Banater Straße**: kerb point (2337.3, 2092.1), 42.3 m, bearing 223°; service roads (car park) 19 m and 32 m. Railway crossing (St Andrew's crosses) and a "30" sign nearby (02) |
| Position | Entrance with glass canopy faces the paved car park; pylon at the car-park entrance by the pavement (01) |
| Status | **ref-done** |

## Images
| File | What | Source |
|---|---|---|
| reference/orterer-nord/01-street-front.png | **Key.** Hall, solar roof, glass canopy with round blue "Orterer" logo, arched pylon "Orterer Getränke-Märkte", red/white barrier posts | Google Street View (capture date not shown) |
| reference/orterer-nord/02-street-side.png | Banater Str. (road marking), railway crossing, "30" sign | same |
| reference/orterer-nord/03-street-other.png | Another angle on the hall and car park | same |
| reference/orterer-nord/04-satellite.png | Pins Orterer Getränkemärkte, Deutsche Post Filiale 511, a business pin, Autohaus, EP:Fried | Google Maps satellite |
| reference/orterer-nord/05-web-logo.png | Chain logo: red striped half-sun over blue "Orterer", "Getränke-Märkte" | orterer.de (site asset) |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Hall | single storey, white / light grey walls | `#fdfdfb` |
| Roof | pitched, red/orange tiles, almost fully covered with solar panels | tile `#cc8467`, panels `#909bb7` |
| Windows | wide windows with **blue frames**, posters inside | logo blue `#1470b7` |
| Entrance | glass canopy over the door; round blue/white "Orterer" logo above it | — |
| Pylon | free-standing **arched** sign: red/white striped half-circle, blue "Orterer", "Getränke-Märkte" on white (matches 05) | red `#e51e23`, blue `#1470b7` (logo file) |
| Car park | light paving, red/white barrier posts at the entrance, bushes and planting strip along the pavement | paving `#e1d4c3` |
| Height | one storey (engine 2) | — |

## Engine terms
- Override the roof: pitched, tile colour + solar texture; levels 1.
- Wall-sign: round logo over the entrance; glass canopy strip.
- Prop: arched pylon by the car-park entrance; barrier posts.
- facade.ts: POI inside → `shop`.

## In-game
- **Job "gelting-1"** (Bauernmafia, phone at the bus stop on the Gelting turf): **pickup "Das Weißbier" here** → dropoff Biometzgerei Pichler Großhandel (#211). 150 s, €2000.
- ⚠ **Pickup likely unreachable:** STOP_REACH = 9 m around (2306.5, 2063.1), but the point is inside the hall, **14.0 m from the nearest wall**, so a player outside never gets within 9 m. Verify in game; fix options for the dev (not done here): move the pickup to the entrance/car park, or snap job places to a reachable spot like spotNear.
- Kind `shop` is not IMPORTANT → no map label.
