import type { CredentialMetadataOut, CredentialUpsertIn, Provider } from "@/lib/types/api"
import { KITE_DEFAULT_ENDPOINT } from "./form/config"


export function credentialDefaults(provider: Provider, credential?: CredentialMetadataOut | null): CredentialUpsertIn {
  const scope = credential?.account_scope ?? {}

  if (provider === "kite") {
    return {
      credentials: {
        endpoint: KITE_DEFAULT_ENDPOINT,
        username: "",
        password: "",
        client_cert_pfx_b64: "",
        client_cert_password: "",
        server_ca_bundle_pem_b64: "",
      },
      account_scope: {
        environment: scope.environment ?? "production",
        end_customer_id: scope.end_customer_id ?? "",
      },
    }
  }

  if (provider === "tele2") {
    return {
      credentials: {
        cobrand_url: "restapi3.jasper.com",
        username: "",
        api_key: "",
      },
      account_scope: {
        account_id: scope.account_id ?? "",
        max_tps: scope.max_tps ?? 5,
        environment: scope.environment ?? "production",
      },
    }
  }

  return {
    credentials: {
      base_url: String(scope.base_url ?? "https://www.api.myorion.co"),
      x_api_key: "",
    },
    account_scope: {
      environment: scope.environment ?? "production",
    },
  }
}

export function pruneEmptyStrings(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(pruneEmptyStrings)
  if (!value || typeof value !== "object") return value

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => item !== "")
      .map(([key, item]) => [key, pruneEmptyStrings(item)])
  )
}
