"use client"

import { Icon } from "../../primitives"
import { T } from "../../tokens"

export function StatusChangeRow({
  sourceColor,
  sourceName,
  targets,
  effectiveTarget,
  onTargetChange,
  onBegin,
}: {
  sourceColor: string
  sourceName: string
  targets: string[]
  effectiveTarget: string
  onTargetChange: (target: string) => void
  onBegin: () => void
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", border: `1px solid ${T.border}`, borderRadius: 6, background: T.cardBg }}>
      <div style={{ width: 32, height: 32, borderRadius: 6, background: sourceColor + "22", color: sourceColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon.chev size={14} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: T.title, letterSpacing: 0 }}>Cambiar estado</div>
        <div style={{ fontSize: 12, color: T.muted, marginTop: 2, lineHeight: 1.4 }}>
          Estados permitidos por {sourceName}.
        </div>
      </div>
      <select
        value={effectiveTarget}
        onChange={(event) => onTargetChange(event.target.value)}
        style={{ minWidth: 170, border: `1px solid ${T.border}`, background: "#fff", color: T.text, borderRadius: 5, padding: "7px 9px", cursor: "pointer", fontSize: 12, fontWeight: 800, flexShrink: 0, fontFamily: T.fontMono }}
      >
        {targets.map((target) => (
          <option key={target} value={target}>{target}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={onBegin}
        disabled={!effectiveTarget}
        style={{ border: `1px solid ${T.border}`, background: "#fff", color: effectiveTarget ? T.text : T.muted, borderRadius: 5, padding: "7px 10px", cursor: effectiveTarget ? "pointer" : "not-allowed", fontSize: 12, fontWeight: 800, flexShrink: 0, fontFamily: T.fontBody }}
      >
        Cambiar
      </button>
    </div>
  )
}

