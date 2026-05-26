import { z } from "zod"
import type { Profile, Company } from "@/lib/types/user"
import type { AsyncJobOut, LocationOut, SimDetailsOut, SimListOut, SimStatsOut, SmsHistoryOut, StatusHistoryOut, SyncStatusOut, SyncTriggerOut, UsageOut, PresenceOut, SimImportOut } from "@/lib/types/api/sims"
import type { SubscriptionOut } from "@/lib/types/api/sims"
import type { CredentialMetadataOut, CredentialProbeOut, CompanyProviderMappingOut, MoabitsSourceCompanyOut, LocalCompanyMoabitsMappingOut, MoabitsProviderMappingDiscoveryOut, CredentialTestOut } from "@/lib/types/api"
import type { ProviderCapabilitiesOut, CapabilityOut } from "@/lib/types/api/providers"
import type { CapabilityStatus } from "@/lib/types/api/common"
import type { TokenResponse } from "@/lib/types/api/auth"

const DateString = z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).or(z.string())

const UserRoleSchema = z.enum(["admin", "manager", "member", "public"])

export const ProfileSchema: z.ZodSchema<Profile> = z.object({
  id: z.string(),
  company_id: z.string().nullable(),
  role: UserRoleSchema,
  full_name: z.string().nullable(),
  email: z.string().email().nullable(),
  created_at: DateString,
}).loose()

export const CompanySchema: z.ZodSchema<Company> = z.object({
  id: z.string(),
  name: z.string(),
  created_at: DateString,
}).loose()

export const PageSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    size: z.number().int().positive(),
    pages: z.number().int().nonnegative(),
  }).loose()

const StatusValueSchema = z.string()

const ProviderSchema = z.enum(["kite", "tele2", "moabits"])

const IdentitySchema = z.object({
  imei: z.string().nullable(),
  alias: z.string().nullable(),
  eid: z.string().nullable(),
  euiccid: z.string().nullable(),
  sim_profile_id: z.string().nullable(),
}).loose()

const StatusSchema = z.object({
  label: z.string().nullish(),
  group: z.string().nullish(),
  group_label: z.string().nullish(),
  source: z.string().nullish(),
  last_changed_at: DateString.nullable(),
}).loose()

const PlanSchema = z.object({
  name: z.string().nullable(),
  code: z.string().nullable(),
  id: z.union([z.string(), z.number()]).nullish(),
  communication_plan: z.string().nullable(),
  apn: z.string().nullable(),
  apns: z.array(z.string()).nullable(),
  started_at: DateString.nullable(),
  expires_at: DateString.nullable(),
}).loose()

const CustomerSchema = z.object({
  name: z.string().nullable(),
  id: z.string().nullable(),
  company_code: z.string().nullable(),
  account_id: z.string().nullable(),
}).loose()

const NetworkSchema = z.object({
  operator: z.string().nullable(),
  country: z.string().nullable(),
  rat_type: z.string().nullable(),
  last_network: z.string().nullable(),
  ip_address: z.string().nullable(),
  ipv6_address: z.string().nullable(),
  fixed_ip_address: z.string().nullable(),
  fixed_ipv6_address: z.string().nullable(),
  static_ips: z.array(z.string()).nullable(),
  additional_static_ips: z.array(z.string()).nullable(),
  sgsn_ip: z.string().nullable(),
  ggsn_ip: z.string().nullable(),
  last_traffic_at: DateString.nullable(),
  first_lu_at: DateString.nullable(),
  last_lu_at: DateString.nullable(),
  first_cdr_at: DateString.nullable(),
  last_cdr_at: DateString.nullable(),
  gprs_status: z.unknown().nullish(),
  ip_status: z.unknown().nullish(),
  location: z.unknown().nullish(),
}).loose()

const HardwareSchema = z.object({
  sim_model: z.string().nullable(),
  module_manufacturer: z.string().nullable(),
  module_model: z.string().nullable(),
  device_id: z.string().nullable(),
  modem_id: z.string().nullable(),
  imei_last_changed_at: DateString.nullable(),
  shipped_at: DateString.nullable(),
}).loose()

const ServicesSchema = z.object({
  active: z.array(z.string()).nullable(),
  basic: z.unknown().nullish(),
  supplementary: z.unknown().nullish(),
  data_service: z.boolean().nullable(),
  sms_service: z.boolean().nullable(),
}).loose()

const UsageControlSchema = z.object({
  limit: z.unknown().nullish(),
  value: z.unknown().nullish(),
  threshold_reached: z.boolean().nullable(),
  traffic_cut: z.boolean().nullable(),
  enabled: z.boolean().nullable(),
}).loose()

const LimitsSchema = z.object({
  data: z.number().nullable(),
  data_unit: z.literal("mb").nullable(),
  sms: z.number().nullable(),
  daily: z.record(z.string(), UsageControlSchema).nullable(),
  monthly: z.record(z.string(), UsageControlSchema).nullable(),
}).loose()

const DatesSchema = z.object({
  added_at: DateString.nullable(),
  provisioned_at: DateString.nullable(),
}).loose()

const NormalizedSubscriptionSchema = z.object({
  identity: IdentitySchema,
  status: StatusSchema,
  plan: PlanSchema,
  customer: CustomerSchema,
  network: NetworkSchema,
  hardware: HardwareSchema,
  services: ServicesSchema,
  limits: LimitsSchema,
  dates: DatesSchema,
  custom_fields: z.record(z.string(), z.unknown()),
}).loose()

export const SubscriptionOutSchema = z.object({
  iccid: z.string(),
  msisdn: z.string().nullable(),
  imsi: z.string().nullable(),
  status: z.string(),
  provider: ProviderSchema,
  company_id: z.string(),
  activated_at: DateString.nullable(),
  updated_at: DateString.nullable(),
  detail_level: z.enum(["summary", "detail"]),
  provider_fields: z.record(z.string(), z.unknown()),
  normalized: NormalizedSubscriptionSchema,
}).loose() as unknown as z.ZodSchema<SubscriptionOut>

const CredentialExpiryStatusSchema = z.enum(["valid", "expiring", "expired", "invalid"])

export const CredentialMetadataOutSchema: z.ZodSchema<CredentialMetadataOut> = z.object({
  provider: ProviderSchema,
  active: z.boolean(),
  expiry_status: CredentialExpiryStatusSchema,
  created_at: DateString,
  rotated_at: DateString.nullable(),
  account_scope: z.record(z.string(), z.unknown()),
}).loose()

export const ProblemDetailsSchema = z.object({
  type: z.string().optional(),
  title: z.string(),
  status: z.number().int(),
  code: z.string().optional(),
  detail: z.string().nullable().optional(),
  instance: z.string().nullable().optional(),
}).catchall(z.unknown())

const FailedProviderSchema = z.object({
  provider: z.string(),
  code: z.string(),
  title: z.string(),
}).loose()

const ProviderStatusSchema = z.object({
  provider: z.string(),
  status: z.enum(["ok", "partial", "error", "not_queried"]),
  count: z.number().int().nonnegative(),
  code: z.string().nullable(),
  title: z.string().nullable(),
}).loose()

export const SimListOutSchema: z.ZodSchema<SimListOut> = (z.object({
  items: z.array(SubscriptionOutSchema),
  next_cursor: z.string().nullable(),
  total: z.number().int().nonnegative().nullable(),
  partial: z.boolean(),
  failed_providers: z.array(FailedProviderSchema),
  provider_statuses: z.array(ProviderStatusSchema),
}).loose() as unknown) as z.ZodSchema<SimListOut>

export const UsageOutSchema: z.ZodSchema<UsageOut> = z.object({
  iccid: z.string(),
  period_start: DateString,
  period_end: DateString,
  data_used_bytes: z.string(),
  sms_count: z.number().int().nonnegative(),
  voice_seconds: z.number().int().nonnegative(),
  provider_metrics: z.record(z.string(), z.unknown()),
  usage_metrics: z.array(z.object({
    metric_type: z.string(),
    usage: z.string(),
    unit: z.string().nullable(),
  }).loose()),
}).loose()

export const PresenceOutSchema: z.ZodSchema<PresenceOut> = z.object({
  iccid: z.string(),
  state: z.enum(["online", "offline", "unknown"]),
  ip_address: z.string().nullable(),
  country_code: z.string().nullable(),
  rat_type: z.string().nullable(),
  network_name: z.string().nullable(),
  last_seen_at: DateString.nullable(),
}).loose()

export const LocationOutSchema: z.ZodSchema<LocationOut> = z.object({
  iccid: z.string(),
  latitude: z.union([z.string(), z.number()]).nullable(),
  longitude: z.union([z.string(), z.number()]).nullable(),
  accuracy_m: z.union([z.string(), z.number()]).nullable(),
  timestamp: DateString.nullable(),
  source: z.string().nullable(),
}).loose()

export const SimImportOutSchema: z.ZodSchema<SimImportOut> = z.object({
  imported: z.number().int().nonnegative(),
}).loose()

export const SmsHistoryOutSchema: z.ZodSchema<SmsHistoryOut> = z.object({
  iccid: z.string(),
  period_start: DateString,
  period_end: DateString,
  records: z.array(z.object({
    iccid: z.string(),
    date: DateString,
    message: z.string(),
    sms_type: z.enum(["MO", "MT"]),
    gateway_delivered: z.boolean().nullable(),
    sms_center_delivered: z.boolean().nullable(),
  }).loose()),
}).loose()

export const StatusHistoryOutSchema: z.ZodSchema<StatusHistoryOut> = z.object({
  iccid: z.string(),
  period_start: DateString.nullable(),
  period_end: DateString.nullable(),
  records: z.array(z.object({
    state: z.string(),
    automatic: z.boolean(),
    time: DateString,
    reason: z.string().nullable(),
    user: z.string().nullable(),
  }).loose()),
}).loose()

export const SimStatsOutSchema: z.ZodSchema<SimStatsOut> = z.object({
  total: z.number().int().nonnegative(),
  by_status: z.record(z.string(), z.number().int().nonnegative()),
  by_status_group: z.record(z.string(), z.number().int().nonnegative()),
  stale_lu_count: z.number().int().nonnegative(),
  provider: ProviderSchema.nullable(),
  fresh_at: DateString,
  partial: z.boolean(),
  failed_providers: z.array(FailedProviderSchema),
}).loose()

const SimDetailsErrorSchema = z.object({
  code: z.string(),
  detail: z.string().nullable().optional(),
  retry_after: z.coerce.number().nullable().optional(),
}).loose()

const SimDetailsResultSchema = z.object({
  provider: ProviderSchema,
  status: z.enum(["ok", "not_found", "timeout", "error", "rate_limited"]),
  data: SubscriptionOutSchema.nullish(),
  error: SimDetailsErrorSchema.nullish(),
}).loose()

export const SimDetailsOutSchema: z.ZodSchema<SimDetailsOut> = z.object({
  results: z.record(z.string(), SimDetailsResultSchema),
  summary: z.object({
    ok: z.number().int().nonnegative().optional(),
    not_found: z.number().int().nonnegative().optional(),
    timeout: z.number().int().nonnegative().optional(),
    rate_limited: z.number().int().nonnegative().optional(),
    error: z.number().int().nonnegative().optional(),
    total: z.number().int().nonnegative(),
  }).loose(),
  unresolved: z.array(z.string()),
  filtered_out: z.array(z.string()),
}).loose() as unknown as z.ZodSchema<SimDetailsOut>

const AsyncJobStatusSchema = z.enum(["pending", "running", "done", "failed"])

const JobProgressSchema = z.object({
  done: z.number().int().nonnegative(),
  total: z.number().int().nonnegative().nullable(),
}).loose()

export const AsyncJobOutSchema: z.ZodSchema<AsyncJobOut> = z.object({
  job_id: z.string(),
  kind: z.enum(["export", "routing_sync"]),
  provider: ProviderSchema.nullable(),
  status: AsyncJobStatusSchema,
  progress: JobProgressSchema.nullable(),
  created_at: DateString,
  started_at: DateString.nullable(),
  finished_at: DateString.nullable(),
  result_url: z.string().nullable(),
  result_expires_at: DateString.nullable(),
  error: z.object({
    code: z.string(),
    detail: z.string().nullable().optional(),
  }).loose().nullable(),
}).loose()

const SyncProviderFreshnessSchema = z.object({
  last_sync_at: DateString.nullish(),
  last_finished_at: DateString.nullish(),
  status: AsyncJobStatusSchema.nullish(),
  last_status: AsyncJobStatusSchema.nullish(),
  last_job_id: z.string().nullish(),
  iccids_seen: z.number().int().nonnegative().nullish(),
  error: z.object({
    code: z.string(),
    detail: z.string().nullable().optional(),
  }).loose().nullish(),
}).loose()

const SyncInFlightJobSchema = z.object({
  job_id: z.string(),
  provider: ProviderSchema,
  started_at: DateString.nullable(),
  progress: JobProgressSchema.nullish(),
}).loose()

const SyncStatusCanonicalSchema = z.object({
  providers: z.record(z.string(), SyncProviderFreshnessSchema),
  in_flight: z.array(SyncInFlightJobSchema),
}).loose()

const BackendSyncFreshnessSchema = z.object({
  provider: ProviderSchema,
  last_finished_at: DateString.nullish(),
  last_status: AsyncJobStatusSchema.nullish(),
}).loose()

const BackendSyncInFlightJobSchema = z.object({
  job_id: z.string(),
  provider: ProviderSchema.nullable(),
  created_at: DateString,
  progress_done: z.number().int().nonnegative(),
  progress_total: z.number().int().nonnegative().nullable(),
}).loose()

const SyncStatusBackendSchema = z.object({
  freshness: z.array(BackendSyncFreshnessSchema),
  in_flight: z.array(BackendSyncInFlightJobSchema),
}).loose().transform((value) => ({
  providers: Object.fromEntries(
    value.freshness.map((item) => [
      item.provider,
      {
        last_finished_at: item.last_finished_at ?? null,
        last_status: item.last_status ?? null,
      },
    ])
  ),
  in_flight: value.in_flight.flatMap((job) => {
    if (!job.provider) return []
    return [{
      job_id: job.job_id,
      provider: job.provider,
      started_at: job.created_at,
      progress: {
        done: job.progress_done,
        total: job.progress_total,
      },
    }]
  }),
}))

export const SyncStatusOutSchema: z.ZodSchema<SyncStatusOut> = z.union([
  SyncStatusCanonicalSchema,
  SyncStatusBackendSchema,
]) as unknown as z.ZodSchema<SyncStatusOut>

export const SyncTriggerOutSchema: z.ZodSchema<SyncTriggerOut> = z.object({
  job_id: z.string(),
  status_url: z.string(),
}).loose()

export const TokenResponseSchema: z.ZodSchema<TokenResponse> = z.object({
  access_token: z.string(),
  token_type: z.literal("bearer"),
  expires_in: z.number().int().positive(),
  refresh_token: z.string(),
}).loose()

const CapabilityStatusSchema: z.ZodSchema<CapabilityStatus> = z.enum(["supported", "not_supported", "requires_feature_flag", "requires_confirmation"])

const CapabilityOutSchema: z.ZodSchema<CapabilityOut> = z.object({
  status: CapabilityStatusSchema,
  reason: z.string().nullable(),
  targets: z.array(StatusValueSchema),
}).loose()

export const ProviderCapabilitiesOutSchema: z.ZodSchema<ProviderCapabilitiesOut> = z.object({
  provider: z.string(),
  capabilities: z.record(z.string(), CapabilityOutSchema),
}).loose() as unknown as z.ZodSchema<ProviderCapabilitiesOut>

export const CredentialProbeOutSchema: z.ZodSchema<CredentialProbeOut> = z.object({
  provider: z.string(),
  ok: z.boolean(),
  detail: z.string(),
  sample_count: z.number().int().nonnegative(),
}).loose()

export const CredentialTestOutSchema: z.ZodSchema<CredentialTestOut> = z.object({
  provider: z.string(),
  ok: z.boolean(),
  detail: z.string().nullable(),
}).loose()

const MoabitsCompanyOutSchema = z.object({
  companyCode: z.string(),
  companyName: z.string(),
  clie_id: z.number().int().nullable(),
}).loose()

export const MoabitsSourceCompanyOutSchema: z.ZodSchema<MoabitsSourceCompanyOut> = MoabitsCompanyOutSchema.extend({
  source_company_id: z.string(),
  active: z.boolean(),
  last_seen_at: DateString,
  updated_at: DateString,
  created_at: DateString,
}).loose()

export const CompanyProviderMappingOutSchema: z.ZodSchema<CompanyProviderMappingOut> = z.object({
  company_id: z.string(),
  provider: z.literal("moabits"),
  companyCode: z.string(),
  companyName: z.string().nullable(),
  clie_id: z.number().int().nullable(),
  settings: z.record(z.string(), z.unknown()),
  active: z.boolean(),
  updated_at: DateString,
  created_at: DateString,
}).loose()

export const LocalCompanyMoabitsMappingOutSchema: z.ZodSchema<LocalCompanyMoabitsMappingOut> = z.object({
  company_id: z.string(),
  company_name: z.string(),
  mapping: CompanyProviderMappingOutSchema.nullable(),
}).loose()

export const MoabitsProviderMappingDiscoveryOutSchema: z.ZodSchema<MoabitsProviderMappingDiscoveryOut> = z.object({
  cache_message: z.string(),
  source_company_codes: z.array(z.string()),
  local_companies: z.array(LocalCompanyMoabitsMappingOutSchema),
  moabits_companies: z.array(
    MoabitsCompanyOutSchema.extend({
      selected_in_source: z.boolean(),
      linked_companies: z.array(z.object({
        company_id: z.string(),
        company_name: z.string(),
      }).loose()),
    })
  ),
}).loose()
