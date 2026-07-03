import { countStatusSelections, isSelectedStatus, type NativeStatusSelections } from "../../filters/status-filter"
import type { SourceFilter } from "../../filters/source-filter"
import { nativeStatusMeta, PROVIDER_NATIVE_STATUSES, SOURCES, type SourceId } from "../../tokens"

export const GRID_COLS_CLASS =
  "grid-cols-[4px_minmax(170px,1.15fr)_minmax(120px,.75fr)_minmax(130px,.8fr)_minmax(150px,1fr)_120px_170px_120px_100px]"

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

