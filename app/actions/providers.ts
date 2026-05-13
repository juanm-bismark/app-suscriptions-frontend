"use server";

import { fetchApi } from "@/lib/api-client";
import { requireProfile } from "@/lib/auth/current-user";
import type { ProviderCapabilitiesOut } from "@/lib/types/api";
import type { Provider } from "@/lib/types/api/common";

export async function getProviderCapabilities(provider: Provider): Promise<ProviderCapabilitiesOut> {
  await requireProfile();
  return fetchApi<ProviderCapabilitiesOut>(`/providers/${provider}/capabilities`, {
    next: { revalidate: 3600 },
  });
}
