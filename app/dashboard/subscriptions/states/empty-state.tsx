"use client";

import { Chip, Icon } from "../primitives";
import { dedupeFailedProviders } from "@/lib/subscriptions/result-utils";
import type { FailedProvider } from "@/lib/subscriptions/types";
import { SOURCES, type SourceId } from "../tokens";

export function EmptyState({
  query,
  source = "all",
  failedProviders = [],
}: {
  query?: string;
  source?: SourceId | "all";
  failedProviders?: FailedProvider[];
}) {
  const isGlobal = source === "all";
  const sourceName = isGlobal ? "la vista global" : SOURCES[source].name;
  const uniqueFailedProviders = dedupeFailedProviders(failedProviders);
  const failedProviderNames = Array.from(new Set(uniqueFailedProviders.map((f) => sourceNameFor(f.provider)))).join(", ");
  const hasQuery = Boolean(query?.trim());
  const hasProviderErrors = uniqueFailedProviders.length > 0;
  const emptyPrefix = hasProviderErrors
    ? hasQuery
      ? `El backend no pudo consultar ${failedProviderNames} para `
      : `El backend no pudo consultar ${failedProviderNames} en este intento.`
    : isGlobal
      ? hasQuery ? "La consulta global no devolvió registros para " : "La consulta global no devolvió registros "
      : hasQuery ? "Buscamos " : "No encontramos registros ";
  const emptySuffix = hasProviderErrors
    ? "en este intento."
    : isGlobal
      ? "con los filtros actuales."
      : `en ${sourceName} y no encontramos registros.`;

  return (
    <div className="flex flex-1 items-center justify-center bg-card p-6">
      <div className="max-w-[420px] text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-divider text-muted">
          <Icon.search size={28} />
        </div>
        <div className="mb-1.5 text-[17px] font-bold tracking-[-0.2px] text-title">
          {hasProviderErrors ? "No se pudo completar la consulta global" : `No hay coincidencias en ${sourceName}`}
        </div>
        <div className="mb-[18px] text-[13px] leading-[1.55] text-muted">
          {emptyPrefix}
          {hasQuery && (
            <>
              <span className="rounded-[3px] bg-zebra px-1.5 py-px font-mono text-title">
                &quot;{query}&quot;
              </span>{" "}
            </>
          )}
          {(!hasProviderErrors || hasQuery) && emptySuffix}
        </div>
        {hasProviderErrors && (
          <div className="mb-3.5 rounded-md border border-warning-action/35 bg-warning-soft px-3.5 py-3 text-left">
            <div className="mb-2 text-[10.5px] font-bold uppercase tracking-[1px] text-muted">
              Fuentes con error
            </div>
            {uniqueFailedProviders.map((f, index) => (
              <div key={`${f.provider}-${f.code}-${index}`} className="flex items-center gap-2 py-1 text-xs">
                <span className="h-[7px] w-[7px] rounded-full" style={{ background: sourceColorFor(f.provider) }} />
                <span className="flex-1 font-semibold text-title">{sourceNameFor(f.provider)}</span>
                <span className="font-mono text-[11px] text-muted">{f.title || f.code}</span>
                <span className="text-warning-action">
                  <Icon.warn size={12} />
                </span>
              </div>
            ))}
          </div>
        )}
        {!isGlobal && (
          <div className="mb-3.5 rounded-md border border-border bg-card px-3.5 py-3 text-left">
            <div className="mb-2 text-[10.5px] font-bold uppercase tracking-[1px] text-muted">
              Fuente consultada
            </div>
            <div className="flex items-center gap-2 py-1 text-xs">
              <span className="h-[7px] w-[7px] rounded-full" style={{ background: SOURCES[source].color }} />
              <span className="flex-1 font-semibold text-title">{sourceName}</span>
              <span className="font-mono text-[11px] text-muted">0 resultados</span>
              <span className="text-success-bg">
                <Icon.check size={12} />
              </span>
            </div>
          </div>
        )}
        <div className="mb-3.5 text-xs text-muted">Prueba con otro criterio:</div>
        <div className="mb-[18px] flex flex-wrap justify-center gap-2">
          <Chip>solo ID</Chip>
          <Chip>MSISDN</Chip>
          <Chip>nombre del cliente</Chip>
          <Chip>serial ONT</Chip>
        </div>
      </div>
    </div>
  );
}

function sourceNameFor(provider: string) {
  return provider in SOURCES ? SOURCES[provider as SourceId].name : provider;
}

function sourceColorFor(provider: string) {
  return provider in SOURCES ? SOURCES[provider as SourceId].color : "var(--color-muted)";
}
