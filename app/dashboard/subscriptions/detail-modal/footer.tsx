"use client"

import type { SubscriptionRow } from "@/lib/api/sim-mapper"
import { Btn, Icon } from "../primitives"

export function DetailModalFooter({
  record,
  onActions,
  onOpenDetail,
  onOpenPurge,
}: {
  record: SubscriptionRow
  onActions: (row: SubscriptionRow) => void
  onOpenDetail: (row: SubscriptionRow) => void
  onOpenPurge: () => void
}) {
  return (
    <div className="border-t border-border bg-table-header-bg px-[22px] py-3 flex flex-col gap-2.5 sm:flex-row sm:items-center">
      <Btn
        variant="outline"
        size="md"
        full
        onClick={() => onActions(record)}
      >
        Acciones
      </Btn>
      <div className="hidden flex-1 sm:block" />
      <Btn variant="outline" size="md" full onClick={onOpenPurge}>
        Purgar
      </Btn>
      <Btn
        variant="primary"
        size="md"
        full
        onClick={() => onOpenDetail(record)}
        icon={<Icon.arrowRight size={12} />}
      >
        Abrir suscripción
      </Btn>
    </div>
  )
}

