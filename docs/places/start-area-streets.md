# Start area streetscape: Sudetenstraße at the spawn — `start-area-streets` (DRAFT)

| Field | Value |
|---|---|
| Scope | Sudetenstraße ±170 m around the start (Sudetenstraße 19, map **3997.4, 4648.0**), incl. the Berliner Weg mouth and the zebra |
| Street | Sudetenstraße, OSM way 157363825 (tertiary, no width/parking/lit tags). Bearing 304° / 124°. Centreline point at the start: **(3992.8, 4654.8)**; the start is 8.3 m NE of it |
| Engine (read-only) | tertiary carriageway 8 m; fixed 2.6 m sidewalk + 0.3 m kerb on each side; dashed centre + edge lines; no parking lanes, no signs, no lamps on tertiary, crossings only from OSM; trees from aerial crowns; bus shelter at every bus_stop |
| Evidence | Street View Aug 2022 (01–05, 07–10) and Sept 2023 (06); DOP20 (2024 flight); LoD2 walls; OSM 2026-10-25 |
| Status | **draft**: numbers marked *(SV?)* need a Street View check before they become acceptance values |

Axis convention below: **station** = metres along Sudetenstraße from the start's centreline point, **+ = NW, − = SE**;
**offset** = metres from the OSM centreline, **+ = NE (shop row), − = SW (Autohof Jorde)**.

## Images (reference/start-area-streets/, local only)
| File | What | Source |
|---|---|---|
| 01–04 | Start, headings N / E / S / W | Street View Aug 2022 |
| 05 | ~60 m NW, heading NW: bus stop, planters | SV Aug 2022 |
| 06 | ~45 m SE, heading SE: Autohaus Billion (VW), Rehmaus arcade, bollards, road name on asphalt | SV Sept 2023 |
| 07 | Autohof Jorde yard entrance, heading SW (**driver blurred** by us) | SV Aug 2022 |
| 08 | Berliner Weg corner + zebra | SV Aug 2022 |
| 09 | Close-up: P sign with time plates | SV Aug 2022 |
| 10 | Close-up: zebra sign + flashing light | SV Aug 2022 |
| 11–13 | Google satellite z20 / z19 / z18 (reference only) | Google |
| 20-dop20-220m.jpg | DOP20, 220 m square, north up, centred on the start (same bbox as `?compare=47.858199,11.483593,110`) | © Bayerische Vermessungsverwaltung, CC BY 4.0 |
| 21-game-compare-220m.jpg | Game, same frame (`?compare`) | our render |
| 22-overlay-game-vs-dop20-220m.jpg | DOP + game carriageway (yellow), game sidewalk edge (cyan), service/aisles (white), paths (orange), game buildings (magenta), LoD2 footprints (green), sign spots | ours |
| 23 / 24 | Cross-section strips at the start, road horizontal, ruler = offset from centreline: DOP vs game | ours |

**Corrections to captures.txt** (checked against OSM): the side street at the Mühlenbäck corner (08–10) is **Berliner Weg**
(not Richard-Wagner-Straße; that is at the signals 168 m NW). The "Apotheke" with bollards in 06 is **Rehmaus Apotheke,
Sudetenstr. 14** (SW side, station −41…−66). The 08 zebra is most likely the **Sudetenstraße** zebra seen from beside it, not a
second zebra across Berliner Weg *(SV?)*. The "small black signal head" in 10 is the zebra's **flashing amber light** (OSM
`flashing_lights=always`).

## Cross-section at the start (station 0)
| Band (NE → SW) | Real (DOP + SV + LoD2) | Game now |
|---|---|---|
| Building front NE (start building 127604891) | **+10.3 m** (LoD2 wall 10.4–10.9 m) | **+7.1 m** (OSM footprint) |
| NE pavement / café forecourt | ~+6.0 … +10.3 (≈ 4.4 m): grey slabs, café seating, A-boards, 3 trees in tree pits, lamp *(SV?)* | +4.3 … +7.1 (2.6 m + 0.3 m kerb), no trees |
| Kerb | granite kerb with a **grey granite-sett gutter strip** (~0.3–0.5 m) both sides (01, 04, 06) | plain kerb |
| NE parking | cars parked parallel at the kerb (01, 02), ≈ 2 m; no bay markings seen *(SV?)* | none |
| Carriageway (running lanes) | ≈ 8 m, 1 lane each way, white **dashed centre line**; edge lines not seen *(SV?)* | 8 m, dashed centre + solid edge lines |
| SW parking | cars parallel at the kerb (02, 03), ≈ 2 m *(SV?)* | none |
| SW pavement + tree row | ≈ −6 … −14.6: tree row (~6 crowns within ±30 m), paving, then Autohof Jorde forecourt parking (private) | −4.3 … −7.1 sidewalk, then **grass** |
| Building front SW (Autohof Jorde) | **−14.6 m** | −13.9 m |
| **Facade to facade** | **24.9 m** | **21.0 m** |
| Kerb to kerb (est.) | **≈ 12 m** (8 + 2 × 2 parking) *(SV?)* | 8 m |

Facade offsets along the NE row (LoD2 vs game): start building +10.4…+10.9 vs +7.1; NW of the start (station +20…+40)
**+28 m vs +23.5 m**; SE of Berliner Weg ~2.4 m too close. **The NE OSM fronts sit 3–4.5 m too close to the road.**
SW side matches within ~0.7 m.

## Berliner Weg mouth and corner plaza (station −22 … −45)
- Berliner Weg (way 32933717, residential, maxspeed DE:urban = 50; `width=6.5` sits on the adjacent segment 32933716) meets
  Sudetenstraße at node 60383008 **(4025.9, 4677.1)**, station −40.
- The start building's SE gable ends at station −22…−25, leaving a **~12 m paved corner plaza** with a **rounded kerb** onto
  Berliner Weg (08). Game: sidewalk strip + square corner, grass behind.
- Beyond the corner on the NE side: car-park entrance and perpendicular parking (10), Autohaus Billion forecourt (06).

## Crossings and signals
| Item | OSM | Position (map m) | Game |
|---|---|---|---|
| Zebra across Sudetenstraße | node 370882647, crossing=zebra/marked, island=no, kerb=lowered, flashing_lights=always | **(4016.0, 4670.6)**, station −28 | drawn ✓ (bars at the right spot) |
| Traffic signals Richard-Wagner-Str. | node 11596450 | (3852.1, 4561.2), station +168 | check (outside 220 m frame) |

## Parking (OSM amenity=parking near the street)
| Way | Type | Station | Offset |
|---|---|---|---|
| 258491200 | customers | +58 … +120 | NE +10 … +22 |
| 189564722 / 538512736 | customers / private | −111 … −162 | NE +8 … +24 |
| 293545708 (+ aisle 293545702) | street_side | −237 … −326 | NE +15 … +44 |
| service 152816901 "Sudetenstraße" (sett, width 3.7) | alley | −117 … −164 | goes SW |
No `parking:lane` / `parking:both` tags on Sudetenstraße: the on-street parking above is from SV/DOP only.

## Trees, lamps, bollards, furniture
- **Trees:** within ±30 m of the start the DOP shows **3 NE pavement trees + ~6 SW row trees**; the game draws **1**.
  No OSM natural=tree here.
- **Lamps:** grey pole, single **curved arm** over the road (02, 06, 10), seemingly on the NE side; spacing ~25–35 m *(SV?)*.
  No OSM street_lamp nodes. Game: none (lamps only on primary/secondary).
- **Bollards:** red/white bollards along the SW pavement edge at Rehmaus Apotheke, station −41…−66 (06).
- Planter troughs with hedges (05), café umbrellas/A-boards at the shops (01, 02), flag poles at Autohaus Billion (06).
- Road name **painted on the asphalt** ("Sudetenstraße", 06).

## Bus stops
| Node | Name/side | Station, offset | Shelter (OSM) | Game |
|---|---|---|---|---|
| 3448196002 | NE | +94, +6.6 → (3918.3, 4597.1) | yes (05 shows shelter/ad panels) | shelter ✓ |
| 3448196000 | SW | +85, −7.1 → (3918.2, 4613.5) | **no** | **shelter drawn (wrong)** |
Both need VZ 224 (Haltestelle) on a pole *(SV?)*.

## Sign spec (StVO numbers)
OSM has **no** traffic_sign, give_way, stop, street_lamp or parking:lane data here; all signs below are from SV.
| # | Sign | Position (map m) | Evidence | Status |
|---|---|---|---|---|
| S1 | **VZ 314** Parken with white **arrow left** (arrow inside the sign or Zusatzzeichen 1000-10, check 09) + Zusatz **"Mo-Sa 8-19 h"** (white time plate, 1040-series) + Zusatz **1040-32** parking disc "2 Std." (blue) on one grey pole | **(4017.5, 4660.2)**, NE pavement at the SE end of No. 19, by the corner | 08, 09 | seen; pole position ±1 m *(SV?)* |
| S2 | **VZ 350** Fußgängerüberweg (blue square, white figure on stripes) + amber **flashing light** above, on a grey pole | **NE (4019.4, 4665.6)** | 10, 02 | seen |
| S3 | VZ 350 + flashing light | **SW (4012.6, 4675.6)** | 03, 04 (far) | estimated *(SV?)* |
| S4 | VZ 224 Haltestelle | at both bus stop nodes above | — | *(SV?)* |
| S5 | VZ 310 / 311 Ortstafel "Geretsried" | city limit node 1360693788 (4015.1, 4390.3), Tattenkofener Straße | OSM | *(SV?)* |
| S6 | VZ 274.1 Tempo-30-Zone or VZ 274-53, where OSM has maxspeed 30 (Kirchweg; Richard-Wagner-Str. 30 Mo–Fr 07–17 = VZ 274-53 + time plate) | positions *(SV?)* | OSM | *(SV?)* |
| S7 | Kirchweg (motor_vehicle=destination): VZ 250 or 260 + Zusatz 1020-30 "Anlieger frei" | Kirchweg mouth, station ~+34 SW | OSM | *(SV?)* |
| S8 | VZ 240 gemeinsamer Geh- und Radweg | path near (3885, 4388) | OSM | *(SV?)* |
| — | Street-name plate | **none found** near the start (name is painted on the asphalt) | 06 | look again in SV at Berliner Weg / Kirchweg corners |
| — | Round blue sign near Rehmaus (06) | SW pavement, station ~−45 | 06 | type unreadable → *(SV?)* |
Sign geometry for sprites: square signs 0.6 × 0.6 m (VZ 314/350/224), Zusatzzeichen 0.6 × 0.33 m, bottom edge ≥ 2.2 m over
the pavement, grey round poles Ø 60–76 mm (standard German sizes; confirm proportions on 09/10).

## Gaps / ask before building
- Exact parking edges and whether bays are marked; lamp spacing and side; SW zebra sign; SV for S4–S8.
- Whether the NE footprints should move to the LoD2 walls (affects collision, B2-1 Mühlenbäck front, other place docs).
- Start building height: LoD2 4602923 11.5 m (eave 8.6), 4602924 12.1 m (9.4), 4602989 16.0 m (11.4) vs engine levels 2 →
  3 levels / masses (already noted in muehlenbaeck-sudetenstrasse.md).

Credits: DOP20 and LoD2 © Bayerische Vermessungsverwaltung – www.geodaten.bayern.de (CC BY 4.0); © OpenStreetMap contributors
(ODbL). Street View / satellite images: Google, reference only, never shipped.
