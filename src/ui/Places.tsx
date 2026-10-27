import { useEffect, useMemo, useRef, useState } from "react"
import { POI_STYLE } from "#/render/overlay.ts"
import { filterSpots, type SpotEntry } from "#/world/teleport.ts"

/** Rows shown at once; the list scrolls past them. */
const SHOWN = 60

/**
 * The place list (T): every built place, then every POI, with a search field. Arrows pick, Enter or a click
 * teleports there, Esc or T closes. The game stands still while it is open.
 */
export function Places({ list, onGo, onClose }: { readonly list: ReadonlyArray<SpotEntry>; readonly onGo: (slug: string) => void; readonly onClose: () => void }) {
  const [query, setQuery] = useState("")
  const [pick, setPick] = useState(0)
  const hits = useMemo(() => filterSpots(list, query), [list, query])
  const rows = hits.slice(0, SHOWN)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    listRef.current?.children[pick]?.scrollIntoView({ block: "nearest" })
  }, [pick])

  const key = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape" || (e.key === "t" && query === "")) {
      e.preventDefault()
      onClose()
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      setPick((p) => Math.min(rows.length - 1, p + 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setPick((p) => Math.max(0, p - 1))
    } else if (e.key === "Enter") {
      const row = rows[pick]
      if (row !== undefined) onGo(row.slug)
    }
  }

  return (
    <div className="absolute inset-0 grid place-items-center bg-black/50" onClick={onClose}>
      <div data-testid="places" className="flex max-h-[80dvh] w-[min(32rem,calc(100vw-2rem))] flex-col rounded bg-black/85 p-3 font-mono" onClick={(e) => e.stopPropagation()}>
        <div className="mb-2 flex items-baseline justify-between text-yellow-300">
          <span className="text-xl uppercase italic">Orte</span>
          <span className="text-xs text-white/60">↑↓ wählen · Enter hin · Esc zu</span>
        </div>
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setPick(0)
          }}
          onKeyDown={key}
          placeholder="Suchen: edeka, rathaus, bäckerei …"
          className="mb-2 rounded bg-white/10 px-3 py-2 text-white outline-none placeholder:text-white/40"
        />
        <ul ref={listRef} className="min-h-0 flex-1 overflow-y-auto">
          {rows.map((row, i) => (
            <li key={row.slug}>
              <button
                type="button"
                onClick={() => onGo(row.slug)}
                onMouseEnter={() => setPick(i)}
                className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left ${i === pick ? "bg-yellow-300 text-black" : "text-white"}`}
              >
                <span className="w-6 text-center">{row.kind === null ? "📍" : POI_STYLE[row.kind][0]}</span>
                <span className="flex-1 truncate">{row.name}</span>
                {row.built && <span className={`text-xs ${i === pick ? "text-black/70" : "text-yellow-300"}`}>★ gebaut</span>}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-2 text-xs text-white/50">
          {hits.length === 0 ? "Nichts gefunden." : hits.length > SHOWN ? `${SHOWN} von ${hits.length}, weiter tippen` : `${hits.length} Orte`}
        </div>
      </div>
    </div>
  )
}
