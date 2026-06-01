import type { CSSProperties } from "react"
import { countStatusSelections, isSelectedStatus, type NativeStatusSelections } from "../../filters/status-filter"
import type { SourceFilter } from "../../filters/source-filter"
import { nativeStatusMeta, PROVIDER_NATIVE_STATUSES, SOURCES, type SourceId, T } from "../../tokens"

export const GRID_COLS = "4px minmax(170px,1.15fr) minmax(120px,.75fr) minmax(130px,.8fr) minmax(150px,1fr) 120px 170px 120px 100px"
export const CELL_STYLE: CSSProperties = { padding: "9px 12px" }
export const SHIMMER_BG = `linear-gradient(90deg, ${T.divider}, ${T.zebra}, ${T.divider})`

export const STATE_KEYFRAMES = `
@keyframes bismark-spin { to { transform: rotate(360deg); } }
@keyframes bismark-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
`

export function providersForLoadingRows(
  activeSource: SourceFilter,
  selections: NativeStatusSelections,
  providerIds: readonly SourceId[],
) {
  if (activeSource !== "all") return [activeSource]
  const selectedProviders = providerIds.filter((provider) => (selections[provider]?.size ?? 0) > 0)
  return selectedProviders.length ? selectedProviders : [...providerIds]
}

export function statusesForProvider(provider: SourceId, activeStatus: string | undefined) {
  const statuses = [...PROVIDER_NATIVE_STATUSES[provider]]
  if (activeStatus && !statuses.some((status) => isSelectedStatus(activeStatus, status.value))) {
    statuses.unshift(nativeStatusMeta(provider, activeStatus))
  }
  return statuses
}

export function loadingLabel(
  activeSource: SourceFilter,
  activeStatus: string | undefined,
  selections: NativeStatusSelections,
  query: string | undefined,
  providerIds: readonly SourceId[],
) {
  const q = query?.trim()
  if (activeSource !== "all") {
    const statusLabel = activeStatus ? nativeStatusMeta(activeSource, activeStatus).label : null
    return `Cargando ${SOURCES[activeSource].name}${statusLabel ? ` · ${statusLabel}` : ""}`
  }

  const selectedCount = countStatusSelections(selections, providerIds)
  if (selectedCount > 0) {
    const selectedProviders = providerIds
      .filter((provider) => (selections[provider]?.size ?? 0) > 0)
      .map((provider) => SOURCES[provider].name)
    const providerText = selectedProviders.length === 1 ? selectedProviders[0] : `${selectedProviders.length} fuentes`
    return `Cargando ${selectedCount} estado${selectedCount !== 1 ? "s" : ""} · ${providerText}`
  }

  if (q) return `Buscando ${q}`
  return "Cargando SIMs"
}

