# Maria Hilf (Pfarrkirche) — `maria-hilf`

| Field | Value |
|---|---|
| POI | #232 "Maria Hilf", kind `church` (pois.csv) |
| Map x, y | 3831.3, 4907.8 m (309 m from start) |
| lat, lon | 47.855863, 11.481366 |
| Address | Parish office: Johann-Sebastian-Bach-Str. 2 (Pfarramt is a separate building, OSM way 127604879, 16.6×11.0 m) |
| OSM building | way **127604845**: building=church, amenity=place_of_worship, religion=christian, denomination=catholic. 837 m², min-rect 32.8 × 32.4 m, axis −86°, centroid (3835.0, 4908.6), 9 nodes. **No `building:levels`, no `roof:*` tags** → the engine defaults to 2 levels (6 m) |
| Engine roof colours (DOP40) | from map.json: `#41473e` (dark grey-green) and `#9f9c8f` (light grey) on alternating faces; `pitched: true` |
| Street frame | **Johann-Sebastian-Bach-Straße** (residential, 6.5 m), nearest kerb point (3819.7, 4929.3), 24.4 m from the POI. Street bearing 118°; n (kerb → POI) bearing 28° (NNE). |
| Status | **ref-done (partial)**. The building's identity is confirmed. The main-entrance side and the tower position on the footprint **need reference**. |

## Identity check
- Parish website photos (05–07) show a white rendered church with a steep gable front, a large round rose window, a flat dark canopy over the main door, and a square white tower on the left with a dark pyramid roof and a cross.
- Street View 01/02 (Jul 2022) shows the same tower: square, white render, small deep-set square windows. It also shows the white nave side wall with a large dark-framed gridded window. → **Same building, confirmed.**
- Current state: the church has been **closed since Nov 2024**. Glue in the roof structure failed, and a construction fence (Bauzaun) stands around it. A new roof was approved, but there is no timeline yet.
  - Sources: Merkur, https://www.merkur.de/lokales/wolfratshausen/geretsried-ort46843/pfarrkirche-schon-lange-gesperrt-jetzt-bekommt-sie-ein-neues-dach-gemeinde-freut-sich-sehr-94514759.html and …/erhalten-oder-aufgeben-geretsrieder-kaempfen-fuer-gotteshaus-94357846.html.
  - The 2022/2016 photos show the church before the fence went up.

## Images
| File | What | Source |
|---|---|---|
| reference/maria-hilf/01-street-front.png | tower + nave side from the street | Google Street View "5 Johann-Sebastian-Bach-Straße", Jul 2022 |
| reference/maria-hilf/02-street-side.png | side entrance with sloped dark/glass canopy, hedges, steps by the tower | same pano, Jul 2022 |
| reference/maria-hilf/03-street-other.png | tower behind neighbouring houses, cobbled parking | Street View "11 Richard-Wagner-Straße", Jul 2022 |
| reference/maria-hilf/04-satellite.png | grey multi-face roof among trees | Google Maps satellite, cropped to the aerial only (Maps UI removed) |
| reference/maria-hilf/05-web-parish-front-autumn.jpg | **key**: gable front, rose window, canopy, tower (175×106 px, low-res) | https://stadtkirche-geretsried.de/MariaHilf/wp-content/uploads/2016/07/bild9_kl-1.jpg |
| reference/maria-hilf/06-web-parish-tower-winter.jpg | tower in snow | …/2016/07/bild3_kl-1.jpg |
| reference/maria-hilf/07-web-parish-front-winter.jpg | gable front in snow | …/2016/07/bild4_kl-1.jpg |
| reference/maria-hilf/08-web-parish-interior.jpg | altar (interior, not used) | …/2016/09/l009-5.jpg |

## Look spec (only what is visible)
Hex values were sampled by script (/tmp/sample.py, median of a box). Street View values are in shade, and the web photo has a blue cast.

| Element | Seen | Hex |
|---|---|---|
| Walls (tower, nave, gable) | smooth white render | `#b7b8b9` (shade, SV) / `#a8a8a6` (nave, SV). Render as near-white ~`#e6e6e4`; the shade values are darker than the real paint |
| Large nave window | dark frame, grid of small panes | `#242627` |
| Tower roof | steep pyramid, dark (slate/blue-black), cross on top | `#061e52` (tiny sample, low-res; treat as dark slate ~`#2a2f38`, **needs reference** for the exact tone) |
| Main door canopy | flat dark slab over the door on the gable end | `#343e39` |
| Main roof | pitched, grey; DOP gives `#41473e` / `#9f9c8f` | from engine roofAt |
| Rose window | large circle, dark, centred in the gable above the canopy | — |
| Sign / text | **none seen** | — |

- **Dimensions:** the footprint is 32.8 × 32.4 m, i.e. compact and nearly square in OSM.
  - Heights of the tower and nave: **needs reference**.
  - Visual estimate from 05/01: the tower rises about 1.5× the gable ridge. Treat this as an estimate and do not bake it in without approval.
- **Unknown / needs reference:**
  - Which footprint edge carries the gable front with the rose window (the OSM outline has no tags for it). The SV pano on J-S-Bach-Str. shows the tower and the side wall, not the gable.
  - The tower's position on the footprint.
  - The roof shape: the satellite image shows several faces, not a simple gable.
  - The fence and construction state as of 2026.

## Engine terms
- **Keep the OSM footprint** (way 127604845).
  - Add the tower as a separate prism only once its corner is confirmed. Today it is a `needs reference` item, so an exterior pass without it is acceptable.
- Street frame: Johann-Sebastian-Bach-Straße; u along bearing 118°, n toward 28°.
- From the top-down camera, the read is mostly the roof plus the tower.
  - A roof-painted sign would be a game liberty: the real roof carries no text. Only add one if the user approves.
- Facade type: the generic facades (shop/industrial/block/house) do not fit a church. A white-render material without shop windows is needed.

## In-game
- It is already a **save point** in src/sim/shops.ts: an on-foot pad named "Maria Hilf" (Jesus Saves-style), $500.
- The save pad must stay reachable on foot. Do not block it with new solids (fence, tower).
