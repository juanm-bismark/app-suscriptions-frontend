"use client"

import { T } from "../../tokens"

export function LoadingFooter({
  cursor,
  label,
}: {
  cursor?: string
  label: string
}) {
  return (
    <div
      style={{
        padding: "10px 24px",
        background: T.cardBg,
        borderTop: `1px solid ${T.border}`,
        display: "flex",
        alignItems: "center",
      }}
    >
      <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", fontSize: 12, color: T.muted }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontFamily: T.fontMono }}>
          <span>{cursor ? "Cargando página" : "Página 1"} · {label}</span>
          <span>consulta en curso</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 600 }}>
            Mostrar
            <span style={{ height: 32, width: 62, border: `1px solid ${T.border}`, background: "#fff", borderRadius: 5 }} />
          </span>
          <span style={{ height: 32, width: 72, borderRadius: 5, background: "#E8EEF2", border: "1px solid #CBD5E1" }} />
          <span style={{ height: 32, width: 78, borderRadius: 5, background: "#D8F0F2", border: "1px solid #B8DDE1" }} />
        </div>
      </div>
    </div>
  )
}

