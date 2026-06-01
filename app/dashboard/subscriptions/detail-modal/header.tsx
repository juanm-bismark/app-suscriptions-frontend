"use client"

import type { SubscriptionRow } from "@/lib/api/sim-mapper"
import { fmtShortDate } from "../data"
import { Icon, SourceBadge, StatusPillWithNative } from "../primitives"
import { SOURCES } from "../tokens"

export function DetailModalHeader({
  record,
  onClose,
}: {
  record: SubscriptionRow
  onClose: () => void
}) {
  const src = SOURCES[record.provider]

  return (
    <div className="relative bg-card px-[22px] pt-[18px] pb-4 border-b border-divider">
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: src.color }} />
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute top-3.5 right-3.5 p-1.5 rounded text-muted hover:bg-zebra cursor-pointer"
      >
        <Icon.close size={15} />
      </button>

      <div className="flex items-center gap-2.5 mb-3 pl-1">
        <SourceBadge source={record.provider} size="sm" withName />
      </div>

      <div className="flex flex-col gap-3 pl-1 sm:flex-row sm:items-end">
        <div className="flex-1 min-w-0">
          <div className="break-words text-[20px] font-bold text-title sm:text-[22px]">
            {record.customerName?.trim() || `SIM · ${src.name}`}
          </div>
          {record.customerScope?.trim() && (
            <div className="mt-0.5 break-all font-mono text-xs text-muted">{record.customerScope}</div>
          )}
        </div>
        <div className="shrink-0 text-left sm:text-right">
          <StatusPillWithNative
            provider={record.provider}
            status={record.status}
            nativeStatus={record.nativeStatus}
            displayLabel={record.status}
            statusGroup={record.statusGroup}
            showContext={false}
            size="md"
          />
          <div className="text-[11px] text-muted mt-1.5">
            Actualizado {fmtShortDate(record.updatedAt)}
          </div>
        </div>
      </div>
    </div>
  )
}

