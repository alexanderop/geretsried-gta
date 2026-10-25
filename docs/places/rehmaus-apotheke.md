# Rehmaus Apotheke (formerly Arkaden Apotheke) — `rehmaus-apotheke`

| Field | Value |
|---|---|
| POI | #168 "Rehmaus Apotheke", kind `pharmacy` (OSM node 13180313166, level 0) |
| Map x, y | 4018.9, 4693.8 m (50 m from start) |
| lat, lon | 47.857788, 11.483882 |
| Address | Sudetenstraße 14, 82538 Geretsried |
| OSM building | way **120402845**, which contains the node: 910 m², min-rect 51.5 × 19.8 m, axis 29°, centroid (4028.3, 4702.3), 10 edges. No levels or roof tags → engine default 2 levels. Neighbour to the W: way 120402836 (594 m²); to the E: Autohaus Billion, way 120402846 |
| Engine roof colours (DOP40) | `#7c705e` (main faces), `#c4af97` / `#d3c0b4` (light faces), pitched |
| Street frame | **Sudetenstraße** (tertiary, 8 m). Kerb point (4028.9, 4679.2), 17.7 m. Street bearing 304°; n bearing 214° (SW, from the street into the building). Arcade front = the NE edges of the footprint (4001.4,4681.5 → 4017.7,4691.4 → 4034.0,4701.3; bearing 301°, 2 × 19.1 m), facing the street across the car park. |
| Status | **implemented** (B1-1, `src/world/places/rehmaus-apotheke.ts`) |

## Rehmaus vs Arkaden: one shop, renamed
- Rehmaus Apotheke has its own website, https://www.rehmausapotheke.de/. The owner is Loreen Hartwig e.K. (HRA 120833, registered 18.03.2025), and the logo says "EST. 2025".
- Older directory listings for **Arkaden Apotheke** (Bastug-Stiller OHG, Inh. Ilke & Dr. Turhan Bastug) give the same address, **Sudetenstr. 14**. Sources: golocal, stadtbranchenbuch.
- The pharmacy's own storefront photo (05) shows **the same round-arched arcade with white pillars**, with the fascia now reading **"REHMAUS APOTHEKE"**.
- So it is the same unit with a new owner and new signage. The Sep 2023 Street View shows the old sign.
- **Use the current sign. Do not use "ARKADEN".**

## Images
| File | What | Source |
|---|---|---|
| reference/rehmaus-apotheke/01-street-front.png | 3-storey block, arcade, old "ARKADEN APOTHEKE" fascia, banners, pharmacy "A" signs | Street View "23 Sudetenstraße", **Sep 2023** |
| reference/rehmaus-apotheke/02-street-side.png, 03-street-other.png | car park, P sign "Mo-Sa 8-19 h", neighbours | same, Sep 2023 |
| reference/rehmaus-apotheke/04-satellite.png | red-brown tile roof; map pins for both names | Google Maps satellite, cropped to the aerial only (Maps UI removed) |
| reference/rehmaus-apotheke/05-web-official-storefront.jpg | **current** fascia "REHMAUS APOTHEKE", arcade, door, "GEÖFFNET" A-board | https://mein-uploads.apocdn.net/38034/storeFront/Rehmaus-Aussenansicht%20%281%29@420-280-crop@2x.webp (via rehmausapotheke.de), undated, ≥2025 |
| reference/rehmaus-apotheke/06-web-official-logo.png | green logo (capsule + leaves) | https://mein-uploads.apocdn.net/38034/logo/Logo_mitSchrift_final.png |

## Look spec
| Element | Seen | Hex (sampled) |
|---|---|---|
| Upper walls | light grey-blue render (overcast SV); warm off-white in the sunlit official photo | `#8a95a9` (SV 2023); `#ccb0a1` (05, sunlit, warm cast). Render as light grey-blue ~`#a9b3c4` (**needs check**: the photo colour cast differs) |
| Arcade | ground floor of round arches on square white pillars, recessed glazing | pillar `#e8ded2` (sunlit) / `#8995aa` (SV shade) |
| Shop glazing frames | dark grey/anthracite | `#6e6c68` |
| **Fascia sign (current)** | **"REHMAUS APOTHEKE"**, individual red serif capitals mounted on the render above the arches | `#e7544a` |
| Old fascia (2023, obsolete) | "ARKADEN APOTHEKE", red serif caps | `#914047` (shade) |
| Pharmacy signs | red "A" box sign projecting from the facade (2023: labelled "ARKADEN APOTHEKE") + a free-standing red A | current label **needs reference** |
| Red vertical banners | "Kosmetik-…" and "…Fusspflege" (2023) | `#7f3139` (shade); current state **needs reference** |
| Bay windows | 2-storey projecting bays with white panels, dark frames | — |
| Roof | red-brown tiles, with dormers | DOP `#7c705e` |
| Ground | car park in front; P sign "Mo-Sa 8-19 h" | — |

- **Storeys:** 3 full storeys plus dormers in the roof. The engine default of 2 is too low, so set it to 3 and add a pitched roof (needs a per-building override).
- **Arcade:** depth and the number of arches along the pharmacy **need reference**. In the 2023 SV, about 4 arches belong to the pharmacy, and the left part belongs to a different shop with pink signs.
- The green logo from 06 was **not seen on the facade**. Don't place it on the building.

## Engine terms
- **Keep OSM footprint** 120402845.
- Add the arcade as a ground-floor recess (pillars + arch band) along the NE (street) edge. Add the fascia "REHMAUS APOTHEKE" as a painted wall-texture strip, because the engine has no 3D text.
- From the top-down camera, the fascia faces the street (NE). It is readable only at an angle, so a small red "A" pharmacy sprite on the car park/kerb side reads best. The free-standing red A is real.
- Street frame: Sudetenstraße, u at 304°, n at 214°.

## In-game
- It is the **destination of the first courier job** (Brezn from Mühlenbäck). town-jobs.ts looks it up with `named("Rehmaus Apotheke")`, and game.test.ts checks `dropoff.name === "Rehmaus Apotheke"`.
- **Do not rename the POI.** The drop-off point must stay reachable by car.
