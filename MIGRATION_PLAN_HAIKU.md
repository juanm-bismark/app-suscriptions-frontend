# Frontend Migration Plan — Wire to Real Backend (Haiku-friendly)

> **Audience**: Claude Haiku 4.5 executing changes step-by-step in this repo.
> **Source of truth**: `/Users/juanjosemorales/Documents/app suscripciones/back/docs/FRONTEND_BACKEND_CONTRACT.md`.
>   Read it before starting any batch.
> **Working directory**: `/Users/juanjosemorales/Documents/app suscripciones/frontend`.
> **Goal**: replace all mock data and stub auth in this Next.js app with the real `Subscriptions API` (`/v1/...`), and align UI attributes with the backend's normalized SIM model.
>
> **Operating rules for Haiku**
> 1. Execute **one batch at a time**. Stop after each batch's validation gate. Do not start the next batch until typecheck/build passes.
> 2. Never invent backend fields. If a UI field cannot be sourced from the contract, either (a) drop it, (b) compute it deterministically from existing fields, or (c) mark with `// MOCK:` and leave a TODO. The list of what is mock vs real is in [§ Mock fields to drop](#mock-fields-to-drop).
> 3. Names must match the contract exactly (snake_case as returned by FastAPI). Wire types are in `lib/types/api/*`. UI types may stay camelCase but **must** be derived through a documented mapper in `lib/api/*`.
> 4. Use `fetchApi` from `lib/api-client.ts` for all backend calls. Don't introduce a second HTTP layer.
> 5. Do not touch `back/`. Do not touch `node_modules`. Do not change `package.json` unless a batch says so.
> 6. After every file edit, run the validation block at the end of that batch before moving on.
>
> **Status legend**: `[ ]` not started · `[~]` in progress · `[x]` done.

---

## Table of contents

- [MCP usage (project-scoped)](#mcp-usage-project-scoped)
- [Pre-flight checks](#pre-flight-checks)
- [Mock fields to drop](#mock-fields-to-drop)
- [Final wire shapes the frontend will use](#final-wire-shapes-the-frontend-will-use)
- [Batch 1 — types + api-client + error handling](#batch-1--types--api-client--error-handling)
- [Batch 2 — auth (signup/login/refresh/logout)](#batch-2--auth-signuploginrefreshlogout)
- [Batch 3 — sims server actions + mappers](#batch-3--sims-server-actions--mappers)
- [Batch 4 — subscriptions table refactor (the headline change)](#batch-4--subscriptions-table-refactor-the-headline-change)
- [Batch 5 — subscription detail page (tabs)](#batch-5--subscription-detail-page-tabs)
- [Batch 6 — credentials management UI](#batch-6--credentials-management-ui)
- [Batch 7 — provider capabilities + lifecycle write actions](#batch-7--provider-capabilities--lifecycle-write-actions)
- [Batch 8 — SIM import + global vs provider-scoped listing](#batch-8--sim-import--global-vs-provider-scoped-listing)
- [Batch 9 — cleanup, error states, polish](#batch-9--cleanup-error-states-polish)
- [Done criteria](#done-criteria)

---

## MCP usage (project-scoped)

This repo's [.mcp.json](.mcp.json) registers two project-scoped MCP servers
that Haiku **must use** instead of hand-writing equivalents:

- **`shadcn`** (`npx shadcn@latest mcp`) — installs/scaffolds shadcn/ui
  components into [components/ui/](components/ui/). Use it for every new
  primitive listed below before writing JSX.
- **`tailwindcss`** (`npx -y tailwindcss-mcp-server`) — Tailwind v4 token /
  class introspection. Use it whenever a new screen needs to compose utility
  classes; do not guess at v4 class names.

> **Project's Tailwind version is v4** ([package.json](package.json) →
> `"tailwindcss": "^4"`, `"@tailwindcss/postcss": "^4"`). Some v3 utility
> names (`bg-opacity-*`, `divide-opacity-*`, `flex-grow`, etc.) are renamed
> in v4 — verify with the `tailwindcss` MCP before using them.

### What is already in `components/ui/`

Already present (re-use, don't re-add): `button`, `input`, `label`, `form`,
`dialog`, `dropdown-menu`. See [components/ui/index.ts](components/ui/index.ts).

### shadcn components to add per batch

Run the shadcn MCP add tool **once per primitive** (or batch them in a single
call when the MCP supports it). After install, re-export each new primitive
from `components/ui/index.ts` so the rest of the codebase imports them via
`@/components/ui`.

| Batch | Component(s) to add | Used in |
|---|---|---|
| 4 | `badge`, `skeleton`, `alert`, `tabs` | status pill polish, list `loading.tsx`, `error.tsx`, source-tabs replacement (optional) |
| 5 | `tooltip`, `card`, `separator`, `progress`, `tabs` (if not added in B4) | detail-page hero, capability "reason" tooltips, usage progress bars |
| 6 | `select`, `checkbox`, `radio-group`, `switch`, `textarea`, `sonner` (toast), `table`, `alert-dialog` | credential forms, Moabits picker, success/error toasts, list table, destructive confirms |
| 7 | `alert-dialog`, `tooltip`, `sonner` (re-use from B6) | "Type the ICCID to confirm" purge modal, capability tooltips, toast on lifecycle write |
| 8 | `progress` (re-use), `alert` (re-use) | CSV import progress + result alert |

> **Do not** install: `command` (we use `cmdk` directly), `popover` unless a
> form needs it, or any chart component (charts in this app are bespoke SVG —
> see `subscription-page.tsx` `FocalHero`).

### How to invoke the shadcn MCP

The MCP exposes resources/tools via the `mcp__shadcn__*` namespace at runtime
(use `ToolSearch` with `+shadcn` to load schemas if not pre-listed). Typical
flow per component:

1. Search the registry (e.g. for `badge`).
2. Call the `add` / `install` tool with the canonical name.
3. Inspect the new file under `components/ui/<name>.tsx` and add the export
   to [components/ui/index.ts](components/ui/index.ts).
4. Run `npm run typecheck` — fix any v4-class fallout flagged by the
   tailwindcss MCP.

If the MCP is not reachable in the current session (server failed to start),
**stop and ask** rather than installing the component manually with `npx
shadcn add`. Project-pinned MCP versions matter for Tailwind v4 compatibility.

### How to use the tailwindcss MCP

Whenever a new screen (Batches 6 and 8) introduces utility classes:

1. Ask the MCP to validate the class list against the v4 token set.
2. For colors, prefer the existing design tokens in
   [tailwind.config.ts](tailwind.config.ts) (`bg-page`, `bg-card`, `text-title`,
   etc.) over raw hex utilities, so the credentials and SIM-import screens
   match the dashboard's existing theme.

The subscriptions list/detail UI uses **inline styles** via the `T` token map
in [app/dashboard/subscriptions/tokens.ts](app/dashboard/subscriptions/tokens.ts).
Keep that pattern for Batches 4–5; only the new credentials and import screens
should be shadcn + Tailwind utility classes.

---

## Pre-flight checks

Before starting Batch 1, run from the frontend directory:

```bash
npm install --no-audit --no-fund
npm run typecheck
npm run build
```

Both `typecheck` and `build` must pass on a clean tree before any change. If
they fail, fix only the failing items (do not refactor).

Confirm `.env` / `.env.local` define:

- `NEXT_PUBLIC_API_URL` → e.g. `http://localhost:8000`
- `AUTH_SECRET` (NextAuth)
- `API_URL` (server-side override, optional)

If missing, **stop and ask**. Do not invent values.

---

## Mock fields to drop

The current mock `SubscriptionRecord` has fields that **do not exist** in the
backend's `SubscriptionOut` (see contract § 4.1). Keep this list handy — every
batch references it.

| Mock field | Backend equivalent | Action |
|---|---|---|
| `id` | `iccid` | Rename to `iccid` everywhere; UI keeps mono styling. |
| `customer` | `normalized.customer.name` (string \| null) | Keep label "Cliente"; show "—" when null. |
| `customerEmail` | **none** | **Drop** the column and the email subline. |
| `plan` | `normalized.plan.name` | Rename. May be null → render "—". |
| `status` | `status` | Already canonical, but full enum is 14 values not 6 (see § 7.1 of contract). |
| `nativeStatus` | `native_status` | Field rename only. |
| `parent` | `normalized.customer.company_code` \|\| `normalized.customer.account_id` \|\| `null` | Rename to `customerScope`. |
| `usage` | NOT in `SubscriptionOut`; lives in `/sims/{iccid}/usage` (`UsageOut`) | **Lazy-fetch on row hover/expand**. Remove from list payload. |
| `amount`, `currency` | **none** (backend v1 has no billing) | **Drop**. |
| `cycle` | **none** | **Drop**. |
| `nextRenewal` | **none** | **Drop** (or keep behind a `// MOCK:` flag for design preview only). |
| `createdAt` | `activated_at` | Rename. May be null. |
| `specific` | `provider_fields` | Rename; render via existing `prettyKey`/`formatVal`. |

Source identifiers:

- Mock `SourceId = "kite" | "tele2" | "moabits"` already matches backend
  `Provider` enum 1:1. Keep `tokens.ts` `SOURCES` map.
- Mock `StatusId = "active" | "paused" | "overdue" | "canceled" | "pending" | "trial"` does
  **not** match backend. Replace with the 14-value canonical enum (see Batch 1).

---

## Final wire shapes the frontend will use

These go into `lib/types/api/`. Copy them exactly — they mirror the contract.

```ts
// lib/types/api/common.ts
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
```

```ts
// lib/types/api/sims.ts
import type { AdministrativeStatus, Provider } from "./common";

export interface SubscriptionOut {
  iccid: string;
  msisdn: string | null;
  imsi: string | null;
  status: AdministrativeStatus;
  native_status: string;
  provider: Provider;
  company_id: string;
  activated_at: string | null;
  updated_at: string | null;
  detail_level: "summary" | "detail";
  provider_fields: Record<string, unknown>;
  normalized: NormalizedSubscription;
}

export interface NormalizedSubscription {
  identity: { iccid: string | null; msisdn: string | null; imsi: string | null;
    imei: string | null; alias: string | null; eid: string | null; euiccid: string | null;
    sim_profile_id: string | null };
  status:   { value: AdministrativeStatus | null; native: string | null;
    last_changed_at: string | null };
  plan:     { name: string | null; code: string | null; id: string | null;
    communication_plan: string | null; apn: string | null; apns: string[] | null;
    started_at: string | null; expires_at: string | null };
  customer: { name: string | null; id: string | null;
    company_code: string | null; account_id: string | null };
  network:  { operator: string | null; country: string | null; rat_type: string | null;
    last_network: string | null; ip_address: string | null;
    sgsn_ip: string | null; ggsn_ip: string | null;
    last_traffic_at: string | null; first_lu_at: string | null;
    last_lu_at: string | null; first_cdr_at: string | null; last_cdr_at: string | null;
    gprs: string | null; ip: string | null; location: string | null };
  hardware: { sim_model: string | null; module_manufacturer: string | null;
    module_model: string | null; device_id: string | null; modem_id: string | null;
    imei_last_changed_at: string | null; shipped_at: string | null };
  services: { active: string[] | null; basic: string | null; supplementary: string | null;
    data_service: boolean | null; sms_service: boolean | null };
  limits:   { data: number | null; data_unit: "mb" | null; sms: number | null;
    daily: Record<string, UsageControl> | null;
    monthly: Record<string, UsageControl> | null };
  dates:    { activated_at: string | null; updated_at: string | null;
    added_at: string | null; provisioned_at: string | null };
  custom_fields: Record<string, unknown>;
}

export interface UsageControl {
  limit: number | null;
  value: number | null;
  threshold_reached: boolean | null;
  traffic_cut: boolean | null;
  enabled: boolean | null;
}

export interface SimListOut {
  items: SubscriptionOut[];
  next_cursor: string | null;
  total: number | null;
  partial: boolean;
  failed_providers: { provider: string; code: string; title: string }[];
}

export interface UsageOut {
  iccid: string;
  period_start: string;
  period_end: string;
  data_used_bytes: string;     // Decimal serialized as string
  sms_count: number;
  voice_seconds: number;
  provider_metrics: Record<string, unknown>;
  usage_metrics: { metric_type: string; usage: string; unit: string | null }[];
}

export interface PresenceOut {
  iccid: string;
  state: "online" | "offline" | "unknown";
  ip_address: string | null;
  country_code: string | null;
  rat_type: string | null;
  network_name: string | null;
  last_seen_at: string | null;
}

export interface StatusChangeIn {
  target: AdministrativeStatus;
  data_service?: boolean | null;
  sms_service?: boolean | null;
}

export interface SimImportIn { sims: { iccid: string; provider: Provider }[]; }
export interface SimImportOut { imported: number; }
```

```ts
// lib/types/api/auth.ts
export interface TokenResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number;       // seconds
  refresh_token: string;
}
```

```ts
// lib/types/api/credentials.ts
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
```

```ts
// lib/types/api/providers.ts
import type { CapabilityStatus, AdministrativeStatus } from "./common";

export interface CapabilityOut {
  status: CapabilityStatus;
  reason: string | null;
  targets: AdministrativeStatus[];
}
export interface ProviderCapabilitiesOut {
  provider: string;
  capabilities: Record<
    | "list_subscriptions" | "get_subscription" | "get_usage" | "get_presence"
    | "set_administrative_status" | "purge" | "status_history"
    | "aggregated_usage" | "plan_catalog" | "quota_management",
    CapabilityOut
  >;
}
```

---

## Batch 1 — types + api-client + error handling

**Goal**: introduce the wire types, harden the API client, route `/v1`
correctly, and parse RFC 7807 responses.

### Files to create

- `lib/types/api/common.ts` — paste the snippet above.
- `lib/types/api/sims.ts` — paste the snippet above.
- `lib/types/api/auth.ts` — paste the snippet above.
- `lib/types/api/credentials.ts` — paste the snippet above.
- `lib/types/api/providers.ts` — paste the snippet above.
- `lib/types/api/index.ts` — re-export everything from above.

### Files to edit

- `lib/api-client.ts`
  1. Force the **`/v1` prefix** for every business call. Add a tiny helper
     `withV1(path: string)` that returns `path` as-is when it starts with
     `/health`, `/ready`, or `/v1/`; otherwise prepends `/v1`.
  2. Capture `X-Request-ID` from the response (return it from the helper, or
     attach to the error). For now, just preserve it on the thrown `ApiError`.
  3. Parse RFC 7807 errors:
     ```ts
     if (!response.ok) {
       const body = await response.json().catch(() => null);
       const isProblem =
         response.headers.get("content-type")?.includes("application/problem+json") ?? false;
       throw new ApiError(response.status, isProblem ? body : { detail: body?.detail });
     }
     ```
  4. Update `ApiError` to carry `code`, `title`, `detail`, `instance`, `extra`,
     plus `raw` (the parsed body). Keep `status`, keep `message` for back-compat
     (assign from `body.title || body.detail || ...`).
  5. Also **forward `Idempotency-Key`** header if `options.headers` includes one
     (do not strip).

- `lib/types/user.ts`
  1. Update `Profile` to match `ProfileOut`:
     ```ts
     export interface Profile {
       id: string;
       company_id: string | null;
       role: UserRole;
       full_name: string | null;
       created_at: string;
     }
     ```
  2. Add `"public"` to `ROLES` and `UserRole`.
  3. `Company` keeps `id`, `name`, plus `created_at: string`. Drop the
     undocumented `subscription_status`.
  4. Add `CompanySettings { company_id: string; settings: Record<string, unknown>; updated_at: string }`.

### Validation gate (Batch 1)

```bash
npm run typecheck   # must pass
npm run build       # must pass
```

If `lib/auth/current-user.ts`, `app/dashboard/layout.tsx`, or any consumer
breaks because `email` is gone from `Profile`, fix the consumer to read the
email from the NextAuth session (`session.user.email`) — **the backend never
returns email in `ProfileOut`**.

---

## Batch 2 — auth (signup / login / refresh / logout)

**Goal**: replace the dev-token fallback with real backend tokens, support
refresh-token rotation, and align the signup form to backend rules.

### `auth.ts` (root)

- Replace the `Credentials.authorize` body so it:
  1. POSTs `{ email, password }` to `${API_URL}/v1/auth/login`.
  2. On non-2xx → return `null` (no dev fallback).
  3. On 2xx, **parse `TokenResponse`** (`access_token`, `expires_in`, `refresh_token`).
  4. Decode the JWT only to read `sub`, then fetch `${API_URL}/v1/me` with
     `Authorization: Bearer <access_token>` to get `id`, `full_name`,
     `company_id`, `role`. Return:
     ```ts
     return {
       id: profile.id,
       email: parsed.data.email,
       name: profile.full_name ?? undefined,
       accessToken: data.access_token,
       refreshToken: data.refresh_token,
       accessTokenExpiresAt: Date.now() + data.expires_in * 1000,
       role: profile.role,
       companyId: profile.company_id,
     };
     ```
- Extend the NextAuth `User`/`Session`/`JWT` declarations with `refreshToken`,
  `accessTokenExpiresAt`, `role`, `companyId`.
- In the `jwt` callback:
  - On first sign-in: persist the four new fields.
  - On subsequent calls: if `Date.now() > token.accessTokenExpiresAt - 60_000`,
    POST `${API_URL}/v1/auth/refresh` with `{ refresh_token }`. On success,
    overwrite token fields with the new pair (NextAuth must store the new
    `refresh_token`, since it rotates). On failure, return a token object
    flagged with `error: "RefreshAccessTokenError"`.
- In the `session` callback: surface `role`, `companyId`, and propagate the
  `error` flag so callers can redirect to `/login`.

### `app/actions/auth.ts`

- Schema:
  ```ts
  const registerSchema = z.object({
    email: z.string().email("Correo inválido"),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    full_name: z.string().min(2, "Nombre requerido").optional(),
    company_name: z.string().min(1, "Empresa requerida"),
  });
  ```
  Drop the legacy `name` field.
- POST to `${API_URL}/v1/auth/signup` (note `/v1`). Expect `TokenResponse` back.
- On 409 (`Email already exists` / `Company name already exists`) return a
  user-friendly message keyed off the response body's `detail`.
- After a successful signup, **do not auto-login on the server**. Return
  `{ success: true }` and let the page call `signIn("credentials", ...)`.

Add a new server action `app/actions/auth-logout.ts`:

- Reads `session.user.refreshToken` from the JWT (via `auth()`).
- POSTs to `/v1/auth/logout` with `{ refresh_token }` (never throw if 401/404).
- Then calls NextAuth `signOut`.

### `app/components/sign-out-button.tsx`

- Replace direct `signOut()` call with the new `logoutAction` server action so
  the backend refresh token is revoked.

### `app/login/page.tsx`, `app/register/page.tsx`

Read both files first, then make minimal changes:

- Login form: keep the email/password fields. On error from `signIn`, show the
  RFC 7807 `detail` if surfaced through `result?.error` (otherwise generic
  "Credenciales inválidas").
- Register form: the form fields must be exactly
  `email`, `password`, `full_name` (optional), `company_name`. Remove any other
  fields. On success, redirect to `/login` with a `?registered=1` param.

### Validation gate (Batch 2)

```bash
npm run typecheck
npm run build
# manual: with backend up at NEXT_PUBLIC_API_URL,
#         signup → login → /me reads role/company_id,
#         after 60+ minutes of activity refresh runs without re-prompting,
#         logout revokes refresh on the backend.
```

---

## Batch 3 — sims server actions + mappers

**Goal**: introduce a single source of truth for fetching SIMs and a UI-shaped
mapper. Keep the table mock for now — the table swap happens in Batch 4.

### Files to create

- `lib/api/sims.ts` (server-only):
  ```ts
  "use server";
  import { fetchApi } from "@/lib/api-client";
  import type {
    PresenceOut, SimImportIn, SimImportOut, SimListOut,
    StatusChangeIn, SubscriptionOut, UsageOut,
  } from "@/lib/types/api";
  import type { Provider, AdministrativeStatus } from "@/lib/types/api/common";

  export interface ListSimsParams {
    cursor?: string | null;
    limit?: number;
    provider?: Provider;
    status?: AdministrativeStatus;
    modified_since?: string;        // yyyy-MM-ddTHH:mm:ssZ
    modified_till?: string;
    iccid?: string;
    imsi?: string;
    msisdn?: string;
    custom?: string[];              // ["key=value", ...]
  }

  export async function listSims(p: ListSimsParams = {}): Promise<SimListOut> {
    const qs = new URLSearchParams();
    if (p.cursor) qs.set("cursor", p.cursor);
    if (p.limit) qs.set("limit", String(p.limit));
    if (p.provider) qs.set("provider", p.provider);
    if (p.status) qs.set("status", p.status);
    if (p.modified_since) qs.set("modified_since", p.modified_since);
    if (p.modified_till) qs.set("modified_till", p.modified_till);
    if (p.iccid) qs.set("iccid", p.iccid);
    if (p.imsi) qs.set("imsi", p.imsi);
    if (p.msisdn) qs.set("msisdn", p.msisdn);
    for (const c of p.custom ?? []) qs.append("custom", c);
    const q = qs.toString();
    return fetchApi<SimListOut>(`/sims${q ? `?${q}` : ""}`);
  }

  export const getSim     = (iccid: string) => fetchApi<SubscriptionOut>(`/sims/${encodeURIComponent(iccid)}`);
  export const getUsage   = (iccid: string, qs?: string) => fetchApi<UsageOut>(`/sims/${encodeURIComponent(iccid)}/usage${qs ? `?${qs}` : ""}`);
  export const getPresence = (iccid: string) => fetchApi<PresenceOut>(`/sims/${encodeURIComponent(iccid)}/presence`);

  export async function setSimStatus(iccid: string, body: StatusChangeIn, idempotencyKey: string) {
    return fetchApi<void>(`/sims/${encodeURIComponent(iccid)}/status`, {
      method: "PUT",
      body: JSON.stringify(body),
      headers: { "Idempotency-Key": idempotencyKey },
    });
  }
  export async function purgeSim(iccid: string, idempotencyKey: string) {
    return fetchApi<void>(`/sims/${encodeURIComponent(iccid)}/purge`, {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
    });
  }
  export async function importSims(body: SimImportIn) {
    return fetchApi<SimImportOut>(`/sims/import`, { method: "POST", body: JSON.stringify(body) });
  }
  ```

- `lib/api/idempotency.ts`:
  ```ts
  export const newIdempotencyKey = () => crypto.randomUUID();
  ```

- `lib/api/sim-mapper.ts` — pure function that maps `SubscriptionOut` →
  the **new** `SubscriptionRow` type used by the table. Keep this as the only
  place that knows about backend field shapes.
  ```ts
  import type { SubscriptionOut } from "@/lib/types/api";
  import type { AdministrativeStatus, Provider } from "@/lib/types/api/common";

  export interface SubscriptionRow {
    iccid: string;
    provider: Provider;
    msisdn: string | null;
    imsi: string | null;
    status: AdministrativeStatus;
    nativeStatus: string;
    customerName: string | null;
    customerScope: string | null;       // company_code || account_id || null
    planName: string | null;
    planCode: string | null;
    activatedAt: string | null;
    updatedAt: string | null;
    detailLevel: "summary" | "detail";
  }

  export function toRow(s: SubscriptionOut): SubscriptionRow {
    const n = s.normalized;
    return {
      iccid: s.iccid,
      provider: s.provider,
      msisdn: s.msisdn ?? n.identity.msisdn,
      imsi:   s.imsi   ?? n.identity.imsi,
      status: s.status,
      nativeStatus: s.native_status,
      customerName: n.customer.name,
      customerScope: n.customer.company_code ?? n.customer.account_id ?? null,
      planName: n.plan.name,
      planCode: n.plan.code,
      activatedAt: s.activated_at ?? n.dates.activated_at,
      updatedAt: s.updated_at ?? n.dates.updated_at,
      detailLevel: s.detail_level,
    };
  }
  ```

### Validation gate (Batch 3)

```bash
npm run typecheck
# Smoke test in a server component scratch (or temporary Suspense child):
#   const data = await listSims({ provider: "tele2", limit: 5, modified_since: "<recent>" });
#   console.log(data.items.map(toRow));
# Then DELETE the scratch before moving on.
```

---

## Batch 4 — subscriptions table refactor (the headline change)

**Goal**: replace the entire mock pipeline in
`app/dashboard/subscriptions/*` with backend-driven data and the new column
set.

### Step 4.1 — Update `tokens.ts`

Replace `StatusId` and `STATUS_META` with the canonical 14 values.
Mapping reuses the existing palette where it makes semantic sense:

```ts
export type StatusId =
  | "active" | "in_test" | "suspended"
  | "inactive_new" | "activation_pendant" | "activation_ready"
  | "terminated" | "purged" | "inventory"
  | "replaced" | "retired" | "restore"
  | "pending" | "unknown";

export const STATUS_META: Record<StatusId, StatusMeta> = {
  active:             { label: "Activa",          color: "#2D8A6F", bg: "#D7ECE4", dot: "#2D8A6F" },
  in_test:            { label: "En prueba",       color: "#7B4FE0", bg: "#E9DFFB", dot: "#7B4FE0" },
  suspended:          { label: "Suspendida",      color: "#C58A1E", bg: "#FBEFD4", dot: "#E0A93F" },
  inactive_new:       { label: "Inactiva (nueva)",color: "#326472", bg: "#D7E7EC", dot: "#33A6B2" },
  activation_pendant: { label: "Pendiente activ.",color: "#326472", bg: "#D7E7EC", dot: "#33A6B2" },
  activation_ready:   { label: "Lista p/ activar",color: "#326472", bg: "#D7E7EC", dot: "#33A6B2" },
  terminated:         { label: "Terminada",       color: "#6B7480", bg: "#E5E8EC", dot: "#8B93A0" },
  purged:             { label: "Purgada",         color: "#C85A4A", bg: "#FADDD6", dot: "#D86550" },
  inventory:          { label: "Inventario",      color: "#6B7480", bg: "#E5E8EC", dot: "#8B93A0" },
  replaced:           { label: "Reemplazada",     color: "#6B7480", bg: "#E5E8EC", dot: "#8B93A0" },
  retired:            { label: "Retirada",        color: "#6B7480", bg: "#E5E8EC", dot: "#8B93A0" },
  restore:            { label: "Restauración",    color: "#326472", bg: "#D7E7EC", dot: "#33A6B2" },
  pending:            { label: "Pendiente",       color: "#326472", bg: "#D7E7EC", dot: "#33A6B2" },
  unknown:            { label: "Desconocida",     color: "#6B7480", bg: "#E5E8EC", dot: "#8B93A0" },
};
```

### Step 4.2 — Replace `data.ts`

`data.ts` becomes a **pure helpers module** (formatters + `prettyKey`,
`formatVal`, `looksMono`, `NOW_REFERENCE`). Delete:

- `DATA: SubscriptionRecord[]`
- `SubscriptionRecord` type (replaced by `SubscriptionRow` from `lib/api/sim-mapper.ts`)
- `findRecord`
- `fmtCOP`, `cycle`, `nextRenewal` references in helpers
- `KEY_LABELS` keeps its current entries plus add: `iccid`, `msisdn`, `imsi`,
  `imei`, `eid`, `euiccid`, `apn`, `ip_address`, `country`, `operator`,
  `rat_type`, `last_traffic_at`, `last_lu_at`, `last_cdr_at`, `device_id`,
  `modem_id`, `sim_model`, `data_limit_mb`, `sms_limit`. Reuse Spanish labels
  ("ICCID", "MSISDN", "IMSI", "IMEI", "EID", "eUICCID", "APN", "Dirección IP",
  "País", "Operador", "Tipo de red", "Último tráfico", "Última actualización LU",
  "Último CDR", "ID dispositivo", "ID módem", "Modelo SIM",
  "Límite datos (MB)", "Límite SMS").

### Step 4.3 — Convert `subscriptions-client.tsx` to a server-driven page

Two-component split:

- `app/dashboard/subscriptions/page.tsx` becomes a **server component** that:
  1. Reads search params (`provider`, `status`, `cursor`, `q`).
  2. Calls `listSims(...)` with provider scope when set, otherwise calls the
     global path.
  3. Maps `items` through `toRow`.
  4. Renders `<SubscriptionsClient initialRows={...} pagination={...} filters={...} />`
     wrapped in `<Suspense>`.
- `subscriptions-client.tsx` keeps the chrome (search, tabs, drawer, table)
  but takes data via props. Internal client-side filtering stays for UX
  responsiveness; all server-truth filters mirror to the URL via
  `router.replace` so refresh keeps state.

**New table columns** (replace `GRID_COLS` and the header row):

| Col | Source | Width | Notes |
|---|---|---|---|
| accent stripe | provider color | `4px` | unchanged |
| ICCID | `row.iccid` | `170px` | mono |
| Identidad | `row.msisdn` (top) + `row.imsi` (sub) | `1.1fr` | both mono; "—" if null |
| Plan | `row.planName` (top) + `row.planCode` (sub) | `1fr` | |
| Cliente | `row.customerName` (top) + `row.customerScope` (sub) | `0.95fr` | |
| Estado | `<StatusPillWithNative status nativeStatus sourceName/>` | `170px` | uses 14-value enum |
| Operador | `<SourceBadge>` + provider short name | `120px` | |
| Última actualización | `fmtShortDate(row.updatedAt)` | `120px` | new col |
| Detalle | "Ver detalle →" | `100px` | unchanged |

Old columns "Compañía" (parent), "Consumo", "Monto", "Renovación" are
**removed**. Consumo lives in the detail page (Batch 5).

The provider-tabs strip stays (kite/tele2/moabits/all). The status chip strip
must offer at least: `active`, `in_test`, `suspended`, `terminated`, `purged`,
`pending`. Drop `paused`, `overdue`, `trial`, `canceled` — they were mock-only.

### Step 4.4 — Empty/error/loading

- `loading.tsx`: keep, no changes.
- `error.tsx`: render `error.message`. If `error.message.includes("listing_precondition_failed")`
  show a CTA: "Sincroniza primero con un proveedor" linking to
  `?provider=kite` (and `?provider=tele2`, `?provider=moabits`).
- `EmptyState` already exists — pass `query` from the URL if any.

### Step 4.5 — Tele2 quirk

If the user picks the Tele2 tab without a `modified_since` URL param, **the
server component** must default `modified_since` to "now − 7 days" formatted
as `yyyy-MM-ddTHH:mm:ssZ` before calling `listSims`. The contract requires
this header for Tele2 listings.

### Validation gate (Batch 4)

```bash
npm run typecheck
npm run build
# manual checklist:
# - /dashboard/subscriptions loads with backend down → error state shows useful message
# - /dashboard/subscriptions?provider=tele2 → list renders (mock fields gone)
# - /dashboard/subscriptions (no provider) with empty routing map → CTA prompt visible
# - status chip filters round-trip via URL
```

---

## Batch 5 — subscription detail page (tabs)

**Goal**: replace mock content in `subscription-page.tsx` with backend data.

### Step 5.1 — Page wiring

`app/dashboard/subscriptions/[id]/page.tsx` becomes:

```tsx
import { getSim } from "@/lib/api/sims";
import { notFound } from "next/navigation";
import { SubscriptionPage } from "../subscription-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const sub = await getSim(decodeURIComponent(id));
    return <SubscriptionPage subscription={sub} />;
  } catch (e: any) {
    if (e.status === 404) notFound();
    throw e;
  }
}
```

`SubscriptionPage` props change: it now receives a `SubscriptionOut` (not the
mock `SubscriptionRecord`). Update its body file-by-file:

### Step 5.2 — Hero

`FocalHero` — drive the three panels off real data:

- **Panel 1 (primary signal)**: replace cycle-usage% with `normalized.limits`
  + `normalized.services.active`. If `limits.data` is set → show "Datos
  permitidos" + "Servicios: data/sms/voz". If no limits, show
  `normalized.status.last_changed_at` and a relative "actualizado hace …".
- **Panel 2 (lifecycle)**: replace `Monto/Plan/Antigüedad/Última factura` with
  `Plan` (`normalized.plan.name`), `Comm. Plan` (`normalized.plan.communication_plan`),
  `Activado` (`activated_at`, format with `fmtDate`), and `Expira plan`
  (`normalized.plan.expires_at`).
- **Panel 3 (sparkline)**: replace deterministic random with the **30-day
  daily series from `getUsage`**. Fetch in a client component on mount; on
  loading show a skeleton; on failure fall back to "Datos no disponibles" and
  no chart. The provider-side latency for this can be a few seconds — keep it
  in a `<Suspense>` boundary inside the hero.

### Step 5.3 — Tab "Detalle"

- Top `Card "Información general"` rows (3-col):
  ICCID · MSISDN · IMSI · Operador (provider) · Estado (`status`) · Estado nativo
  · Activado · Última actualización · ID compañía (`company_id`).
- Bottom card title becomes "Atributos específicos · {provider}". Source =
  `subscription.provider_fields` (the full raw bag) merged with
  `normalized.custom_fields`. Keep the existing `prettyKey`/`formatVal`/`looksMono`
  rendering. Drop the email row.

### Step 5.4 — Tab "Estado e historial"

Backend v1 has **no** status-history endpoint (contract § 5 — `status_history`
is only `supported` for `kite`).

- If `provider === "kite"` and the `ProviderCapabilities.status_history.status === "supported"`,
  call a new endpoint **only if** the backend later exposes it. For now
  render an empty state: "El histórico nativo aún no está disponible vía
  Bismark API." (No fake events.)
- Otherwise show the warning panel that already exists, but pull provider name
  from `subscription.provider`.
- Keep the "Mapeo de estados" card. Source the row labels from the
  `subscription.status` and `subscription.native_status`. Replace the fixed
  Tele2/Moabits equivalences with dynamic labels read from
  `STATUS_META[subscription.status].label`.

### Step 5.5 — Tab "Consumo"

- On mount call `getUsage(iccid, "metrics=data")`.
- KPIs come from `UsageOut`:
  - "Datos consumidos" → `data_used_bytes` ÷ `1024^2` MB (or GB ≥ 1024).
  - "Cap del plan" → `subscription.normalized.limits.data` (`data_unit = "mb"`).
  - "Promedio diario" → derive from `period_start`/`period_end` and the total.
  - "Pico diario" → `max(usage_metrics by day)` if present; otherwise hide.
- Bar chart series: drop the deterministic random. Use `usage_metrics` if it
  contains a `metric_type = "data_daily"` or similar; otherwise render a
  single bar with the period total.
- Drop the Tele2 "SMS / Voz" panel **unless** `usage_metrics` contains
  `sms` / `voice` metrics. Drop the Moabits "Renovaciones de plan" panel
  entirely (no backend source).

### Step 5.6 — Tab "Presencia y red"

- Call `getPresence(iccid)` on mount.
- Render `state` (`online/offline/unknown`) as a colored dot, plus
  `last_seen_at`, `country_code`, `network_name`, `rat_type`, `ip_address`.
- If the call returns 404 with `code === "provider.unsupported_operation"`,
  show the existing "no expone presencia" panel.

### Step 5.7 — Tab "Límites"

Read from `subscription.normalized.limits`:

- "Datos por SIM" → `data` + `data_unit ?? "mb"`. If `null` → show "Sin
  límite contractual".
- "SMS por SIM" → `sms`.
- Loop `daily` and `monthly` records and render each metric:
  `limit / value`, plus dot for `threshold_reached` and `traffic_cut`.

Drop the Moabits "Límites por compañía" card (no backend source).

### Step 5.8 — Tab "Acciones"

This is implemented in Batch 7. For now, leave the tab content as a
placeholder card that says "Cargando capacidades…" and a TODO comment.

### Validation gate (Batch 5)

```bash
npm run typecheck
npm run build
# manual: open a real SIM, verify each tab loads or fails gracefully.
# Acciones tab is allowed to be a placeholder until Batch 7 lands.
```

---

## Batch 6 — credentials management UI

**Goal**: a new `/dashboard/credentials` area for admins/managers to manage
provider credentials.

### Pages to add

```
app/dashboard/credentials/
  page.tsx                   # list view (server component)
  [provider]/page.tsx        # provider-specific upsert form
  moabits/page.tsx           # Moabits-only discovery + selection screen
  loading.tsx
  error.tsx
```

### Server actions to add (`app/actions/credentials.ts`)

- `listCredentials(): Promise<CredentialMetadataOut[]>` → `GET /companies/me/credentials`
- `getCredential(provider): Promise<CredentialMetadataOut>`
- `testCredential(provider, body)` → `POST /companies/me/credentials/{provider}/test`
- `upsertCredential(provider, body)` → `PATCH /companies/me/credentials/{provider}`
- `deactivateCredential(provider)` → `DELETE /companies/me/credentials/{provider}`
- `discoverMoabitsCompanies()` → `GET /companies/me/credentials/moabits/companies/discover`
- `selectMoabitsCompanyCodes({ company_codes })` → `PUT /companies/me/credentials/moabits/company-codes`

Each action wraps `fetchApi`, returns `{ ok, data }` or `{ ok: false, error }`,
and **only `revalidatePath("/dashboard/credentials")` on success**.

### Forms (per provider)

The `[provider]/page.tsx` form is built from a per-provider schema.
Build them with `react-hook-form` + `zod` (already installed).

- **Kite** schema (UpsertIn):
  ```ts
  z.object({
    credentials: z.object({
      endpoint: z.string().url().refine(u => u.startsWith("https://"), "Debe ser HTTPS"),
      username: z.string().optional(),
      password: z.string().optional(),
      client_cert_pfx_b64: z.string().min(1),
      client_cert_password: z.string().min(1),
      server_ca_bundle_pem_b64: z.string().optional(),
    }).refine(v => !!v.username === !!v.password, {
      message: "username y password de WS-Sec deben ir juntos",
      path: ["username"],
    }),
    account_scope: z.object({
      environment: z.enum(["production", "staging", "sandbox"]).default("production"),
      end_customer_id: z.string().optional(),
      cert_expires_at: z.string().datetime().optional(),
    }),
  })
  ```
  - The `client_cert_pfx_b64` field is rendered as a `<input type="file">`
    that base64-encodes the file client-side before submit.

- **Tele2** schema:
  ```ts
  z.object({
    credentials: z.object({
      cobrand_url: z.string().default("restapi3.jasper.com"),
      username: z.string().min(1),
      api_key: z.string().min(1),
      api_version: z.literal("v1").default("v1"),
    }),
    account_scope: z.object({
      account_id: z.string().min(1),
      max_tps: z.number().int().min(1).max(50).default(5),
      environment: z.enum(["production", "staging"]).default("production"),
    }),
  })
  ```

- **Moabits** schema:
  ```ts
  z.object({
    credentials: z.object({
      base_url: z.string().url().default("https://www.api.myorion.co"),
      x_api_key: z.string().min(1),
      parent_company_code: z.string().min(1),
    }),
    account_scope: z.object({
      parent_company_code: z.string().min(1),
      environment: z.enum(["production", "staging"]).default("production"),
    }),
  })
  ```

### UX rules

- Each form has two buttons: **"Probar credenciales"** (calls `testCredential`)
  and **"Guardar"** (calls `upsertCredential`, which itself runs a backend test
  before persisting — surface 422 detail as an inline error).
- Show `expiry_status` as a colored badge ("Válida"/"Por vencer"/"Vencida"/"Inválida")
  using the same palette as `STATUS_META.active`/`...suspended`/`...purged`/`...unknown`.
- The list page renders one row per provider with metadata + a "Editar"/"Probar"
  link. If a provider has no active credential, render a "Configurar" CTA.

### Moabits selection page

`/dashboard/credentials/moabits/page.tsx`:

1. Calls `discoverMoabitsCompanies()` server-side.
2. Renders the existing company list with checkboxes pre-checked from
   `selected_company_codes`.
3. On submit calls `selectMoabitsCompanyCodes({ company_codes: [...] })`.
4. Validation: at least 1 selected (mirrors backend `min_length: 1`).

### Nav

Add `/dashboard/credentials` to `app/dashboard/layout.tsx` `NAV_ITEMS` with
visibility = `canManageUsers` (admin or manager). Keep "Empresa" as the
admin-only entry.

### Validation gate (Batch 6)

```bash
npm run typecheck
npm run build
# manual: as admin user, configure each provider, run "Probar", then save.
# manual: trigger 422 by submitting a wrong x_api_key and confirm detail surfaces.
```

---

## Batch 7 — provider capabilities + lifecycle write actions

**Goal**: drive the "Acciones" tab from real provider capabilities and execute
real lifecycle writes.

### Server action

`app/actions/providers.ts`:

```ts
"use server";
import { fetchApi } from "@/lib/api-client";
import type { ProviderCapabilitiesOut } from "@/lib/types/api";
import type { Provider } from "@/lib/types/api/common";
export const getProviderCapabilities = (p: Provider) =>
  fetchApi<ProviderCapabilitiesOut>(`/providers/${p}/capabilities`);
```

### Detail page wiring

In `subscription-page.tsx`:

- The `[id]/page.tsx` server component fetches **both** `getSim(iccid)` and
  `getProviderCapabilities(sub.provider)` in parallel (`Promise.all`) and
  passes both as props.
- `TabAcciones` becomes data-driven:
  - `set_administrative_status` button group is built from `targets[]` in the
    capability response. Each target is a button labeled with
    `STATUS_META[target].label`. Buttons are disabled when status is
    `not_supported` or `requires_feature_flag` (with a tooltip showing the
    `reason`).
  - `purge` button is shown only if the `purge` capability is `supported`.
- On click:
  1. Show a confirmation modal with the target status name and the SIM ICCID.
  2. Generate `idempotencyKey = newIdempotencyKey()`.
  3. Call `setSimStatus(iccid, { target, data_service?, sms_service? }, idempotencyKey)`.
  4. On success, `router.refresh()` to re-fetch the SIM. Toast success.
  5. On error: show `err.detail || err.title`. If `code === "provider.rate_limited"`
     also show the `retry_after` from `err.extra` if present.
- For Moabits, when target is `active` or `suspended`, additionally render two
  toggles for `data_service` and `sms_service` and require at least one true
  (mirror backend rule from contract § 5.1).
- Purge is gated behind a "Type the ICCID to confirm" modal.

### Validation gate (Batch 7)

```bash
npm run typecheck
npm run build
# manual: with LIFECYCLE_WRITES_ENABLED=true on the backend,
# move a SIM through status transitions for each provider. Confirm idempotency
# by re-submitting the same key (network panel) — second call should return
# 204 instantly without re-hitting the provider.
```

---

## Batch 8 — SIM import + global vs provider-scoped listing

**Goal**: surface the bootstrap flow so global listings work.

### Pages to add

- `app/dashboard/sims/import/page.tsx` — admin-or-manager form:
  - File upload accepting CSV with two columns `iccid,provider`.
  - Client-side parse, validate every row (`iccid` non-empty, `provider ∈
    {kite, tele2, moabits}`).
  - Submit calls `importSims({ sims: rows })` and shows the returned
    `imported` count.

### Subscriptions list integration

- When `listSims` (no provider) returns `412 subscription.listing_precondition_failed`
  with `extra.reason === "routing_map_empty"`, the error UI shows a CTA
  "Importar SIMs" → `/dashboard/sims/import`, plus a "Ver por proveedor"
  CTA opening `?provider=kite`.

### Validation gate (Batch 8)

```bash
npm run typecheck
npm run build
# manual: from a fresh DB, import a 5-row CSV, then load /dashboard/subscriptions
# (no provider). It must list those rows.
```

---

## Batch 9 — cleanup, error states, polish

- Sweep for `// MOCK:` comments and any remaining references to the dropped
  fields (`amount`, `currency`, `cycle`, `nextRenewal`, `customerEmail`).
  Delete or replace with a backend-sourced value.
- Centralize error rendering: a tiny `ProblemAlert.tsx` that takes the
  parsed `ApiError` and shows `title`, `detail`, `instance`, plus a "Copiar
  request id" button.
- Verify the `dashboard/page.tsx` overview tiles aren't using mock totals;
  if they are, swap to `listSims({ limit: 1 })` and use `total` from the
  global path; for the per-provider tiles, call once per provider (3 calls
  in parallel) and use `items.length` from the first page as a hint when
  `total` is null.
- Verify `dashboard/profile`, `dashboard/company`, `dashboard/users`
  unchanged behavior — they were already wired to the real backend; just
  confirm they still work after Batch 1's `Profile` shape change.
- Add `next.config.ts` `output: "standalone"` only if the user's deploy
  target needs it — otherwise leave alone.
- `README.md` and `AUTH_SETUP.md` updated to describe the real flow:
  signup → login → JWT → refresh.

### Validation gate (Batch 9)

```bash
npm run typecheck
npm run build
npm run lint
# manual: full smoke test:
# 1. signup new tenant
# 2. /me, /company, /users round-trip
# 3. configure each of 3 providers, test, save
# 4. for moabits: discover + select company codes
# 5. import 3 SIMs
# 6. /dashboard/subscriptions (global) — see them
# 7. open a SIM detail; verify all 6 tabs render
# 8. on a Tele2 SIM run set_status with a valid target
# 9. logout; refresh token revoked.
```

---

## Done criteria

- Every new primitive in `components/ui/` was added via the **shadcn MCP**
  (no hand-written equivalents) and re-exported from `components/ui/index.ts`.
- All new utility classes in Batches 6 and 8 were validated via the
  **tailwindcss MCP** for Tailwind v4 compatibility.
- No file in `app/dashboard/subscriptions/` references mock `DATA`,
  `customerEmail`, `cycle`, `nextRenewal`, `amount`, `currency`, or
  `findRecord`.
- Every backend call goes through `lib/api/*` (no `fetch(API_URL/...)` outside
  `auth.ts`'s NextAuth credentials provider — that one is unavoidable).
- Every backend call hits `/v1/...` (verify by grepping for the literal `/v1/`
  in `lib/api/*` and confirming `withV1` rewrites paths in `api-client.ts`).
- All canonical 14 `AdministrativeStatus` values render with a unique label
  in `tokens.ts`.
- Lifecycle writes always send `Idempotency-Key`.
- Tele2 listing always sends `modified_since` (server-side default if
  user-supplied is missing).
- Refresh token rotation works: opening DevTools → Network, the access token
  changes after `expires_in` without a re-login.

---

## File-by-file change index (one-line summaries)

| File | Batch | Change |
|---|---|---|
| `lib/types/api/*` | 1 | new — wire types from contract |
| `lib/api-client.ts` | 1 | `/v1` rewriter, `ApiError` carries problem+json fields |
| `lib/types/user.ts` | 1 | `Profile` aligned, `ROLES` adds `public`, drops `email` |
| `auth.ts` | 2 | real `/auth/login`, refresh rotation, role/companyId in session |
| `app/actions/auth.ts` | 2 | `/v1/auth/signup`, schema with `full_name`, no auto-login |
| `app/actions/auth-logout.ts` | 2 | new — POST `/v1/auth/logout` then NextAuth signOut |
| `app/login/page.tsx` | 2 | error mapping from RFC 7807 |
| `app/register/page.tsx` | 2 | fields = email/password/full_name/company_name |
| `app/components/sign-out-button.tsx` | 2 | use `auth-logout` action |
| `lib/api/sims.ts` | 3 | new — list/get/usage/presence/setStatus/purge/import |
| `lib/api/sim-mapper.ts` | 3 | new — `toRow` |
| `lib/api/idempotency.ts` | 3 | new — `crypto.randomUUID()` helper |
| `app/dashboard/subscriptions/tokens.ts` | 4 | 14-value `StatusId` + meta |
| `app/dashboard/subscriptions/data.ts` | 4 | helpers only; mock removed |
| `app/dashboard/subscriptions/page.tsx` | 4 | server component fetching + Tele2 default |
| `app/dashboard/subscriptions/subscriptions-client.tsx` | 4 | new column set + URL state |
| `app/dashboard/subscriptions/error.tsx` | 4 | precondition CTA |
| `app/dashboard/subscriptions/[id]/page.tsx` | 5 | server fetch + capabilities |
| `app/dashboard/subscriptions/subscription-page.tsx` | 5 + 7 | tabs rewritten + Acciones from capabilities |
| `app/dashboard/subscriptions/detail-modal.tsx` | 5 | quick-actions wired to capabilities |
| `app/actions/credentials.ts` | 6 | new — credentials CRUD + Moabits select |
| `app/dashboard/credentials/...` | 6 | new — list, per-provider form, Moabits picker |
| `app/dashboard/layout.tsx` | 6 | `NAV_ITEMS` adds Credenciales |
| `app/actions/providers.ts` | 7 | new — capabilities fetch |
| `app/dashboard/sims/import/page.tsx` | 8 | new — CSV bootstrap |
| `app/dashboard/page.tsx` | 9 | overview tiles use real totals |
| `README.md`, `AUTH_SETUP.md` | 9 | docs match the real flow |

---

## Quick reference: commit message template

After each batch:

```
chore(frontend): batch <N> — <one-line summary>

Refs: docs/FRONTEND_BACKEND_CONTRACT.md (back/),
      MIGRATION_PLAN_HAIKU.md (frontend/)
```

Do **not** force-push, do **not** amend earlier commits, and do not invoke
`git push` unless the user explicitly asks.
