"use client"

import type { SimDetailsResult } from "@/lib/types/api"
import { Icon } from "../../primitives"
import { T } from "../../tokens"
import { stringOrNull } from "../rows"

export function RowDetailState({ detail, fallbackValue, onRetry }: { detail: SimDetailsResult; fallbackValue?: string | null; onRetry: () => void }) {
  const retryAfter = detail.error?.retry_after
  const fallback = stringOrNull(fallbackValue === "—" ? null : fallbackValue)
  const label =
    detail.status === "timeout" ? "Timeout" :
    detail.status === "rate_limited" ? `Límite${retryAfter ? ` · ${retryAfter}s` : ""}` :
    detail.status === "not_found" ? "No encontrada" :
    "Error"
  const canRetry = detail.status === "timeout" || detail.status === "error" || (detail.status === "rate_limited" && !retryAfter)
  const title = [detail.error?.code, detail.error?.detail].filter(Boolean).join(" · ") || label

  if (fallback) {
    return (
      <span title={title} style={{ display: "inline-flex", alignItems: "center", gap: 7, minWidth: 0 }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fallback}</span>
        <span style={{ color: T.warning, display: "inline-flex", flexShrink: 0 }}>
          <Icon.warn size={13} />
        </span>
        {canRetry && <RetryButton onRetry={onRetry} />}
      </span>
    )
  }

  return (
    <span title={title} style={{ display: "inline-flex", alignItems: "center", gap: 7, minWidth: 0, color: detail.status === "not_found" ? T.muted : T.danger }}>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      {canRetry && <RetryButton onRetry={onRetry} />}
    </span>
  )
}

function RetryButton({ onRetry }: { onRetry: () => void }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onRetry()
      }}
      style={{ border: `1px solid ${T.border}`, background: "#fff", color: T.headerBg, borderRadius: 4, padding: "2px 5px", fontSize: 11, fontWeight: 800, cursor: "pointer", flexShrink: 0 }}
    >
      Reintentar
    </button>
  )
}

