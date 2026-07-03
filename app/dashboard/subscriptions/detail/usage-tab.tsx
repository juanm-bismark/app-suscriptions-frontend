"use client"

import type { SubscriptionOut } from "@/lib/types/api"
import { fmtDate } from "../data"
import { useUsage } from "./hooks"
import { BarChart, Card, Empty, KV } from "./primitives"
import { bytesToDataLabel, daysBetween, mbToLabel, metricNumber, usageBars } from "./utils"

export function UsageTab({ subscription }: { subscription: SubscriptionOut }) {
  // Moabits rechaza explícitamente cualquier filtro `metrics` (UnsupportedOperation).
  // Kite y Tele2 sí lo soportan.
  const metricsQs = subscription.provider === "moabits" ? undefined : "metrics=data"
  const state = useUsage(subscription.iccid, metricsQs)
  if (state.status === "error") return <Card title="Consumo"><Empty text={state.message} /></Card>
  if (state.status !== "success") return <Card title="Consumo"><Empty text="Cargando consumo desde el proveedor..." /></Card>

  const usage = state.data
  const totalBytes = metricNumber(usage.data_used_bytes) ?? 0
  const days = daysBetween(usage.period_start, usage.period_end)
  const bars = usageBars(usage)
  const peak = Math.max(...bars.map((bar) => bar.value), 0)
  const hasSms = usage.sms_count > 0 || usage.usage_metrics.some((metric) => /sms/i.test(metric.metric_type))
  const hasVoice = usage.voice_seconds > 0 || usage.usage_metrics.some((metric) => /voice|voz/i.test(metric.metric_type))

  return (
    <div className="grid gap-3.5">
      <Card title="KPIs de consumo">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))]">
          <KV label="Datos consumidos" value={bytesToDataLabel(usage.data_used_bytes)} />
          <KV label="Cap del plan" value={mbToLabel(subscription.normalized.limits.data)} />
          <KV label="Promedio diario" value={bytesToDataLabel(totalBytes / days)} />
          {peak > 0 && <KV label="Pico diario" value={`${peak.toLocaleString("es-CO", { maximumFractionDigits: 1 })} ${bars[0]?.unit || "MB"}`} />}
        </div>
      </Card>
      <Card title={`Periodo · ${fmtDate(usage.period_start)} a ${fmtDate(usage.period_end)}`}>
        <BarChart bars={bars} />
      </Card>
      {(hasSms || hasVoice) && (
        <Card title="Otros consumos">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))]">
            {hasSms && <KV label="SMS" value={usage.sms_count.toLocaleString("es-CO")} />}
            {hasVoice && <KV label="Voz" value={`${Math.round(usage.voice_seconds / 60).toLocaleString("es-CO")} min`} />}
          </div>
        </Card>
      )}
    </div>
  )
}
