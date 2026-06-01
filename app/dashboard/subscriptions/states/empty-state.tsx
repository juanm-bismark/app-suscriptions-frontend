"use client";

import { Chip, Icon } from "../primitives";
import { dedupeFailedProviders } from "@/lib/subscriptions/result-utils";
import type { FailedProvider } from "@/lib/subscriptions/types";
import { SOURCES, type SourceId, T } from "../tokens";

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
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: T.cardBg,
      }}
    >
      <div style={{ maxWidth: 420, textAlign: "center" }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 12,
            background: T.divider,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            color: T.muted,
          }}
        >
          <Icon.search size={28} />
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: T.title, letterSpacing: -0.2, marginBottom: 6 }}>
          {hasProviderErrors ? "No se pudo completar la consulta global" : `No hay coincidencias en ${sourceName}`}
        </div>
        <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.55, marginBottom: 18 }}>
          {emptyPrefix}
          {hasQuery && (
            <>
              <span
                style={{
                  fontFamily: T.fontMono,
                  color: T.title,
                  background: T.zebra,
                  padding: "1px 6px",
                  borderRadius: 3,
                }}
              >
                &quot;{query}&quot;
              </span>{" "}
            </>
          )}
          {(!hasProviderErrors || hasQuery) && emptySuffix}
        </div>
        {hasProviderErrors && (
          <div
            style={{
              background: "#FDF4E1",
              border: `1px solid ${T.warning}55`,
              borderRadius: 6,
              padding: "12px 14px",
              textAlign: "left",
              marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 10.5, letterSpacing: 1, color: T.muted, fontWeight: 700, marginBottom: 8 }}>
              FUENTES CON ERROR
            </div>
            {uniqueFailedProviders.map((f, index) => (
              <div key={`${f.provider}-${f.code}-${index}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 12 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: sourceColorFor(f.provider) }} />
                <span style={{ color: T.title, fontWeight: 600, flex: 1 }}>{sourceNameFor(f.provider)}</span>
                <span style={{ color: T.muted, fontFamily: T.fontMono, fontSize: 11 }}>{f.title || f.code}</span>
                <span style={{ color: T.warning }}>
                  <Icon.warn size={12} />
                </span>
              </div>
            ))}
          </div>
        )}
        {!isGlobal && (
          <div
            style={{
              background: T.cardBg,
              border: `1px solid ${T.border}`,
              borderRadius: 6,
              padding: "12px 14px",
              textAlign: "left",
              marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 10.5, letterSpacing: 1, color: T.muted, fontWeight: 700, marginBottom: 8 }}>
              FUENTE CONSULTADA
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 12 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: SOURCES[source].color }} />
              <span style={{ color: T.title, fontWeight: 600, flex: 1 }}>{sourceName}</span>
              <span style={{ color: T.muted, fontFamily: T.fontMono, fontSize: 11 }}>0 resultados</span>
              <span style={{ color: T.success }}>
                <Icon.check size={12} />
              </span>
            </div>
          </div>
        )}
        <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>Prueba con otro criterio:</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 18 }}>
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
  return provider in SOURCES ? SOURCES[provider as SourceId].color : T.muted;
}
