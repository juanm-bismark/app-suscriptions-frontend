"use client"

import { providerDisplayName } from "@/lib/provider-meta"
import type { ProviderCardItem } from "./types"
import {
  getProviderCardDescription,
  getProviderStatusClassName,
  PROVIDER_CARD_CLASSES,
} from "./utils"

export function ProviderStatusCard({ item }: { item: ProviderCardItem }) {
  return (
    <div className={`rounded-lg px-4 py-2.5 shadow-sm shadow-header-top/5 ${PROVIDER_CARD_CLASSES[item.provider]}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-title">{providerDisplayName(item.provider)}</p>
          <p className="mt-1 text-xs text-muted">
            {getProviderCardDescription(item)}
          </p>
        </div>
        <span className={getProviderStatusClassName(item)}>
          {getProviderStatusLabel(item.status)}
        </span>
      </div>
    </div>
  )
}

function getProviderStatusLabel(status: ProviderCardItem["status"]) {
  if (status === "loading") return "Cargando"
  if (status === "error") return "Error"
  if (status === "partial") return "Parcial"
  if (status === "not_queried") return "No consultado"
  return "OK"
}
