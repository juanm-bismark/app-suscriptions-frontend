"use client"

import { Btn, Chip, Icon } from "../../primitives"
import { SourceFilterTabs, type SourceFilter } from "../../filters/source-filter"
import type { NativeStatusSelections } from "../../filters/status-filter"
import { SOURCES, type SourceId, T } from "../../tokens"
import { LoadingSourceSummary } from "./loading-source-summary"

export function LoadingToolbar({
  effectiveQuery,
  hasQuery,
  activeSource,
  displayProviderIds,
  activeStatus,
  statusSelections,
  selectedCount,
  anySelected,
  activeColor,
  label,
}: {
  effectiveQuery?: string
  hasQuery: boolean
  activeSource: SourceFilter
  displayProviderIds: readonly SourceId[]
  activeStatus?: string
  statusSelections: NativeStatusSelections
  selectedCount: number
  anySelected: boolean
  activeColor: string
  label: string
}) {
  return (
    <div style={{ padding: "22px 24px 16px", borderBottom: `1px solid ${T.border}`, background: T.cardBg }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 14, gap: 12, flexWrap: "wrap" }}>
        <div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 1.2,
              color: T.muted,
              fontWeight: 600,
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Búsqueda unificada
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.title, letterSpacing: -0.4 }}>
            Suscripciones
          </h1>
        </div>
        <Btn variant="outline" size="sm" icon={<Icon.refresh size={13} />}>
          Actualizar tabla
        </Btn>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: T.pageBg,
          border: `1px solid ${hasQuery || anySelected || activeSource !== "all" ? activeColor : T.border}`,
          boxShadow: hasQuery || anySelected || activeSource !== "all" ? `0 0 0 3px ${activeColor}22` : undefined,
          borderRadius: 6,
          padding: "9px 12px",
        }}
      >
        {(hasQuery || anySelected || activeSource !== "all") && (
          <div
            style={{
              width: 15,
              height: 15,
              borderRadius: "50%",
              border: `2px solid ${activeColor}`,
              borderTopColor: "transparent",
              animation: "bismark-spin 0.7s linear infinite",
            }}
          />
        )}
        <span style={{ color: T.muted, display: "inline-flex" }}>
          <Icon.search size={15} />
        </span>
        <span style={{ flex: 1, fontSize: 13.5, color: hasQuery ? T.text : T.muted }}>
          {hasQuery ? effectiveQuery : "Buscar por ICCID, MSISDN o IMSI..."}
        </span>
        <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.muted }}>{label}</span>
      </div>

      <SourceFilterTabs activeSource={activeSource} providerIds={displayProviderIds} />

      <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
        <div style={{ display: "grid", gap: 8, minWidth: 0, width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ fontSize: 11, color: T.muted, marginRight: 4, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>
              {activeSource === "all" ? "Estado por fuente" : "Estado"}
            </div>
            {selectedCount > 0 && (
              <span style={{ fontSize: 11, color: activeSource === "all" ? T.headerBg : SOURCES[activeSource].tintText, fontFamily: T.fontMono, fontWeight: 700 }}>
                {selectedCount}
              </span>
            )}
            <Chip active={!anySelected}>Todos</Chip>
          </div>
          <LoadingSourceSummary
            activeSource={activeSource}
            activeStatus={activeStatus}
            displayProviderIds={displayProviderIds}
            statusSelections={statusSelections}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 12, color: T.muted, fontFamily: T.fontMono }}>{label}</div>
          <button
            type="button"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "6px 11px",
              borderRadius: 4,
              border: `1px solid ${T.border}`,
              background: "#fff",
              color: T.text,
              fontSize: 12,
              fontWeight: 600,
              fontFamily: T.fontBody,
              whiteSpace: "nowrap",
            }}
          >
            <Icon.filter size={13} />
            Filtros avanzados
          </button>
        </div>
      </div>
    </div>
  )
}
