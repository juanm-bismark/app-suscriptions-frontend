export type Provider = "kite" | "tele2" | "moabits";

export type AdministrativeStatus =
  | "active" | "in_test" | "suspended"
  | "inactive_new" | "activation_pendant" | "activation_ready"
  | "terminated" | "purged" | "inventory"
  | "replaced" | "retired" | "restore"
  | "pending" | "unknown";

export type CapabilityStatus =
  | "supported" | "not_supported"
  | "requires_feature_flag" | "requires_confirmation";

export type CredentialExpiryStatus = "valid" | "expiring" | "expired" | "invalid";

export type ConnectivityState = "online" | "offline" | "unknown";

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  code: string;
  detail: string | null;
  instance: string | null;
  [extra: string]: unknown;
}
