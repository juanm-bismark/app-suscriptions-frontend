"use client"

import { SEARCH_MODE_OPTIONS, type SearchMode } from "@/lib/sim-identifiers"
import { T } from "../../tokens"

export function SearchModeControl({
  activeSearchMode,
  onChange,
}: {
  activeSearchMode: SearchMode
  onChange: (mode: SearchMode) => void
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        border: `1px solid ${T.border}`,
        borderRadius: 5,
        overflow: "hidden",
        background: "#fff",
        width: "fit-content",
      }}
    >
      {SEARCH_MODE_OPTIONS.map((option) => {
        const active = activeSearchMode === option.id
        return (
          <button
            key={option.id}
            type="button"
            title={option.title}
            onClick={() => onChange(option.id)}
            style={{
              border: "none",
              borderRight: option.id === "imsi" ? "none" : `1px solid ${T.border}`,
              background: active ? T.headerBg : "transparent",
              color: active ? "#fff" : T.text,
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 800,
              fontFamily: T.fontBody,
              padding: "5px 7px",
              lineHeight: 1,
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

