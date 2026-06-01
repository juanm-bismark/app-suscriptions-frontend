"use client"

import { Chip } from "../primitives"
import type { SourceFilter } from "./source-filter"
import { hasStatusSelections, statusKey, type NativeStatusSelections } from "./status-filter"
import type { StatusFilter } from "../list/types"
import { PROVIDER_NATIVE_STATUSES, SOURCES, STATUS_TONES, type SourceId, T } from "../tokens"

export function StatusFilterControls({
  activeSrc,
  activeStatus,
  statusSelections,
  activeProviders,
  statusCount,
  selectedCount,
  onActiveStatusChange,
  onClearSelections,
  onToggleSelection,
}: {
  activeSrc: SourceFilter
  activeStatus: StatusFilter
  statusSelections: NativeStatusSelections
  activeProviders: SourceId[]
  statusCount: (provider: SourceId, status: string) => number
  selectedCount: number
  onActiveStatusChange: (status: StatusFilter) => void
  onClearSelections: () => void
  onToggleSelection: (provider: SourceId, status: string) => void
}) {
  if (activeSrc !== "all") {
    const source = SOURCES[activeSrc]
    return (
      <div style={{ display: "grid", gap: 7, minWidth: 0, width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ fontSize: 11, color: T.muted, marginRight: 4, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>
            Estado
          </div>
          {selectedCount > 0 && <span style={{ fontSize: 11, color: source.tintText, fontFamily: T.fontMono, fontWeight: 700 }}>{selectedCount}</span>}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <Chip active={activeStatus === "all"} color={source.color} onClick={() => onActiveStatusChange("all")}>
            Todos
          </Chip>
          {PROVIDER_NATIVE_STATUSES[activeSrc].map((status) => (
            <StatusOptionChip
              key={status.value}
              value={status.value}
              label={status.label}
              tone={status.tone}
              count={statusCount(activeSrc, status.value)}
              active={activeStatus !== "all" && statusKey(activeStatus) === statusKey(status.value)}
              onClick={() => onActiveStatusChange(status.value)}
            />
          ))}
        </div>
      </div>
    )
  }

  const anySelected = hasStatusSelections(statusSelections, activeProviders)
  return (
    <div style={{ display: "grid", gap: 8, minWidth: 0, width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div style={{ fontSize: 11, color: T.muted, marginRight: 4, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>
          Estado por fuente
        </div>
        {selectedCount > 0 && <span style={{ fontSize: 11, color: T.headerBg, fontFamily: T.fontMono, fontWeight: 700 }}>{selectedCount}</span>}
        <Chip active={!anySelected} onClick={onClearSelections}>
          Todos
        </Chip>
      </div>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", alignItems: "start" }}>
        {activeProviders.map((provider) => {
          const source = SOURCES[provider]
          return (
            <div key={provider} style={{ display: "grid", gap: 7, minWidth: 0, alignContent: "start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: source.color }} />
                <span style={{ fontSize: 11.5, color: T.title, fontWeight: 800 }}>{source.name}</span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", minWidth: 0 }}>
                {PROVIDER_NATIVE_STATUSES[provider].map((status) => (
                  <StatusOptionChip
                    key={status.value}
                    value={status.value}
                    label={status.label}
                    tone={status.tone}
                    count={statusCount(provider, status.value)}
                    active={Boolean(statusSelections[provider]?.has(status.value))}
                    onClick={() => onToggleSelection(provider, status.value)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatusOptionChip({
  value,
  label,
  tone,
  count,
  active,
  onClick,
}: {
  value: string
  label: string
  tone: keyof typeof STATUS_TONES
  count: number
  active: boolean
  onClick: () => void
}) {
  const palette = STATUS_TONES[tone]
  return (
    <button
      type="button"
      title={value}
      onClick={onClick}
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
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: palette.dot, flexShrink: 0 }} />
      <span>{label}</span>
      <span style={{ color: active ? palette.color : T.muted, fontFamily: T.fontMono, fontSize: 10.5, fontWeight: 700 }}>{count}</span>
    </button>
  )
}
