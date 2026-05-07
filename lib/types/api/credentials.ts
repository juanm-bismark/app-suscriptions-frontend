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
  credentials: Record<string, unknown>;
  account_scope: Record<string, unknown>;
}

export interface CredentialTestOut {
  provider: string;
  ok: boolean;
  detail: string | null;
}

export interface MoabitsCompanyOut {
  companyCode: string; companyName: string; clie_id: number | null;
}
export interface MoabitsCompanyDiscoveryOut {
  current_company_name: string;
  selected_company_codes: string[];
  selected_companies: MoabitsCompanyOut[];
  companies: MoabitsCompanyOut[];
}
export interface MoabitsCompanySelectionIn {
  company_codes: { companyCode: string; companyName?: string; clie_id?: number | null }[];
}
