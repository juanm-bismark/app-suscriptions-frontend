"use client";

import { CSSProperties } from "react";
import { Btn, Chip, Icon } from "./primitives";
import { nativeStatusMeta, PROVIDER_NATIVE_STATUSES, SOURCES, SourceId, STATUS_TONES, T } from "./tokens";

const GRID_COLS = "4px minmax(170px,1.15fr) minmax(120px,.75fr) minmax(130px,.8fr) minmax(150px,1fr) 120px 170px 120px 100px";
const cellH: CSSProperties = { padding: "9px 12px" };

const SHIMMER_BG = `linear-gradient(90deg, ${T.divider}, ${T.zebra}, ${T.divider})`;
const PROVIDER_IDS = Object.keys(SOURCES) as SourceId[];

const STATE_KEYFRAMES = `
@keyframes bismark-spin { to { transform: rotate(360deg); } }
@keyframes bismark-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
`;

type LoadingFilters = {
  provider?: string;
  status?: string;
  statuses?: string;
  cursor?: string;
  size?: string;
  q?: string;
};

type SourceFilter = SourceId | "all";
type StatusSelections = Partial<Record<SourceId, Set<string>>>;

function isSourceId(value: string | null | undefined): value is SourceId {
  return !!value && value in SOURCES;
}

function statusKey(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function isSelectedStatus(selected: string | undefined, candidate: string) {
  return Boolean(selected?.trim()) && statusKey(selected) === statusKey(candidate);
}

function parseStatusSelections(value: string | null | undefined): StatusSelections {
  const selections: StatusSelections = {};

  for (const raw of (value ?? "").split(",")) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const separator = trimmed.indexOf(":");
    if (separator <= 0) continue;

    const provider = trimmed.slice(0, separator).trim();
    const status = trimmed.slice(separator + 1).trim();
    if (!isSourceId(provider) || !status) continue;

    selections[provider] = selections[provider] ?? new Set<string>();
    selections[provider]?.add(status);
  }

  return selections;
}

function hasStatusSelections(selections: StatusSelections) {
  return PROVIDER_IDS.some((provider) => (selections[provider]?.size ?? 0) > 0);
}

function countStatusSelections(selections: StatusSelections) {
  return PROVIDER_IDS.reduce((total, provider) => total + (selections[provider]?.size ?? 0), 0);
}

function providersForLoadingRows(activeSource: SourceFilter, selections: StatusSelections) {
  if (activeSource !== "all") return [activeSource];
  const selectedProviders = PROVIDER_IDS.filter((provider) => (selections[provider]?.size ?? 0) > 0);
  return selectedProviders.length ? selectedProviders : PROVIDER_IDS;
}

function statusesForProvider(provider: SourceId, activeStatus: string | undefined) {
  const statuses = [...PROVIDER_NATIVE_STATUSES[provider]];
  if (activeStatus && !statuses.some((status) => isSelectedStatus(activeStatus, status.value))) {
    statuses.unshift(nativeStatusMeta(provider, activeStatus));
  }
  return statuses;
}

function loadingLabel(activeSource: SourceFilter, activeStatus: string | undefined, selections: StatusSelections, query: string | undefined) {
  const q = query?.trim();
  if (activeSource !== "all") {
    const statusLabel = activeStatus ? nativeStatusMeta(activeSource, activeStatus).label : null;
    return `Cargando ${SOURCES[activeSource].name}${statusLabel ? ` · ${statusLabel}` : ""}`;
  }

  const selectedCount = countStatusSelections(selections);
  if (selectedCount > 0) {
    const selectedProviders = PROVIDER_IDS.filter((provider) => (selections[provider]?.size ?? 0) > 0).map((provider) => SOURCES[provider].name);
    const providerText = selectedProviders.length === 1 ? selectedProviders[0] : `${selectedProviders.length} fuentes`;
    return `Cargando ${selectedCount} estado${selectedCount !== 1 ? "s" : ""} · ${providerText}`;
  }

  if (q) return `Buscando ${q}`;
  return "Cargando SIMs";
}

export function LoadingState({ query, filters }: { query?: string; filters?: LoadingFilters }) {
  const effectiveQuery = query ?? filters?.q;
  const hasQuery = Boolean(effectiveQuery?.trim());
  const activeSource: SourceFilter = isSourceId(filters?.provider) ? filters.provider : "all";
  const activeStatus = activeSource !== "all" ? filters?.status?.trim() || undefined : undefined;
  const statusSelections = activeSource === "all" ? parseStatusSelections(filters?.statuses) : {};
  const selectedCount = activeSource === "all" ? countStatusSelections(statusSelections) : activeStatus ? 1 : 0;
  const anySelected = activeSource === "all" ? hasStatusSelections(statusSelections) : Boolean(activeStatus);
  const activeColor = activeSource === "all" ? T.headerAccent : SOURCES[activeSource].color;
  const rowsSourceCycle = providersForLoadingRows(activeSource, statusSelections);
  const label = loadingLabel(activeSource, activeStatus, statusSelections, effectiveQuery);

  return (
    <div
      style={{
        background: T.pageBg,
        fontFamily: T.fontBody,
        display: "flex",
        flexDirection: "column",
        minHeight: "calc(100vh - 64px)",
      }}
    >
      <style>{STATE_KEYFRAMES}</style>
      <div style={{ padding: "22px 24px 16px", borderBottom: `1px solid ${T.border}`, background: T.cardBg }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 14, gap: 12, flexWrap: "wrap" }}>
          <div>
            <div
              style={{
                fontSize: 11,
                letterSpacing: 1.2,
                color: T.muted,
                fontWeight: 600,
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              Búsqueda unificada
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.title, letterSpacing: -0.4 }}>
              Suscripciones
            </h1>
          </div>
          <Btn variant="outline" size="sm" icon={<Icon.refresh size={13} />}>
            Sincronizar
          </Btn>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: T.pageBg,
            border: `1px solid ${hasQuery || anySelected || activeSource !== "all" ? activeColor : T.border}`,
            boxShadow: hasQuery || anySelected || activeSource !== "all" ? `0 0 0 3px ${activeColor}22` : undefined,
            borderRadius: 6,
            padding: "9px 12px",
          }}
        >
          {(hasQuery || anySelected || activeSource !== "all") && (
            <div
              style={{
                width: 15,
                height: 15,
                borderRadius: "50%",
                border: `2px solid ${activeColor}`,
                borderTopColor: "transparent",
                animation: "bismark-spin 0.7s linear infinite",
              }}
            />
          )}
          <span style={{ color: T.muted, display: "inline-flex" }}>
            <Icon.search size={15} />
          </span>
          <span style={{ flex: 1, fontSize: 13.5, color: hasQuery ? T.text : T.muted }}>
            {hasQuery ? effectiveQuery : "Buscar por ICCID, MSISDN o IMSI..."}
          </span>
          <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.muted }}>{label}</span>
        </div>

        <div style={{ display: "flex", gap: 6, marginTop: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontSize: 11, color: T.muted, marginRight: 4, fontWeight: 600, letterSpacing: 0.6, textTransform: "uppercase" }}>
            Fuente
          </div>
          <button
            style={{
              padding: "6px 11px 6px 9px",
              background: activeSource === "all" ? T.headerBg : "#fff",
              border: `1px solid ${activeSource === "all" ? T.headerBg : T.border}`,
              borderRadius: 4,
              color: activeSource === "all" ? "#fff" : T.title,
              fontSize: 12.5,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontFamily: T.fontBody,
            }}
          >
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: activeSource === "all" ? "rgba(255,255,255,.18)" : T.tableHeaderBg,
                display: "inline-flex",
              }}
            />
            Todas
          </button>
          {PROVIDER_IDS.map((provider) => {
            const s = SOURCES[provider];
            const active = activeSource === provider;
            return (
              <button
                key={s.id}
                style={{
                  padding: "6px 11px 6px 9px",
                  background: active ? s.color : "#fff",
                  border: `1px solid ${active ? s.color : T.border}`,
                  borderRadius: 4,
                  color: active ? "#fff" : T.title,
                  fontSize: 12.5,
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: T.fontBody,
                }}
              >
                <span style={{ width: 14, height: 14, borderRadius: 3, background: active ? "rgba(255,255,255,.18)" : s.color }} />
                {s.name}
              </button>
            );
          })}
        </div>

        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          <div style={{ display: "grid", gap: 8, minWidth: 0, width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ fontSize: 11, color: T.muted, marginRight: 4, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>
                {activeSource === "all" ? "Estado por fuente" : "Estado"}
              </div>
              {selectedCount > 0 && (
                <span style={{ fontSize: 11, color: activeSource === "all" ? T.headerBg : SOURCES[activeSource].tintText, fontFamily: T.fontMono, fontWeight: 700 }}>
                  {selectedCount}
                </span>
              )}
              <Chip active={!anySelected}>Todos</Chip>
            </div>
            <div
              style={{
                display: "grid",
                gap: 10,
                gridTemplateColumns: activeSource === "all" ? "repeat(auto-fit, minmax(min(100%, 260px), 1fr))" : "1fr",
                alignItems: "start",
              }}
            >
              {(activeSource === "all" ? PROVIDER_IDS : [activeSource]).map((provider) => {
                const source = SOURCES[provider];
                return (
                  <div key={provider} style={{ display: "grid", gap: 7, minWidth: 0, alignContent: "start" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: source.color }} />
                      <span style={{ fontSize: 11.5, color: T.title, fontWeight: 800 }}>{source.name}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", minWidth: 0 }}>
                      {statusesForProvider(provider, activeSource === provider ? activeStatus : undefined).map((status) => {
                        const palette = STATUS_TONES[status.tone];
                        const active =
                          activeSource === provider
                            ? isSelectedStatus(activeStatus, status.value)
                            : Boolean(statusSelections[provider]?.has(status.value));
                        return (
                          <span
                            key={status.value}
                            title={status.value}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              minHeight: 28,
                              padding: "5px 8px",
                              borderRadius: 4,
                              border: `1px solid ${active ? palette.dot : T.border}`,
                              background: active ? palette.bg : "#fff",
                              color: active ? palette.color : T.text,
                              fontSize: 12,
                              fontWeight: 700,
                              fontFamily: T.fontBody,
                              whiteSpace: "nowrap",
                            }}
                            >
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: palette.dot, flexShrink: 0 }} />
                              <span>{status.label}</span>
                            <span
                              style={{
                                width: 14,
                                height: 8,
                                borderRadius: 2,
                                background: SHIMMER_BG,
                                backgroundSize: "200% 100%",
                                animation: "bismark-shimmer 1.3s infinite",
                              }}
                            />
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 12, color: T.muted, fontFamily: T.fontMono }}>
              {label}
            </div>
            <button
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "6px 11px",
                borderRadius: 4,
                border: `1px solid ${T.border}`,
                background: "#fff",
                color: T.text,
                fontSize: 12,
                fontWeight: 600,
                fontFamily: T.fontBody,
                whiteSpace: "nowrap",
              }}
            >
              <Icon.filter size={13} />
              Filtros avanzados
            </button>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", background: T.cardBg }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: GRID_COLS,
            fontSize: 10.5,
            letterSpacing: 0.6,
            color: T.tableHeaderText,
            fontWeight: 700,
            textTransform: "uppercase",
            background: T.tableHeaderBg,
            borderBottom: `1px solid ${T.border}`,
            position: "sticky",
            top: 0,
            zIndex: 2,
          }}
        >
          <div />
          <div style={cellH}>ICCID</div>
          <div style={cellH}>MSISDN</div>
          <div style={cellH}>IMSI</div>
          <div style={cellH}>Plan</div>
          <div style={cellH}>Operador</div>
          <div style={cellH}>Estado</div>
          <div style={cellH}>Última actualización</div>
          <div style={{ ...cellH, textAlign: "right", paddingRight: 16 }} />
        </div>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: GRID_COLS,
              alignItems: "center",
              borderBottom: `1px solid ${T.rowDivider}`,
              minHeight: 54,
            }}
          >
            <div style={{ alignSelf: "stretch", background: SOURCES[rowsSourceCycle[i % rowsSourceCycle.length]].color }} />
            <SkeletonCell width={116} />
            <SkeletonCell width={90} />
            <SkeletonCell width={112} />
            <SkeletonCell width={124} />
            <div style={{ padding: "9px 12px", display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  background: SHIMMER_BG,
                  backgroundSize: "200% 100%",
                  animation: "bismark-shimmer 1.3s infinite",
                }}
              />
              <div
                style={{
                  width: 48,
                  height: 10,
                  borderRadius: 2,
                  background: SHIMMER_BG,
                  backgroundSize: "200% 100%",
                  animation: "bismark-shimmer 1.3s infinite",
                }}
              />
            </div>
            <div style={{ padding: "9px 12px" }}>
              <div
                style={{
                  width: 86,
                  height: 22,
                  borderRadius: 999,
                  background: SHIMMER_BG,
                  backgroundSize: "200% 100%",
                  animation: "bismark-shimmer 1.3s infinite",
                }}
              />
            </div>
            <SkeletonCell width={84} />
            <div style={{ padding: "9px 16px 9px 12px", display: "flex", justifyContent: "flex-end" }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 4,
                  background: SHIMMER_BG,
                  backgroundSize: "200% 100%",
                  animation: "bismark-shimmer 1.3s infinite",
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          padding: "10px 24px",
          background: T.cardBg,
          borderTop: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", fontSize: 12, color: T.muted }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontFamily: T.fontMono }}>
            <span>{filters?.cursor ? "Cargando página" : "Página 1"} · {label}</span>
            <span>consulta en curso</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 600 }}>
              Mostrar
              <span style={{ height: 32, width: 62, border: `1px solid ${T.border}`, background: "#fff", borderRadius: 5 }} />
            </span>
            <span style={{ height: 32, width: 72, borderRadius: 5, background: "#E8EEF2", border: "1px solid #CBD5E1" }} />
            <span style={{ height: 32, width: 78, borderRadius: 5, background: "#D8F0F2", border: "1px solid #B8DDE1" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonCell({ width }: { width: number }) {
  return (
    <div style={{ padding: "9px 12px" }}>
      <div
        style={{
          width,
          maxWidth: "100%",
          height: 10,
          borderRadius: 2,
          background: SHIMMER_BG,
          backgroundSize: "200% 100%",
          animation: "bismark-shimmer 1.3s infinite",
        }}
      />
    </div>
  );
}

type FailedProvider = { provider: string; code: string; title: string };

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

function dedupeFailedProviders(failedProviders: FailedProvider[]) {
  return Array.from(
    failedProviders
      .reduce((byKey, failed) => {
        const key = `${failed.provider}:${failed.code}:${failed.title}`;
        if (!byKey.has(key)) byKey.set(key, failed);
        return byKey;
      }, new Map<string, FailedProvider>())
      .values()
  );
}

function SourceStatus({
  source,
  ok,
  count,
  latency,
  err,
}: {
  source: SourceId;
  ok: boolean;
  count?: number;
  latency?: string;
  err?: string;
}) {
  const s = SOURCES[source];
  return (
    <div
      style={{
        flex: "1 1 180px",
        padding: "8px 12px",
        borderRadius: 6,
        border: `1px solid ${ok ? T.border : T.warning + "55"}`,
        background: ok ? T.cardBg : "#FDF4E1",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: ok ? T.success : T.warning }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: T.title, fontWeight: 600 }}>{s.name}</div>
        <div style={{ fontSize: 10.5, color: T.muted, fontFamily: T.fontMono, marginTop: 1 }}>
          {ok ? `${count} registros · ${latency}` : err}
        </div>
      </div>
    </div>
  );
}

export function ErrorState({ query, onRetry }: { query?: string; onRetry?: () => void }) {
  const hasQuery = Boolean(query?.trim());
  const retry = onRetry ?? (() => window.location.reload());

  return (
    <div
      style={{
        background: T.pageBg,
        fontFamily: T.fontBody,
        display: "flex",
        flexDirection: "column",
        minHeight: "calc(100vh - 64px)",
      }}
    >
      <div style={{ padding: "22px 24px 16px", borderBottom: `1px solid ${T.border}`, background: T.cardBg }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.title, marginBottom: 14 }}>
          Suscripciones
        </h1>
        {hasQuery && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: T.pageBg,
              border: `1px solid ${T.border}`,
              borderRadius: 6,
              padding: "9px 12px",
            }}
          >
            <span style={{ color: T.muted, display: "inline-flex" }}>
              <Icon.search size={15} />
            </span>
            <span style={{ flex: 1, fontSize: 13.5, color: T.text }}>{query}</span>
          </div>
        )}

        <div
          style={{
            marginTop: hasQuery ? 12 : 0,
            padding: "10px 14px",
            borderRadius: 6,
            background: "#FBEFD4",
            border: `1px solid ${T.warning}55`,
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <span style={{ color: T.warning, marginTop: 1, display: "inline-flex" }}>
            <Icon.warn size={15} />
          </span>
          <div style={{ flex: 1, fontSize: 12.5, color: "#6B4A0E" }}>
            <strong style={{ fontWeight: 700 }}>No se pudo cargar la lista.</strong> Revisa la conexión con el backend
            o prueba filtrando por un proveedor específico.
          </div>
          <Btn variant="outline" size="sm" icon={<Icon.refresh size={12} />} onClick={retry}>
            Reintentar
          </Btn>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <SourceStatus source="kite" ok={false} err="Sin datos" />
          <SourceStatus source="tele2" ok={false} err="Sin datos" />
          <SourceStatus source="moabits" ok={false} err="Sin datos" />
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", background: T.cardBg }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: GRID_COLS,
            fontSize: 10.5,
            letterSpacing: 0.6,
            color: T.tableHeaderText,
            fontWeight: 700,
            textTransform: "uppercase",
            background: T.tableHeaderBg,
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          <div />
          <div style={cellH}>ICCID</div>
          <div style={cellH}>MSISDN</div>
          <div style={cellH}>IMSI</div>
          <div style={cellH}>Plan</div>
          <div style={cellH}>Operador</div>
          <div style={cellH}>Estado</div>
          <div style={cellH}>Última actualización</div>
          <div style={{ ...cellH, textAlign: "right", paddingRight: 16 }} />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "14px 16px",
            background: "#FDF4E1",
            border: `1px dashed ${T.warning}66`,
            margin: 12,
            borderRadius: 6,
          }}
        >
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: 4,
              background: SOURCES.moabits.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontFamily: T.fontMono,
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            !
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, color: T.title, fontWeight: 600 }}>No hay filas para mostrar</div>
            <div style={{ fontSize: 11.5, color: T.muted, marginTop: 2, fontFamily: T.fontMono }}>
              {hasQuery ? (
                <>
                  Consulta: <span style={{ color: T.warning }}>{query}</span>
                </>
              ) : (
                "No se recibieron filas para esta consulta."
              )}
            </div>
          </div>
          <Btn variant="outline" size="sm" icon={<Icon.refresh size={12} />} onClick={retry}>
            Reintentar fuente
          </Btn>
        </div>
      </div>
    </div>
  );
}
