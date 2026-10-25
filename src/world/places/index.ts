/**
 * The place dressing registry (see dressing.ts): one file per place, listed
 * here. A new place is a new file and one line below.
 */
import type { PlaceDressing } from "./dressing.ts"
import { MARIA_HILF } from "./maria-hilf.ts"
import { MUEHLENBAECK } from "./muehlenbaeck.ts"
import { RATHAUS } from "./rathaus.ts"
import { REHMAUS_APOTHEKE } from "./rehmaus-apotheke.ts"
import { SPARKASSE_STEIN } from "./sparkasse-stein.ts"
import { ST_URSULA } from "./st-ursula.ts"

export const PLACES: ReadonlyArray<PlaceDressing> = [ST_URSULA, REHMAUS_APOTHEKE, SPARKASSE_STEIN, RATHAUS, MARIA_HILF, MUEHLENBAECK]
