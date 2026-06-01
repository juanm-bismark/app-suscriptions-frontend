import type { SubscriptionRow } from "@/lib/api/sim-mapper"
import { SOURCES } from "../tokens"
import { value } from "./utils"

export function PlanBanner({ record }: { record: SubscriptionRow }) {
  const src = SOURCES[record.provider]

  return (
    <div className="flex items-start gap-3.5 px-[18px] pt-3.5 pb-3 border-b border-divider">
      <div className="w-[3px] self-stretch rounded-sm shrink-0" style={{ background: src.color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1 flex-wrap">
          <span className="text-xs font-extrabold text-title tracking-wider uppercase">Plan</span>
          <span className="text-[11.5px] text-muted font-medium">Servicio contratado para esta SIM</span>
        </div>
        <div className="text-[15px] font-bold text-title -tracking-[0.2px] truncate">
          {record.planDisplay}
        </div>
        {record.planName && (record.planCode || record.planId) && (
          <div className="text-[11.5px] text-muted mt-0.5 font-mono">
            {value(record.planCode ?? record.planId)}
          </div>
        )}
      </div>
    </div>
  )
}

