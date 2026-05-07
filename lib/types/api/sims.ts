import type { AdministrativeStatus, Provider } from "./common";

export interface SubscriptionOut {
  iccid: string;
  msisdn: string | null;
  imsi: string | null;
  status: AdministrativeStatus;
  native_status: string;
  provider: Provider;
  company_id: string;
  activated_at: string | null;
  updated_at: string | null;
  detail_level: "summary" | "detail";
  provider_fields: Record<string, unknown>;
  normalized: NormalizedSubscription;
}

export interface NormalizedSubscription {
  identity: { iccid: string | null; msisdn: string | null; imsi: string | null;
    imei: string | null; alias: string | null; eid: string | null; euiccid: string | null;
    sim_profile_id: string | null };
  status:   { value: AdministrativeStatus | null; native: string | null;
    last_changed_at: string | null };
  plan:     { name: string | null; code: string | null; id: string | null;
    communication_plan: string | null; apn: string | null; apns: string[] | null;
    started_at: string | null; expires_at: string | null };
  customer: { name: string | null; id: string | null;
    company_code: string | null; account_id: string | null };
  network:  { operator: string | null; country: string | null; rat_type: string | null;
    last_network: string | null; ip_address: string | null;
    sgsn_ip: string | null; ggsn_ip: string | null;
    last_traffic_at: string | null; first_lu_at: string | null;
    last_lu_at: string | null; first_cdr_at: string | null; last_cdr_at: string | null;
    gprs: string | null; ip: string | null; location: string | null };
  hardware: { sim_model: string | null; module_manufacturer: string | null;
    module_model: string | null; device_id: string | null; modem_id: string | null;
    imei_last_changed_at: string | null; shipped_at: string | null };
  services: { active: string[] | null; basic: string | null; supplementary: string | null;
    data_service: boolean | null; sms_service: boolean | null };
  limits:   { data: number | null; data_unit: "mb" | null; sms: number | null;
    daily: Record<string, UsageControl> | null;
    monthly: Record<string, UsageControl> | null };
  dates:    { activated_at: string | null; updated_at: string | null;
    added_at: string | null; provisioned_at: string | null };
  custom_fields: Record<string, unknown>;
}

export interface UsageControl {
  limit: number | null;
  value: number | null;
  threshold_reached: boolean | null;
  traffic_cut: boolean | null;
  enabled: boolean | null;
}

export interface SimListOut {
  items: SubscriptionOut[];
  next_cursor: string | null;
  total: number | null;
  partial: boolean;
  failed_providers: { provider: string; code: string; title: string }[];
}

export interface UsageOut {
  iccid: string;
  period_start: string;
  period_end: string;
  data_used_bytes: string;
  sms_count: number;
  voice_seconds: number;
  provider_metrics: Record<string, unknown>;
  usage_metrics: { metric_type: string; usage: string; unit: string | null }[];
}

export interface PresenceOut {
  iccid: string;
  state: "online" | "offline" | "unknown";
  ip_address: string | null;
  country_code: string | null;
  rat_type: string | null;
  network_name: string | null;
  last_seen_at: string | null;
}

export interface StatusChangeIn {
  target: AdministrativeStatus;
  data_service?: boolean | null;
  sms_service?: boolean | null;
}

export interface SimImportIn { sims: { iccid: string; provider: Provider }[]; }
export interface SimImportOut { imported: number; }
