"use client"

import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"
import { Btn, Chip, Icon } from "../../primitives"
import { SourceFilterTabs, type SourceFilter } from "../../filters/source-filter"
import type { NativeStatusSelections } from "../../filters/status-filter"
import { SOURCES, type SourceId } from "../../tokens"
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
  const isFiltered = hasQuery || anySelected || activeSource !== "all"

  return (
    <div className="border-b border-border bg-card px-6 pb-4 pt-[22px]">
      <div className="mb-3.5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[1.2px] text-muted">
            Búsqueda unificada
          </div>
          <h1 className="m-0 text-[22px] font-bold tracking-[-0.4px] text-title">
            Suscripciones
          </h1>
        </div>
        <Btn variant="outline" size="sm" icon={<Icon.refresh size={13} />}>
          Actualizar tabla
        </Btn>
      </div>

      <div
        className={cn(
          "flex items-center gap-2.5 rounded-md border bg-page px-3 py-[9px]",
          isFiltered ? "border-(--active-color) ring-[3px] ring-(--active-color)/15" : "border-border"
        )}
        style={{ "--active-color": activeColor } as CSSProperties}
      >
        {isFiltered && (
          <div className="h-[15px] w-[15px] animate-spin rounded-full border-2 border-(--active-color) border-t-transparent" />
        )}
        <span className="inline-flex text-muted">
          <Icon.search size={15} />
        </span>
        <span className={cn("flex-1 text-[13.5px]", hasQuery ? "text-text" : "text-muted")}>
          {hasQuery ? effectiveQuery : "Buscar por ICCID, MSISDN o IMSI..."}
        </span>
        <span className="font-mono text-[11px] text-muted">{label}</span>
      </div>

      <SourceFilterTabs activeSource={activeSource} providerIds={displayProviderIds} />

      <div className="mt-3 grid gap-2.5">
        <div className="grid w-full min-w-0 gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="mr-1 text-[11px] font-bold uppercase tracking-[0.5px] text-muted">
              {activeSource === "all" ? "Estado por fuente" : "Estado"}
            </div>
            {selectedCount > 0 && (
              <span
                className={cn("font-mono text-[11px] font-bold", activeSource === "all" && "text-header-bg")}
                style={activeSource !== "all" ? { color: SOURCES[activeSource].tintText } : undefined}
              >
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

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="font-mono text-xs text-muted">{label}</div>
          <button
            type="button"
            className="inline-flex items-center gap-[7px] whitespace-nowrap rounded border border-border bg-card px-[11px] py-1.5 text-xs font-semibold text-text"
          >
            <Icon.filter size={13} />
            Filtros avanzados
          </button>
        </div>
      </div>
    </div>
  )
}
