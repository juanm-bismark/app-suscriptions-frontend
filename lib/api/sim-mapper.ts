import type { SubscriptionOut } from "@/lib/types/api";
import type { AdministrativeStatus, Provider } from "@/lib/types/api/common";

export interface SubscriptionRow {
  iccid: string;
  provider: Provider;
  msisdn: string | null;
  imsi: string | null;
  status: AdministrativeStatus;
  nativeStatus: string;
  customerName: string | null;
  customerScope: string | null;
  planName: string | null;
  planCode: string | null;
  activatedAt: string | null;
  updatedAt: string | null;
  detailLevel: "summary" | "detail";
}

export function toRow(s: SubscriptionOut): SubscriptionRow {
  const n = s.normalized;

  return {
    iccid: s.iccid,
    provider: s.provider,
    msisdn: s.msisdn ?? n.identity.msisdn,
    imsi: s.imsi ?? n.identity.imsi,
    status: s.status,
    nativeStatus: s.native_status,
    customerName: n.customer.name,
    customerScope: n.customer.company_code ?? n.customer.account_id ?? null,
    planName: n.plan.name,
    planCode: n.plan.code,
    activatedAt: s.activated_at ?? n.dates.activated_at,
    updatedAt: s.updated_at ?? n.dates.updated_at,
    detailLevel: s.detail_level,
  };
}
