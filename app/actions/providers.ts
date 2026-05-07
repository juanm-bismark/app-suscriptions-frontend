"use server";

import { fetchApi } from "@/lib/api-client";
import type { ProviderCapabilitiesOut } from "@/lib/types/api";
import type { Provider } from "@/lib/types/api/common";

export async function getProviderCapabilities(provider: Provider): Promise<ProviderCapabilitiesOut> {
  return fetchApi<ProviderCapabilitiesOut>(`/providers/${provider}/capabilities`);
}
