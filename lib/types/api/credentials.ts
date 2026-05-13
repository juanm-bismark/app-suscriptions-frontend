import type { CredentialExpiryStatus } from "./common";

export interface CredentialMetadataOut {
  provider: string;
  active: boolean;
  rotated_at: string | null;
  created_at: string;
  account_scope: Record<string, unknown>;
  expiry_status: CredentialExpiryStatus;
}

export interface CredentialUpsertIn {
  credentials?: Record<string, unknown>;
  account_scope?: Record<string, unknown> | null;
}

export interface CredentialTestOut {
  provider: string;
  ok: boolean;
  detail: string | null;
}

export interface MoabitsCompanyOut {
  companyCode: string;
  companyName: string;
  clie_id: number | null;
}
export interface MoabitsSourceCompanyOut extends MoabitsCompanyOut {
  source_company_id: string;
  active: boolean;
  last_seen_at: string;
  updated_at: string;
  created_at: string;
}
export interface CompanyProviderMappingOut {
  company_id: string;
  provider: "moabits";
  companyCode: string;
  companyName: string | null;
  clie_id: number | null;
  settings: Record<string, unknown>;
  active: boolean;
  updated_at: string;
  created_at: string;
}
export interface CompanyProviderMappingIn {
  companyCode: string;
  companyName?: string | null;
  clie_id?: number | null;
  settings?: Record<string, unknown>;
}
export interface MoabitsLinkedCompanyOut {
  company_id: string;
  company_name: string;
}
export interface MoabitsCompanyWithLinksOut extends MoabitsCompanyOut {
  selected_in_source: boolean;
  linked_companies: MoabitsLinkedCompanyOut[];
}
export interface LocalCompanyMoabitsMappingOut {
  company_id: string;
  company_name: string;
  mapping: CompanyProviderMappingOut | null;
}
export interface MoabitsProviderMappingDiscoveryOut {
  cache_message: string;
  source_company_codes: string[];
  local_companies: LocalCompanyMoabitsMappingOut[];
  moabits_companies: MoabitsCompanyWithLinksOut[];
}
