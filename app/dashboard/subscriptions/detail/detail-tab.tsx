"use client"

import type { ProviderCapabilitiesOut, SubscriptionOut } from "@/lib/types/api"
import { fmtDate, formatVal, looksMono, prettyKey } from "../data"
import { SOURCES } from "../tokens"
import { StatusHistoryCard } from "./history"
import { Card, Empty, FieldGrid, KV } from "./primitives"
import { mbToLabel, mergedAttributes, providerString, value } from "./utils"

export function DetailTab({
  subscription,
  capabilities,
}: {
  subscription: SubscriptionOut
  capabilities: ProviderCapabilitiesOut
}) {
  const providerName = SOURCES[subscription.provider].name
  const n = subscription.normalized
  const attrs = mergedAttributes(subscription)
  const canStatusHistory = capabilities.capabilities.status_history?.status === "supported"
  const secondaryIdentityRows = [
    { label: "IMEI", value: value(n.identity.imei), mono: true },
    { label: "Alias", value: value(n.identity.alias) },
    { label: "EID", value: value(n.identity.eid), mono: true },
    { label: "eUICCID", value: value(n.identity.euiccid), mono: true },
    { label: "SIM profile", value: value(n.identity.sim_profile_id), mono: true },
  ].filter((row) => row.value !== "—")
  const planRows = [
    { label: "Nombre", value: value(n.plan.name) },
    { label: "Código", value: value(n.plan.code), mono: true },
    { label: "ID", value: formatVal(n.plan.id), mono: true },
    { label: "Communication plan", value: value(n.plan.communication_plan) },
    { label: "APN", value: value(n.plan.apn), mono: true },
    { label: "APNs", value: formatVal(n.plan.apns), mono: true },
    { label: "Inicio", value: fmtDate(n.plan.started_at) },
    { label: "Expira", value: fmtDate(n.plan.expires_at) },
  ].filter((row) => row.value !== "—")
  const dateRows = [
    { label: "Agregado", value: fmtDate(n.dates.added_at) },
    { label: "Provisionado", value: fmtDate(n.dates.provisioned_at) },
  ].filter((row) => row.value !== "—")

  return (
    <div className="grid gap-3.5">
      {secondaryIdentityRows.length > 0 && (
        <Card title="Identificadores secundarios">
          <FieldGrid rows={secondaryIdentityRows} />
        </Card>
      )}

      <Card title="Plan">
        {planRows.length ? <FieldGrid rows={planRows} /> : <Empty text="Este proveedor no envió información de plan." />}
      </Card>

      <Card title="Cliente">
        <FieldGrid rows={[
          { label: "Nombre", value: value(n.customer.name) },
          { label: "ID", value: value(n.customer.id), mono: true },
          { label: "Company code", value: value(n.customer.company_code), mono: true },
          { label: "Account ID", value: value(n.customer.account_id), mono: true },
        ]} />
      </Card>

      <Card title="Red">
        <FieldGrid rows={[
          { label: "Operador", value: value(n.network.operator) },
          { label: "País", value: value(n.network.country), mono: true },
          { label: "RAT", value: value(n.network.rat_type), mono: true },
          { label: "Última red", value: value(n.network.last_network) },
          { label: "IMSI conectividad", value: value(providerString(subscription, "connectivity_imsi_raw")), mono: true },
          { label: "IP actual/sesión", value: value(n.network.ip_address), mono: true },
          { label: "IPv6 actual/sesión", value: value(n.network.ipv6_address), mono: true },
          { label: "IP fija", value: value(n.network.fixed_ip_address), mono: true },
          { label: "IPv6 fija", value: value(n.network.fixed_ipv6_address), mono: true },
          { label: "IPs estáticas", value: formatVal(n.network.static_ips), mono: true },
          { label: "IPs estáticas adicionales", value: formatVal(n.network.additional_static_ips), mono: true },
          { label: "Estado GPRS", value: formatVal(n.network.gprs_status) },
          { label: "Estado servicio IP", value: formatVal(n.network.ip_status) },
          { label: "SGSN IP", value: value(n.network.sgsn_ip), mono: true },
          { label: "GGSN IP", value: value(n.network.ggsn_ip), mono: true },
          { label: "Ubicación", value: formatVal(n.network.location) },
          { label: "Último tráfico", value: fmtDate(n.network.last_traffic_at) },
          { label: "Primer LU", value: fmtDate(n.network.first_lu_at) },
          { label: "Último LU", value: fmtDate(n.network.last_lu_at) },
          { label: "Primer CDR", value: fmtDate(n.network.first_cdr_at) },
          { label: "Último CDR", value: fmtDate(n.network.last_cdr_at) },
          { label: "CDR mes", value: fmtDate(providerString(subscription, "firstcdrmonth")) },
        ]} />
      </Card>

      <Card title="Hardware">
        <FieldGrid rows={[
          { label: "Modelo SIM", value: value(n.hardware.sim_model) },
          { label: "Fabricante módulo", value: value(n.hardware.module_manufacturer) },
          { label: "Modelo módulo", value: value(n.hardware.module_model) },
          { label: "Device ID", value: value(n.hardware.device_id), mono: true },
          { label: "Modem ID", value: value(n.hardware.modem_id), mono: true },
          { label: "Cambio IMEI", value: fmtDate(n.hardware.imei_last_changed_at) },
          { label: "Despachado", value: fmtDate(n.hardware.shipped_at) },
        ]} />
      </Card>

      <Card title="Servicios">
        <FieldGrid rows={[
          { label: "Activos", value: formatVal(n.services.active) },
          { label: "Básicos", value: formatVal(n.services.basic) },
          { label: "Suplementarios", value: formatVal(n.services.supplementary) },
          { label: "Datos", value: formatVal(n.services.data_service) },
          { label: "SMS", value: formatVal(n.services.sms_service) },
        ]} />
      </Card>

      <Card title="Límites">
        <FieldGrid rows={[
          { label: "Datos", value: mbToLabel(n.limits.data) },
          { label: "SMS", value: n.limits.sms == null ? "Sin límite contractual" : n.limits.sms.toLocaleString("es-CO") },
          { label: "Controles diarios", value: Object.keys(n.limits.daily ?? {}).length.toLocaleString("es-CO") },
          { label: "Controles mensuales", value: Object.keys(n.limits.monthly ?? {}).length.toLocaleString("es-CO") },
        ]} />
      </Card>

      {dateRows.length > 0 && (
        <Card title="Fechas">
          <FieldGrid rows={dateRows} />
        </Card>
      )}

      {canStatusHistory && <StatusHistoryCard subscription={subscription} />}

      <Card title={`Campos avanzados · ${providerName}`}>
        {attrs.length ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
            {attrs.map(([key, v]) => <KV key={key} label={prettyKey(key)} value={formatVal(v)} mono={looksMono(key)} />)}
          </div>
        ) : (
          <Empty text="Sin atributos adicionales." />
        )}
      </Card>
    </div>
  )
}
