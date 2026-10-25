/**
 * The place dressing registry (see dressing.ts): one file per place, listed
 * here. A new place is a new file and one line below.
 */
import { ALDI_SUED_STEIN } from "./aldi-sued-stein.ts"
import { AM_STERN_WEST } from "./am-stern-west.ts"
import { BL_HAIRSTYLING } from "./bl-hairstyling.ts"
import type { PlaceDressing } from "./dressing.ts"
import { EDEKA_AM_STERN } from "./edeka-am-stern.ts"
import { GASTHOF_GEIGER } from "./gasthof-geiger.ts"
import { KAUFLAND } from "./kaufland.ts"
import { MARIA_HILF } from "./maria-hilf.ts"
import { METZGEREI_LAENGER } from "./metzgerei-laenger.ts"
import { ORTERER_NORD } from "./orterer-nord.ts"
import { MUEHLENBAECK } from "./muehlenbaeck.ts"
import { PENNY_SUDETENSTRASSE } from "./penny-sudetenstrasse.ts"
import { PETRUSKIRCHE, PETRUSKIRCHE_TOWER } from "./petruskirche.ts"
import { POLIZEI_GERETSRIED } from "./polizei-geretsried.ts"
import { POST_FILIALE_571 } from "./post-filiale-571.ts"
import { RATHAUS } from "./rathaus.ts"
import { REHMAUS_APOTHEKE } from "./rehmaus-apotheke.ts"
import { ROSSMANN_AM_STERN } from "./rossmann-am-stern.ts"
import { SPARKASSE_STEIN } from "./sparkasse-stein.ts"
import { SPIELWAREN_KROEMER } from "./spielwaren-kroemer.ts"
import { ST_URSULA } from "./st-ursula.ts"
import { SUDETENSTRASSE_11_15 } from "./sudetenstrasse-11-15.ts"
import { TEDI_SUDETENSTRASSE } from "./tedi-sudetenstrasse.ts"
import { WERKSTATT_WILHELM } from "./werkstatt-wilhelm.ts"
import { WOOLWORTH_AM_STERN } from "./woolworth-am-stern.ts"

export const PLACES: ReadonlyArray<PlaceDressing> = [ST_URSULA, REHMAUS_APOTHEKE, SPARKASSE_STEIN, RATHAUS, MARIA_HILF, MUEHLENBAECK, POST_FILIALE_571, WERKSTATT_WILHELM, ALDI_SUED_STEIN, POLIZEI_GERETSRIED, AM_STERN_WEST, ROSSMANN_AM_STERN, PENNY_SUDETENSTRASSE, EDEKA_AM_STERN, TEDI_SUDETENSTRASSE, WOOLWORTH_AM_STERN, BL_HAIRSTYLING, SPIELWAREN_KROEMER, GASTHOF_GEIGER, PETRUSKIRCHE, PETRUSKIRCHE_TOWER, METZGEREI_LAENGER, ORTERER_NORD, KAUFLAND, SUDETENSTRASSE_11_15]
