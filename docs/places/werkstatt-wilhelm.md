# Automobilwerkstatt Wilhelm (Wallensteinstraße 4) — `werkstatt-wilhelm`

| Field | Value |
|---|---|
| POI | #103 "Automobilwerkstatt Wilhelm", kind `car_repair` |
| Map x, y | 4706.9, 4824.3 m (731 m from start) |
| lat, lon | 47.856614, 11.493106 |
| Official | Workshop of **Robert Wilhelm** at Wallensteinstraße 4, opened 2012, colleague Werner Horky (Gelbes Blatt articles, see SOURCES.md). Sign: "AUTO MOBIL robert wilhelm — KFZ Fachbetrieb für Reparaturen & Unfallinstandsetzung" |
| OSM building | way **128266487** (addr Wallensteinstraße 4, building=yes): rectangle **59.7 × 12.8 m**, long axis 52°/232° (NE–SW). The POI sits at its **NE end** |
| Engine | levels **2** (default); pitched; DOP roof `#c3a689` / `#bfa385` (light brown) |
| Street frame | **Wallensteinstraße** (residential, 6.5 m), NE of the hall: closest point (4723.7, 4810.8), 21.5 m; street bearing 141°, n bearing 231°. An **unnamed service lane** (4 m) runs along the hall's NW long side, 8.2 m from the POI (bearing 52°), next to an open car park |
| Status | **implemented (partial)** (B2-3, `src/world/places/werkstatt-wilhelm.ts`): the front is the NW wall (DOP20: customers' cars along it, car park beyond; the POI 3.8 m inside it); one tall storey under a flat light-brown roof, 4.8 m, from the Bavarian LoD2 model (tile 686_5302, `DEBY_LOD2_4667533`). Guesses: the window band's length, where the sign and the "4" sit, the logo's orange, the "4"'s colour |

## Images
| File | What | Source |
|---|---|---|
| reference/werkstatt-wilhelm/01-street-front.png | Sign end of the long wall: navy sign, PW logo, EINGANG arrow, frosted window strip | Street View, **Sep 2023** |
| reference/werkstatt-wilhelm/02-street-side.png | Same wall continuing, house number "4" on the glass, parked cars, halls beyond | same |
| reference/werkstatt-wilhelm/03-street-other.png | Hall end + open car park, "Wallensteinstr." painted on the road | same |
| reference/werkstatt-wilhelm/04-satellite.png | Long hall with light-brown pitched roof, car park NW of it | Google Maps satellite, aerial only |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Walls | **single-storey** hall (tall, ~1 storey + parapet), smooth grey cladding with a blue-violet cast | `#4b4d60` (shade) |
| Window strip | long continuous **frosted glass** band at ~2–4 m, white frame, vertical mullions | `#5f6b69` |
| Sign | navy panel at the top-left of the wall: round **PW logo** (orange), "AUTO MOBIL" / "robert wilhelm" (orange), small line "KFZ Fachbetrieb für Reparaturen & Unfallinstandsetzung", "EINGANG →" box top right | navy `#2e3b4d`; orange: thin text, sample unreliable (`#87574a` blended) → **needs closer reference** for the exact orange |
| Roof | low-pitch, light-brown from above (DOP), thin dark-brown fascia from the street | DOP `#c3a689`; satellite `#958279` |
| House number | large "4" on the window strip (02) | — |
| Entrance door, workshop doors/gates | **not seen → needs reference** (only the "EINGANG →" arrow) | — |

## Which wall?
Likely (not verified): the sign + window strip are on the **NW long side**, facing the service lane and the open car park. The camera in 01–03 stands on that side and 03 shows the car park; the sign is at the NE end, where the POI node sits. Verify with a Street View from the service lane before building it.

## Engine terms
- **Keep** footprint 128266487. **Levels: engine 2 vs photo 1 tall storey** → override levels 1 via #0b (the hall is clearly single-storey).
- facade.ts: `car_repair` is not a shop-front kind and the footprint is 764 m² (< 800), so the engine draws a **"house"** (Bavarian house) facade today. The hall should read **industrial**: either a facade override to `industrial` in #0b or a wall tint `#4b4d60` + window-strip texture.
- Sign = painted wall-sign texture on the NW edge near the NE end (u range: the 12–15 m nearest the NE corner; check against 01).
- Top-down read: light-brown long roof; the navy/orange sign is only visible when the NW wall is near a screen edge. Ask first before painting the logo on the roof (liberty).

## In-game
- **Spray shop**: `SPRAY_AT` in shops.ts contains "Automobilwerkstatt Wilhelm" → a spray-can pad at `spotNear(poi, DRIVEWAYS)`: the nearest free road point within 40 m. That is almost certainly on the **NW service lane** (8 m). The dressing must not make that lane or the car park solid.
- **Job "mercedes"** (home phone, after "brezn"): "Vorm Rathaus steht ein Mercedes G. Klau ihn und bring ihn zur Werkstatt Wilhelm!" → `steal(MERCEDES_G, rathaus, named("Automobilwerkstatt Wilhelm"))`, 200 s, $2500. Drop-off = within 9 m (`STOP_REACH`) of the POI; a car can get to 5.0 m on the NW side (checked against the footprints).
- Exact name used by shops.ts + town-jobs.ts; never rename.
