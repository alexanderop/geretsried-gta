# PENNY Am Stern (Sudetenstraße) — `penny-sudetenstrasse`

| Field | Value |
|---|---|
| POI | #66 "PENNY", kind `supermarket` (OSM node 2971507476, addr Sudetenstraße 43) |
| Map x, y | 4288.8, 4804.3 m (330 m from start) |
| lat, lon | 47.856794, 11.4875 |
| Official | "PENNY Am Stern", **Sudetenstraße 29-43**, Mon–Sat 7:30–20:00. Store page geo **47.85713, 11.487**, i.e. map (4251.5, 4766.9). https://www.penny.de/markt/geretsried/830815/penny-am-stern-sudetenstrasse-29-43 |
| OSM building of node | way **822461881**: 2225 m², 56.5 × 68.5 m, 18 nodes, axis −147°. It also contains Ahorn Apotheke (Sudetenstr. 41), da Daniele (39). No levels or roof tags |
| OSM building of penny.de geo | way **293545707**: building=apartments, Sudetenstr. 33, **levels 4**, 1065 m², 53.3 × 20.0 m. Rossmann (node 2971507475) sits in it |
| Engine roof colours | 822461881: `#d9a180` / `#da9f7d` (terracotta); 293545707: `#ecb791` / `#9d7863` |
| Street frame | **Sudetenstraße** (tertiary, 8 m), kerb point (4266.3, 4838.3), 40.7 m from the node; street bearing 304°, n bearing 34° |
| Entrance (new, 05/06) | **W end of the ground floor of way 293545707** (Rossmann block, Sudetenstr. 33 side), on its SW long side facing the shared car park; footprint corner (4226.4, 4761.5). Closest Sudetenstraße point to that end: (4208.2, 4800.9), 42 m, across the car park |
| Status | **ref-done** (unblocked by 05/06). The OSM node (Sudetenstr. 43, way 822461881) is the address point of the complex, not the store; leave it, the dressing goes on 293545707 |

## Where Penny sits in the block
- Street View 01 (Aug 2022) shows a red sign **"PENNY." (yellow dot) "Am Stern"** above the glass corner shop **"AHORN APOTHEKE"**, at the corner of way 822461881 on Sudetenstraße. It is a name or direction board, not the store entrance.
- **05 (new)**, from inside the car park: the store entrance is at the **W end of the white balcony block** (293545707): two red Penny boards (a small "PENNY" at the very W corner and **"PENNY. Am Stern"**) over a **glass shop front** recessed under the first-floor overhang (bikes and a blue sign in front; trolleys not visible). Further E along the same ground floor: "Bar Café da Daniele" (red fascia), "Ahorn Apotheke" (green lettering). A tall **red pylon** at the car park carries panels PENNY / ROSSMANN / Ahorn Apotheke / BEYER.
- **06 (new)**, from Sudetenstraße at the car-park entrance: the whole block across the car park; the Penny sign is at the far (W) end.
- penny.de's coordinate (4251.5, 4766.9) is inside 293545707 too. **Conclusion: Penny = W end of 293545707's ground floor, facing the car park (SW).** The earlier ~50 m disagreement is explained: the OSM node marks the complex address (no. 43).

## Images
| File | What | Source |
|---|---|---|
| reference/penny-sudetenstrasse/01-street-front.png | white corner, Ahorn Apotheke glass front, red "PENNY. Am Stern" sign | Street View "39 Sudetenstraße", **Aug 2022** |
| reference/penny-sudetenstrasse/02-street-side.png | pylon, car park, Rossmann block | same |
| reference/penny-sudetenstrasse/03-street-other.png | white 3-storey building, grey window frames, grey ground-floor base, door no. "36" | same |
| reference/penny-sudetenstrasse/04-satellite.png | long terracotta-roof blocks around a round plaza | Google Maps satellite, cropped to the aerial only (Maps UI removed) |
| reference/penny-sudetenstrasse/05-street-entrance.png | **Penny entrance**: red sign over glass entrance at the W end, trolley area, pylon | Street View in the car park (date not given in the capture notes) |
| reference/penny-sudetenstrasse/06-street-carpark.png | Whole block, car park, pylon, sign at the W end | Street View, Sudetenstraße |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Corner building walls | white render | `#e2e2e3` |
| Window frames / base band | anthracite grey | `#737273` |
| PENNY sign board | red rectangle; white "PENNY" with a yellow dot, "Am Stern" in small white text | `#e7595e` |
| Ahorn Apotheke front | full-height glazing, white lower band, green "AHORN APOTHEKE" + green maple-leaf emblem | (not sampled) |
| Pylon | tall red post at the car-park entrance, several panels, PENNY on top | red as the sign |
| Roofs | terracotta, pitched | DOP `#d9a180` |
| Penny fascia (05) | red board on the white ground-floor wall, white "PENNY" + yellow dot, small "Am Stern" | sampled `#86272c` in 05 (shade; use the 01 value `#e7595e` for the sunlit red) |
| Penny entrance (05) | glass front at the W end, recessed under the first-floor overhang; door position and trolleys **needs reference** | — |
| Block above (05/06) | white render, continuous **balconies with grey steel railings** on every upper storey; ground floor of shops + **4 balcony storeys** in 05 (5 storeys vs engine 4) → recount before overriding | fascia band in shade `#a3aebe`; rails dark grey |
| Pylon (05) | red, panels PENNY (top), ROSSMANN (white), Ahorn Apotheke (green), BEYER (white) | red `#a2333b` (shade), green `#669c36` |
| Store interior | not seen → not needed (exterior only) | — |

## Engine terms
- Keep both OSM footprints. The store dressing goes on **293545707** (Rossmann block): wall-sign texture "PENNY. Am Stern" + glass-front strip at the **W end of the SW long edge** (no trolley sprites until seen).
- Keep the existing corner sign on 822461881 (01) and the red pylon sprite at the car-park entrance (02/05): both are seen.
- Levels: 05 suggests 5 storeys (engine 4); override only after a second count (ask first).
- Top-down read: from above the block is a long terracotta roof; the red fascia + pylon are what identify Penny when the SW wall is near a screen edge.

## In-game
- No gameplay hooks; it is generic `supermarket` facade (facade.ts shop type).
- Post Filiale 571 (the van-bomb job) is directly across Sudetenstraße at (4238.7, 4832.4); its van parks on Sudetenstraße. Do not block that kerb.
