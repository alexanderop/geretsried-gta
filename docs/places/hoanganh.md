# HoangAnh (Vietnamese/Chinese restaurant), Sudetenstraße 17 — `hoanganh`

| Field | Value |
|---|---|
| POI | #12 "HoangAnh", kind `food` (OSM node 370882648, amenity=restaurant, cuisine=asian, Mo–Su 11:30–21:30, +49 8171 2337996) |
| Map x, y | 3992.7, 4644.1 m (6 m from start) |
| lat, lon | 47.858235, 11.483530 |
| Official | Sudetenstraße 17. Listings 2024–2026 (restaurantguru "updated 6 days ago", HappyCow Aug 2024, exa: status Open, 4.8★/112) say open Tu–Su 11:30–21:30, Mo closed. The Google satellite still shows a "HoangAnh" pin on this building |
| Conflict (resolved 2026-10-25) | Street View (Aug 2022) shows unit 17 dressed as **Deliqos® Burger & Pizza**. Newer Google Maps user photos (30–32) show the same white unit with **HOÀNG ANH** letters and **"NEUERÖFFNUNG"** stickers, so **HoangAnh is the current tenant at Sudetenstr. 17; Deliqos is the 2022 state** (old directory entries). Photo dates are not shown; the stickers place them after the reopening |
| OSM building | way **127604891** (7 corners, 566 m², bbox x 3985–4027, y 4630–4662), the start building (Sudetenstraße 17–19: unit 17, Angel Nails, Mühlenbäck) |
| Engine | levels 2, pitched; DOP wall tints `#cab4a3` / `#84735e` / `#897b6c` |
| Street frame | **Sudetenstraße** (tertiary, 8 m), street bearing 304°; kerb point (3987.7, 4651.4), 8.9 m; NE of the street |
| Position | NW end of way 127604891: the modern white unit with glass balconies between Dolce Gelato (SE end of 127604887) and Angel Nails |
| Status | **ref-done (partial)**: facade, sign and terrace seen (photos 30–32); exact sign width and terrace extent need a screenshot check |

## Images
| File | What | Source |
|---|---|---|
| reference/hoanganh/05-crop-unit17-sv.png | Unit 17 in Street View, Aug 2022: white unit, glass balcony, orange **Deliqos** banners (old state) | crop of dolce-gelato/02, Street View |
| reference/hoanganh/30-web-gmaps-facade-day.jpg | Day: white render, **gold 3D letters "HOÀNG ANH"** above **dark-grey framed** glass doors/windows, food posters on orange wood-look panels, red **"NEUERÖFFNUNG"** stickers, opening-hours sign. Photographer's reflection blurred by us | Google Maps user photo, date not shown |
| reference/hoanganh/31-web-gmaps-sign-night.jpg | Night: the letters lit warm yellow, **red neon script "Asiatische Küche"** to the right, warm-lit timber slats under the balcony, round "HOÀNG ANH – fresh and natural" logo on the door, rattan chairs | Google Maps user photo, date not shown |
| reference/hoanganh/32-web-gmaps-terrace-night.jpg | Night, wide: shopfront under the dark balcony, letters + red neon, blue oval lit logo sign at the left corner, terrace on the pavement with **rattan chairs** (yellow and blue weave) and dark tables, neon "OPEN". Guest at the right edge and a reflection blurred by us | Google Maps user photo, date not shown |

## Look spec (only what's seen)
| Element | Seen | Hex |
|---|---|---|
| Wall | white render (the unit of the start building, glass balcony above) | web `#8c8781` (shade, reads white → engine off-white) |
| Frames | **dark grey / anthracite** window and door frames | web `#1a1b1f` |
| Sign | **gold/brass 3D letters "HOÀNG ANH"** (with diacritics) on the white wall above the windows; lit warm at night | day `#5c543d`–`#151613` (dark letter faces), night lit `#a2660e` |
| Neon | red neon script **"Asiatische Küche"** right of the letters (lit at night) | `#e01e37` (lit) |
| Windows | food posters on orange wood-look panels; red diagonal "NEUERÖFFNUNG" stickers | — |
| Door | round white logo "HOÀNG ANH – fresh and natural" | — |
| Terrace | on the pavement: **rattan bistro chairs** (yellow and blue weave), dark tables | — |
| Corner sign | small blue oval lit "HOÀNG ANH" logo box at the left corner (32) | — |

Hex note: day photo 30 is the colour source (wall, frames); 31/32 are night shots, so use them for the neon only.

## Engine terms
- Keep the POI "HoangAnh" (current tenant). wallSign "HOÀNG ANH" as dark-gold letters on the white unit front (NW end of way 127604891, wall 0 u 0.3–12.9: the No. 17 shop-front strips B2-1 built without a sign; B2-1 itself stays as built), plus a red "Asiatische Küche" script strip to its right; z ≈ 3.0–3.6 by eye vs 30. Width and u: screenshot check.
- Optional props: 2–3 rattan table sprites on the pavement; keep the pavement walkable.
- No Deliqos dressing (2022 state).
- facade.ts: POI inside → `food`.

## In-game
- No hooks. Kind `food` is not IMPORTANT → **no map label** (overlay.ts: the HUD names it when near).

## Sources
- https://restaurantguru.com/HoangAnh-Geretsried
- https://www.happycow.net/reviews/hoanganh-geretsried-417502
- https://exa.ai/library/place/1bvjgqf1vqm
- https://adresse.dastelefonbuch.de/Geretsried/1-Restaurants-sonstige-Deliqos-Geretsried-Sudetenstr.html
- https://stadtleben.de/geretsried/branchen/location/deliqos/
- OSM node 370882648
- reference/hoanganh/SOURCES.md (Google Maps user photos 30–32)
