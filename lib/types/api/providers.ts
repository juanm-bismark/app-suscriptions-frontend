import type { CapabilityStatus, SimStatus } from "./common";

export interface CapabilityOut {
  status: CapabilityStatus;
  reason: string | null;
  targets: SimStatus[];
}
export interface ProviderCapabilitiesOut {
  provider: string;
  capabilities: Record<
    | "list_subscriptions" | "get_subscription" | "get_usage" | "get_presence"
    | "set_administrative_status" | "purge" | "status_history" | "sms_history"
    | "location" | "aggregated_usage" | "plan_catalog" | "quota_management",
    CapabilityOut
  >;
}
