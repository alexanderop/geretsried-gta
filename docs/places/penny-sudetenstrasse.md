# PENNY Am Stern (Sudetenstraße) — `penny-sudetenstrasse`

| Field | Value |
|---|---|
| POI | #66 "PENNY", kind `supermarket` (OSM node 2971507476, addr Sudetenstraße 43) |
| Map x, y | 4288.8, 4804.3 m (330 m from start) |
| lat, lon | 47.856794, 11.4875 |
| Official | "PENNY Am Stern", **Sudetenstraße 29-43**, Mon–Sat 7:30–20:00. Store page geo **47.85713, 11.487**, i.e. map (4251.5, 4766.9). https://www.penny.de/markt/geretsried/830815/penny-am-stern-sudetenstrasse-29-43 |
| OSM building of node | way **822461881**: 2225 m², 19 nodes, engine levels 2, terracotta DOP roof. **This is Penny's building** (corrected in batch 3). Its NW long facade (≈ (4270.7, 4827.3) → (4298.3, 4784.2), bearing 33°, ≈ 51 m) faces the Am Stern car park and holds, NE → SW: **PENNY · da Daniele (39) · Schlüsseldienst Geyer (39) · Ahorn Apotheke (41, corner on Sudetenstraße)**. The polygon also wraps a second block E around the round plaza (to x 4350) |
| OSM building of penny.de geo | way **293545707** (Rossmann block, Sudetenstr. 33, levels 4). penny.de's geo falls inside it, but **that geo is wrong**: Penny is not in this block (batch-3 check, see below) |
| Engine roof colours | 822461881: `#d9a180` / `#da9f7d` (terracotta); 293545707: `#ecb791` / `#9d7863` |
| Street frame | **Sudetenstraße** (tertiary, 8 m), kerb point (4266.3, 4838.3), 40.7 m from the node; street bearing 304°, n bearing 34° |
| Entrance (corrected, batch 3) | **NE end of 822461881's NW facade**, under a **free-standing red canopy "PENNY. Am Stern" on posts** with trolleys under it (da-daniele/02), facing NW onto the car park; around (4290–4298, 4785–4800), next to the OSM node (4288.8, 4804.3). Nearest drivable: the car-park aisle at (4279.6, 4797.9), 11.2 m from the node |
| Status | **ref-done** (location corrected in batch 3). The OSM node (Sudetenstr. 43, way 822461881) is right; the dressing goes on 822461881. Built together with the Am Stern block, see BACKLOG **B3-0** |

## Where Penny sits in the block (corrected in batch 3)
- **Batch-2 error, now fixed:** batch 2 said the entrance was at the W end of 293545707 (Rossmann block) and that 05 showed 5 storeys of that block. Wrong. 05 shows the **same NW facade of 822461881** as da-daniele/01–02 and ahorn-apotheke/02: Penny canopy at the left (NE) end, then the crimson "Bar Café da Daniele" fascia, then green "Ahorn Apotheke" lettering at the right (Sudetenstraße) end, with the red pylon in front. The Rossmann block (293545707) is the lower 3-storey block with the terracotta roof seen across the car park in 02.
- Street View 01 (Aug 2022): a red **"PENNY."** board on the **Sudetenstraße end wall** of 822461881, above the glass corner of Ahorn Apotheke. It is a name/direction board, not the entrance.
- **05**, from inside the car park: the block is white with continuous balconies, ground floor of shops + **4 balcony storeys** (≈ 5 storeys vs engine levels 2). Red "PENNY" boards at the far-left (NE) end over the entrance area.
- **06**, from Sudetenstraße at the car-park entrance: the same block on the right of the car park; the Penny sign is at the far (NE) end.
- **da-daniele/02** (batch 3): the Penny entrance is under a **free-standing red canopy on posts** reading "PENNY. Am Stern", trolleys underneath.
- The pylon's 4th panel reads **GEYER** (Schlüsseldienst Geyer, OSM node 3450946413, Sudetenstr. 39), not "BEYER".

## Images
| File | What | Source |
|---|---|---|
| reference/penny-sudetenstrasse/01-street-front.png | white corner, Ahorn Apotheke glass front, red "PENNY. Am Stern" sign | Street View "39 Sudetenstraße", **Aug 2022** |
| reference/penny-sudetenstrasse/02-street-side.png | pylon, car park, Rossmann block | same |
| reference/penny-sudetenstrasse/03-street-other.png | white 3-storey building, grey window frames, grey ground-floor base, door no. "36" | same |
| reference/penny-sudetenstrasse/04-satellite.png | long terracotta-roof blocks around a round plaza | Google Maps satellite, cropped to the aerial only (Maps UI removed) |
| reference/penny-sudetenstrasse/05-street-entrance.png | NW facade of 822461881 from the car park: Penny boards at the NE end, da Daniele, Ahorn, pylon | Street View in the car park (date not given in the capture notes) |
| reference/penny-sudetenstrasse/06-street-carpark.png | Car park from Sudetenstraße; Penny block on the right, Penny sign at its far (NE) end | Street View, Sudetenstraße |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Corner building walls | white render | `#e2e2e3` |
| Window frames / base band | anthracite grey | `#737273` |
| PENNY sign board | red rectangle; white "PENNY" with a yellow dot, "Am Stern" in small white text | `#e7595e` |
| Ahorn Apotheke front | full-height glazing, white lower band, green "AHORN APOTHEKE" + green maple-leaf emblem | (not sampled) |
| Pylon | tall red post at the car-park entrance, several panels, PENNY on top | red as the sign |
| Roofs | terracotta, pitched | DOP `#d9a180` |
| Penny canopy (05, da-daniele/02) | free-standing red canopy on posts in front of the NE end, "PENNY." white + yellow dot, "Am Stern" small white; trolleys under it | shade `#871b21` / `#86272c`; sunlit red from 01 `#e7595e` |
| Penny entrance | glass front behind the canopy at the NE end of the NW facade; exact door position **needs reference** | — |
| Block (05/06) | 822461881: white render, continuous **balconies with grey steel railings**; ground floor of shops + **4 balcony storeys** (≈ 5 storeys vs engine 2) | wall in shade `#aab1bc`; fascia band in shade `#a3aebe`; rails dark grey |
| Pylon (05) | red, panels PENNY Am Stern (top), ROSSMANN (white), Ahorn Apotheke (green, red A), **Schlüsseldienst GEYER** (white) | red `#a2333b` (shade), green `#669c36` |
| Store interior | not seen → not needed (exterior only) | — |

## Engine terms
- Keep both OSM footprints. The store dressing goes on **822461881** (the node's own building): canopy (red board on posts, ≈ store width, in front of the NE end of the NW facade) + glass-front strip behind it; trolley sprites under the canopy (seen in da-daniele/02).
- Keep the "PENNY." board on 822461881's Sudetenstraße end wall (01) and the red pylon at the car-park entrance (02/05).
- Levels: 822461881 is engine 2 vs ≈ 5 storeys in 05/da-daniele/02, but the polygon also covers the E block and the space between, so a levels override would raise the whole outline: ask first (see B3-0).
- Top-down read: from above the block is a long terracotta roof; the red canopy, which sticks out from the wall, and the pylon are what identify Penny. A roof-readable PENNY sign is an option in B3-0.
- Build it as part of the **Am Stern block (B3-0)** together with da Daniele, Ahorn Apotheke, Rossmann, Takko, Orterer and Denns.

## In-game
- No gameplay hooks; it is generic `supermarket` facade (facade.ts shop type).
- Post Filiale 571 (the van-bomb job) is directly across Sudetenstraße at (4238.7, 4832.4); its van parks on Sudetenstraße. Do not block that kerb.
