"use client"

import { Icon } from "../../primitives"
import { T } from "../../tokens"

export function AdvancedFiltersButton({
  count,
  onClick,
}: {
  count: number
  onClick: () => void
}) {
  const active = count > 0

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "6px 11px",
        borderRadius: 4,
        border: `1px solid ${active ? T.headerBg : T.border}`,
        background: active ? T.headerBg : "#fff",
        color: active ? "#fff" : T.text,
        fontSize: 12,
        fontWeight: 600,
        fontFamily: T.fontBody,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      <Icon.filter size={13} />
      Filtros avanzados
      {active && (
        <span
          style={{
            background: "#fff",
            color: T.headerBg,
            fontFamily: T.fontMono,
            fontSize: 10.5,
            fontWeight: 700,
            padding: "0 5px",
            borderRadius: 8,
            minWidth: 16,
            textAlign: "center",
            lineHeight: "15px",
          }}
        >
          {count}
        </span>
      )}
    </button>
  )
}

