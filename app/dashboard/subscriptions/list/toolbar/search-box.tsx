"use client"

import { searchPlaceholder, type SearchMode } from "@/lib/sim-identifiers"
import { cn } from "@/lib/utils"
import { Icon } from "../../primitives"

export function SearchBox({
  activeSearchMode,
  draftQ,
  q,
  setDraftQ,
  commitSearch,
  clearSearch,
  isMultiIccid,
  iccidCount,
}: {
  activeSearchMode: SearchMode
  draftQ: string
  q: string
  setDraftQ: (query: string) => void
  commitSearch: () => void
  clearSearch: () => void
  isMultiIccid: boolean
  iccidCount: number
}) {
  const isDirty = draftQ.trim() !== q.trim()

  return (
    <div
      className={cn(
        "flex flex-1 items-center gap-2.5 rounded-md border bg-page px-3 py-2.5 transition-colors",
        isDirty ? "border-header-accent" : "border-border"
      )}
    >
      <span className="inline-flex shrink-0 text-muted">
        <Icon.search size={15} />
      </span>
      <input
        value={draftQ}
        onChange={(event) => setDraftQ(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") commitSearch()
        }}
        placeholder={searchPlaceholder(activeSearchMode)}
        className="min-w-0 flex-1 border-none bg-transparent text-[13.5px] text-text outline-none placeholder:text-muted"
      />
      {isMultiIccid && (
        <span className="shrink-0 whitespace-nowrap rounded-full bg-header-bg px-2 py-0.5 font-mono text-[10.5px] font-bold text-white">
          {iccidCount} ICCIDs
        </span>
      )}
      {draftQ.trim() && (
        <button
          type="button"
          onClick={clearSearch}
          title="Limpiar busqueda"
          className="shrink-0 rounded p-1 leading-none text-muted transition-colors hover:text-title focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-header-accent"
        >
          <Icon.close size={14} />
        </button>
      )}
    </div>
  )
}
