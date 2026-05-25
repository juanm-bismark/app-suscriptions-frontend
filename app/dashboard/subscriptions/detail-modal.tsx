"use client";

import type { SubscriptionRow } from "@/lib/api/sim-mapper";
import { toast } from "@/components/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { fmtShortDate } from "./data";
import { Btn, Icon, SourceBadge, StatusPillWithNative } from "./primitives";
import { SOURCES, type SourceId } from "./tokens";

// Per-identifier accent colors — kept inline since they're not provider-related
// and exist only to help users tell ICCID / MSISDN / IMSI apart visually.
const ICCID_COLOR = "#33A6B2";
const MSISDN_COLOR = "#7B4FE0";
const IMSI_COLOR = "#E07A3A";

function IdentifierRow({
  label,
  description,
  value,
  color,
  onCopy,
  isCopied,
  isMissing,
}: {
  label: string;
  description: string;
  value: string;
  color: string;
  onCopy?: () => void;
  isCopied?: boolean;
  isMissing?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3.5 px-[18px] py-[13px] border-b border-divider sm:flex-nowrap">
      <div className="w-[3px] self-stretch rounded-sm shrink-0" style={{ background: color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1 flex-wrap">
          <span className="text-xs font-extrabold text-title tracking-wider uppercase">{label}</span>
          <span className="text-[11.5px] text-muted font-medium">{description}</span>
        </div>
        <div
          className={`break-all font-mono text-[14.5px] font-semibold ${
            isMissing ? "text-muted italic" : "text-title"
          }`}
        >
          {isMissing ? "No disponible en este proveedor" : value}
        </div>
      </div>
      {!isMissing && onCopy && (
        <button
          type="button"
          onClick={onCopy}
          title={`Copiar ${label}`}
          className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-bold border border-border bg-card text-text transition-colors"
          style={
            isCopied
              ? { borderColor: color, background: `${color}1a`, color: color }
              : undefined
          }
        >
          {isCopied ? <Icon.check size={11} /> : <Icon.copy size={11} />}
          {isCopied ? "Copiado" : "Copiar"}
        </button>
      )}
    </div>
  );
}

export interface DetailModalProps {
  record: SubscriptionRow | null;
  selectedProvider?: SourceId;
  onClose: () => void;
}

function value(v: string | null | undefined) {
  return v && v.trim() ? v : "—";
}

function detailHref(record: SubscriptionRow, selectedProvider?: SourceId, tab?: "actions") {
  const params = new URLSearchParams({ provider: selectedProvider ?? record.provider });
  if (tab) params.set("tab", tab);
  return `/dashboard/subscriptions/${encodeURIComponent(record.iccid)}?${params.toString()}`;
}

export function DetailModal({ record, selectedProvider, onClose }: DetailModalProps) {
  const router = useRouter();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [purgeMockOpen, setPurgeMockOpen] = useState(false);
  if (!record) return null;
  const iccid = record.iccid;
  const provider = record.provider;
  const src = SOURCES[record.provider];

  async function copyToClipboard(text: string, fieldKey: string, label: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const input = document.createElement("textarea");
        input.value = text;
        input.style.position = "fixed";
        input.style.left = "-9999px";
        document.body.appendChild(input);
        input.focus();
        input.select();
        document.execCommand("copy");
        input.remove();
      }
      setCopiedField(fieldKey);
      toast.success(`${label} copiado`);
      window.setTimeout(() => setCopiedField((c) => (c === fieldKey ? null : c)), 1600);
    } catch {
      toast.error(`No pudimos copiar el ${label}`);
    }
  }

  function simulatePurge() {
    console.warn("[MOCK] Purga simulada. No se envio ninguna solicitud al backend.", {
      iccid,
      provider,
      endpoint: `/v1/sims/${iccid}/purge`,
    });
    toast.warning("Mock: purga simulada. No se envio ninguna solicitud.");
    setPurgeMockOpen(false);
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-[rgba(15,32,42,0.55)] backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[680px] max-h-[90vh] bg-card rounded-lg border border-border flex flex-col overflow-hidden font-body shadow-[0_20px_60px_rgba(15,32,42,0.25),0_2px_8px_rgba(15,32,42,0.1)]"
      >
        {/* Header */}
        <div className="relative bg-card px-[22px] pt-[18px] pb-4 border-b border-divider">
          <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: src.color }} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute top-3.5 right-3.5 p-1.5 rounded text-muted hover:bg-zebra cursor-pointer"
          >
            <Icon.close size={15} />
          </button>

          <div className="flex items-center gap-2.5 mb-3 pl-1">
            <SourceBadge source={record.provider} size="sm" withName />
          </div>

          <div className="flex flex-col gap-3 pl-1 sm:flex-row sm:items-end">
            <div className="flex-1 min-w-0">
              <div className="break-words text-[20px] font-bold text-title sm:text-[22px]">
                {record.customerName?.trim() || `SIM · ${src.name}`}
              </div>
              {record.customerScope?.trim() && (
                <div className="mt-0.5 break-all font-mono text-xs text-muted">{record.customerScope}</div>
              )}
            </div>
            <div className="shrink-0 text-left sm:text-right">
              <StatusPillWithNative
                provider={record.provider}
                status={record.status}
                nativeStatus={record.nativeStatus}
                displayLabel={record.status}
                statusGroup={record.statusGroup}
                showContext={false}
                size="md"
              />
              <div className="text-[11px] text-muted mt-1.5">
                Actualizado {fmtShortDate(record.updatedAt)}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto">
          {/* Plan banner */}
          <div className="flex items-start gap-3.5 px-[18px] pt-3.5 pb-3 border-b border-divider">
            <div className="w-[3px] self-stretch rounded-sm shrink-0" style={{ background: src.color }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                <span className="text-xs font-extrabold text-title tracking-wider uppercase">Plan</span>
                <span className="text-[11.5px] text-muted font-medium">Servicio contratado para esta SIM</span>
              </div>
              <div className="text-[15px] font-bold text-title -tracking-[0.2px] truncate">
                {record.planDisplay}
              </div>
              {record.planName && (record.planCode || record.planId) && (
                <div className="text-[11.5px] text-muted mt-0.5 font-mono">
                  {value(record.planCode ?? record.planId)}
                </div>
              )}
            </div>
          </div>

          {/* Identifiers section */}
          <div className="px-[22px] pt-3 pb-1.5 text-[10.5px] tracking-wider text-muted font-bold uppercase">
            Identificadores
          </div>
          <IdentifierRow
            label="ICCID"
            description="Chip físico de la SIM (18-22 dígitos)"
            value={record.iccid}
            color={ICCID_COLOR}
            onCopy={() => copyToClipboard(record.iccid, "iccid", "ICCID")}
            isCopied={copiedField === "iccid"}
          />
          <IdentifierRow
            label="MSISDN"
            description="Número de línea telefónica"
            value={value(record.msisdn)}
            color={MSISDN_COLOR}
            isMissing={!record.msisdn?.trim()}
            onCopy={record.msisdn ? () => copyToClipboard(record.msisdn!, "msisdn", "MSISDN") : undefined}
            isCopied={copiedField === "msisdn"}
          />
          <IdentifierRow
            label="IMSI"
            description="Identidad del abonado en la red móvil"
            value={value(record.imsi)}
            color={IMSI_COLOR}
            isMissing={!record.imsi?.trim()}
            onCopy={record.imsi ? () => copyToClipboard(record.imsi!, "imsi", "IMSI") : undefined}
            isCopied={copiedField === "imsi"}
          />
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-table-header-bg px-[22px] py-3 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <Btn
            variant="outline"
            size="md"
            full
            onClick={() => {
              onClose();
              router.push(detailHref(record, selectedProvider, "actions"));
            }}
          >
            Acciones
          </Btn>
          <div className="hidden flex-1 sm:block" />
          <Btn variant="outline" size="md" full onClick={() => setPurgeMockOpen(true)}>
            Purgar
          </Btn>
          <Btn
            variant="primary"
            size="md"
            full
            onClick={() => {
              onClose();
              router.push(detailHref(record, selectedProvider));
            }}
            icon={<Icon.arrowRight size={12} />}
          >
            Abrir suscripción
          </Btn>
        </div>
      </div>

      {/* Purge confirmation mock */}
      {purgeMockOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setPurgeMockOpen(false)}
          className="fixed inset-0 z-[70] grid place-items-center p-4 bg-[rgba(15,23,42,0.42)]"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="w-[min(460px,100%)] bg-card rounded-lg border border-border overflow-hidden shadow-[0_24px_80px_rgba(15,23,42,0.22)]"
          >
            <div className="px-[18px] py-4 border-b border-divider">
              <h3 className="m-0 text-title text-base">Purgar SIM</h3>
              <p className="mt-1.5 mb-0 text-muted text-[13px]">
                Mockup para <span className="font-mono">{iccid}</span>
              </p>
            </div>
            <div className="p-[18px] text-text text-sm leading-snug">
              Esta accion solo simula el flujo de purga para {src.name}. No se llamara al endpoint del backend.
            </div>
            <div className="px-3.5 py-3.5 border-t border-divider flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPurgeMockOpen(false)}
                className="border border-border bg-card text-text rounded-md px-2.5 py-2 cursor-pointer text-xs font-extrabold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={simulatePurge}
                className="rounded-md px-2.5 py-2 cursor-pointer text-xs font-extrabold border bg-[#FADDD6] text-[#A84234] border-[#C85A4A]"
              >
                Simular purga
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
