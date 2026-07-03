"use client"

import type { SubscriptionOut } from "@/lib/types/api"
import { Card, KV, LimitGroup } from "./primitives"
import { mbToLabel } from "./utils"

export function LimitsTab({ subscription }: { subscription: SubscriptionOut }) {
  const limits = subscription.normalized.limits
  return (
    <div className="grid gap-3.5">
      <Card title="Límites contractuales">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))]">
          <KV label="Datos por SIM" value={mbToLabel(limits.data)} />
          <KV label="SMS por SIM" value={limits.sms == null ? "Sin límite contractual" : limits.sms.toLocaleString("es-CO")} />
        </div>
      </Card>
      <LimitGroup title="Controles diarios" controls={limits.daily} />
      <LimitGroup title="Controles mensuales" controls={limits.monthly} />
    </div>
  )
}
