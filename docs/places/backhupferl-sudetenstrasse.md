# Bäckerei "Das Backhupferl" (inside EDEKA, Breslauer Weg 113) — `backhupferl-sudetenstrasse`

| Field | Value |
|---|---|
| POI | #5 "Bäckerei Backhupferl", kind `bakery` (OSM node 370650899, shop=bakery, Mo–Sa 08:00–19:00, no street tag) |
| Map x, y | 4408.8, 4798.6 m (438 m from start) |
| lat, lon | 47.856845, 11.489109 |
| Official | In-store bakery counter of **EDEKA Heininger & Dietz, Breslauer Weg 113** (the address is Breslauer Weg, not Sudetenstraße; slug kept for continuity). Run by Stephan and Melanie Simmeth; main shop Schießstättstraße 37, Wolfratshausen. The Geretsried branch opened 2021 ("neun Jahre später" after 2012) per Gelbes Blatt, 21.02.2024 |
| OSM building | inside EDEKA way **189042651** (B3-1, edeka-am-stern.md), ~10 m from the W corner (4398.4, 4793.3) |
| Engine | EDEKA hall: levels 1, flat, `#dcdcde` |
| Street frame | **Breslauer Weg** (residential, 6.5 m): kerb point (4397.1, 4783.6), 19.0 m |
| Status | **needs reference** (`todo`): no photo of its sign or counter found |

## Images
None. Searched (2026-10-25): EDEKA Heininger & Dietz site (mentions the in-house bakery, no Geretsried photo), Gelbes Blatt articles (photos are of the Waldram branch), mein-wolfratshausen / exa listings (Wolfratshausen shop), wie.de / openalfa (no photos). Batch 3 EDEKA photos (edeka-am-stern/01–04) show **no Backhupferl sign** on the outside; the EDEKA satellite shows a "Hahn im Korb" food pin inside but no Backhupferl pin.

## Look spec
**Needs reference.** No look spec until a photo exists. Do not add an outside sign.

## Engine terms
- Lives inside the EDEKA hall (B3-0/B3-1). Exterior-only rules → nothing to build unless a photo shows an outside sign.
- facade.ts: POI inside a building → `shop` (already true for EDEKA).

## In-game
- No hooks; kind `bakery` is not IMPORTANT → no map label. Not the Brezn courier bakery (that is Mühlenbäck #48 / pickup #46).

## Sources
- https://www.dasgelbeblatt.de/lokales/bad-toelz-wolfratshausen/das-backhupferl-eroeffnet-neue-filiale-in-wolfratshausen-92830275.html (history, Geretsried branch in Heininger & Dietz)
- https://www.edeka-heininger-dietz.de/maerkte ("Backwaren unseres Bäckers 'Das Backhupferl'")
- https://germany-streets.openalfa.com/streets/breslauer-weg-82538-geretsried-geretsried (Bäckerei Backhupferl, Breslauer Weg, Mo–Sa 08–19)
- OSM node 370650899 via https://api.openstreetmap.org/api/0.6/map?bbox=11.4885,47.8565,11.4897,47.8572
