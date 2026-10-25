# Rathaus Geretsried — `rathaus`

| Field | Value |
|---|---|
| POI | #174 "Rathaus Geretsried", kind `civic` |
| Map x, y | 2605.1, 2845.4 m (2278 m from start) |
| lat, lon | 47.874411, 11.464927 |
| Address | Karl-Lederer-Platz 1 |
| OSM building | way **92735882**: amenity=townhall, building=yes. 1066 m², bbox 36.8 × 48.6 m, main axis 122°, centroid (2608.7, 2841.0). Outline is an L / T shape with edges of 34.0, 21.3, 30.4+6.4, 33.1+15.4 and 15.6 m. **No levels or roof tags** → engine default 2 levels |
| Engine roof colours (DOP40) | `#a68670`, `#997d6c`, `#e2c9bb` (brown/terracotta), pitched |
| Street frame | **Karl-Lederer-Platz** (residential, 6.5 m), kerb point (2633.9, 2867.3), 36.2 m. Street bearing 217°; n bearing 307° (toward NW). Graslitzer Straße lies 32.7 m away on the other side. |
| Status | **implemented** (B1-3, `src/world/places/rathaus.ts`) |

## Images
| File | What | Source |
|---|---|---|
| reference/rathaus/01–03-street-*.png | long cream wing, shutters, bay window, arched door, red-brick plaza | Google Maps user photosphere, **Fokko B., May 2021** |
| reference/rathaus/04-satellite.png | brown pitched L-shaped roof at Karl-Lederer-Platz | Google Maps satellite, cropped to the aerial only (Maps UI removed) |
| reference/rathaus/05-web-commons-horemu-2007.jpg | front with **central clock tower** | Commons, Horemu, 2007-06-07, CC BY-SA 3.0 — https://commons.wikimedia.org/wiki/File:Geretsried-Gartenberg_Town-Hall_2007.jpg |
| reference/rathaus/06–08-web-commons-gras-ober-go7/8/9.jpg | tower, both wings, roundabout side | Commons, Gras-Ober, CC BY-SA 3.0 (File:Geretsried_GO-7/8/9_Rathaus.jpg) |
| reference/rathaus/09-web-commons-michielverbeek-2012.jpg | close-up of the tower: clock + "RATHAUS" lettering | Commons, Michielverbeek, 2012-08-17, CC BY-SA 3.0 |

## Look spec
| Element | Seen | Hex (sampled) |
|---|---|---|
| Wall render | cream / off-white | `#e9decd` (09) |
| Corner pilasters, tower quoins, window surrounds | ochre/yellow, segmental pediments over the windows | `#dbb267` |
| Shutters | diagonal stripes, teal-grey and white | average `#bfc0b1`; **exact teal needs a closer sample** |
| Main roof | red-brown tiles, hipped, with dark metal snow rails | `#935434` (photo); DOP `#a68670` |
| Tower | square, ochre quoins, oculus window, decorative clock face, dark shingled pyramid roof with finial/cross | roof `#5a5041` |
| Tower door | arched, with diagonal grey/white chevron pattern | — |
| Sign text | **"RATHAUS"** in dark capitals under the clock on the tower (2012 photo). No other sign seen; the 2021 photosphere shows no readable sign | lettering `#615239` |
| Plaza | red-brick pavers with grey cobble edging | (from SV, not sampled) |

- **Storeys:** both wings have 2 full storeys under a tall roof (an attic oculus shows in the gable). The gable block has 3 storeys plus the attic oculus (photosphere).
- **Tower:** it rises above the ridge by about one storey plus the pyramid roof (visual estimate from 05/09). Its exact height **needs reference**.
- **Bay window:** single-storey, dark roof, on the ground floor of the gable block.
- **Needs reference:**
  - Which footprint edge carries the tower. The Commons photos show it mid-facade on the plaza side. The plaza-facing long edge in OSM is probably 2635.5,2833.6 → 2616.1,2864.9 (36.8 m, facing ESE toward Karl-Lederer-Platz), but this is not proven, so check it against the aerial.
  - Whether the 2026 state still matches the 2012/2021 photos.

## Engine terms
- **Keep the OSM footprint**, but set height = 2 storeys + a pitched hip roof (the default 2 levels fits).
- Add the tower as an extra square prism (~5×5 m, **needs reference**) with a pyramid roof. A tower needs a new primitive, or a prism plus a roof cap.
- From the top-down camera the brown hip roof and the tower are what read.
  - The tower roof and clock are the landmark.
  - "RATHAUS" sits on a vertical wall, so it is barely visible from above. A roof-painted label would be a liberty; get approval first.
- Street frame: Karl-Lederer-Platz, u at 217°, n at 307°.

## In-game
- It is the job hub in town-jobs.ts:
  - the **Mercedes G job** (Rathaus → Werkstatt Wilhelm) starts here;
  - the **Taxi job** (Rathaus → Polizeiinspektion) starts here;
  - the **Rathaus payphone** is at the bus stop by the Rathaus.
- Do not move the payphone or the job pickup points. Keep the plaza driveable or walkable where the jobs spawn.
