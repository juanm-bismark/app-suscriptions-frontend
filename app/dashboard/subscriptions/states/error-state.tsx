"use client";

import { cn } from "@/lib/utils";
import { Btn, Icon } from "../primitives";
import { SOURCES, type SourceId } from "../tokens";

const GRID_COLS =
  "grid-cols-[4px_minmax(170px,1.15fr)_minmax(120px,.75fr)_minmax(130px,.8fr)_minmax(150px,1fr)_120px_170px_120px_100px]";
const cellH = "px-3 py-[9px]";

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
      className={cn(
        "flex flex-[1_1_180px] items-center gap-2.5 rounded-md border px-3 py-2",
        ok ? "border-border bg-card" : "border-warning-action/35 bg-warning-soft"
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", ok ? "bg-success-bg" : "bg-warning-action")} />
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-title">{s.name}</div>
        <div className="mt-px font-mono text-[10.5px] text-muted">
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
    <div className="flex min-h-[calc(100vh-64px)] flex-col bg-page">
      <div className="border-b border-border bg-card px-6 pb-4 pt-[22px]">
        <h1 className="m-0 mb-3.5 text-[22px] font-bold text-title">
          Suscripciones
        </h1>
        {hasQuery && (
          <div className="flex items-center gap-2.5 rounded-md border border-border bg-page px-3 py-[9px]">
            <span className="inline-flex text-muted">
              <Icon.search size={15} />
            </span>
            <span className="flex-1 text-[13.5px] text-text">{query}</span>
          </div>
        )}

        <div
          role="alert"
          className={cn(
            "flex items-start gap-2.5 rounded-md border border-warning-action/35 bg-warning-soft px-3.5 py-2.5",
            hasQuery && "mt-3"
          )}
        >
          <span className="mt-px inline-flex text-warning-action">
            <Icon.warn size={15} />
          </span>
          <div className="flex-1 text-[12.5px] text-warning-text-soft">
            <strong className="font-bold">No se pudo cargar la lista.</strong> Revisa la conexión con el backend
            o prueba filtrando por un proveedor específico.
          </div>
          <Btn variant="outline" size="sm" icon={<Icon.refresh size={12} />} onClick={retry}>
            Reintentar
          </Btn>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-2">
          <SourceStatus source="kite" ok={false} err="Sin datos" />
          <SourceStatus source="tele2" ok={false} err="Sin datos" />
          <SourceStatus source="moabits" ok={false} err="Sin datos" />
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-card">
        <div
          className={cn(
            "grid border-b border-border bg-table-header-bg text-[10.5px] font-bold uppercase tracking-[0.6px] text-table-header-text",
            GRID_COLS
          )}
        >
          <div />
          <div className={cellH}>ICCID</div>
          <div className={cellH}>MSISDN</div>
          <div className={cellH}>IMSI</div>
          <div className={cellH}>Plan</div>
          <div className={cellH}>Operador</div>
          <div className={cellH}>Estado</div>
          <div className={cellH}>Última actualización</div>
          <div className={cn(cellH, "pr-4 text-right")} />
        </div>

        <div className="m-3 flex items-center gap-3.5 rounded-md border border-dashed border-warning-action/40 bg-warning-soft px-4 py-3.5">
          <span
            className="flex h-[26px] w-[26px] items-center justify-center rounded font-mono text-xs font-bold text-white"
            style={{ background: SOURCES.moabits.color }}
          >
            !
          </span>
          <div className="flex-1">
            <div className="text-[12.5px] font-semibold text-title">No hay filas para mostrar</div>
            <div className="mt-0.5 font-mono text-[11.5px] text-muted">
              {hasQuery ? (
                <>
                  Consulta: <span className="text-warning-action">{query}</span>
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
