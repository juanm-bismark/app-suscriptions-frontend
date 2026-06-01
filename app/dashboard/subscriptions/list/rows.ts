import type { SubscriptionRow } from "@/lib/api/sim-mapper"
import type { LoadSubscriptionsData } from "@/lib/subscriptions/types"
import type { SimDetailsResult } from "@/lib/types/api"
import { normalizeStatusValue } from "../filters/status-filter"

export function rowNativeStatus(row: SubscriptionRow) {
  return normalizeStatusValue(row.status || row.nativeStatus)
}

export function secondary(value: string | null | undefined) {
  return value && value.trim() ? value : "—"
}

export function sortedUnique(values: readonly string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort()
}

export function rowKey(row: SubscriptionRow) {
  return `${row.provider}:${row.iccid}`
}

export function stringOrNull(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed || null
}

export function mergeRow(existing: SubscriptionRow | undefined, incoming: SubscriptionRow) {
  if (!existing) return incoming
  return {
    ...existing,
    ...incoming,
    msisdn: incoming.msisdn ?? existing.msisdn,
    imsi: incoming.imsi ?? existing.imsi,
    nativeStatus: incoming.nativeStatus || existing.nativeStatus,
    status: incoming.status || existing.status,
    statusLabel: incoming.statusLabel || existing.statusLabel,
    statusGroup: incoming.statusGroup ?? existing.statusGroup,
    statusGroupLabel: incoming.statusGroupLabel ?? existing.statusGroupLabel,
    customerName: incoming.customerName ?? existing.customerName,
    customerScope: incoming.customerScope ?? existing.customerScope,
    planName: incoming.planName ?? existing.planName,
    planCode: incoming.planCode ?? existing.planCode,
    planId: incoming.planId ?? existing.planId,
    planDisplay: incoming.planDisplay !== "—" ? incoming.planDisplay : existing.planDisplay,
    activatedAt: incoming.activatedAt ?? existing.activatedAt,
    updatedAt: incoming.updatedAt ?? existing.updatedAt,
  }
}

export function mergeRowsIntoResult(cached: LoadSubscriptionsData, incomingRows: SubscriptionRow[]): LoadSubscriptionsData {
  const nextRows = [...cached.rows]
  const rowIndexes = new Map(nextRows.map((row, index) => [rowKey(row), index]))

  for (const incoming of incomingRows) {
    const key = rowKey(incoming)
    const index = rowIndexes.get(key)
    const merged = mergeRow(index == null ? undefined : nextRows[index], incoming)

    if (index != null) {
      nextRows[index] = merged
    } else {
      nextRows.unshift(merged)
      rowIndexes.forEach((value, existingKey) => rowIndexes.set(existingKey, value + 1))
      rowIndexes.set(key, 0)
    }
  }

  return {
    ...cached,
    rows: nextRows,
    pagination: {
      ...cached.pagination,
      total: cached.pagination.total == null ? cached.pagination.total : Math.max(cached.pagination.total, nextRows.length),
    },
  }
}

export function mergeDetailRows(rows: SubscriptionRow[], details: Record<string, SimDetailsResult> | undefined) {
  if (!details) return rows
  return rows.map((row) => {
    const detail = details[row.iccid]
    if (detail?.status === "ok" && detail.data) return mergeRow(row, toDetailRow(detail.data))
    return row
  })
}

function toDetailRow(data: NonNullable<SimDetailsResult["data"]>): SubscriptionRow {
  const n = data.normalized
  const providerStatus = data.status?.trim() || "UNKNOWN"
  const planName = stringOrNull(n.plan.name)
  const planCode = stringOrNull(n.plan.code)
  const planId = stringOrNull(n.plan.id == null ? null : String(n.plan.id))
  const pf = data.provider_fields ?? {}
  const pfString = (key: string): string | null => {
    const raw = pf[key]
    if (raw == null) return null
    const text = String(raw).trim()
    return text || null
  }

  return {
    iccid: data.iccid,
    provider: data.provider,
    msisdn: data.msisdn,
    imsi: data.imsi,
    status: providerStatus,
    nativeStatus: providerStatus,
    statusLabel: stringOrNull(n.status.label) ?? providerStatus,
    statusGroup: stringOrNull(n.status.group),
    statusGroupLabel: stringOrNull(n.status.group_label),
    customerName: n.customer.name,
    customerScope: n.customer.company_code ?? n.customer.account_id ?? null,
    planName,
    planCode,
    planId,
    planDisplay: planName ?? planCode ?? planId ?? "—",
    activatedAt: data.activated_at,
    updatedAt: data.updated_at,
    imei: n.identity.imei,
    operator: n.network.operator,
    country: n.network.country,
    ratType: n.network.rat_type,
    ipAddress: n.network.ip_address,
    dataService: n.services.data_service,
    smsService: n.services.sms_service,
    lastLuAt: n.network.last_lu_at,
    lastCdrAt: n.network.last_cdr_at,
    firstCdrMonth: pfString("firstcdrmonth"),
    connectivityImsi: pfString("connectivity_imsi_raw"),
    communicationPlan: stringOrNull(n.plan.communication_plan) ?? pfString("communication_plan"),
    autorenewal: pfString("autorenewal"),
    alias: stringOrNull(n.identity.alias) ?? pfString("alias"),
    commercialGroup: pfString("commercial_group"),
    supervisionGroup: pfString("supervision_group"),
    servicePack: pfString("service_pack") ?? pfString("service_pack_id"),
    accountId: stringOrNull(n.customer.account_id) ?? pfString("account_id"),
    endConsumerId: pfString("end_consumer_id") ?? stringOrNull(n.customer.id) ?? null,
    deviceId: stringOrNull(n.hardware.device_id) ?? pfString("device_id"),
    modemId: stringOrNull(n.hardware.modem_id) ?? pfString("modem_id"),
    eid: stringOrNull(n.identity.eid) ?? pfString("eid"),
    euiccid: stringOrNull(n.identity.euiccid) ?? pfString("euiccid"),
    simProfileId: stringOrNull(n.identity.sim_profile_id) ?? pfString("sim_profile_id"),
    fixedIpAddress: stringOrNull(n.network.fixed_ip_address) ?? pfString("fixed_ip_address"),
    productCode: planCode ?? pfString("product_code"),
    companyCode: stringOrNull(n.customer.company_code) ?? pfString("company_code"),
    dataLimitMb: pfString("data_limit_mb"),
    smsLimit: pfString("sms_limit"),
    accountCustoms: Array.from({ length: 10 }, (_, index) => pfString(`account_custom_${index + 1}`)),
    operatorCustoms: Array.from({ length: 5 }, (_, index) => pfString(`operator_custom_${index + 1}`)),
    customerCustoms: Array.from({ length: 5 }, (_, index) => pfString(`customer_custom_${index + 1}`)),
    customField1: stringOrNull(n.custom_fields.custom_field_1 == null ? null : String(n.custom_fields.custom_field_1)) ?? pfString("custom_field_1"),
    customField2: stringOrNull(n.custom_fields.custom_field_2 == null ? null : String(n.custom_fields.custom_field_2)) ?? pfString("custom_field_2"),
    customField3: stringOrNull(n.custom_fields.custom_field_3 == null ? null : String(n.custom_fields.custom_field_3)) ?? pfString("custom_field_3"),
    customField4: stringOrNull(n.custom_fields.custom_field_4 == null ? null : String(n.custom_fields.custom_field_4)) ?? pfString("custom_field_4"),
  }
}
