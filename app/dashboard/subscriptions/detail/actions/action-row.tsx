"use client"

import { Loader2 } from "lucide-react"
import { T } from "../../tokens"
import type { ActionDef } from "./types"

export function ActionRow({ action, isRefreshing, onClick }: { action: ActionDef; isRefreshing: boolean; onClick: () => void }) {
  const busy = action.key === "sync" && isRefreshing
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", border: `1px solid ${action.danger ? T.danger + "55" : T.border}`, borderRadius: 6, background: action.danger ? "#FFF5F2" : T.cardBg }}>
      <div style={{ width: 32, height: 32, borderRadius: 6, background: action.color + "22", color: action.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {action.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: T.title, letterSpacing: -0.1 }}>{action.title}</div>
        <div style={{ fontSize: 12, color: T.muted, marginTop: 2, lineHeight: 1.4 }}>{action.body}</div>
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        aria-busy={busy || undefined}
        style={{ border: `1px solid ${action.danger ? T.danger + "66" : T.border}`, background: "#fff", color: action.danger ? T.danger : T.text, borderRadius: 5, padding: "5px 10px", cursor: busy ? "wait" : "pointer", fontSize: 12, fontWeight: 800, flexShrink: 0, fontFamily: T.fontBody, display: "inline-flex", alignItems: "center", gap: 6, opacity: busy ? 0.72 : 1 }}
      >
        {busy && <Loader2 size={12} className="animate-spin" aria-hidden="true" />}
        {action.danger ? "Confirmar…" : busy ? "Ejecutando..." : "Ejecutar"}
      </button>
    </div>
  )
}

