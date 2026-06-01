"use client"

import { T } from "../../tokens"
import type { ViewScope } from "../types"

export function ViewScopeSwitch({
  viewScope,
  hasCompanyScope,
  onSwitchViewScope,
}: {
  viewScope: ViewScope
  hasCompanyScope: boolean
  onSwitchViewScope: (scope: ViewScope) => void
}) {
  return (
    <div style={{ display: "inline-flex", border: `1px solid ${T.border}`, borderRadius: 4, overflow: "hidden", background: T.pageBg }}>
      <button
        type="button"
        onClick={() => onSwitchViewScope("company")}
        disabled={!hasCompanyScope}
        title={hasCompanyScope ? undefined : "Admin sin company asignada"}
        style={{
          border: "none",
          borderRight: `1px solid ${T.border}`,
          background: viewScope === "company" ? T.headerBg : "transparent",
          color: viewScope === "company" ? "#fff" : hasCompanyScope ? T.text : T.muted,
          cursor: hasCompanyScope ? "pointer" : "not-allowed",
          fontSize: 12,
          fontWeight: 700,
          fontFamily: T.fontBody,
          padding: "6px 10px",
          whiteSpace: "nowrap",
        }}
      >
        Vista mi company
      </button>
      <button
        type="button"
        onClick={() => onSwitchViewScope("global")}
        style={{
          border: "none",
          background: viewScope === "global" ? T.headerBg : "transparent",
          color: viewScope === "global" ? "#fff" : T.text,
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 700,
          fontFamily: T.fontBody,
          padding: "6px 10px",
          whiteSpace: "nowrap",
        }}
      >
        Vista global
      </button>
    </div>
  )
}

