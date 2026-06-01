"use client";

import { type CSSProperties } from "react";
import { Btn, Icon } from "../primitives";
import { SOURCES, type SourceId, T } from "../tokens";

const GRID_COLS = "4px minmax(170px,1.15fr) minmax(120px,.75fr) minmax(130px,.8fr) minmax(150px,1fr) 120px 170px 120px 100px";
const cellH: CSSProperties = { padding: "9px 12px" };

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
