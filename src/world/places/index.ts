/**
 * The place dressing registry (see dressing.ts): one file per place, listed
 * here. A new place is a new file and one line below.
 */
import type { PlaceDressing } from "./dressing.ts"
import { ST_URSULA } from "./st-ursula.ts"

export const PLACES: ReadonlyArray<PlaceDressing> = [ST_URSULA]
