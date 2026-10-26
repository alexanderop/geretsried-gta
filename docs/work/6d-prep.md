# Batch 6d prep (start area, 318–821 m): research notes, NOT final place docs

> Superseded by docs/places/<slug>.md and B6d-1…B6d-16 (2026-10-25, after Street View). SOURCES-prep.md files were merged
> into SOURCES.md; `laufbahnen-franz-marc-schule` is now `verkehrsuebungsplatz-franz-marc-schule`. Level proposals here
> (e.g. Lewke 1 level) were revised with SV; the place docs win.

Researched 2026-10-25 from the web, OSM (Overpass, 2026-10-25), Bavarian **LoD2** (tiles 684_5302, 684_5304, 686_5302) and
**DOP20** (© Bayerische Vermessungsverwaltung – www.geodaten.bayern.de, CC BY 4.0). OSM data © OpenStreetMap contributors (ODbL).
**Street View pending** (part 1 is being captured separately): every facade, sign and colour below that is not from the DOP or a
business photo still **needs reference**. Web photos are **reference only** (copyrighted, never shipped). Engine values =
`public/geretsried.map.json` at **c30c347**; no 6d building is dressed by a Place (`src/world/places/*`) yet.
Images: `reference/<slug>/10-dop20.png` (plain) + `11-dop20-osm.png` (OSM outline cyan), dark caption bar with the credit;
web photos `2x-web-*`. Credits: `SOURCES.md`; in the 8 part-1 slugs `SOURCES-prep.md` (so the SV run's SOURCES.md is not
clobbered; merge later). Heights: LoD2 measuredHeight = ridge; "eave" = NiedrigsteTraufe − HoeheGrund (lowest eave, a low
annex pulls it down). Levels proposal = (main eave − 0.6) / 3, rounded. Raw data: `work/6d/` (analysis.json, dopstats.json).

Slug note: the SV run named two folders differently, so the DOP files went there: **`centrale-geretsried`** and
**`fitness-forum-squash`**. Matheis, DUO and Spielplatz Breslauer Weg have no SV folder yet (mine: `kfz-matheis`,
`cafe-bar-duo`, `spielplatz-breslauer-weg`); align if the SV run picks other names.

## Overview
| Place | Still there? (web, 2026) | Building / area | LoD2 | Game now | Web photos |
|---|---|---|---|---|---|
| #218 Carglass | yes, **Sudetenstraße 50**, Mo–Fr 8–12:15, 13–17 | way 772887800, 12.5×6.6 m | flat 3.6 m | 2 lv flat → too tall | brand stock only |
| #79 Piatsa | yes ("Cafe Bar Piatsa", Lausitzer Str. 12) | way 189043196, 60×22 m (shared, Vegas Casino) | gable 8.1 m, eave 3.0 | 2 lv pitched → eave too high | none |
| #98 Arztpraxis Lewke | yes (Dorothea Lewke, Allgemeinmedizin) | way 188590009, 23×11 m | gable 8.8 m, eave 2.9 | 2 lv pitched | none |
| #26 KFZ Matheis | yes (listings) | way 1319566946, 21×17 m | gable 7.5 m, eave 4.7 | 2 lv pitched ≈ ok | none |
| #128 Fitness Forum & Squash | yes (squashpoint.info) | way 188648201, 46×18 m | flat 7.4 m | 2 lv flat ✓ | stock/interior only |
| #189 Franz-Marc-Schule | yes (Förderzentrum, new website) | way 128271980 + 3 more | flat 8.4 m (+7.3 m, gable 7.1 m) | 2 lv flat ✓, no PV/atrium | **1 exterior** |
| #106 Bäckerei Burger | yes (Benzweg 2: production + drive-in + café) | way 191449964, 32×18 m | "flat" 8.4 m, eave 5.1 (conflicts DOP) | 1 lv pitched | **1 exterior (small, dusk)** |
| #59 Schreibwaren Schröter | yes ("Schröter Bürobedarf", A.-Stifter-Str. 39) | way 668663477, 27×27 m | hip 11.3 m, eave 10.6 | 2 lv flat → too low, wrong roof | none |
| #217 Occasione | yes (web spells "Mode & **Lifestyle**") | way 668663478, 10×8 m | flat 3.9 m | 2 lv, no roof → too tall | none |
| #233 Christuskirche | yes (EFG/Baptisten) | way 127872148, 32×21 m L-shape | gable 9.4 m, eave 4.9 | 2 lv pitched brown | **4 exterior** |
| #78 BSZ Direktmarketing | yes, but it's **BSZ GmbH / BSZ Group** (direct marketing + logistics, not a shop) | way 191461638, 29×23 m | gable 9.8 m, eave 7.6 | 2 lv flat → wrong roof | none useful |
| Spielplatz Breslauer Weg | n/a (public) | way 1271723892, 43×33 m | — | not drawn (residential) | none; **DOP: under canopy** |
| Centrale (ex Coffeeholic) | yes (Neuer Platz 5, Mo–Sa 9–22) | way 127604896 (= 6c Site A) | 4 flat parts 3.6–4.4 m | 1 lv **pitched** → should be flat | none |
| Café Bar DUO | yes (Sudetenstraße 47/47a) | way 1385177375, 36×23 m | gable 6.8 m, eave 4.1 | 2 lv pitched ≈ | none (tourism page has no photo) |
| "Laufbahnen" Franz-Marc-Schule | **is a Verkehrsübungsplatz** (traffic training course), not running tracks | ways 258497399–402, 269909762 in recreation_ground 258497403 | — | grass area | none; DOP good |
| Spielplatz J.-S.-Bach-Str. | n/a | way 122032725, 27×23 m | — | not drawn | none; DOP good |
| Fitness-Station 574767212 | n/a | 21×20 m in Stadtwald | — | forest | none; **DOP: under canopy** |
| Fitness-Station 497511384 (lit) | n/a | 23×13 m in Stadtwald | — | forest | none; DOP: bark/sand patch |
| Champini Kita | yes (Jeschkenstr. 103) | way 524105770, 32×15 m | flat 6.5 m | 2 lv flat ✓ | promo/kids only (not saved) |

No 6d place looks closed or moved. Name/tag issues: Carglass OSM has no housenumber (web: 50); Occasione "Livestyle" vs web
"Lifestyle"; BSZ is tagged shop=stationery but is a B2B company; Fitness Forum's POI kind is **food** (from amenity=pub,
the in-house bistro); the "Laufbahnen" row is a traffic training course.

## Per place

### #218 Carglass (slug `carglass`; 552 m)
| | |
|---|---|
| OSM | node/way 772887800 (building=yes, brand Carglass, shop=car_repair, 82 m², 12.5 × 6.6 m, long axis ~121°); car park way 772887799 (operator Carglass GmbH, 3083 m²); 2nd building 772887798 (159 m², 20 × 11 m) on the same lot |
| LoD2 | 108848825 flat 3.6 m (72 m²); 772887798 = 4602021 flat 3.1 m + 108848826 flat 3.6 m |
| DOP roof | `#bcb8b3` / `#cdc8c4` / `#cdcdcd` (light grey flat) |
| Game | 772887800: levels 2, flat `#c8c6c2` → **1 level**; 772887798: levels 2, **pitched** → 1 level flat |
| DOP | small flat box on a large gravel/asphalt lot full of parked cars, timber/material stacks W (neighbour yard) |
| Web | standorte.carglass.de/geretsried/sudetenstrasse-50.html: Mo–Fr 08:00–12:15, 13:00–17:00, Sa/Su closed (OSM still says Sa 9–13). Site photos are national stock |
| Needs SV | which box is the workshop (bay door?), Carglass red/yellow sign position, lot use (Carglass vs neighbour car dealer) |

### #79 Piatsa (slug `piatsa`; 659 m)
| | |
|---|---|
| OSM | node 3528911943 amenity=pub "Piatsa", Lausitzer Str. 12, outdoor_seating; node 3528911971 "Vegas Casino" (nightclub, same address); building way 189043196 (1154 m², 60 × 22 m) |
| LoD2 | 4667505 gable ridge 8.1, eave 3.0 (779 m²); 4667415 gable 6.7 / 4.6 (223 m²); 108158757 flat 2.8 m (51009_1610 roof/canopy, 83 m²) |
| DOP roof | `#a67763` / `#b47c62` / `#e3dee1`: red tiles on the SE part, light grey/white NW part |
| Game | levels 2, pitched (DOP colours) → proposal **1 level** with the higher gable ridge; maybe 2 masses |
| Web | "Cafe Bar Piatsa (Naci Pileidou)", tel. 08171 529107, Facebook page, listed open; one listing puts it ~50 m NW (47.85758, 11.49190), so **which unit** is Piatsa needs SV |
| Needs SV | unit + sign, terrace, Vegas Casino sign |

### #98 Arztpraxis Lewke (slug `arztpraxis-lewke`; 664 m)
| | |
|---|---|
| OSM | node 6261802825 (Adalbert-Stifter-Str. 43, operator Dorothea Lewke, website arztpraxis-lewke.de); building way 188590009 (241 m², 23 × 11 m) |
| LoD2 | 107585793 gable ridge 8.8 m, eave 2.9 m (340 m², bigger than the OSM outline: a joined neighbour part) |
| DOP roof | `#767460` / `#9a9185` / `#c6b8a3` (grey-brown) |
| Game | levels 2, pitched → proposal **1 level + steep gable** (eave 2.9) |
| Web | listed open (Allgemeinmedizin); OSM: tel. +49 8171 9978818, Mo–Fr 8–12, Mo 17:30–19:30, Fr 17–19 (web listings differ slightly; check). Website has no photos |
| Needs SV | entrance, praxis sign (residential-looking house) |

### #26 KFZ-Meisterbetrieb Gerd Matheis (slug `kfz-matheis`; 678 m)
| | |
|---|---|
| OSM | node 371385757 (Spreestraße 11); building way 1319566946 (No. 11, 298 m², 21 × 17 m); neighbour way 1319566945 (No. 13, 1116 m²) |
| LoD2 | No. 11: 4602058 gable 7.5 m, eave 4.7. No. 13: 4601991 gable 7.3/4.6, 4602514 gable 6.1/3.0, 4602515 gable 9.7/8.4 |
| DOP roof | `#998875` / `#b49b83` / `#bfaca4` |
| Game | No. 11 levels 2 pitched (≈ ok; proposal 1 tall storey, eave 4.7). **No. 13 drawn flat** but LoD2 = 3 gables |
| Web | tel. 08171 31696, listed open. No website/photos |
| Needs SV | workshop doors, sign |

### #128 Fitness Forum & Squash (slug `fitness-forum-squash`; 690 m)
| | |
|---|---|
| OSM | building way 188648201 (Breslauer Weg 103, leisure=fitness_centre, sport=squash, 827 m², 46 × 18 m); node 9955217554 amenity=pub "Fitness Forum & Squash" (bistro) → game POI kind **food** |
| LoD2 | 4667402 flat 7.4 m (768 m²); 4667387 flat 5.2 m (453 m², neighbour S) |
| DOP roof | `#d8d2cb` / `#dbd4d0` / `#ded9d4` (white flat) |
| Game | levels 2, flat ✓ |
| Web | squashpoint.info: Alexander Giesner, 1400 m² on 2 floors, "the only squash courts in the area", sauna, **bistro + beer garden with children's playground**, renovated 2020. Photos are stock/interior |
| Needs SV | entrance, sign, beer garden |

### #189 Franz-Marc-Schule (slug `franz-marc-schule`; 701 m)
| | |
|---|---|
| OSM | way 128271980 (building=school, Robert-Schumann-Weg 5, 1440 m², 50 × 46 m) in school grounds 1271753003 (14 342 m²); also 128271826 (852 m²), 822457545 (538 m², red gable), 822457546 (26 m² shed) |
| LoD2 | 4532039 flat 8.4 m (eave value 0.9 is bogus); 4532246 flat 7.3 m; 107585679 gable 7.1 m, eave 6.1 (= 822457545, likely the gym hall) |
| DOP | main block flat, **PV over most of the roof + a glazed atrium skylight in the middle**; SW wing flat with skylights; N hall red tiles |
| Game | all levels 2; main flat `#c2bdb3` (no PV/atrium); 822457546 shed 2 levels pitched → too tall |
| Web | franz-marc-schule.de: Sonderpädagogisches Förderzentrum (new site; OSM website is the old one). `20-web-building.jpg`: **2-storey flat-roof block clad in light grey/white panels, dark-framed window bands, glazed entrance under a thin slab canopy, asphalt forecourt** (2 more home-page photos show pupils: not saved) |
| Needs SV | which face the photo shows, entrance side, school sign |

### #106 Bäckerei Manfred Burger (slug `baeckerei-burger`; 720 m)
| | |
|---|---|
| OSM | node 7372551532 (no address); building way 191449964 (Benzweg 2, building=retail, 570 m², 32 × 18 m) |
| LoD2 | 107394164 roofType **flat**, ridge 8.4 m, eave 5.1 (452 m²); 108848883 flat 4.3 m (95 m², annex) |
| DOP roof | `#a27969` / `#ab8569` / `#b88877`: **red tiled roof**, conflicts with LoD2 "flat" |
| Game | levels 1, pitched terracotta |
| Web | burger-baeckerei.de/standorte: "Produktion mit Drive-In und Café" (OSM hours Mo–Fr 5:30–17, Sa 5:30–12, Su 6:30–12). `20-web-front-dusk.jpg` (300 × 180 only): **timber-clad gable upper floor over a glazed ground floor, white flat-roof wing with "Burger" lettering**, lit lamp posts, lawn |
| Needs SV | roof shape (LoD2 vs DOP), drive-in lane, café terrace |

### #59 Schreibwaren Schröter (slug `schreibwaren-schroeter`; 726 m)
| | |
|---|---|
| OSM | node 2599419104 (shop=stationery, no address; web: **Adalbert-Stifter-Str. 39**); building way 668663477 (414 m², 27 × 27 m) |
| LoD2 | 4603829 hip, ridge 11.3, eave 10.6 (242 m²); 4604182 hip 10.2 / 7.3 (113 m²) |
| DOP roof | `#c6b9a8` / `#cbc0b1` / `#d2c6b8` (light) |
| Game | levels 2, **flat** → proposal **3 levels, hip roof** (shop on the ground floor) |
| Web | "Schröter Bürobedarf", Adalbert-Stifter-Str. 39, listed open. No photos |
| Needs SV | shop front, sign |

### #217 Occasione Mode & Livestyle (slug `occasione`; 750 m)
| | |
|---|---|
| OSM | way 668663478 (building, Adalbert-Stifter-Str. 39, shop=clothes, 77 m², 10 × 8 m), annex next to Schröter's block |
| LoD2 | 4604132 flat 3.9 m |
| DOP roof | `#7c7a66` / `#7f7f6a` / `#8a846f` (dark, flat) |
| Game | levels 2, no roof colour → **1 level flat** |
| Web | "Occasione Mode & **Lifestyle**", listed open (OSM: tel. +49 8171 348675, Mo–Fr 10–18, Sa 10–13). No photos |
| Needs SV | front, sign (spelling) |

### #233 Christuskirche (slug `christuskirche`; 767 m)
| | |
|---|---|
| OSM | way 127872148 (building=church, Jeschkenstraße 125, baptist, check_date 2024-07-20, 501 m², L-shape 32 × 21 m) |
| LoD2 | 4602043 gable ridge 9.4, eave 4.9 (function 3041 = church, 259 m²); 4602042 gable 7.5 / 4.9 (103 m²); small gables 4.0 and 4.8 m |
| DOP roof | `#544334` / `#695b4b` / `#9f7f6f` (dark brown tiles, several gables/hips) |
| Game | levels 2, pitched, brown colours ≈; proposal **1 tall storey** (eave 4.9), several roof masses |
| Web | baptisten-geretsried.de (EFG Geretsried, Baptisten; active). **Good photos:** `20-web-front.jpg` = street front: **white single-storey hall with 6–7 round-arched windows (dark frames), glazed double door, brown tile roofs (hip + lower wing), cream-yellow side wing with a glass-block window, street trees, low picket fence**; `21-web-innenhof.jpg` courtyard side (white rendered gable with 4 tall lattice windows, **small white chimney-tower with a cross**, red-brown tiles); neighbouring houses in the garden shots are dark-timber gables, one with PV; `22/23` garden with timber pergola, swing, climbing tower |
| Needs SV | only a currency check (photo date unknown) and the cross/sign |

### #78 BSZ Direktmarketing GmbH (slug `bsz-direktmarketing`; 783 m)
| | |
|---|---|
| OSM | node 3528911942 (Wallensteinstraße 6b, shop=stationery); building way 191461638 (677 m², 29 × 23 m) |
| LoD2 | 4667440 gable ridge 9.8, eave 7.6 (954 m²: larger than the OSM outline) |
| DOP roof | `#a9a69f` / `#d2cecc` / `#dbd8d5`: gable with **PV on both slopes**, yard with trucks/containers |
| Game | levels 2, **flat** → proposal 2 levels, gable + PV |
| Web | bszgroup.com Impressum: **BSZ GmbH**, Wallensteinstr. 6b: direct marketing / logistics. Not a shop → kind should be office/industrial |
| Needs SV | sign, loading doors |

### Spielplatz Breslauer Weg (slug `spielplatz-breslauer-weg`; 318 m)
| | |
|---|---|
| OSM | way 1271723892 leisure=playground, access=yes, 1368 m², 43 × 33 m |
| DOP | **entirely under tree canopy** (`#313e2b` / `#44512e` / `#4c5a44`): no equipment or surface visible |
| Game | not drawn (residential ground) |
| Needs | SV from Breslauer Weg if it sees in; otherwise **Alex's photo** (equipment, surface) |

### Centrale Geretsried (ex Coffeeholic) (slug `centrale-geretsried`; 379 m)
| | |
|---|---|
| OSM | address node 2330656364 (Neuer Platz 5) inside way 127604896 = **6c Site A** (Feinkost Christos #160 and Munzur Kebap #57 in the same low building) |
| LoD2 | 4 flat parts 3.6–4.4 m (see 6c-prep Site A) |
| DOP roof | `#b3a694` / `#ebe0d8` / `#f0e8e3` (light flat) |
| Game | levels 1, **pitched = true** → flat (same fix as 6c Site A; coordinate with that item) |
| Web | "Centrale Geretsried", tel. 08171 31435, Mo–Sa 9–22; older listings "Coffeeholic Café Bistro" with terrace. No photos |
| Needs SV | which name is on the sign, terrace, which unit |

### Café Bar DUO (slug `cafe-bar-duo`; 508 m)
| | |
|---|---|
| OSM | building way 1385177375 (Sudetenstraße 47a, 647 m², 36 × 23 m); node 4918722760 = disused pet shop "Isartaler Zoofachmarkt" (47a) |
| LoD2 | 4603083 gable ridge 6.8, eave 4.1 (581 m²) |
| DOP roof | `#99806c` / `#ad977c` / `#cba792` (brown gable) |
| Game | levels 2, pitched → proposal **1 level** gable (eave 4.1) |
| Web | tourismus.geretsried.de/cafe-bar-duo-1 + toelzer-land.de: Sudetenstraße 47, tel. 08171 6298445. No usable photo |
| Needs SV | unit (47 vs 47a; Takt Tanz, ex-Zoofachmarkt), sign |

### "Laufbahnen" Franz-Marc-Schule → Verkehrsübungsplatz (slug `laufbahnen-franz-marc-schule`; 660–690 m)
| | |
|---|---|
| OSM | leisure=track ways 258497399 (asphalt, lit=no, outer loop 1807 m²), 258497400–402, 269909762 (inner lanes), inside landuse=recreation_ground 258497403 **"Verkehrsübungsplatz"** (2503 m²) |
| DOP | **a children's traffic training course**: asphalt lanes (~4 m) looping round 3 lawn islands, white lane/stop markings and small crossings visible; trees on the S side |
| Game | drawn as one grass area (2502 m²) |
| Proposal | rename the item ("Verkehrsübungsplatz Franz-Marc-Schule"); draw asphalt lanes + markings from DOP20, keep the lawn islands |
| Needs | DOP20 is good for the layout; SV unlikely (inside the grounds); signs/markings detail: Alex's photo optional |

### Spielplatz J.-S.-Bach-Straße (slug `spielplatz-jsb-strasse`; 680 m)
| | |
|---|---|
| OSM | way 122032725 leisure=playground, access=yes, 620 m², 27 × 23 m |
| DOP | open **sand area** with a few coloured play items (red/orange), lawn rim, trees around |
| Game | not drawn |
| Needs | SV or Alex for the equipment types |

### Fitness-Station way 574767212 (slug `fitness-station-574767212`; 751 m)
| | |
|---|---|
| OSM | leisure=fitness_station, lit=no, 261 m², in Stadtwald Geretsried (forest 104955372) |
| DOP | **under canopy**, nothing visible (`#262e23`…) |
| Game | forest |
| Needs | **Alex's photo** (127 m off the road, no SV) |

### Fitness-Station way 497511384 (lit) (slug `fitness-station-497511384`; 787 m)
| | |
|---|---|
| OSM | leisure=fitness_station, lit=yes, 217 m², 23 × 13 m, in the Stadtwald next to a path |
| DOP | light **bark/sand patch** (`#e0c5a4`) beside the forest path; equipment not readable |
| Game | forest |
| Needs | **Alex's photo** (equipment) |

### Champini Sport- & Bewegungskita (slug `champini-kita`; 821 m)
| | |
|---|---|
| OSM | building way 524105770 (Jeschkenstr. 103, building=kindergarten, 463 m², 32 × 15 m); grounds way 1271723889 "Champini" (978 m²) |
| LoD2 | 107585788 flat 6.5 m (function 3065 = kindergarten) |
| DOP roof | `#c5bcb0` / `#c8bfb6` / `#cfc5bb` (light flat), garden S |
| Game | levels 2, flat ✓; garden not drawn |
| Web | champini.de/Unsere-KiTas/Suedbayern/Geretsried-Jeschkenstrasse, tel. 08171 4824820. Photos: interiors and a promo poster with children: not saved |
| Needs SV | facade colour, sign, garden fence |

## What Street View / Alex must deliver
- **Good web photos already:** Christuskirche (front + courtyard + garden), Franz-Marc-Schule (one exterior), Bäckerei Burger (one small dusk shot).
- **Street View should do it:** Carglass, Piatsa, Lewke, Matheis, Fitness Forum, Burger (roof + drive-in), Schröter, Occasione, BSZ, Centrale, DUO, Champini, Christuskirche (currency).
- **Clearly Alex's own photos:** both Fitness-Stations (forest, one under canopy), Spielplatz Breslauer Weg (under canopy), Spielplatz J.-S.-Bach-Str. (equipment), optionally Verkehrsübungsplatz details.
