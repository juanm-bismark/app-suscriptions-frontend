import { toRow } from "@/lib/api/sim-mapper";
import { ApiError } from "@/lib/api-client";
import { listSims, type ListSimsParams } from "@/lib/api/sims";
import type { AdministrativeStatus, Provider } from "@/lib/types/api";
import Link from "next/link";
import { Suspense } from "react";
import { SubscriptionsClient } from "./subscriptions-client";

export const metadata = {
  title: "Suscripciones · Bismark",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const PROVIDERS: Provider[] = ["kite", "tele2", "moabits"];
const STATUSES: AdministrativeStatus[] = [
  "active",
  "in_test",
  "suspended",
  "inactive_new",
  "activation_pendant",
  "activation_ready",
  "terminated",
  "purged",
  "inventory",
  "replaced",
  "retired",
  "restore",
  "pending",
  "unknown",
];

function single(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

function isProvider(v: string | undefined): v is Provider {
  return !!v && PROVIDERS.includes(v as Provider);
}

function isStatus(v: string | undefined): v is AdministrativeStatus {
  return !!v && STATUSES.includes(v as AdministrativeStatus);
}

function tele2DefaultModifiedSince() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export default async function SubscriptionsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const provider = single(params.provider);
  const status = single(params.status);
  const cursor = single(params.cursor);
  const q = single(params.q);
  const modifiedSince = single(params.modified_since);

  const filters = {
    provider: isProvider(provider) ? provider : undefined,
    status: isStatus(status) ? status : undefined,
    cursor,
    q,
  };

  const apiParams: ListSimsParams = {
    provider: filters.provider,
    status: filters.status,
    cursor,
    limit: 50,
  };

  if (filters.provider === "tele2") {
    apiParams.modified_since = modifiedSince || tele2DefaultModifiedSince();
  }

  if (q) {
    apiParams.custom = [q];
  }

  let result;
  try {
    result = await listSims(apiParams);
  } catch (error) {
    const reason = error instanceof ApiError ? error.extra?.reason : undefined;
    if (
      error instanceof ApiError &&
      error.status === 412 &&
      error.code === "subscription.listing_precondition_failed" &&
      reason === "routing_map_empty"
    ) {
      return <RoutingMapEmptyState />;
    }

    throw error;
  }

  const rows = result.items.map(toRow);

  return (
    <Suspense fallback={null}>
      <SubscriptionsClient
        initialRows={rows}
        pagination={{
          nextCursor: result.next_cursor,
          total: result.total,
          partial: result.partial,
        }}
        filters={filters}
      />
    </Suspense>
  );
}

function RoutingMapEmptyState() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">
          Listado global pendiente
        </p>
        <h1 className="mt-2 text-2xl font-bold text-title">Importa SIMs para activar la vista global</h1>
        <p className="mt-2 max-w-2xl text-sm text-amber-900">
          El backend aun no tiene mapa de enrutamiento ICCID-proveedor. Puedes cargar un CSV inicial o revisar un proveedor especifico.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/dashboard/sims/import"
            className="rounded bg-header-bg px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Importar SIMs
          </Link>
          <Link
            href="/dashboard/subscriptions?provider=kite"
            className="rounded border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100"
          >
            Ver por proveedor
          </Link>
        </div>
      </div>
    </div>
  );
}
