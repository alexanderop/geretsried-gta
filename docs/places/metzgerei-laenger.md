# Metzgerei Länger, Amselweg 9 — `metzgerei-laenger`

| Field | Value |
|---|---|
| POI | #219 "Metzgerei Länger", kind `shop` (OSM way 858188287, shop=butcher, operator Metzgerei Länger GmbH) |
| Map x, y | 2659, 2499.5 m (2531 m from start) |
| lat, lon | 47.877521, 11.465654 |
| Official | Amselweg 9, 82538 Geretsried; https://metzgerei-laenger.de/ ("Genuss & Qualität in Geretsried"; a second shop "Neuer Platz" is shown on the site). OSM hours Mo 07:30–12:30, Tu–Fr 07:30–18:00, Sa 07:00–12:00 |
| OSM building | way **858188287** (13 corners, 660 m²) |
| Engine | levels 2, pitched, roof `#aa937d` / `#bda081` / `#7a705e` … |
| Street frame | **Amselweg**: kerb point (2671, 2487.5), 17 m NE of the POI, bearing 135°; service road 21.7 m; Geltinger Weg 41.9 m |
| Position | Shop front on the ground floor facing a paved forecourt / parking towards Amselweg; garages beside (03). Google pin "Metzgerei Länger" on Amselweg |
| Status | **ref-done** |

## Images
| File | What | Source |
|---|---|---|
| reference/metzgerei-laenger/01-street-front.png | **Key.** White house, black cow silhouette, crest sign, red/white awning, green fascia, paved forecourt, benches/planters | Google Street View (capture date not shown) |
| reference/metzgerei-laenger/02-street-side.png | Shop front closer: pig picture board over the door, dark menu boards with round food photos | same |
| reference/metzgerei-laenger/03-street-other.png | Red-brown tiled roof, red-brown vertical pilaster strips, garages, white trailer | same |
| reference/metzgerei-laenger/04-satellite.png | Pin "Metzgerei Länger" on Amselweg | Google Maps satellite |
| reference/metzgerei-laenger/05-web-crest.png | The crest as artwork: cartouche "Aus Liebe zum Handwerk / Metzgerei Länger", ram + cow + pig heads, crossed axes | metzgerei-laenger.de (site asset, 2020) |
| reference/metzgerei-laenger/06-web-logo.png | Wordmark "METZGEREI LÄNGER — Genuss & Qualität in Geretsried" | metzgerei-laenger.de |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Walls | white render, 2–3 storeys (house + taller wing at the back/right) | `#a6aeb7` shaded → use white |
| Roof | red-brown tiles, pitched | `#999187` (far, hazy); engine browns ok |
| Pilasters | red-brown vertical strips on the corners / between window bays | `#7c5e68` |
| Fascia | dark green strip / slim canopy over the ground-floor shop front | `#2d3537` |
| Cow | big **black cow silhouette** painted on the white wall, upper left of the shop | `#242b37` |
| Crest | oval cartouche sign with animal heads and "Metzgerei Länger" (as 05), on the wall right of centre; a second crest at the right corner | cream `#e3dad1` + browns |
| Awning | small **red/white striped** awning over the left shop window | — |
| Pig board | picture board with a pink pig on orange, over the door (02) | — |
| Boards | dark menu / offer panels with round food images by the door | — |
| Forecourt | light paving, parked cars, benches and planters along the front | `#ded5c3` |

## Engine terms
- Ground-floor shop front with green fascia strip; wall decals: cow silhouette (upper left), crest (centre-right + corner), red/white awning over one window, pig board over the door.
- Props: benches + planters on the forecourt; garages (03) as part of the footprint if OSM has them.
- facade.ts: POI inside → `shop`.

## In-game
- **Job "weisswurst"** (phone at the Rathaus bus stop): **pickup "Die Weißwürste" here** → dropoff Gasthof Geiger (#181). 170 s, €2000.
- Pickup radius STOP_REACH = 9 m around (2659, 2499.5); the point is inside the house, 5.8 m from the nearest wall, so walking/driving up to the shop front works on paper. The Amselweg kerb is 17 m away: from the road alone you do not reach it.
- Kind `shop` is not IMPORTANT → no map label.
