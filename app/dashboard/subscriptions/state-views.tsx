"use client";

import { CSSProperties } from "react";
import { Btn, Chip, Icon } from "./primitives";
import { SOURCES, SourceId, T } from "./tokens";

const GRID_COLS = "4px 170px 1.1fr 1fr 0.95fr 170px 120px 120px 100px";
const cellH: CSSProperties = { padding: "9px 12px" };

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

export function ErrorState({ query = "valentina ocampo" }: { query?: string }) {
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
            <strong style={{ fontWeight: 700 }}>No se pudo cargar la lista.</strong> Revisa la conexión con el backend
            o prueba filtrando por un proveedor específico.
          </div>
          <Btn variant="outline" size="sm" icon={<Icon.refresh size={12} />}>
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
          <div style={cellH}>Identidad</div>
          <div style={cellH}>Plan</div>
          <div style={cellH}>Cliente</div>
          <div style={cellH}>Estado</div>
          <div style={cellH}>Operador</div>
          <div style={cellH}>Última actualización</div>
          <div style={{ ...cellH, textAlign: "right", paddingRight: 16 }}>Detalle</div>
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
              Consulta: <span style={{ color: T.warning }}>{query}</span>
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
