"use client"

import type { SourceFilter } from "../../filters/source-filter"
import { isSelectedStatus, type NativeStatusSelections } from "../../filters/status-filter"
import { SOURCES, type SourceId, STATUS_TONES, T } from "../../tokens"
import { SHIMMER_BG, statusesForProvider } from "./utils"

export function LoadingSourceSummary({
  activeSource,
  activeStatus,
  displayProviderIds,
  statusSelections,
}: {
  activeSource: SourceFilter
  activeStatus?: string
  displayProviderIds: readonly SourceId[]
  statusSelections: NativeStatusSelections
}) {
  return (
    <div
      style={{
        display: "grid",
        gap: 10,
        gridTemplateColumns: activeSource === "all" ? "repeat(auto-fit, minmax(min(100%, 260px), 1fr))" : "1fr",
        alignItems: "start",
      }}
    >
      {(activeSource === "all" ? displayProviderIds : [activeSource]).map((provider) => {
        const source = SOURCES[provider]
        return (
          <div key={provider} style={{ display: "grid", gap: 7, minWidth: 0, alignContent: "start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: source.color }} />
              <span style={{ fontSize: 11.5, color: T.title, fontWeight: 800 }}>{source.name}</span>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", minWidth: 0 }}>
              {statusesForProvider(provider, activeSource === provider ? activeStatus : undefined).map((status) => {
                const palette = STATUS_TONES[status.tone]
                const active =
                  activeSource === provider
                    ? isSelectedStatus(activeStatus, status.value)
                    : Boolean(statusSelections[provider]?.has(status.value))
                return (
                  <span
                    key={status.value}
                    title={status.value}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      minHeight: 28,
                      padding: "5px 8px",
                      borderRadius: 4,
                      border: `1px solid ${active ? palette.dot : T.border}`,
                      background: active ? palette.bg : "#fff",
                      color: active ? palette.color : T.text,
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: T.fontBody,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: palette.dot, flexShrink: 0 }} />
                    <span>{status.label}</span>
                    <span
                      style={{
                        width: 14,
                        height: 8,
                        borderRadius: 2,
                        background: SHIMMER_BG,
                        backgroundSize: "200% 100%",
                        animation: "bismark-shimmer 1.3s infinite",
                      }}
                    />
                  </span>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

