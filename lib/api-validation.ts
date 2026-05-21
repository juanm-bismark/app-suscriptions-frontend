import { z } from "zod"
import type { Profile, Company, User } from "@/lib/types/user"
import type { SubscriptionOut, NormalizedSubscription } from "@/lib/types/api/sims"
import type { CredentialMetadataOut, Provider } from "@/lib/types/api"

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
  account_scope: z.record(z.string(), z.string()),
})

export const ProblemDetailsSchema = z.object({
  type: z.string().optional(),
  title: z.string(),
  status: z.number().int(),
  code: z.string().optional(),
  detail: z.string().nullable().optional(),
  instance: z.string().nullable().optional(),
}).catchall(z.unknown())
