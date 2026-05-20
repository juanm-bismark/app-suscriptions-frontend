"use server";

import { fetchApi } from "@/lib/api-client";
import { requireProfile } from "@/lib/auth/current-user";
import type { ProviderCapabilitiesOut } from "@/lib/types/api";
import type { Provider } from "@/lib/types/api/common";

export async function getProviderCapabilities(provider: Provider): Promise<ProviderCapabilitiesOut> {
  await requireProfile();
  // 10-minute revalidate: capabilities depend on the LIFECYCLE_WRITES_ENABLED
  // feature flag, so we want flips to propagate within a coffee break without
  // hitting the backend on every page render.
  return fetchApi<ProviderCapabilitiesOut>(`/providers/${provider}/capabilities`, {
    next: { revalidate: 600 },
  });
}
