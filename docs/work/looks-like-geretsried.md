# Warum es nicht wie Geretsried aussieht: die größten Unterschiede (2026-10-25)

Auftrag (Alex, 2026-10-25): "finde noch mehr stellen und details aktuell sieht es nicht wie geretsreid aus".
Nur Doku. Am Spielcode wurde nichts geändert.

**Grundlage**
- **Spiel:** Box-Klon auf `origin/main` f9ca49d, `pnpm dev` auf :5190. Headless-Chrome-Screenshots über `?compare=lat,lon,half` (von oben, Norden oben) plus ein Bild im Spielmodus am Start. Bilder liegen in `work/looks/*-game.png`.
- **Luftbild:** Bayerisches DOP20 per WMS `by_dop20c`, gleiche Ausschnitte (`work/looks/*-dop20.jpg`). © Bayerische Vermessungsverwaltung – www.geodaten.bayern.de, CC BY 4.0.
- **LoD2:** CityGML-Kacheln `684_5302` und `684_5304` (6453 Gebäude: Start, Neuer Platz, Stein, Am Stern, Rathaus, Gartenberg). Liegt in `work/lod2/`, ausgewertet mit `lod2.py`.
- **OSM:** Overpass (overpass.openstreetmap.fr, Datenstand 2026-08-10), Karten-bbox S 47.845, W 11.43, N 47.9, E 11.505. Daten in `work/looks-osm.json`, `q2.json`, `q3.json`.
- **Web:** de.wikipedia „Geretsried“, Denkmalliste Geretsried (BLfD-PDF), geretsried.de/stadtzentrum, Merkur, SZ und Krämmel (puls G). Links stehen bei den einzelnen Punkten.
- **Kontaktbogen:** `contact-sheets/looks-gap.png` mit 6 Orten, links Spiel, rechts DOP20.

**Die sechs Vergleichsorte (alle im Kontaktbogen)**

| Ort | lat, lon | Ausschnitt |
|---|---|---|
| Start, Sudetenstraße 19 | 47.85820, 11.48359 | 240 m |
| Neuer Platz (Stein) | 47.85790, 11.47860 | 240 m |
| Rathaus / Karl-Lederer-Platz | 47.87460, 11.46550 | 240 m |
| Am Stern (EDEKA) | 47.85680, 11.48940 | 240 m |
| Gartenberg, Blombergweg (Wohnstraße) | 47.87200, 11.47300 | 240 m |
| Isar bei Ascholding | 47.88100, 11.48160 | 400 m |

**Pixelvergleich pro Ausschnitt** (256² Pixel. Das DOP ist dunstig, deshalb ist seine Sättigung immer etwas niedriger. Die Richtung des Unterschieds ist trotzdem eindeutig.)

| Ort | Spiel: grüne Pixel (Sättigung) | DOP20: grüne Pixel (Sättigung) | Spiel: Terrakotta-Pixel | DOP20: Terrakotta-Pixel |
|---|---|---|---|---|
| Start | 46 % (0.51) | 27 % (0.23) | 23.8 % | 6.0 % |
| Neuer Platz | 56 % (0.53) | 32 % (0.24) | 18.4 % | 1.8 % |
| Rathaus | 43 % (0.47) | 27 % (0.21) | 12.9 % | 1.7 % |
| Am Stern | 54 % (0.51) | 32 % (0.24) | 9.6 % | 4.9 % |
| Gartenberg | 58 % (0.52) | 38 % (0.24) | 18.4 % | 4.5 % |
| Isar | 72 % (0.60) | 48 % (0.28) | 0 % | 0 % |

---

## Rangliste: die 13 größten Unterschiede

### 1. Fast jedes Steildach ist orange-terrakotta. Echt sind die Dächer gemischt: Braun, Anthrazit, Ziegelrot. Aufwand S
- **Im Spiel:**
  - `src/render/scene/roof-tone.ts` macht aus jeder „warmen“ Dachfarbe (Farbton < 0.12 oder > 0.95, Sättigung ≥ 0.1) sattes Terrakotta: Farbton wird auf ≤ 0.055 gesetzt, Sättigung ×2.2 auf 0.35–0.58.
  - Braune und graubeige Betondachsteine bzw. Eternit (Farbton 25–43°, wenig Sättigung) fallen in dieselbe Klasse.
  - Ergebnis: **3215 von 3872 Steildächern mit Fotofarbe (83 %) werden Terrakotta.** Davon sind **1528** eigentlich gering gesättigtes Braun oder Graubeige (Farbton 25–43°, Sättigung < 0.25).
  - Beispiel Neuer Platz: Gemessen wurden `#746d5c`, `#7f705f` und `#686454` (Graubraun), gemalt wird Orange.
- **In Wirklichkeit:**
  - DOP20 Neuer Platz: Die langen Wohnblocks haben dunkelbraune Dächer.
  - DOP20 Gartenberg: Ziegelrot, Anthrazit und Braun gemischt.
  - Pixelanteil Terrakotta: Spiel 10–24 %, DOP20 1.7–6 %. Das Spiel ist also **3–10× zu orange**.
  - Im BACKLOG gibt es das schon als Einzelfall: Werkstatt Wilhelm, Zeile ~665: „light brown came out as orange clay tiles“.
- **OSM:** `roof:colour` steht nur an 2 von 5523 Gebäuden, `roof:shape` an 74. Die Farbe muss also weiter aus dem Luftbild kommen.
- **Vorschlag:** Die Warm-Klasse auf wirklich rote Ziegel begrenzen (z. B. Farbton < 0.07 **und** Sättigung ≥ 0.18). Braun und Graubeige als Braun bzw. Anthrazit graden. Wenn möglich mit DOP20 statt DOP40 neu sampeln, weil DOP20 weniger Dunst hat. → **V-1**

### 2. Gebäudehöhen: 79 % der Gebäude stehen auf dem Standardwert „2 Geschosse“, die Wohnblocks sind zu niedrig. Aufwand M
- **Im Spiel:** Die Geschosszahl kommt aus `building:levels`. Fehlt das Tag, gilt `TYPICAL_LEVELS` (apartments 4, sonst 2). Wandhöhe = Geschosse × 3 m.
  - Verteilung in `map.json`: 2 Geschosse **4538**, 1 → 1013, 4 → 176, 3 → 18, 5 → 3, 11 → 1.
- **OSM:** Nur **159 von 5523** Gebäuden haben `building:levels`, 12 haben `height`.
- **LoD2, nur 2 Kacheln** (Gebäude mit Grundfläche ≥ 150 m², per Schwerpunkt ≤ 6 m zugeordnet, Place-Gebäude ausgenommen):
  - 543 zugeordnet. **120 davon sind ≥ 12 m hoch (First), 71 davon zeichnet das Spiel als 2 Geschosse (6 m Wand).**
  - 37 sind ≥ 15 m, 17 davon als ≤ 2 Geschosse.
  - Bei 87 ist der First mindestens 6 m höher als die Spielwand.
- **Beispiele:**
  - puls G am Karl-Lederer-Platz: LoD2 30.3 m. Laut Krämmel EG + 1. OG + 5 Wohnetagen = 7 Geschosse (https://www.kraemmel.de/immobilien/ausgewaehlte-referenzen/puls-g). Im Spiel 5.
  - Way 833483720 (47.87776, 11.47191): LoD2 27.5 m, im Spiel 2 Geschosse.
  - Way 669533892 (47.85900, 11.48066): 36.1 m, im Spiel 11 Geschosse, das passt.
  - Kirchtürme (Maria Hilf, Petruskirche) sind über Places schon richtig hoch.
- **Gesamter Ausschnitt:** etwa 16 LoD2-Kacheln à 2×2 km. Abruf: `https://download1.bayernwolke.de/a/lod2/citygml/<E>_<N>.gml`, E und N in km UTM32, gerade Zahlen, z. B. 684_5302.
- → **V-2**

### 3. Die Isar ist ein tiefblauer Kanal im Rasen. Echt: türkis-graues Wasser zwischen großen weißen Kiesbänken. Aufwand M
- **Im Spiel:**
  - Fluss als `waterway` mit 40 m Breite plus Wasserflächen. Wasser-Pixel im Median **(22, 87, 124)**, tiefblau. Ringsum Rasen.
  - Das Import-QUERY holt nur `natural~"water|wood"`, daher fehlt **`natural=shingle` komplett: 44 Ways, 15.4 ha** im Ausschnitt.
- **In Wirklichkeit:**
  - DOP20 Isar: Wasser blass jade bis graugrün (Proben 143–168, 143–174, 102–141). Dazu breite weiße Kiesbänke (Pixel > 190 Helligkeit: 22.5 % des Ausschnitts).
  - Unter der Wasserfläche des Spiels liegt im DOP im Median heller Kies (235, 225, 217). Die OSM-Rinne liegt dort etwa **60 m neben** der aktuellen Rinne. Bei einem Wildfluss ist das normal, Kiesbänke wandern.
  - Wikipedia: „eine der letzten europäischen Wildflusslandschaften … schlängelt sich die Isar … frei und wild durch den Endmoränenschotter“. Naturschutzgebiet „Isarauen zwischen Schäftlarn und Bad Tölz“ (OSM way 291496772). Die Isar ist auch das Wellenband im Stadtwappen.
- → **V-3**

### 4. Zu viel und zu sattes Grün, zu wenig Pflaster und Hof. Aufwand S (Gestaltungsentscheidung)
- **Im Spiel:** In der Stadt sind 43–58 % der Pixel Rasengrün, Sättigung ≈ 0.5. Höfe zwischen den Blocks und Vorplätze sind fast überall Rasen.
- **In Wirklichkeit:** DOP20 zeigt 27–38 % Grün, Sättigung ≈ 0.23. Höfe sind oft gepflastert oder Stellplatz, Gärten fleckig und dunkler. Die DOP-Sättigung ist durch Dunst gedrückt, ein Faktor ~2 bleibt trotzdem.
- **Vorschlag:** Rasen-Tint dunkler und weniger gesättigt. Wo das Luftbild hell und grau ist, Pflaster statt Rasen. → **V-4**

### 5. Straßen: dunkel-schiefer statt hellgrauer Asphalt, die Neue Mitte ist sandfarben. Aufwand S (Gestaltungsentscheidung)
- **Im Spiel:** Fahrbahn an allen 4 Proben am Start **(61, 80, 76)**, dunkel grün-schiefer.
- **In Wirklichkeit:**
  - DOP20 an denselben Stellen: (200–216, 192–204, 178–192), hellgrau-beige.
  - geretsried.de/stadtzentrum: Karl-Lederer-Platz und Egerlandstraße haben **„sandfarbenen Farbasphalt“**, Bachläufe und 7 Pflanzinseln (Feldahorn, Gleditschie, Kupfer-Felsenbirne, Rot-Esche, laut SZ). Eröffnet am 28.07.2023.
- **Hinweis:** Dunkle Straßen sind ein typischer GTA-2-Look. Alex soll entscheiden, wie hell es werden darf. → **V-5**

### 6. Parkplätze sind leer, echt stehen sie voll. Aufwand M
- **Im Spiel:** 160 Parkplatzflächen, alle ohne Autos. Beispiel Am Stern: EDEKA-Parkplatz leer.
- **In Wirklichkeit:** DOP20 Am Stern, Start und Rathaus: Die Stellplätze sind dicht belegt. OSM hat `amenity=parking` 161 Ways + 12 Nodes; `parking=surface` 97, `street_side` 33, `underground` 4, `multi-storey` 1. → **V-6**

### 7. Bäume: zu wenig Nadelbaum, der Wald wirkt gelbgrün und stachelig. Aufwand S–M (Mischung: needs reference)
- **Im Spiel:**
  - 148 276 Kronen aus dem Luftbild (`trees.bin`).
  - Stadtkronen `CROWNS = [0,0,0,1,2,3,6,6]` = Buche ×3, Fichte ×1, Birke, Apfel, Ahorn ×2. Nur 1 von 8 ist ein Nadelbaum.
  - Wald `FOREST_TREES = [0,1,1,1,6]`. Die Sprites tree-1 (Fichte) und tree-5 (Thuja) wirken in Spielgröße sternförmig, fast wie Palmen.
  - Der Wald im Isar-Ausschnitt wirkt gelbgrün.
- **In Wirklichkeit:**
  - Wikipedia: Die Fabrik entstand im Wolfratshauser Forst, Gebäude „mit Buschwerk getarnt“. Die Tanne im Wappen steht für „das … Nadelwaldgebiet“.
  - DOP20 Neuer Platz und Start: hohe, dunkle Nadelbaumkronen mit langen Schatten zwischen den Blocks. DOP20 Isar: dichter, dunkelgrüner Wald.
- **Offen:** Das genaue Mischverhältnis ist nicht gemessen. Vorschlag: per DOP20-Stichprobe zählen (dunkle, kegelige Kronen). → **V-7**

### 8. Kein einziges Gleis: Industriegleis und Werkbahn fehlen. Aufwand M
- **Im Spiel:** Der Import holt kein `railway`. 0 Gleise.
- **OSM:** `railway=rail` 14 Ways, **5.4 km**. Dazu 14 Bahnübergänge (`level_crossing`), 8 Prellböcke, 10 Weichen. Namen u. a. „Industriegleis“ (Gewerbegebiet Nord, 47.8805, 11.473) und die Gleisgruppe in Geretsried-Süd (47.853, 11.501).
- **Web:**
  - Wikipedia: „15 km Gleisanlagen durchzogen den Forst. Die Werkbahnen und Betonstraßen bestimmen noch heute das Stadtbild.“
  - „private Bahnstrecke nach Wolfratshausen, die ausschließlich dem Gütertransport vorbehalten ist. Eigentümer ist die Stadt Geretsried.“
  - Die S7-Verlängerung ist geplant (`railway=proposed` in OSM), nicht zeichnen.
- → **V-8**

### 9. Keine Hecken, Zäune oder Mauern. Aufwand M
- **Im Spiel:** Nur einzelne Hecken als Place-Dressing.
- **OSM:** `barrier=hedge` 47 (**1.65 km**), `fence` 35 (**7.9 km**), `wall` 19 (**1.96 km**), `retaining_wall` 3 (0.1 km). Dazu Punkte: 85 Tore, 48 Poller, 20 Schranken.
- **In Wirklichkeit:** DOP20 Gartenberg und Start: Gärten sind von Hecken gesäumt (dunkelgrüne Linien). In OSM sind sicher nicht alle erfasst. → **V-9**

### 10. Bodenbedeckung fehlt: Gebüsch, Feuchtwiesen, Friedhof, Kleingärten, Baustellen. Aufwand M
- **Nicht importiert oder falsch einsortiert:**
  - `natural=scrub` 63 (**38.9 ha**)
  - `natural=wetland` 28 (**66.1 ha**, u. a. Babenstubener Moore)
  - `natural=grassland` 58 (9.7 ha)
  - `landuse=construction` 13 (7.4 ha)
  - `landuse=allotments` 1 (4.1 ha)
  - `landuse=quarry` 1
  - `landuse=cemetery` wird zu „grass“: der **Waldfriedhof Geretsried (8.1 ha)** ist im Spiel eine leere Wiese.
  - `farmyard` 19 (17.3 ha) wird zu „farmland“, also Acker statt Hof.
- → **V-10**

### 11. Stadtmöbel: Bänke, Mülleimer, Wertstoffinseln, Radständer. Aufwand M
- **Im Spiel:** `props` = 92 Bushaltestellen + **7** Glascontainer (nur `recycling:glass_bottles=yes`).
- **OSM:** `bench` 166, `waste_basket` 80, `recycling` **62** (50 Nodes + 12 Ways), `bicycle_parking` 26, `shelter` 6, `drinking_water` 1. Laternen sind nur 1× getaggt, also nicht aus OSM ableitbar. → **V-11**

### 12. Hochspannungsleitungen fehlen. Aufwand S–M
- **OSM:** `power=line` 5 Ways (**14.0 km** im Ausschnitt), u. a. „Kochel – Föhrenwald“, „Geretsried – Schönmühl“, „Föhrenwald – Höllriegelskreuth“. Dazu `minor_line` 3 (1.9 km), **54 Masten**, 21 Umspannwerke/Stationen (14 Nodes + 7 Ways).
- **In Wirklichkeit:** Von oben deutlich sichtbar: Schneisen und Masten. → **V-12**

### 13. Wahrzeichen der Stadtgeschichte fehlen (Bunker, Kapelle, Kunst, Brunnen). Aufwand M, Referenzen nötig
- Siehe die Liste unten. Fast alle haben OSM-Koordinaten, aber keine Fotos. Deshalb zuerst Referenzen sammeln.
- Vier davon sind Baudenkmäler: Rathaus (schon Place), Nikolauskapelle, Kohlebunker Isardamm 20, Versöhnungskirche. → **V-13**

**Bewusst nicht aufgenommen**
- Private Gartenpools (18): Laut I-2 bleiben sie draußen.
- Brücken (30 Ways, 0.42 km): Von oben flach, kaum sichtbar.
- Wegkreuze einzeln (24): Die stehen bei V-13 als Option.

---

## Zusätzliche Wahrzeichen und Details (nicht in den POIs und nicht im Backlog)

Koordinaten aus OSM (Overpass 2026-10-25), Fakten aus den genannten Quellen. **23 Einträge.**

| # | Name | lat, lon | OSM | Was es ist (Quelle) |
|---|---|---|---|---|
| L1 | Nikolauskapelle (St. Nikolaus) | 47.86022, 11.46786 | way 822460728 (chapel) | Ältestes Bauwerk des Ortes. Barocker Achteckbau mit Zeltdach und Zwiebelturm, 1722, Baudenkmal D-1-73-126-1 (Denkmalliste, Wikipedia) |
| L2 | Kohlebunker / Künstlerhaus Alf Lechner, Isardamm 20 | Hausnummer nicht geocodiert (Nominatim kennt nur die Straße Isardamm) | – | Ehemaliger Kohlebunker und Entaschungsanlage des Kraftwerks Tal I (1938). Turmartiger Kopfbau aus Stahlbeton, 1980 von Lechner umgebaut, Denkmal seit 2021 (Denkmalliste, Merkur) |
| L3 | Blauer Bunker (Bunker 356) | 47.86893, 11.48105 | node 466518495 (ruins) | Unvollendetes Pikrinsäure-Trockenhaus, 1948 gesprengt, blieb stehen. Blaue Graffiti, einsturzgefährdet (Merkur, SZ) |
| L4 | Ruine (Werksgelände) | 47.88236, 11.46837 | way 188064082 (ruins) | Rest der Rüstungswerke. Typ unbekannt, needs reference |
| L5 | Historischer Kalkbrennofen | 47.86654, 11.50283 | node 7645741752 (ruins) | Am Isarufer, needs reference |
| L6 | Gorilla (Hans Kastler, Bronze) | 47.87545, 11.46671 | node 11089456182 | Seit 2008 an der Ecke Egerlandstraße/Karl-Lederer-Platz, Gesicht zur Straße (Merkur, SZ) |
| L7 | „Dialog“ (Ernst Grünwald, Bronze) | Karl-Lederer-Platz | – (nicht in OSM) | Skulptur auf dem Platz (Merkur, SZ). Genaue Stelle: needs reference |
| L8 | Wasserträgerinnen („Grazien“, Travertin, Srb-Schloßbauer) + Bachlauf/Brunnenanlage | 47.87425, 11.46526 (Brunnen-Node) | node 8123619978 (fountain) | Zwei Figuren im Bachlauf vor dem Rathaus, eine daneben. Bachläufe vom Auftaktbrunnen Egerlandstraße bis zum Rathaus (SZ, geretsried.de) |
| L9 | Stele „Stadt Geretsried“ | 47.87415, 11.46500 | node 12680895204 | Geschichtsstele beim Rathaus |
| L10 | Schriftzug „Geretsried“ (Skulptur) | 47.87167, 11.47050 | node 2886910016 | Ortsschriftzug als Skulptur, needs reference |
| L11 | Kriegergedenkstätte + Fahnenmasten, Waldfriedhof | 47.86208, 11.48312 | node 6246831671, flagpoles 10676263936/7 | Inschrift „Euer Opfer ist unser Vermächtnis“ |
| L12 | Denkmäler Waldfriedhof (Veteranen, Sternenkinder, anonyme Bestattungen, Pfarrer, Sozialgräber, Heimatkreuz) | um 47.8620, 11.4825 | nodes 6247055511, 6261196807, 6361729861, 14273244956, 9074111872, 6261196806 | 6 Stelen bzw. Skulpturen auf dem Waldfriedhof (8.1 ha, way 104959902) |
| L13 | Obelisk „Aus der Geschichte Geretsrieds“ | 47.84805, 11.47455 | node 1804353044 | Obelisk am Südrand |
| L14 | Löschkette aus Eimern (Brunnen) | 47.85231, 11.49986 | way 288093155 (fountain) | Brunnen an der Staatlichen Feuerwehrschule |
| L15 | Versöhnungskirche (ehem. ev.), Richard-Wagner-Straße 3 | 47.85848, 11.48083 (Nominatim, Hausnummer), ~210 m vom Start | Gebäude mit Adresse | Sechs hexagonale Aluminium-Skelett-Module, holzverschindelt, 1969/70, Denkmal D-1-73-126-25 (Denkmalliste) |
| L16 | St. Anna-Kapelle, Gelting | 47.88520, 11.45069 | way 837400510 | Kapelle in Gelting |
| L17 | DITIB-Moschee, Geretsried-Nord | 47.88804, 11.43938 | way 191174393 | place_of_worship, nicht in den POIs |
| L18 | Schloss Ascholding + St. Leonhard + Maibaum | 47.89314, 11.49216 / 47.88833, 11.50329 | way 565721895 (manor), node 12401036161 | Gutshof bzw. Schloss östlich der Isar. St. Leonhard ist POI #229, Schloss und Maibaum nicht |
| L19 | Erinnerungsort Badehaus + Brunnen + Adolf-Kolping-Statue | 47.89929, 11.44435 | way 189995513, way 305948602, node 9572017019 | Museum am Nordrand (Föhrenwald) |
| L20 | Drei Türme (`man_made=tower`) | 47.87107, 11.43478 · 47.88971, 11.43760 · 47.88796, 11.50432 | man_made=tower | Drei Türme. Art: needs reference |
| L21 | Vogelinsel / Isar-Altwasser | Isarauen | – | Schutzzone für Vögel im NSG (Wikipedia). Nicht in OSM verortet |
| L22 | Loisach-Isar-Kanal | West-Rand, 47.868, 11.431 | way 157287581 (canal) | Liegt am Kartenrand. Im Spiel nur als 3-m-Linie (alle Nicht-Isar-Gewässer = 3 m) |
| L23 | 24 Wegkreuze (`historic=wayside_cross`) | verteilt | 24 Nodes | Feldkreuze, typisch oberbayerisch. Optionales Stadtmöbel |

---

## Neue Backlog-Punkte
V-1 … V-13 stehen in `docs/BACKLOG.md` unter „Looks like Geretsried“, jeweils als fertiger Claude-Code-Prompt mit Done-when.
