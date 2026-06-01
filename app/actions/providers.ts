"use server";

import { fetchApi } from "@/lib/api-client";
import { CredentialMetadataOutSchema, ProviderCapabilitiesOutSchema } from "@/lib/api-validation";
import { requireCompanyUser, requireProfile } from "@/lib/auth/current-user";
import type { ProviderCapabilitiesOut } from "@/lib/types/api";
import type { Provider } from "@/lib/types/api/common";
import { ROLES } from "@/lib/types/user";
import { isProvider, PROVIDER_IDS } from "@/lib/provider-meta";

export type ActiveCredentialProviders = Provider[] | null;

export async function getProviderCapabilities(provider: Provider): Promise<ProviderCapabilitiesOut> {
  await requireProfile();
  // 10-minute revalidate: status-write capabilities depend on a backend feature
  // flag, so flips should propagate without hitting the backend on every render.
  return fetchApi(`/providers/${provider}/capabilities`, {
    schema: ProviderCapabilitiesOutSchema,
    next: { revalidate: 600 },
  });
}

export async function listActiveCredentialProviders(): Promise<ActiveCredentialProviders> {
  const profile = await requireCompanyUser();

  if (profile.role !== ROLES.ADMIN && profile.role !== ROLES.MANAGER) {
    return null;
  }
  if (!profile.company_id) return null;

  const credentials = await fetchApi("/companies/me/credentials", {
    schema: CredentialMetadataOutSchema.array(),
    cache: "no-store",
  });
  const active = new Set(
    credentials
      .filter((credential) => credential.active && isProvider(credential.provider))
      .map((credential) => credential.provider as Provider)
  );

  return PROVIDER_IDS.filter((provider) => active.has(provider));
}
