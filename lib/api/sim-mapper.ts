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
  };
}
