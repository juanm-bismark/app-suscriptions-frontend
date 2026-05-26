import type { SubscriptionOut } from "@/lib/types/api";
import type { Provider } from "@/lib/types/api/common";

export interface SubscriptionRow {
  iccid: string;
  provider: Provider;
  msisdn: string | null;
  imsi: string | null;
  status: string;
  nativeStatus: string;
  statusLabel: string;
  statusGroup: string | null;
  statusGroupLabel: string | null;
  customerName: string | null;
  customerScope: string | null;
  planName: string | null;
  planCode: string | null;
  planId: string | null;
  planDisplay: string;
  activatedAt: string | null;
  updatedAt: string | null;
  imei: string | null;
  operator: string | null;
  country: string | null;
  ratType: string | null;
  ipAddress: string | null;
  dataService: boolean | null;
  smsService: boolean | null;
  lastLuAt: string | null;
  lastCdrAt: string | null;
  firstCdrMonth: string | null;
  connectivityImsi: string | null;
  communicationPlan: string | null;
  autorenewal: string | null;
  alias: string | null;
  commercialGroup: string | null;
  supervisionGroup: string | null;
  servicePack: string | null;
  accountId: string | null;
  endConsumerId: string | null;
  deviceId: string | null;
  modemId: string | null;
  eid: string | null;
  euiccid: string | null;
  simProfileId: string | null;
  fixedIpAddress: string | null;
  productCode: string | null;
  companyCode: string | null;
  dataLimitMb: string | null;
  smsLimit: string | null;
  accountCustoms: (string | null)[];
  operatorCustoms: (string | null)[];
  customerCustoms: (string | null)[];
  customField1: string | null;
  customField2: string | null;
  customField3: string | null;
  customField4: string | null;
}

function clean(value: string | number | null | undefined) {
  const trimmed = value == null ? undefined : String(value).trim();
  return trimmed || undefined;
}

function fallbackStatusGroup(value: string | null | undefined) {
  const key = clean(value)?.toLowerCase();
  if (!key) return "unknown";
  if (key.includes("purged")) return "purged_like";
  if (key.includes("terminat") || key.includes("retired") || key.includes("replaced")) return "terminal_like";
  if (key.includes("suspend") || key.includes("deactivat")) return "suspended_like";
  if (key.includes("test")) return "test_like";
  if (key.includes("active") || key.includes("activated")) return "active_like";
  if (key.includes("unknown")) return "unknown";
  return "other";
}

export function toRow(s: SubscriptionOut): SubscriptionRow {
  const n = s.normalized;
  const providerStatus = clean(s.status) ?? "UNKNOWN";
  const planName = clean(n.plan.name) ?? null;
  const planCode = clean(n.plan.code) ?? null;
  const planId = clean(n.plan.id) ?? null;
  const pf = s.provider_fields ?? {};
  const pfString = (key: string): string | null => {
    const raw = pf[key];
    if (raw == null) return null;
    const text = String(raw).trim();
    return text || null;
  };

  return {
    iccid: s.iccid,
    provider: s.provider,
    msisdn: s.msisdn,
    imsi: s.imsi,
    status: providerStatus,
    nativeStatus: providerStatus,
    statusLabel: clean(n.status.label) ?? providerStatus,
    statusGroup: clean(n.status.group) ?? fallbackStatusGroup(providerStatus),
    statusGroupLabel: clean(n.status.group_label) ?? null,
    customerName: n.customer.name,
    customerScope: n.customer.company_code ?? n.customer.account_id ?? null,
    planName,
    planCode,
    planId,
    planDisplay: planName ?? planCode ?? planId ?? "—",
    activatedAt: s.activated_at,
    updatedAt: s.updated_at,
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
    communicationPlan: clean(n.plan.communication_plan) ?? pfString("communication_plan"),
    autorenewal: pfString("autorenewal"),
    alias: clean(n.identity.alias) ?? pfString("alias"),
    commercialGroup: pfString("commercial_group"),
    supervisionGroup: pfString("supervision_group"),
    servicePack: pfString("service_pack") ?? pfString("service_pack_id"),
    accountId: clean(n.customer.account_id) ?? pfString("account_id"),
    endConsumerId: pfString("end_consumer_id") ?? clean(n.customer.id) ?? null,
    deviceId: clean(n.hardware.device_id) ?? pfString("device_id"),
    modemId: clean(n.hardware.modem_id) ?? pfString("modem_id"),
    eid: clean(n.identity.eid) ?? pfString("eid"),
    euiccid: clean(n.identity.euiccid) ?? pfString("euiccid"),
    simProfileId: clean(n.identity.sim_profile_id) ?? pfString("sim_profile_id"),
    fixedIpAddress: clean(n.network.fixed_ip_address) ?? pfString("fixed_ip_address"),
    productCode: planCode ?? pfString("product_code"),
    companyCode: clean(n.customer.company_code) ?? pfString("company_code"),
    dataLimitMb: pfString("data_limit_mb"),
    smsLimit: pfString("sms_limit"),
    accountCustoms: Array.from({ length: 10 }, (_, index) => pfString(`account_custom_${index + 1}`)),
    operatorCustoms: Array.from({ length: 5 }, (_, index) => pfString(`operator_custom_${index + 1}`)),
    customerCustoms: Array.from({ length: 5 }, (_, index) => pfString(`customer_custom_${index + 1}`)),
    customField1: clean(n.custom_fields.custom_field_1 as string | number | null | undefined) ?? pfString("custom_field_1"),
    customField2: clean(n.custom_fields.custom_field_2 as string | number | null | undefined) ?? pfString("custom_field_2"),
    customField3: clean(n.custom_fields.custom_field_3 as string | number | null | undefined) ?? pfString("custom_field_3"),
    customField4: clean(n.custom_fields.custom_field_4 as string | number | null | undefined) ?? pfString("custom_field_4"),
  };
}
