# Batch 6c prep (start area, 377–509 m): research notes, NOT final place docs

> **Superseded 2026-10-25** by the final docs (places/feinkost-christos, munzur-kebap, brk-kleidermarkt, isar-apotheke,
> dr-schmucker, juchheim-cosmetics, italy, zirngibl-bestattungen, aussegnungshalle) and BACKLOG B6c-1…5, after the Street View
> capture. Corrections: the Feinkost window sign reads **"Feinkost Christos"** (name stays); the Aussegnungshalle orange roof +
> PV is confirmed by Google satellite too.

Researched 2026-10-25 from the web, OSM (Overpass, 2026-10-25), Bavarian **LoD2** (tiles 684_5302 + 684_5304) and **DOP20**
(© Bayerische Vermessungsverwaltung – www.geodaten.bayern.de, CC BY 4.0). OSM data © OpenStreetMap contributors (ODbL).
**No Street View yet**: every facade, sign and colour below that is not from the DOP or a business photo still **needs
reference**. Web photos and logos are **reference only** (copyrighted, never shipped). Engine values = public/geretsried.map.json
at 44fc414. Images: `reference/6c-prep/<site>/` (local only). Heights: LoD2 measuredHeight = ridge; "eave" = the building's
lowest eave (NiedrigsteTraufe), so a low annex pulls it down. Levels proposal = (main eave − 0.6) / 3, rounded.

Backhupferl (#5) is a counter inside EDEKA Am Stern (already covered there): no own item.

## Site A: Neuer Platz 3 / 7 (one low building, way 127604896): #160 + #57
| | |
|---|---|
| Building | way 127604896 (building=retail, building:levels 1, roof:shape flat); address node Neuer Platz 3 inside, Neuer Platz 7 node ~7 m away |
| Engine | levels 1, **pitched = true** → mismatch: OSM + LoD2 say flat |
| LoD2 | 4 flat parts: 4602857 4.4 m (99 m²), 4602858 3.6 m, 4602859 3.7 m, 105019383 3.6 m |
| DOP roof | 25/50/75 %: `#b1a99c` / `#ece3de` / `#f1e7e5` (light, flat) |
| Proposal | #0b: roof { pitched: false, colour `#ece3de` }, levels 1. Optional masses: the 4.4 m part vs the 3.6 m parts (difference small) |
| Images | 01-dop20-ortho.jpg, 02-dop20-osm-outline.jpg, 06-web-olive-feinkost-logo.png (reference only) |

**#160 "Feinkost Christos"** (map 3621.0, 4676.6; 377 m from start). OSM node 12430667625, shop=greengrocer, check_date
2024-12-18. Trades as **"Olive Feinkost"** (Christos Voudouris), **Neuer Platz 7**, 82538 Geretsried, tel. 08171 80307,
Mo–Fr 8–18, Sa 8–14 (olivefeinkost.de, Das Örtliche, Gelbe Seiten). Logo: green olive branch + "Olive Feinkost – Griechische
Lebensmittel & mehr". Website photos are products only, no exterior. Possible name fix later ("Olive Feinkost"): ask/decide
with the final doc. Facade, sign position: **needs Street View confirmation**.

**#57 "Munzur Kebap"** (3607.4, 4689.2; 392 m). OSM node 2599419101 (old_name Metzgerei Knöbl). Munzur Kebap & Imbiss,
**Neuer Platz 3**, tel. +49 8171 9977088, Mo–Fr 8–18:30, Sa 9–16:30 (several listings agree). No usable exterior photo found.
Same building as #160. Nearby: bus stop "Geretsried, Neuer Platz" (node 2024816308, no shelter, realtime board), WC container
(node 4628757195), HUK-Coburg office. Facade, sign: **needs Street View confirmation**.

## Site B: J.-S.-Bach-Straße 13 / 13a (way 127604883): #73 + #18 + #121
| | |
|---|---|
| Building | way 127604883 (building=yes); Isar-Apotheke node is 7.5 m outside it (nearest building) |
| Engine | levels 2, pitched → **too low** |
| LoD2 | 4602812 gable, ridge 13.4 m, eave 11.2 m (184 m²); 4602813 gable, ridge 14.0 m, lowest eave 5.2 m (386 m²) |
| DOP roof | `#8c8978` / `#bbaa9a` / `#c5b4a4` |
| Proposal | #0b masses: 4602812 levels 4 pitched (eave 11.2 m); 4602813 split eave (5.2 m low side) → needs the LoD2 roof faces before choosing levels (likely 4 + a low annex) |
| Images | 01/02 DOP, **06-web-isar-apotheke-front.jpg** (exterior), 07 banner, 08 logo, 09-web-dr-schmucker-logo.png |

**#18 "Isar-Apotheke"** (3683.2, 4864; 381 m). OSM node 370894683. **J.-S.-Bach-Str. 13a**, Hans Lieb e.K., tel. 08171 31499,
Mo–Fr 8–19, Sa 8–13. **Exterior photo exists** (isar-apo-geretsried.de/storeFront, reference only), seen there:
- cream/white multi-storey block with yellow balcony panels; ground floor clad in travertine-like stone slabs;
- a red line along the top of the shop fascia; a dark grey fascia panel with red "ISAR APOTHEKE" lettering and a blue logo
  between the words; a red/white pharmacy "A" sign projecting at the right;
- red window bands ("…ährungsberatung", "Bestell-/Lieferservice", "Pharmazie | Arzneimittel", "…Rezepturen");
- glass door, a ramp with steel rails, terracotta planters, a blue "P nur für Kunden" sign at the left.
Photo date unknown → colours and lettering: **needs Street View confirmation** before the final prompt.

**#121 "Dr. Schmucker"** (3685.7, 4874.6; 385 m). OSM node 9172434598. Dr. med. Uli Schmucker, Hausarzt, J.-S.-Bach-Straße 13,
tel. 08171 909045. Logo "Hausarztpraxis DR. SCHMUCKER" (blue/teal circle). The praxis photo on the site is stock: not used.
Gameplay note: findHospital() respawns the player at this doctor; do not move or rename the POI.

**#73 "BRK KleiderMarkt"** (3691.5, 4872.7; 380 m). OSM node 3203730734. J.-S.-Bach-Straße 13, tel. 08171 649300. Hours:
BRK site Mo–Fr 9:30–13, Th also to 18; OSM Mo–Fr 09–13 + Tu/Th/Fr 15–18:30 (OSM probably outdated). The BRK photo is an
interior with a person: not used. Sign, entrance: **needs Street View confirmation**.

Nearby: bus stop "Geretsried, Karl-Lederer-Schule" (node 3823202158, no shelter).

## Site C: Neuer Platz 2 (way 127604877): #17
| | |
|---|---|
| Engine | levels 2, pitched → **too low** |
| LoD2 | 105018621 hipped, ridge 12.1 m, eave 9.6 m (171 m²) |
| DOP roof | `#746756` / `#847464` / `#b89f89` (brown) |
| Proposal | #0b levels 3, pitched (hip), DOP colours |
| Images | 01/02 DOP |

**#17 "Juchheim Cosmetics"** (3582.7, 4710.5; 419 m). OSM node 370891568, shop=beauty, check_date 2024-12-18, OSM note
"Brrr, name sic.". On the web the business at this spot is **"Isar Nails und Beauty", Neuer Platz 2** (tel. 08171 3608284;
isarnails.de did not resolve on 2026-10-25); the owner is an independent Dr. Juchheim adviser. Dr. Juchheim GmbH itself is
in Oberhaching, so the OSM name is the product brand. **The name on the sign needs Street View confirmation** before any rename.

## Site D: J.-S.-Bach-Straße 23 / 25 (way 668422401): #19 + #97
| | |
|---|---|
| Building | way 668422401 (address nodes 23 and 25); dentist "Wirth Steffen" (node 9172434597) is in the same building |
| Engine | levels 2, pitched → **too low** for the main part |
| LoD2 | 4603126 gable, ridge 11.8 m, eave 9.6 m (206 m²); 4603127 gable, ridge 12.3 m, lowest eave 3.4 m (301 m²) |
| DOP roof | `#6d6153` / `#ac9c8c` / `#bdaa99` |
| Proposal | #0b masses: 4603126 levels 3 pitched; 4603127 needs the roof faces (3.4 m eave = a long sloping side or a low annex) |
| Images | 01/02 DOP, 06-web-italy-logo-crop.jpg, 07-web-zirngibl-logo.png (reference only) |

**#19 "Italy"** (3545.7, 4770.4; 468 m). OSM node 370894688, restaurant, Italian. Web name **"Italy da Umile"**,
J.-S.-Bach-Straße 23, tel. 08171 31211, closed Mondays (italydaumile.com, tourismus.geretsried.de). Website images are food
and interior only; the logo uses dark-red lettering "Ital…". Facade, terrace, sign: **needs Street View confirmation**.

**#97 "Zirngibl Bestattungen GmbH"** (3524.7, 4750.8; 484 m). OSM node 6259468485. J.-S.-Bach-Straße 25, tel. 08171 2581234
(zirngibl-bestattungen.de/filialen/geretsried). OSM operator="Tara Carroll" looks wrong (unverified; do not use). Logo grey
"ZIRNGIBL Bestattungen"; the banner photo is stock. Facade: **needs Street View confirmation**.

## Site E: Aussegnungshalle, Waldfriedhof (way 645297386): #234
| | |
|---|---|
| Building | way 645297386 (amenity=place_of_worship) inside Waldfriedhof Geretsried (way 104959902), Adalbert-Stifter-Straße 53; Friedhofsverwaltung tel. 08171 31353 |
| Engine | levels 2, pitched (gable) → wrong roof shape |
| LoD2 | 4603557 **Pultdach (mono-pitch)**, ridge 9.0 m, eave 3.9 m, 255 m²; 4603558 (function 51009_1610, 7 m², flat, 10.6 m), ~20 m E = most likely the **bell tower**; low flat neighbours 4603555 (4.85 m, 394 m²), 4603556 (3.6 m) |
| DOP roof | `#666352` / `#8e8878` / `#e19f6b`: orange roof with PV panels on the N part, grey S part |
| Images | 01/02 DOP, **06-web-friedhofsgebaeude.jpg** (geretsried.de/friedhofsverwaltung, reference only) |

City photo (date unknown) shows: a cream building with a steep dark, mossy mono-pitch roof; a flat-roofed entrance wing; a tall
cream concrete bell tower with red-brown louvres and a crucifix. **The dark roof in the photo conflicts with the orange DOP roof**
(maybe re-roofed with PV, or the photo shows a different face): **needs Street View confirmation**. The engine has no mono-pitch
roof type: needs an engine check (#0b roof options) before the prompt. OSM entrance nodes: "Eingang Aussegnungshalle"
(6261202275), "Ausgang Trauerzug"; also a memorial stele and toilets.

## Summary: what Street View must show for 6c
- A: which unit is Olive Feinkost vs Munzur Kebap, signs, the flat roof edge.
- B: whether the web front photo is still current (colours, lettering), BRK and Dr. Schmucker entrances.
- C: the actual sign name (Juchheim Cosmetics vs Isar Nails und Beauty).
- D: Italy da Umile's front/terrace, Zirngibl's front.
- E: roof colour/shape and the bell tower.
