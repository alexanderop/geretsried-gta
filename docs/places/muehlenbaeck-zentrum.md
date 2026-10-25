# Bäckerei Mühlenbäck, Fasanenweg / Egerlandstraße 54 — `muehlenbaeck-zentrum`

| Field | Value |
|---|---|
| POI | #46 "Bäckerei Mühlenbäck", kind `bakery` (OSM node 1911099481) |
| Map x, y | 2849.3, 2775.7 m (2196 m from start) |
| lat, lon | 47.875038, 11.468206 |
| Official | Directories: Egerlandstraße 54, Geretsried-Gartenberg, tel. 08171 61491 (dasoertliche, 11880). OSM: Fasanenweg, Mo–Fr 05–18, Sa 05–12:30, Su/PH 07–11, indoor + outdoor seating (hours differ between sources). No own website found |
| OSM building | inside way **1466483403** (2 levels, flat, `#c7beb1`, 3245 m², the whole shop row). Neighbours in OSM: HypoVereinsbank (Egerlandstr. 52), Intersport Utzinger + Paracelsus Apotheke (Egerlandstr. 56), Fasanenweg 3 (Reisebüro Hecher, Simone Boll Photographie, Haardesign Irene), KIND Hörgeräte; bus stop "Geretsried, Fasanenweg" |
| Engine | levels 2, flat, `#c7beb1` (one merged outline for the row) |
| Street frame | **Fasanenweg** (residential): kerb point (2840.9, 2768.5), 11.1 m, bearing 221° |
| Position | In the shop row on Fasanenweg near Egerlandstraße (Google satellite pin "Bäckerei Mühlenbäck"; also Rossmann, TEDi, Kaufhaus, KIND pins) |
| Status | **todo (needs reference)** — satellite only; shop front and sign not seen |

## Images
| File | What | Source |
|---|---|---|
| reference/muehlenbaeck-zentrum/04-satellite.png | Pin "Bäckerei Mühlenbäck" in the Fasanenweg shop row; flat roofs | Google Maps satellite |

## Look spec (only what's seen)
| Element | Seen | Hex |
|---|---|---|
| Roof | flat roofs of the shop row (satellite) | engine `#c7beb1` |
| Sign, shop front, seating | not seen | **needs reference** |

The Stein branch (#48, B2-1, `muehlenbaeck-sudetenstrasse`) shows the chain sign; do **not** copy it here without a photo of this branch.

## Sources
- Need: a Street View or photo of the shop front on Fasanenweg / Egerlandstraße 54.
- OSM node 1911099481; https://www.dasoertliche.de/Themen/M%C3%BChlenb%C3%A4ck-Geretsried-Gartenberg-Egerlandstr ; https://www.11880.com/branchenbuch/geretsried/071210469B29472836/muehlenbaeck.html

## In-game
- **Job "brezn"** (home phone, first job): pickup "Die Brezn" here → dropoff Rehmaus Apotheke (#168). 150 s, €1500. The code picks `across(pois, home, "Mühlenbäck")` = the nearest Mühlenbäck more than 300 m from home, which is #46 (the Stein branch #48 is next to the start).
- Pickup radius STOP_REACH = 9 m around (2849.3, 2775.7); the point is inside the row outline but only 0.4 m from its wall, and the Fasanenweg kerb is 11.1 m away, so walking up to the front (or stopping a car on the pavement) is enough.
- Kind `bakery` is not IMPORTANT → no map label.
