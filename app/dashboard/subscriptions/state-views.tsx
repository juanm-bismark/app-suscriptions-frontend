"use client";

import { CSSProperties } from "react";
import { DATA, fmtCOP, fmtShortDate } from "./data";
import { Btn, Chip, Icon, SourceBadge, StatusPillWithNative, UsageBar } from "./primitives";
import { SOURCES, SourceId, T } from "./tokens";

const GRID_COLS = "4px 150px 1.1fr 0.95fr 130px 110px 130px 110px 100px 110px";
const cellH: CSSProperties = { padding: "9px 12px" };
const cell: CSSProperties = { padding: "9px 12px", minWidth: 0 };

const SHIMMER_BG = `linear-gradient(90deg, ${T.divider}, ${T.zebra}, ${T.divider})`;

const STATE_KEYFRAMES = `
@keyframes bismark-spin { to { transform: rotate(360deg); } }
@keyframes bismark-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
`;

export function LoadingState({ query = "ocampo" }: { query?: string }) {
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
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.title, marginBottom: 14 }}>
          Suscripciones
        </h1>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: T.pageBg,
            border: `1px solid ${T.headerAccent}`,
            boxShadow: `0 0 0 3px ${T.headerAccent}22`,
            borderRadius: 6,
            padding: "9px 12px",
          }}
        >
          <div
            style={{
              width: 15,
              height: 15,
              borderRadius: "50%",
              border: `2px solid ${T.headerAccent}`,
              borderTopColor: "transparent",
              animation: "bismark-spin 0.7s linear infinite",
            }}
          />
          <span style={{ flex: 1, fontSize: 13.5, color: T.text }}>{query}</span>
          <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.muted }}>buscando…</span>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
          {Object.values(SOURCES).map((s, i) => (
            <div
              key={s.id}
              style={{
                flex: "1 1 200px",
                padding: "10px 12px",
                border: `1px solid ${T.border}`,
                borderRadius: 6,
                background: T.cardBg,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: T.title }}>{s.name}</div>
                <div style={{ fontSize: 11, color: T.muted, fontFamily: T.fontMono, marginTop: 2 }}>
                  {i === 0 ? "consultando API…" : i === 1 ? "esperando respuesta…" : "procesando 120 ms"}
                </div>
              </div>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  border: `2px solid ${s.color}`,
                  borderTopColor: "transparent",
                  animation: "bismark-spin 0.7s linear infinite",
                }}
              />
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, background: T.cardBg, padding: "12px 0" }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "12px 24px",
              borderBottom: `1px solid ${T.rowDivider}`,
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: SHIMMER_BG,
                backgroundSize: "200% 100%",
                animation: "bismark-shimmer 1.3s infinite",
              }}
            />
            <div
              style={{
                width: 90,
                height: 10,
                borderRadius: 2,
                background: SHIMMER_BG,
                backgroundSize: "200% 100%",
                animation: "bismark-shimmer 1.3s infinite",
              }}
            />
            <div
              style={{
                flex: 1,
                height: 10,
                borderRadius: 2,
                background: SHIMMER_BG,
                backgroundSize: "200% 100%",
                animation: "bismark-shimmer 1.3s infinite",
              }}
            />
            <div
              style={{
                width: 70,
                height: 14,
                borderRadius: 3,
                background: SHIMMER_BG,
                backgroundSize: "200% 100%",
                animation: "bismark-shimmer 1.3s infinite",
              }}
            />
            <div
              style={{
                width: 100,
                height: 10,
                borderRadius: 2,
                background: SHIMMER_BG,
                backgroundSize: "200% 100%",
                animation: "bismark-shimmer 1.3s infinite",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ query = "xqtm-999-zzz" }: { query?: string }) {
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
          No hay coincidencias en ninguna fuente
        </div>
        <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.55, marginBottom: 18 }}>
          Buscamos{" "}
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
          en Kite, Tele2 y Moabits y no encontramos registros.
        </div>
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
            FUENTES CONSULTADAS
          </div>
          {Object.values(SOURCES).map((s) => (
            <div
              key={s.id}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 12 }}
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.color }} />
              <span style={{ color: T.title, fontWeight: 600, flex: 1 }}>{s.name}</span>
              <span style={{ color: T.muted, fontFamily: T.fontMono, fontSize: 11 }}>0 resultados</span>
              <span style={{ color: T.success }}>
                <Icon.check size={12} />
              </span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>Prueba con otro criterio:</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 18 }}>
          <Chip>solo ID</Chip>
          <Chip>MSISDN</Chip>
          <Chip>nombre del cliente</Chip>
          <Chip>serial ONT</Chip>
        </div>
        <Btn variant="primary" size="md" icon={<Icon.plus size={12} />}>
          Crear nueva suscripción
        </Btn>
      </div>
    </div>
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

// "Moabits caído" partial-error variant: top has a non-blocking warning banner,
// per-source status strip, and the rest of the table renders Kite + Tele2 rows
// with a placeholder strip for the failed source so users don't lose data
// they could otherwise see.
export function ErrorState({ query = "valentina ocampo" }: { query?: string }) {
  const visibleRows = DATA.filter((r) => r.source !== "moabits" && r.customer.includes("Valentina"));
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

        <div
          style={{
            marginTop: 12,
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
            <strong style={{ fontWeight: 700 }}>Moabits no respondió.</strong> Mostramos resultados parciales de Kite y
            Tele2. Los registros de Moabits pueden estar desactualizados.
          </div>
          <Btn variant="outline" size="sm" icon={<Icon.refresh size={12} />}>
            Reintentar
          </Btn>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <SourceStatus source="kite" ok count={2} latency="142 ms" />
          <SourceStatus source="tele2" ok count={1} latency="98 ms" />
          <SourceStatus source="moabits" ok={false} err="Timeout · 8.0s" />
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
          <div style={cellH}>ID</div>
          <div style={cellH}>Cliente</div>
          <div style={cellH}>Plan</div>
          <div style={cellH}>Compañía</div>
          <div style={cellH}>Estado</div>
          <div style={cellH}>Consumo</div>
          <div style={{ ...cellH, textAlign: "right" }}>Monto</div>
          <div style={cellH}>Renovación</div>
          <div style={{ ...cellH, textAlign: "right", paddingRight: 16 }}>Detalle</div>
        </div>

        {visibleRows.map((r, i) => {
          const src = SOURCES[r.source];
          return (
            <div
              key={r.id}
              style={{
                display: "grid",
                gridTemplateColumns: GRID_COLS,
                alignItems: "stretch",
                background: i % 2 ? T.zebra : T.cardBg,
                borderBottom: `1px solid ${T.rowDivider}`,
                fontSize: 12.5,
              }}
            >
              <div style={{ background: src.color }} />
              <div style={{ ...cell, display: "flex", alignItems: "center", gap: 8 }}>
                <SourceBadge source={r.source} size="sm" />
                <span
                  style={{
                    fontFamily: T.fontMono,
                    fontSize: 11.5,
                    color: T.title,
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.id}
                </span>
              </div>
              <div style={{ ...cell, display: "flex", alignItems: "center" }}>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      color: T.title,
                      fontWeight: 600,
                      fontSize: 12.5,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.customer}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: T.muted,
                      marginTop: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.customerEmail}
                  </div>
                </div>
              </div>
              <div
                style={{
                  ...cell,
                  color: T.text,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.plan}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>Desde {fmtShortDate(r.createdAt)}</div>
              </div>
              <div
                title={r.parent}
                style={{
                  ...cell,
                  fontSize: 11.5,
                  color: T.text,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {r.parent}
              </div>
              <div style={{ ...cell, display: "flex", alignItems: "center" }}>
                <StatusPillWithNative
                  status={r.status}
                  nativeStatus={r.nativeStatus}
                  sourceName={src.name}
                  size="sm"
                />
              </div>
              <div style={{ ...cell, display: "flex", alignItems: "center" }}>
                <UsageBar used={r.usage?.used} total={r.usage?.total} unit={r.usage?.unit} width={120} />
              </div>
              <div
                style={{
                  ...cell,
                  textAlign: "right",
                  fontFamily: T.fontMono,
                  fontSize: 12.5,
                  color: T.title,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                }}
              >
                {fmtCOP(r.amount)}
              </div>
              <div style={{ ...cell, fontSize: 12, color: T.text, display: "flex", alignItems: "center" }}>
                {fmtShortDate(r.nextRenewal)}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", paddingRight: 12 }}>
                <span
                  style={{
                    fontSize: 11.5,
                    color: T.muted,
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 8px",
                  }}
                >
                  Ver detalle <Icon.arrowRight size={11} />
                </span>
              </div>
            </div>
          );
        })}

        {/* Placeholder card for the failed source */}
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
            M
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, color: T.title, fontWeight: 600 }}>Moabits no disponible</div>
            <div style={{ fontSize: 11.5, color: T.muted, marginTop: 2, fontFamily: T.fontMono }}>
              Última sync correcta: hace 14 min · Error: <span style={{ color: T.warning }}>TIMEOUT_8S</span>
            </div>
          </div>
          <Btn variant="outline" size="sm" icon={<Icon.refresh size={12} />}>
            Reintentar fuente
          </Btn>
        </div>
      </div>
    </div>
  );
}
