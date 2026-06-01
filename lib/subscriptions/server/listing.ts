import { actionErrorMessage } from "@/lib/action-error"
import { getSimDetails, listAdminSims, listSims, searchAdminSims, searchSims, type ListSimsParams } from "@/lib/api/sims"
import { requireAdmin, requireCompanyUser } from "@/lib/auth/current-user"
import { MAX_ICCID_BATCH, parseIccidList } from "@/lib/iccid"
import { PROVIDER_IDS } from "@/lib/provider-meta"
import { applySearchParam, normalizeSubscriptionFilters } from "@/lib/subscriptions/filters"
import { AMBIGUOUS_IDENTIFIER_FIELDS, shouldSearchImsiAndMsisdn } from "@/lib/sim-identifiers"
import type { LoadSubscriptionsInput, LoadSubscriptionsResult } from "@/lib/subscriptions/types"
import { listActiveCredentialProviders } from "@/app/actions/providers"
import { buildSearchBody } from "./builders"
import { dedupeFailedProviders, readFailedProviders } from "./errors"
import {
  detailLookupResult,
  emptySubscriptionResult,
  findFirstUsefulGlobalPage,
  isRoutingMapEmpty,
  mergeLoadSubscriptionResults,
  normalizeSimListResult,
  simListResult,
} from "./results"

export async function loadSubscriptionsForInput(input: LoadSubscriptionsInput): Promise<LoadSubscriptionsResult> {
  const scope: "company" | "global" = input.scope === "global" ? "global" : "company"
  if (scope === "global") await requireAdmin()
  else await requireCompanyUser()

  const activeProviders = scope === "global" ? null : await listActiveCredentialProviders()
  const queryableProviders = activeProviders ?? PROVIDER_IDS
  const filters = normalizeSubscriptionFilters(input, { activeProviders, scope })

  if (activeProviders !== null && activeProviders.length === 0) {
    return emptySubscriptionResult(filters)
  }

  if (shouldSearchImsiAndMsisdn(filters.q, filters.searchField) && !filters.cursor) {
    const results = await Promise.all(
      AMBIGUOUS_IDENTIFIER_FIELDS.map((searchField) => loadSubscriptionsForInput({ ...input, searchField })),
    )
    return mergeLoadSubscriptionResults(results, filters)
  }

  const apiParams: ListSimsParams = {
    provider: filters.provider,
    status: filters.status,
    cursor: filters.cursor,
    limit: input.limit ?? 50,
  }

  applySearchParam(apiParams, filters.q, filters.searchField)

  try {
    const iccids = parseIccidList(filters.q)
    if (scope === "company" && iccids.length > 1 && !filters.cursor) {
      const details = await getSimDetails({
        iccids: iccids.slice(0, MAX_ICCID_BATCH),
        providers: filters.provider ? [filters.provider] : undefined,
      })
      return detailLookupResult(details, filters)
    }

    const searchProviders = filters.provider ? [filters.provider] : queryableProviders
    const searchBody = buildSearchBody(filters, apiParams.limit ?? 50, searchProviders)
    const runSearch = scope === "global" ? searchAdminSims : searchSims
    const runList = scope === "global" ? listAdminSims : listSims
    let result = searchBody ? await runSearch(searchBody) : await runList(apiParams)
    result = searchBody || scope === "global"
      ? normalizeSimListResult(result)
      : await findFirstUsefulGlobalPage(result, apiParams, queryableProviders)

    return simListResult(result, filters)
  } catch (error) {
    if (isRoutingMapEmpty(error)) {
      return {
        ok: false,
        kind: "routing_map_empty",
        failedProviders: dedupeFailedProviders(readFailedProviders(error.extra?.failed_providers)),
      }
    }

    return {
      ok: false,
      kind: "error",
      error: actionErrorMessage(error, "No se pudo cargar la lista"),
    }
  }
}
