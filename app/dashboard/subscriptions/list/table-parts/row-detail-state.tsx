"use client"

import type { SimDetailsResult } from "@/lib/types/api"
import { cn } from "@/lib/utils"
import { Icon } from "../../primitives"
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
      <span title={title} className="inline-flex min-w-0 items-center gap-[7px]">
        <span className="truncate">{fallback}</span>
        <span className="inline-flex shrink-0 text-warning-action">
          <Icon.warn size={13} />
        </span>
        {canRetry && <RetryButton onRetry={onRetry} />}
      </span>
    )
  }

  return (
    <span
      title={title}
      className={cn("inline-flex min-w-0 items-center gap-[7px]", detail.status === "not_found" ? "text-muted" : "text-danger-action")}
    >
      <span className="truncate">{label}</span>
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
      className="shrink-0 cursor-pointer rounded border border-border bg-white px-[5px] py-0.5 text-[11px] font-extrabold text-header-bg"
    >
      Reintentar
    </button>
  )
}
