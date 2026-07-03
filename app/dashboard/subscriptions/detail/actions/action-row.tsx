"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ActionDef } from "./types"

export function ActionRow({ action, isRefreshing, onClick }: { action: ActionDef; isRefreshing: boolean; onClick: () => void }) {
  const busy = action.key === "sync" && isRefreshing
  return (
    <div
      className={cn(
        "flex items-center gap-3.5 rounded-md border p-3",
        action.danger ? "border-danger-action/25 bg-danger-tint" : "border-border bg-card"
      )}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
        style={{ background: action.danger ? "var(--color-danger-tint)" : `${action.color}22`, color: action.color }}
      >
        {action.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-bold tracking-[-0.1px] text-title">{action.title}</div>
        <div className="mt-0.5 text-xs leading-[1.4] text-muted">{action.body}</div>
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        aria-busy={busy || undefined}
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-[5px] border bg-card px-2.5 py-[5px] text-xs font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-header-accent disabled:opacity-70",
          action.danger ? "border-danger-action/40 text-danger-action" : "border-border text-text",
          busy ? "cursor-wait" : "cursor-pointer hover:bg-hover-soft"
        )}
      >
        {busy && <Loader2 size={12} className="animate-spin" aria-hidden="true" />}
        {action.danger ? "Confirmar…" : busy ? "Ejecutando..." : "Ejecutar"}
      </button>
    </div>
  )
}
