"use client"

import Link from "next/link"
import type { ProviderCapabilitiesOut, SubscriptionOut } from "@/lib/types/api"
import { fmtDate, formatVal } from "../data"
import { T } from "../tokens"
import { usePresence, useSimLocation } from "./hooks"
import { SmsHistoryCard } from "./history"
import { Card, Empty, KV } from "./primitives"
import { clean, providerString, value } from "./utils"

export function PresenceTab({
  subscription,
  capabilities,
}: {
  subscription: SubscriptionOut
  capabilities: ProviderCapabilitiesOut
}) {
  const state = usePresence(subscription.iccid)
  const isMoabits = subscription.provider === "moabits"
  const canSmsHistory = capabilities.capabilities.sms_history?.status === "supported"
  const canLocation = capabilities.capabilities.location?.status === "supported"

  if (state.status === "error") {
    const unsupported = state.code === "provider.unsupported_operation"
    return <Card title="Presencia y red"><Empty text={unsupported ? "Este proveedor no expone presencia para la SIM." : state.message} /></Card>
  }
  if (state.status !== "success") return <Card title="Presencia y red"><Empty text="Consultando presencia..." /></Card>
  const p = state.data
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Card title="Presencia y red">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
          <KV label="Estado" value={p.state} dot={presenceColor(p.state)} />
          <KV label="Última vez vista" value={fmtDate(p.last_seen_at)} />
          <KV label="País" value={value(p.country_code)} mono />
          <KV label="Red" value={value(p.network_name)} />
          <KV label="RAT" value={value(p.rat_type)} mono />
          <KV label="IP" value={value(p.ip_address)} mono />
        </div>
      </Card>
      {canLocation && <LocationCard subscription={subscription} />}
      {isMoabits && <MoabitsConnectivityCard subscription={subscription} />}
      {canSmsHistory && <SmsHistoryCard subscription={subscription} />}
    </div>
  )
}

function LocationCard({ subscription }: { subscription: SubscriptionOut }) {
  const state = useSimLocation(subscription.iccid)
  if (state.status === "error") return <Card title="Ubicación"><Empty text={state.message} /></Card>
  if (state.status !== "success") return <Card title="Ubicación"><Empty text="Consultando ubicación..." /></Card>
  const loc = state.data
  const hasCoords = loc.latitude != null && loc.longitude != null
  const mapsUrl = hasCoords ? `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}` : null
  return (
    <Card title="Ubicación">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
        <KV label="Latitud" value={formatVal(loc.latitude)} mono />
        <KV label="Longitud" value={formatVal(loc.longitude)} mono />
        <KV label="Fuente" value={value(loc.source)} />
        <KV label="Actualizada" value={fmtDate(loc.timestamp)} />
      </div>
      {mapsUrl && (
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${T.divider}` }}>
          <Link href={mapsUrl} target="_blank" rel="noreferrer" style={{ color: T.headerBg, fontWeight: 700, fontSize: 13 }}>
            Ver en mapa
          </Link>
        </div>
      )}
    </Card>
  )
}

function MoabitsConnectivityCard({ subscription }: { subscription: SubscriptionOut }) {
  const n = subscription.normalized
  const operator = clean(n.network.operator)
  const country = clean(n.network.country)
  const rat = clean(n.network.rat_type)
  const ip = clean(n.network.ip_address)
  const imsiConn = providerString(subscription, "connectivity_imsi_raw")
  const mcc = providerString(subscription, "mcc")
  const mnc = providerString(subscription, "mnc")
  const sessionStarted = providerString(subscription, "session_started_at")
  const usageKb = providerString(subscription, "usage_kb")
  const chargeTowards = providerString(subscription, "charge_towards")
  const dataSessionId = providerString(subscription, "data_session_id")
  const enrichmentStatus = providerString(subscription, "enrichment_status")

  const hasAny = operator || country || rat || ip || imsiConn || mcc || mnc ||
                 sessionStarted || usageKb || chargeTowards || dataSessionId

  if (!hasAny) {
    return (
      <Card title="Connectivity status (Moabits v2)">
        <Empty text="Enrichment v2 sin datos para esta SIM. Puede estar en `v1_only`." />
      </Card>
    )
  }

  return (
    <Card title="Connectivity status (Moabits v2)">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <KV label="Operador" value={value(operator)} />
        <KV label="País" value={value(country)} mono />
        <KV label="RAT" value={value(rat)} mono />
        <KV label="IP privada" value={value(ip)} mono />
        <KV label="IMSI conectividad" value={value(imsiConn)} mono />
        <KV label="MCC / MNC" value={mcc || mnc ? `${value(mcc)} / ${value(mnc)}` : "—"} mono />
        <KV label="Inicio sesión datos" value={fmtDate(sessionStarted)} />
        <KV label="Tráfico sesión (KB)" value={value(usageKb)} mono />
        <KV label="Charge towards" value={value(chargeTowards)} mono />
        <KV label="Data session ID" value={value(dataSessionId)} mono />
        <KV label="Actualizado" value={fmtDate(subscription.updated_at)} />
        <KV label="Enrichment" value={value(enrichmentStatus)} sub="full · detail_only · connectivity_only · v1_only" />
      </div>
    </Card>
  )
}

function presenceColor(state: string) {
  if (state === "online") return T.success
  if (state === "offline") return T.danger
  return T.muted
}
