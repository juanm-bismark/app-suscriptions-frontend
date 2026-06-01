"use client"

import { searchPlaceholder, type SearchMode } from "@/lib/sim-identifiers"
import { Icon } from "../../primitives"
import { T } from "../../tokens"

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
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: T.pageBg,
        border: `1px solid ${draftQ.trim() !== q.trim() ? T.headerAccent : T.border}`,
        borderRadius: 6,
        padding: "9px 12px",
        transition: "border-color .15s",
      }}
    >
      <span style={{ color: T.muted, display: "inline-flex", flexShrink: 0 }}>
        <Icon.search size={15} />
      </span>
      <input
        value={draftQ}
        onChange={(event) => setDraftQ(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") commitSearch()
        }}
        placeholder={searchPlaceholder(activeSearchMode)}
        style={{
          flex: 1,
          border: "none",
          outline: "none",
          background: "transparent",
          fontSize: 13.5,
          fontFamily: T.fontBody,
          color: T.text,
          minWidth: 0,
        }}
      />
      {isMultiIccid && (
        <span
          style={{
            background: T.headerBg,
            color: "#fff",
            fontSize: 10.5,
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 10,
            fontFamily: T.fontMono,
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {iccidCount} ICCIDs
        </span>
      )}
      {draftQ.trim() && (
        <button
          type="button"
          onClick={clearSearch}
          title="Limpiar busqueda"
          style={{
            border: "none",
            background: "transparent",
            color: T.muted,
            cursor: "pointer",
            lineHeight: 0,
            padding: 4,
            borderRadius: 4,
            flexShrink: 0,
          }}
        >
          <Icon.close size={14} />
        </button>
      )}
    </div>
  )
}

