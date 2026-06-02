import { type FieldPath } from "react-hook-form"
import { z } from "zod"
import type { CredentialUpsertIn, Provider } from "@/lib/types/api"

export const environment = {
  production: "Produccion",
  staging: "Staging",
  sandbox: "Sandbox",
} as const

export const KITE_DEFAULT_ENDPOINT =
  "https://kiteplatform-api.telefonica.com:8010/services/SOAP/GlobalM2M/Inventory/v12/r12"

export const TELE2_DEFAULT_COBRAND_URL = "restapi3.jasper.com"
export const TELE2_DEFAULT_API_VERSION = "v1"

const optionalString = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().optional()
)

const optionalNumber = z.preprocess(
  (value) =>
    value === "" ||
    value === undefined ||
    value === null ||
    (typeof value === "number" && Number.isNaN(value))
      ? undefined
      : value,
  z.coerce.number().int().min(1).max(50).optional()
)

const kiteSchema = z.object({
  credentials: z.object({
    endpoint: z.string().url("URL invalida").refine((u) => u.startsWith("https://"), "Debe ser HTTPS"),
    username: z.string().optional(),
    password: z.string().optional(),
    client_cert_pfx_b64: z.string().min(1, "Carga el certificado PFX"),
    client_cert_password: z.string().min(1, "Ingresa la clave del certificado"),
    server_ca_bundle_pem_b64: z.string().optional(),
  }).refine((v) => !!v.username === !!v.password, {
    message: "Los campos WS-Sec son opcionales, pero deben ir juntos",
    path: ["username"],
  }),
  account_scope: z.object({
    environment: z.enum(["production", "staging", "sandbox"]).default("production"),
    end_customer_id: z.string().optional(),
  }),
})

const tele2Schema = z.object({
  credentials: z.object({
    cobrand_url: optionalString,
    username: z.string().trim().min(1, "Ingresa el usuario"),
    api_key: z.string().trim().min(1, "Ingresa el API key"),
    api_version: optionalString.refine((value) => !value || value === "v1" || value === "1", {
      message: "Solo se soporta v1",
    }),
  }),
  account_scope: z.object({
    account_id: optionalString,
    max_tps: optionalNumber,
    environment: z.preprocess(
      (value) => value === "" ? undefined : value,
      z.enum(["production", "staging"]).optional()
    ),
  }),
})

const moabitsSchema = z.object({
  credentials: z.object({
    base_url: z.string().url("URL invalida").default("https://www.api.myorion.co"),
    x_api_key: z.string().min(1, "Ingresa el x-api-key"),
  }),
  account_scope: z.object({
    environment: z.enum(["production", "staging"]).default("production"),
  }),
})

const moabitsUserSchema = z.object({
  credentials: z.object({
    x_api_key: z.string().min(1, "Ingresa el x-api-key"),
  }),
  account_scope: z.record(z.string(), z.unknown()).default({}),
})

const tele2UserSchema = z.object({
  credentials: z.object({
    api_key: z.string().min(1, "Ingresa el API key"),
  }),
  account_scope: z.record(z.string(), z.unknown()).default({}),
})

const kiteUserSchema = z.object({
  credentials: z.object({
    client_cert_pfx_b64: z.string().min(1, "Carga el certificado PFX"),
    client_cert_password: z.string().min(1, "Ingresa la clave del certificado"),
  }),
  account_scope: z.record(z.string(), z.unknown()).default({}),
})

const SCHEMAS = {
  kite: kiteSchema,
  tele2: tele2Schema,
  moabits: moabitsSchema,
} as const

export function getSchema(provider: Provider, isAdmin: boolean) {
  if (!isAdmin && provider === "moabits") return moabitsUserSchema
  if (!isAdmin && provider === "tele2") return tele2UserSchema
  if (!isAdmin && provider === "kite") return kiteUserSchema
  return SCHEMAS[provider]
}

export type Field =
  | { kind: "text" | "password" | "number"; name: FieldPath<CredentialUpsertIn>; label: string; placeholder?: string; adminOnly?: boolean }
  | { kind: "select"; name: FieldPath<CredentialUpsertIn>; label: string; options: readonly (keyof typeof environment)[]; placeholder?: string; adminOnly?: boolean }
  | { kind: "file"; name: FieldPath<CredentialUpsertIn>; label: string; adminOnly?: boolean }

export const FIELDS: Record<Provider, Field[]> = {
  kite: [
    { kind: "text", name: "credentials.endpoint", label: "Endpoint SOAP (obligatorio)", placeholder: KITE_DEFAULT_ENDPOINT, adminOnly: true },
    { kind: "text", name: "credentials.username", label: "WS-Sec username (opcional)", adminOnly: true },
    { kind: "password", name: "credentials.password", label: "WS-Sec password (opcional)", adminOnly: true },
    { kind: "file", name: "credentials.client_cert_pfx_b64", label: "Certificado cliente (.pfx/.p12) (obligatorio)" },
    { kind: "password", name: "credentials.client_cert_password", label: "Clave del certificado (obligatoria)" },
    { kind: "select", name: "account_scope.environment", label: "Ambiente (production por defecto)", options: ["production", "staging", "sandbox"], adminOnly: true },
    { kind: "text", name: "account_scope.end_customer_id", label: "End customer ID (opcional)", adminOnly: true },
  ],
  tele2: [
    { kind: "text", name: "credentials.cobrand_url", label: "Cobrand URL (opcional)", placeholder: TELE2_DEFAULT_COBRAND_URL, adminOnly: true },
    { kind: "text", name: "credentials.username", label: "Usuario (obligatorio)", adminOnly: true },
    { kind: "password", name: "credentials.api_key", label: "API key (obligatorio)" },
    { kind: "text", name: "credentials.api_version", label: "API version (opcional)", placeholder: TELE2_DEFAULT_API_VERSION, adminOnly: true },
    { kind: "text", name: "account_scope.account_id", label: "Account ID (opcional)", adminOnly: true },
    { kind: "number", name: "account_scope.max_tps", label: "Max TPS (opcional)", placeholder: "1", adminOnly: true },
    { kind: "select", name: "account_scope.environment", label: "Ambiente (opcional)", options: ["production", "staging"], placeholder: "Sin metadata", adminOnly: true },
  ],
  moabits: [
    { kind: "text", name: "credentials.base_url", label: "Base URL", adminOnly: true },
    { kind: "password", name: "credentials.x_api_key", label: "x-api-key" },
    { kind: "select", name: "account_scope.environment", label: "Ambiente", options: ["production", "staging"], adminOnly: true },
  ],
}

const USER_CREDENTIAL_KEYS: Record<Provider, readonly string[]> = {
  kite: ["endpoint", "client_cert_pfx_b64", "client_cert_password"],
  tele2: ["api_key"],
  moabits: ["x_api_key"],
}

export function fieldsForProvider(provider: Provider, isAdmin: boolean) {
  return FIELDS[provider].filter((field) => isAdmin || !field.adminOnly)
}

export function userCredentialPayload(provider: Provider, credentials: Record<string, unknown>) {
  return Object.fromEntries(
    USER_CREDENTIAL_KEYS[provider].map((key) => [key, credentials[key]])
  )
}

export function getPath(source: unknown, path: string) {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (!acc || typeof acc !== "object") return undefined
    return (acc as Record<string, unknown>)[part]
  }, source)
}

export async function fileToBase64(file: File) {
  const buffer = await file.arrayBuffer()
  let binary = ""
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < bytes.byteLength; i += 1) binary += String.fromCharCode(bytes[i])
  return window.btoa(binary)
}
