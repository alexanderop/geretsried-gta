# Gasthof Geiger, Tattenkofener Straße 1 — `gasthof-geiger`

| Field | Value |
|---|---|
| POI | #181 "Gasthof Geiger", kind `food` (OSM way 122032724, amenity=restaurant, addr Tattenkofener Straße 1) |
| Map x, y | 2844.9, 4388 m (1182 m from start) |
| lat, lon | 47.860538, 11.468147 |
| Official | Tattenkofener Straße 1, 82538 Geretsried, tel. 08171 31611; Bavarian kitchen, beer garden + terrace; Thu 10–15 / 17–22, Fri–Sun 10–23, Mon–Wed closed (speisekarte.de). Google pin label: "Gaststätte Geiger". No own website found |
| OSM building | way **122032724** (5 corners, 414 m²): (2843,4406) (2855,4402) (2846,4370) (2834,4374) (2837,4384) — long axis N–S along the B11 |
| Engine | levels 2, pitched, roof `#44473f` / `#bca68e` (grey / beige) — **photo shows red-brown tiles** |
| Street frame | **Bundesstraße (B11)**, primary 10 m: kerb point (2830.6, 4390), 14.4 m W of the POI, street bearing 172°; a service road 8.8 m away. Tattenkofener Str. runs E/S (Google satellite) |
| Position | Lettered main facade faces **west** (towards the B11 / the Nikolauskapelle meadow; Commons photo is taken "from the west") |
| Status | **ref-done (partial)** — one 2012 photo of the W facade; no Street View coverage; other sides, beer garden and car park look **needs reference** |

## Images
| File | What | Source |
|---|---|---|
| reference/gasthof-geiger/05-web-commons-nikolauskapelle.jpg | **Key.** Nikolauskapelle in front, Gasthof Geiger behind: white 2-storey house, red-brown tiled roof, "Gasthof Geiger" lettering | Wikimedia Commons, Gras-Ober, 2012-06-29, CC BY-SA 3.0 |
| reference/gasthof-geiger/06-crop-sign.png | Crop of 05 (full-res): black script lettering, dark beam, hanging bracket sign, window surrounds | derived from 05 |
| reference/gasthof-geiger/04-satellite.png | Pins "Gaststätte Geiger" (E of B11), Nikolauskapelle, Erdbeerhäusl; large gravel parking N of the house along the B11 | Google Maps satellite |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Walls | white render (sample is in shade) | `#7b858f` shaded → use white |
| Roof | red-brown clay tiles, large pitched (gable) roof, two chimneys, a TV antenna | `#7e6f66` (weathered, shaded) |
| Lettering | **"Gasthof Geiger"** in black script, painted on the wall between ground and upper floor, centred over the door | `#161618`-ish |
| Beam | dark horizontal timber beam above the lettering | `#161618` |
| Hanging sign | wrought-iron bracket with a small white/red blade sign above the beam | — |
| Windows | small square windows, white frames, **grey-green baroque-shaped surrounds** (curved top) on both floors; about 7 windows per floor on the W side | `#414a49` |
| Door | dark (black/brown) door, wall lamp above it, small framed board to the right | `#0d0d0d` |
| Ground | meadow in front (W) with the chapel; car parked at the N end | — |
| Not seen | beer garden, terrace, car-park surface, N/E/S facades | **needs reference** |

## Engine terms
- Pitched roof colour should move to red-brown tile (`roof.colors` from DOP gives grey/beige).
- W facade: painted script name strip + beam, centred; window surrounds as a facade texture pattern.
- Prop: wall bracket sign; gravel lot N of the house (from satellite) if the area layer has no parking polygon.
- facade.ts: POI is the building way itself → `shop`.

## In-game
- **Job "weisswurst"** (phone at the Rathaus bus stop): pickup "Die Weißwürste" at Metzgerei Länger (#219) → **dropoff here**. 170 s, €2000. Brief: "Der Bürgermeister will Weißwürste von der Metzgerei Länger, im Gasthof Geiger. Vor zwölfe!"
- Dropoff radius STOP_REACH = 9 m around the POI point (2844.9, 4388), which is **inside** the footprint, 6.3 m from the nearest wall. The B11 kerb is 14.4 m away, so the player has to come up to the house (service road 8.8 m / forecourt) to deliver; reachable on paper, check in game.
- Kind `food` is not IMPORTANT → no map label.
