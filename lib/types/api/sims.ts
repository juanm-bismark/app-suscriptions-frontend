import type { Provider, SimStatus } from "./common";

export interface SubscriptionOut {
  iccid: string;
  msisdn: string | null;
  imsi: string | null;
  status: SimStatus;
  provider: Provider;
  company_id: string;
  activated_at: string | null;
  updated_at: string | null;
  detail_level: "summary" | "detail";
  provider_fields: Record<string, unknown>;
  normalized: NormalizedSubscription;
}

export interface NormalizedSubscription {
  identity: { imei: string | null; alias: string | null; eid: string | null;
    euiccid: string | null; sim_profile_id: string | null };
  status:   { label?: string | null; group?: string | null;
    group_label?: string | null; source?: string | null; last_changed_at: string | null };
  plan:     { name: string | null; code: string | null; id?: string | number | null;
    communication_plan: string | null; apn: string | null; apns: string[] | null;
    started_at: string | null; expires_at: string | null };
  customer: { name: string | null; id: string | null;
    company_code: string | null; account_id: string | null };
  network:  { operator: string | null; country: string | null; rat_type: string | null;
    last_network: string | null; ip_address: string | null; ipv6_address: string | null;
    fixed_ip_address: string | null; fixed_ipv6_address: string | null;
    static_ips: string[] | null; additional_static_ips: string[] | null;
    sgsn_ip: string | null; ggsn_ip: string | null;
    last_traffic_at: string | null; first_lu_at: string | null;
    last_lu_at: string | null; first_cdr_at: string | null; last_cdr_at: string | null;
    gprs_status?: unknown; ip_status?: unknown; location?: unknown };
  hardware: { sim_model: string | null; module_manufacturer: string | null;
    module_model: string | null; device_id: string | null; modem_id: string | null;
    imei_last_changed_at: string | null; shipped_at: string | null };
  services: { active: string[] | null; basic?: unknown; supplementary?: unknown;
    data_service: boolean | null; sms_service: boolean | null };
  limits:   { data: number | null; data_unit: "mb" | null; sms: number | null;
    daily: Record<string, UsageControl> | null;
    monthly: Record<string, UsageControl> | null };
  dates:    { added_at: string | null; provisioned_at: string | null };
  custom_fields: Record<string, unknown>;
}

export interface UsageControl {
  limit?: unknown;
  value?: unknown;
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
  provider_statuses: {
    provider: string;
    status: "ok" | "partial" | "error" | "not_queried";
    count: number;
    code: string | null;
    title: string | null;
  }[];
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
  target: SimStatus;
  data_service?: boolean | null;
  sms_service?: boolean | null;
}

export interface SimSearchFilters {
  status?: string | null;
  statuses?: string[] | null;
  cursor?: string | null;
  limit?: number | null;
  iccid?: string | null;
  imsi?: string | null;
  msisdn?: string | null;
  modified_since?: string | null;
  modified_till?: string | null;
  custom?: Record<string, string> | null;
}

export interface SimSearchIn {
  limit?: number | null;
  cursor?: string | null;
  common?: SimSearchFilters | null;
  providers?: Partial<Record<Provider, SimSearchFilters>> | null;
}

export interface SimImportIn { sims: { iccid: string; provider: Provider }[]; }
export interface SimImportOut { imported: number; }

export type SimDetailsStatus = "ok" | "not_found" | "timeout" | "error" | "rate_limited";

export interface SimDetailsError {
  code: string;
  detail?: string | null;
  retry_after?: number | null;
}

export interface SimDetailsResult {
  provider: Provider;
  status: SimDetailsStatus;
  data?: SubscriptionOut;
  error?: SimDetailsError;
}

export interface SimDetailsIn {
  iccids: string[];
  providers?: Provider[];
}

export interface SimDetailsOut {
  results: Record<string, SimDetailsResult>;
  summary: Partial<Record<SimDetailsStatus, number>> & { total: number };
  unresolved: string[];
  filtered_out: string[];
}

export type AsyncJobStatus = "pending" | "running" | "done" | "failed";
export type AsyncJobKind = "export" | "routing_sync";

export interface AsyncJobOut {
  job_id: string;
  kind: AsyncJobKind;
  provider: Provider | null;
  status: AsyncJobStatus;
  progress: { done: number; total: number | null } | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  result_url: string | null;
  result_expires_at: string | null;
  error: { code: string; detail?: string | null } | null;
}

export interface SyncProviderFreshness {
  last_sync_at?: string | null;
  last_finished_at?: string | null;
  status?: AsyncJobStatus | null;
  last_status?: AsyncJobStatus | null;
  last_job_id?: string | null;
  iccids_seen?: number | null;
  error?: { code: string; detail?: string | null } | null;
}

export interface SyncInFlightJob {
  job_id: string;
  provider: Provider;
  started_at: string | null;
  progress?: { done: number; total: number | null } | null;
}

export interface SyncStatusOut {
  providers: Partial<Record<Provider, SyncProviderFreshness>>;
  in_flight: SyncInFlightJob[];
}

export interface SyncTriggerOut {
  job_id: string;
  status_url: string;
}
