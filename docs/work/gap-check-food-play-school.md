# Gap check: food / play / schools / sport (2026-10-25)

Source: Overpass (overpass.openstreetmap.fr; overpass-api.de returned 406), map bbox 47.845,11.43 – 47.9,11.505
(= scripts/import-osm.ts BBOX). 208 OSM features. Compared with public/geretsried.map.json (box clone, 234 POIs, 743 areas)
and docs/BACKLOG.md (6e table, Gyms, I-1). Matching: named feature = same/contained name within 400 m of a game POI;
unnamed feature = game POI of the same kind within 40 m; park/pitch ways = centroid inside a game area of that kind.
Full row list: gap-check-food-play-school.csv (OSM id, tag, address, m from start, status, match, importer coverage,
nearest road, access). Script: gap.py, raw: osm.json. Plus 13 web-only restaurants (not in OSM), marked osm=web.

## Counts

| Category | OSM total | in game | planned in BACKLOG (6e/Gyms → I-1) | missing entirely |
|---|---|---|---|---|
| Restaurants/cafés/fast food/bars/pubs/biergarten/ice cream/clubs | 40 | 37 POIs | 3 (ShishaBar, M1 Lounge, Vegas Casino) | 0 in OSM; **~10 real ones not in OSM (web)** |
| Schools/kindergartens/childcare/college/driving schools | 43 | 12 (9 named schools + 3 unnamed campus parts) | 5 (Caritas KiGa, Kinderland, Erle, Blechkiste ×2) | 26 (14 named = 13 sites, Champini twice; 12 unnamed) |
| Playgrounds (leisure=playground) | 22 | 0 | 0 | 22 (all unnamed, 1 named after KiGa Gelting) |
| Parks (leisure=park/garden) | 3 | 3 as areas (kind park) | – | 0 |
| Sport (pitch, sports_centre, stadium, track, fitness_station) | 81 | 56 pitch areas + Dirtpark POI #70 | 3 (school hall skip, Tina´s, ClubVital) | 21 |
| Swimming pools | 19 | 0 | 0 | 19 (18 unnamed private garden pools + 1 near Hallenbad) |

Map structure: map.json keys = width, height, bbox, roads, buildings, **areas**, waterways, pois, signals, crossings, props,
districts, covered, buses. `areas` kinds: grass 255, parking 160, forest 108, farmland 60, **pitch 57**, water 52,
industrial 28, residential 20, **park 3**. Areas carry only {kind, pts}: no name, no OSM id. There is **no playground area
kind**: import QUERY fetches `way["leisure"~"park|pitch"]` only (ways, no relations), so playgrounds, tracks, stadiums and
fitness stations never reach the map, not even as ground.

## Food & drink
In OSM everything named is already a game POI (37) or in 6e (3). The gap is OSM itself. Real places found on the web
(tourismus.geretsried.de, toelzer-land.de, golocal, mappde) that are in neither OSM nor the game; verify still open:

| Name | Address | m from start | Note |
|---|---|---|---|
| Coffeeholic Café | Neuer Platz 5 | ~396 | Neuer Platz, next to Munzur |
| Café Bar DUO | Sudetenstraße 47 | ~483 | same building as Takt Tanz |
| Indian Palace | Sudetenstraße 47 | ~483 | old directory entry, maybe closed |
| Club57 | Sudetenstraße 74 | 1083 | |
| Asien Perle | Jeschkenstraße 28 | 909 | |
| Boulevard Bistro | Jeschkenstraße 13 | ~1360 | |
| Restaurant Akropolis | Brunnenfeldweg 4-10 | ? | on official tourism list |
| Yellow Chilli | ? | ? | on official tourism list |
| Café Centrale | ? | ? (near centre) | |
| Hotel Gasthof Neu Wirt | Wolfratshauser Str. 24-26, Gelting | ~5000 | |
| Landgasthof Alter Wirth | Buchberger Str. 4, Gelting | ~5000 | |
| Kulturbühne Hinterhalt | Leitenstraße 40, Gelting | ~5400 | venue with bar |
| (Restaurant Ostasien) | Steiner Ring 8 | | same address as Pho Viet #22: old name, skip |

## Schools & childcare: missing (nearest first)
| m | Name | Tag | Address / near | OSM | I-1 |
|---|---|---|---|---|---|
| 821 | Champini Sport- & Bewegungskita | kindergarten | Jeschkenstraße 103 | way 524105770 (+ way 1271723889 "Champini" = same site) | yes (step 1) |
| 830 | (unnamed Kita) | kindergarten | Robert-Schumann-Weg | way 1385177361 | dropped (no name) |
| 1369 | (unnamed Kita) | kindergarten | Adalbert-Stifter-Straße | way 669533891 | dropped (no name) |
| 1376 | Kindergarten des Diakonischen Werkes | kindergarten | Steiner Ring 159 | way 539822403 | yes |
| 1382 | Kinderland Gartenberg | kindergarten | Adalbert-Stifter-Straße 7 | way 188240368 | yes |
| 1398 | Staatliche Feuerwehrschule Geretsried | college | Sudetenstraße 81 | way 107100808 | **no** (amenity=college not in any filter) |
| 1413 | Fahrschule Leirich | driving_school | Tegernseeweg 1 | node 6247244441 | **no** |
| 1442 | Fahrschule Schattschneider | driving_school | Adalbert-Stifter-Straße 5 | node 7513431851 | **no** |
| 1597 | Fahrschule kmh | driving_school | Egerlandstraße 2 | way 320687022 | **no** |
| 2079 | (unnamed Kita) | kindergarten | Martin-Luther-Weg | way 1271723886 | dropped |
| 2211 | Waldkindergarten Isartal e.V. | kindergarten | Am Forst | way 285710835 | yes |
| 2352 | Johanniter Kinderhaus Zwergenland | kindergarten | Johannisplatz 4a | node 11809512565 | yes |
| 3509 | Kindergarten Ascholding | kindergarten | Isarstraße 24 | way 189251625 | yes |
| 3820 | Kita "Isarkinder" Ascholding | kindergarten | Eglinger Straße 3 | way 1069594154 | yes |
| 5473 | Kindergarten Gelting | kindergarten | Leitenstraße 4 | way 92101829 | yes |
| 5723 | Städt. Kindergarten & Kinderkrippe | kindergarten | Sudetenstraße 102 | way 97695048 | yes |
The 9 missing unnamed amenity=school ways (248 m, 261 m, 741 m, 1355–1503 m) are parts of existing school campuses
(Karl-Lederer, Blechkiste/Franz-Marc, Schulzentrum): not separate places, skip. All 9 named schools are in the game.

## Playgrounds: all missing (22, none named)
Nearest: 318 m Breslauer Weg (way 1271723892, public) · 680 m J.-S.-Bach-Straße (way 122032725, public) · 1189 m
Adalbert-Stifter-Straße (496090149) · 1380 m Osterseeweg (169271318) · 1433 m Tegernseeweg (169270686) · 1493 m Steiner Ring
(539824773) · 2302 m B 11 (833472869) · 2354 m Amselweg · 2355/2380 m Johannisplatz (2) · then Isardamm, Kirchplatz, Rosenweg,
Graslitzer Str. (private), Schloßstraße, Gelting (Rupertstr., Korbinianstr., KiGa Gelting). 2 private, 1 customers-only.
OSM likely misses more (e.g. in the Stein/Neuer Platz blocks); needs a DOP20/Street View pass to confirm.

## Sport & pools: missing
| m | Name | Tag | Near | OSM | I-1 |
|---|---|---|---|---|---|
| 660–690 | running/asphalt tracks (5) | track | Robert-Schumann-Weg (Franz-Marc-Schule) | ways 258497399–402, 269909762 | no |
| 751/787/1124 | Trimm-dich / fitness stations (3) | fitness_station | St 2369, Ahornweg | 574767212, 497511384, 574767217 | no |
| 1174 | **Interkommunales Hallenbad Geretsried** | sports_centre (swimming) | Adalbert-Stifter-Straße 22 | way 772881803 | caught, but as kind **gym** (wrong) |
| 1285 | Turnhalle Mittelschule | sports_centre | Adalbert-Stifter-Straße 18 | way 188593099 | caught as **gym** (wrong: school hall) |
| 1301 | **Heinz-Schneider-Eisstadion** | stadium | Jahnstraße 25 | way 172282411 | **no** |
| 1362 | **Isarau Stadion** | stadium | Jahnstraße 4 | way 981957335 | **no** |
| 1387/1444 | long-jump pits (2) | track | Schulzentrum | 1236727141/2 | no |
| 1424 | tartan running track | track (relation) | Jahnstraße | relation 16929053 | no |
| 1474 | Turnhalle Gymnasium | sports_centre | Adalbert-Stifter-Straße | way 188593876 | caught as **gym** (wrong) |
| 1575 | Sport Center Hahn | sports_centre | Königsdorfer Weg 7 | node 2716650515 | yes (gym; check what it is) |
| 1586/1592 | tennis halls (2, unnamed) | sports_centre tennis | Grundstraße/Stollenwiese | 188632640, 188632620 | dropped (no name) |
| 3011 | table tennis table | pitch (node) | Banater Straße | node 13306464058 | no (node) |
| 3844 | (unnamed) | sports_centre | Schloßstraße | way 1086044529 | dropped |
Pools: 19 leisure=swimming_pool, all unnamed; 18 are private garden pools (skip). way 1311996572 (1176 m) sits at the
Hallenbad. No public outdoor pool in OSM inside the bbox.

## Does I-1 cover it?
- Food: OSM yes (all in game). The ~10 web-only restaurants need a hand-added list like I-1 step 4 (needs lat/lon each).
- Kindergartens: yes, I-1 step 1 (amenity kindergarten|childcare, whole bbox) catches the 10 named elements (9 sites; Champini twice); unnamed ones are
  dropped by the name rule. But I-1's check list only names the 6e ones: add these 11 to the check list.
- Schools: Feuerwehrschule (college) and 3 driving schools are not in any filter → extend: amenity college|driving_school.
- Playgrounds: NOT covered. Needs: way["leisure"="playground"] in QUERY + new area kind `playground` (build.ts areaKind
  + ground colour), optionally a POI/label. Same for leisure=track and stadium (would also need relations for 16929053).
- Sport centres: I-1 maps every named leisure=sports_centre to `gym` → Hallenbad and two school Turnhallen would become
  gyms (and pickup candidates). Extend I-1: sport=swimming → new kind `pool` (or civic); name ~ "Turnhalle" or inside a
  school area → skip (like the Karl-Lederer hall); stadium → kind `stadium`/civic.

## Update 2026-10-25 (verification, Alex: "füge die alle hinzu")
Restaurants verified on the web + geocoded; result is BACKLOG item I-2 step 3.
- Added (hand list): Centrale Geretsried (= Coffeeholic/Café Centrale, Neuer Platz 5, 379 m), Café Bar DUO (Sudetenstr. 47a,
  508 m), Asien Perle (Jeschkenstr. 28, 909 m), Club57 (Sudetenstr. 74, 1082 m), Restaurant Akropolis (Brunnenfeldweg 4, 4631 m).
- From OSM instead: Kulturbühne Hinterhalt (way 191174401, amenity=arts_centre).
- Not added: Indian Palace (unverified: only old directory entries), Boulevard Bistro (unverified: last reviews 2012,
  contradicting hours), Yellow Chilli (in Königsdorf), Restaurant Ostasien (old name, Pho Viet's address), Alter Wirth and
  Servus Gelting/Neu Wirt (open, in OSM, but west of the map bbox).
- Kindergarten count corrected: 10 named OSM elements = 9 sites (Champini twice).
