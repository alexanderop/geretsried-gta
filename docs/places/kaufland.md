# Kaufland, Bayerwaldstraße 2 — `kaufland`

| Field | Value |
|---|---|
| POI | #180 "Kaufland", kind `supermarket` (OSM way 121822645, building=retail) |
| Map x, y | 2244.3, 1880.5 m (3276 m from start) |
| lat, lon | 47.883088, 11.460093 |
| Official | Bayerwaldstraße 2, 82538 Geretsried; Mo–Sa 07:00–20:00; store page https://filiale.kaufland.de/service/filiale/geretsried-7860.html (no store photo there). Inside/at the mall (OSM nodes): Landbäckerei Ihle, Deichmann, Vinzenzmurr, Dönerworks, An Nhien Asian Street Food, Cigo Kiosk/Lotto/DHL, ALP Schuh- und Schlüsseldienst, DHL Packstation 193; Kaufland charging station; bus stop "Geretsried, Blumenstraße" |
| OSM building | way **121822645** (20 corners, 6373 m²) |
| Engine | levels 1, flat `#e1dad6` |
| Street frame | car-park service roads ~31 m; **Thüringer-Wald-Straße** 41 m; Blumenstraße W/SW (Street View sits on Blumenstraße); Bayerwaldstraße (address) |
| Position | Big hall S/E of a large car park ("Parkplatz Kaufland" pin) |
| Status | **ref-done (partial)** — side view from Blumenstraße only; entrance and car-park side **need reference** |

## Images
| File | What | Source |
|---|---|---|
| reference/kaufland/02-street-side.png | **Key.** Long low hall, solar panels on the roof, white sign band with red "K" logo + "Kaufland"; car park behind a low wall, parked cars; Blumenstraße at left; bike/pedestrian sign | Google Street View on Blumenstraße (capture date not shown) |
| reference/kaufland/04-satellite.png | Pins Kaufland Geretsried, Parkplatz Kaufland, Deichmann, Landbäckerei IHLE, Dönerworks, An Nhien, Kaufland-Ladestation, Euronet ATM; Blumenstraße, Thüringer-Wald-Straße, Bayerwaldstraße | Google Maps satellite |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Hall | long, low, light walls (beige/grey in shade) | `#8f8571` (shaded) |
| Roof | roof surface visible from the street, covered with solar panels; exact shape **needs reference** (engine flat) | panels `#616f86` |
| Sign | white sign band on the gable/upper wall: red square "K" logo + red "Kaufland" | band `#d7dee0`, red `#cc4644` |
| Car park | asphalt/paving, low concrete wall along Blumenstraße | — |
| Not seen | entrance, trolley bays, mall shop signs, charging station | **needs reference** |

## Engine terms
- Wall-sign: white band + red K logo/"Kaufland" on the Blumenstraße side.
- Roof: solar texture; shape stays flat until a better view.
- facade.ts: POI inside → `shop`.

## In-game
- **Job "kaufland"** (phone at the Rathaus bus stop, unlocks after "weisswurst"): "Ein BMW parkt am Kaufland, der Wagen vom Stadtrat. Mach ihn kaputt!" Destroy a **BMW** (model 1). 120 s, €3500.
- The BMW (game.ts jobCar) is parked at the right-hand kerb of the road nearest the POI (roadAt within 80 m); the POI is 26.5 m inside the hall, nearest roads are the car-park service roads (~31 m), so the BMW most likely stands on a **car-park aisle**. Destroy jobs do not need STOP_REACH.
- Kind `supermarket` is IMPORTANT → **map label "Kaufland"** (overlay.ts).
