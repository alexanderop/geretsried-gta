# Petruskirche (evang.-luth.), Egerlandstraße 39 — `petruskirche`

| Field | Value |
|---|---|
| POI | #231 "Petruskirche", kind `church` (OSM way 121436739, building=church, religion christian, denomination protestant) |
| Map x, y | 2883.8, 2925.2 m (2052 m from start) |
| lat, lon | 47.873693, 11.468668 |
| Official | Egerlandstraße 39, 82538 Geretsried; parish site http://www.geretsried-evangelisch.de/. Architect Franz Lichtblau, consecrated 30 Oct 1960. Press: "concrete tent", **free-standing bell tower**, generously glazed entrance gable, bronze portal (Rolf Nida-Rümelin), tower mosaic with the name "Petruskirche" and St Peter as fisherman (Hubert Distler) — text only, mosaic/portal **not seen** |
| OSM building | way **121436739** (5 corners, 333 m²): (2871,2921) (2882,2912) (2897,2930) (2886,2939) (2879,2931). **Bell tower = way 188048958** (man_made=tower, tower:type=bell_tower, name "Kirchturm Petruskirche", 20 m², centre 2879.8, 2904.6, ≈21 m N of the POI). Neighbours 188048920 (flat, 139 m²), 188048875 (240 m²) |
| Engine | church: levels 2, pitched, roof `#717066` / `#b4aea1`. Tower 188048958: levels 2 (a 20 m² stub) — **far too low**, photos show a tall slim tower |
| Street frame | **Egerlandstraße**, 25 m (bearing 147°); Prießnitzweg 28 m; Martin-Luther-Weg 31 m; footway 14 m |
| Position | Church and tower on a lawn W of Egerlandstraße, between Martin-Luther-Weg and Prießnitzweg (Google satellite); kindergarten and parish parking pins nearby |
| Status | **ref-done (partial)** — side + tower seen; the glazed entrance gable from the front, the bronze portal and the mosaic **need reference** |

## Images
| File | What | Source |
|---|---|---|
| reference/petruskirche/05-web-dekanat.jpg | **Key.** Church (big dark roof, peach walls, glazed gable strips) + free-standing tower with clock and louvre | isarloisachtal-evangelisch.de (Dekanat), summer, date not stated |
| reference/petruskirche/08-crop-tower.png | Crop of 05: tower top, louvre, red clock marks, small windows | derived from 05 |
| reference/petruskirche/06-web-parish-winter.jpg | Tower and church in snow, from the street | geretsried-evangelisch.de (2023 upload) |
| reference/petruskirche/07-web-parish-drawing.png | Line drawing used as the parish logo: tower with cross, louvre, clock; church gable behind | geretsried-evangelisch.de |
| reference/petruskirche/02-street-side.png | Church side: steep dark roof, cream wall, tall vertical glass strip with white mullions, round white emblem with cross, barred window; lawn, path, blue bin | Google Street View (© 2025 Google; capture date not shown) |
| reference/petruskirche/04-satellite.png | Pins Petruskirche Evangelisch, Martin-Luther-Weg, Prießnitzweg, Kindergarten, parking | Google Maps satellite |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Roof | huge steep pitched roof reaching low over the walls, dark grey shingles/slates ("tent") | `#403f40` |
| Walls | peach / salmon render (cream in 02) | `#b69c85` |
| Gable glazing | tall vertical glass strips between narrow white/cream pillars at the gable end | glass `#222223` |
| Emblem | round white emblem with a cross on the side wall (02) | white |
| Tower | free-standing, slim, square, peach render like the church; small pitched cap; large dark louvre opening near the top; **clock with red hands and red hour marks painted directly on the wall** (no dial disc); a few small square windows; cross on top (06/07); door at the foot | `#a29b8e` (shaded) |
| Tower height | many times the church eave height (05/06); exact height **needs reference** | — |
| Grounds | lawn, trees, paved footpath; birch and conifers next to the tower | — |
| Not seen | mosaic "Petruskirche", bronze portal, front of the entrance gable | **needs reference** |

## Engine terms
- Church: steep pitched roof, eaves close to the ground; peach walls; vertical glass strips on the gable end.
- Tower 188048958: needs a height override (tall prism, ~4 × 5 m), louvre + clock decals near the top, cross.
- facade.ts: POI inside the church way → `shop`.

## In-game
- **Save point** (shops.ts SAVE_AT = ["Maria Hilf", "Petruskirche"]): "Jesus Saves" pad, cost **€500**, foot pad (radius 1.8 m), re-arms after you walk 8 m away.
- Pad position = spotNear: first free road/path spot (roadAt ≤3 m, not solid/water, not under tree crowns) in rings of 3 m up to 40 m around (2883.8, 2925.2). Nearest path is the footway ~14 m away, so the pad likely sits on that footway; the exact spot is computed at runtime (trees on the lawn can push it further).
- Kind `church` is not IMPORTANT → no map label.
