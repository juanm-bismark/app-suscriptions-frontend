import { z } from "zod"
import type { Profile, Company, User } from "@/lib/types/user"
import type { SimListOut, UsageOut, PresenceOut, SimImportOut } from "@/lib/types/api/sims"
import type { SubscriptionOut, NormalizedSubscription } from "@/lib/types/api/sims"
import type { CredentialMetadataOut, Provider, CredentialProbeOut, CompanyProviderMappingOut, MoabitsSourceCompanyOut, LocalCompanyMoabitsMappingOut, MoabitsProviderMappingDiscoveryOut, CredentialTestOut } from "@/lib/types/api"
import type { ProviderCapabilitiesOut, CapabilityOut } from "@/lib/types/api/providers"
import type { CapabilityStatus } from "@/lib/types/api/common"
import type { TokenResponse } from "@/lib/types/api/auth"

const DateString = z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/))

const UserRoleSchema = z.enum(["admin", "manager", "member", "public"])

export const ProfileSchema: z.ZodSchema<Profile> = z.object({
  id: z.string(),
  company_id: z.string().nullable(),
  role: UserRoleSchema,
  full_name: z.string().nullable(),
  email: z.string().email().nullable(),
  created_at: DateString,
})

export const CompanySchema: z.ZodSchema<Company> = z.object({
  id: z.string(),
  name: z.string(),
  created_at: DateString,
})

export const PageSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    size: z.number().int().positive(),
    pages: z.number().int().nonnegative(),
  })

const AdministrativeStatusSchema = z.enum([
  "active",
  "in_test",
  "suspended",
  "inactive_new",
  "activation_pendant",
  "activation_ready",
  "terminated",
  "purged",
  "inventory",
  "replaced",
  "retired",
  "restore",
  "pending",
  "unknown",
])

const ProviderSchema = z.enum(["kite", "tele2", "moabits"])

const IdentitySchema = z.object({
  iccid: z.string().nullable(),
  msisdn: z.string().nullable(),
  imsi: z.string().nullable(),
  imei: z.string().nullable(),
  alias: z.string().nullable(),
  eid: z.string().nullable(),
  euiccid: z.string().nullable(),
  sim_profile_id: z.string().nullable(),
})

const StatusSchema = z.object({
  value: AdministrativeStatusSchema.nullable(),
  native: z.string().nullable(),
  last_changed_at: DateString.nullable(),
})

const PlanSchema = z.object({
  name: z.string().nullable(),
  code: z.string().nullable(),
  id: z.string().nullable(),
  communication_plan: z.string().nullable(),
  apn: z.string().nullable(),
  apns: z.array(z.string()).nullable(),
  started_at: DateString.nullable(),
  expires_at: DateString.nullable(),
})

const CustomerSchema = z.object({
  name: z.string().nullable(),
  id: z.string().nullable(),
  company_code: z.string().nullable(),
  account_id: z.string().nullable(),
})

const NetworkSchema = z.object({
  operator: z.string().nullable(),
  country: z.string().nullable(),
  rat_type: z.string().nullable(),
  last_network: z.string().nullable(),
  ip_address: z.string().nullable(),
  sgsn_ip: z.string().nullable(),
  ggsn_ip: z.string().nullable(),
  last_traffic_at: DateString.nullable(),
  first_lu_at: DateString.nullable(),
  last_lu_at: DateString.nullable(),
  first_cdr_at: DateString.nullable(),
  last_cdr_at: DateString.nullable(),
  gprs: z.string().nullable(),
  ip: z.string().nullable(),
  location: z.string().nullable(),
})

const HardwareSchema = z.object({
  sim_model: z.string().nullable(),
  module_manufacturer: z.string().nullable(),
  module_model: z.string().nullable(),
  device_id: z.string().nullable(),
  modem_id: z.string().nullable(),
  imei_last_changed_at: DateString.nullable(),
  shipped_at: DateString.nullable(),
})

const ServicesSchema = z.object({
  active: z.array(z.string()).nullable(),
  basic: z.string().nullable(),
  supplementary: z.string().nullable(),
  data_service: z.boolean().nullable(),
  sms_service: z.boolean().nullable(),
})

const UsageControlSchema = z.object({
  limit: z.number().nullable(),
  value: z.number().nullable(),
  threshold_reached: z.boolean().nullable(),
  traffic_cut: z.boolean().nullable(),
  enabled: z.boolean().nullable(),
})

const LimitsSchema = z.object({
  data: z.number().nullable(),
  data_unit: z.literal("mb").nullable(),
  sms: z.number().nullable(),
  daily: z.record(z.string(), UsageControlSchema).nullable(),
  monthly: z.record(z.string(), UsageControlSchema).nullable(),
})

const DatesSchema = z.object({
  activated_at: DateString.nullable(),
  updated_at: DateString.nullable(),
  added_at: DateString.nullable(),
  provisioned_at: DateString.nullable(),
})

const NormalizedSubscriptionSchema: z.ZodSchema<NormalizedSubscription> = z.object({
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
})

export const SubscriptionOutSchema: z.ZodSchema<SubscriptionOut> = z.object({
  iccid: z.string(),
  msisdn: z.string().nullable(),
  imsi: z.string().nullable(),
  status: AdministrativeStatusSchema,
  native_status: z.string(),
  provider: ProviderSchema,
  company_id: z.string(),
  activated_at: DateString.nullable(),
  updated_at: DateString.nullable(),
  detail_level: z.enum(["summary", "detail"]),
  provider_fields: z.record(z.string(), z.unknown()),
  normalized: NormalizedSubscriptionSchema,
})

const CredentialExpiryStatusSchema = z.enum(["valid", "expiring", "expired", "invalid"])

export const CredentialMetadataOutSchema: z.ZodSchema<CredentialMetadataOut> = z.object({
  provider: ProviderSchema,
  active: z.boolean(),
  expiry_status: CredentialExpiryStatusSchema,
  created_at: DateString,
  rotated_at: DateString.nullable(),
  account_scope: z.record(z.string(), z.unknown()),
})

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
})

const ProviderStatusSchema = z.object({
  provider: z.string(),
  status: z.enum(["ok", "partial", "error", "not_queried"]),
  count: z.number().int().nonnegative(),
  code: z.string().nullable(),
  title: z.string().nullable(),
})

export const SimListOutSchema: z.ZodSchema<SimListOut> = z.object({
  items: z.array(SubscriptionOutSchema),
  next_cursor: z.string().nullable(),
  total: z.number().int().nonnegative().nullable(),
  partial: z.boolean(),
  failed_providers: z.array(FailedProviderSchema),
  provider_statuses: z.array(ProviderStatusSchema),
})

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
  })),
})

export const PresenceOutSchema: z.ZodSchema<PresenceOut> = z.object({
  iccid: z.string(),
  state: z.enum(["online", "offline", "unknown"]),
  ip_address: z.string().nullable(),
  country_code: z.string().nullable(),
  rat_type: z.string().nullable(),
  network_name: z.string().nullable(),
  last_seen_at: DateString.nullable(),
})

export const SimImportOutSchema: z.ZodSchema<SimImportOut> = z.object({
  imported: z.number().int().nonnegative(),
})

export const TokenResponseSchema: z.ZodSchema<TokenResponse> = z.object({
  access_token: z.string(),
  token_type: z.literal("bearer"),
  expires_in: z.number().int().positive(),
  refresh_token: z.string(),
})

const CapabilityStatusSchema: z.ZodSchema<CapabilityStatus> = z.enum(["supported", "not_supported", "requires_feature_flag", "requires_confirmation"])

const CapabilityOutSchema: z.ZodSchema<CapabilityOut> = z.object({
  status: CapabilityStatusSchema,
  reason: z.string().nullable(),
  targets: z.array(AdministrativeStatusSchema),
})

export const ProviderCapabilitiesOutSchema: z.ZodSchema<ProviderCapabilitiesOut> = z.object({
  provider: z.string(),
  capabilities: z.record(z.string(), CapabilityOutSchema),
}) as any

export const CredentialProbeOutSchema: z.ZodSchema<CredentialProbeOut> = z.object({
  provider: z.string(),
  ok: z.boolean(),
  detail: z.string(),
  sample_count: z.number().int().nonnegative(),
})

export const CredentialTestOutSchema: z.ZodSchema<CredentialTestOut> = z.object({
  provider: z.string(),
  ok: z.boolean(),
  detail: z.string().nullable(),
})

const MoabitsCompanyOutSchema = z.object({
  companyCode: z.string(),
  companyName: z.string(),
  clie_id: z.number().int().nullable(),
})

export const MoabitsSourceCompanyOutSchema: z.ZodSchema<MoabitsSourceCompanyOut> = MoabitsCompanyOutSchema.extend({
  source_company_id: z.string(),
  active: z.boolean(),
  last_seen_at: DateString,
  updated_at: DateString,
  created_at: DateString,
})

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
})

export const LocalCompanyMoabitsMappingOutSchema: z.ZodSchema<LocalCompanyMoabitsMappingOut> = z.object({
  company_id: z.string(),
  company_name: z.string(),
  mapping: CompanyProviderMappingOutSchema.nullable(),
})

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
      })),
    })
  ),
})
