"use client"

import type { SmsHistoryOut, SmsHistoryRecord, StatusHistoryOut, StatusHistoryRecord, SubscriptionOut } from "@/lib/types/api"
import { type ReactNode, useState } from "react"
import { cn } from "@/lib/utils"
import { fmtDate } from "../data"
import { Btn, Icon } from "../primitives"
import { useSmsHistory, useStatusHistory } from "./hooks"
import { Card, Empty, KV } from "./primitives"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"

const thClass = "px-3 py-2 text-left text-[11px] font-bold uppercase tracking-[0.5px] text-muted"
const tdClass = "border-b border-divider px-3 py-2 align-top text-text"

export function SmsHistoryCard({ subscription }: { subscription: SubscriptionOut }) {
  const { state, reload } = useSmsHistory(subscription.iccid)
  const [showModal, setShowModal] = useState(false)

  const lastMo = state.status === "success"
    ? state.data.records.find((record) => record.sms_type === "MO")
    : undefined
  const lastMt = state.status === "success"
    ? state.data.records.find((record) => record.sms_type === "MT")
    : undefined

  const moLabel = lastMo ? fmtDate(lastMo.date) : "Sin MO en el periodo"
  const mtLabel = lastMt ? fmtDate(lastMt.date) : "Sin MT en el periodo"
  const deliveryLabel = lastMt
    ? `GW ${lastMt.gateway_delivered === true ? "✓" : lastMt.gateway_delivered === false ? "✗" : "—"} · SC ${lastMt.sms_center_delivered === true ? "✓" : lastMt.sms_center_delivered === false ? "✗" : "—"}`
    : "Sin MT en el periodo"

  return (
    <>
      <Card title="Mensajería">
        {state.status === "error" ? (
          <Empty text={state.message} />
        ) : state.status !== "success" ? (
          <Empty text="Cargando historial SMS..." />
        ) : (
          <>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))]">
              <KV label="Último SMS recibido (MO)" value={moLabel} sub={lastMo ? truncate(lastMo.message, 60) : undefined} />
              <KV label="Último SMS enviado (MT)" value={mtLabel} sub={lastMt ? truncate(lastMt.message, 60) : undefined} />
              <KV label="Delivery último MT" value={deliveryLabel} mono />
              <KV label="Total registros" value={state.data.records.length.toLocaleString("es-CO")} sub={`Periodo: ${fmtDate(state.data.period_start)} a ${fmtDate(state.data.period_end)}`} />
            </div>
            <div className="flex gap-2 border-t border-divider px-4 py-3">
              <Btn variant="primary" size="sm" icon={<Icon.refresh size={12} />} onClick={() => setShowModal(true)}>
                Ver historial SMS
              </Btn>
              <Btn variant="ghost" size="sm" onClick={reload}>
                Refrescar
              </Btn>
            </div>
          </>
        )}
      </Card>
      {showModal && state.status === "success" && (
        <SmsHistoryModal data={state.data} onClose={() => setShowModal(false)} />
      )}
    </>
  )
}

export function StatusHistoryCard({ subscription }: { subscription: SubscriptionOut }) {
  const { state, reload } = useStatusHistory(subscription.iccid)
  const [showModal, setShowModal] = useState(false)

  return (
    <Card title="Historial de estados">
      {state.status === "error" ? (
        <Empty text={state.message} />
      ) : state.status !== "success" ? (
        <Empty text="Cargando historial de estados..." />
      ) : state.data.records.length === 0 ? (
        <Empty text="Sin cambios de estado en el periodo." />
      ) : (
        <>
          <div className="grid">
            {state.data.records.slice(0, 8).map((record, index) => (
              <StatusHistoryRow key={`${record.time}-${index}`} record={record} />
            ))}
          </div>
          <div className="flex gap-2 border-t border-divider px-4 py-3">
            <Btn variant="primary" size="sm" icon={<Icon.refresh size={12} />} onClick={() => setShowModal(true)}>
              Ver historial completo
            </Btn>
            <Btn variant="ghost" size="sm" onClick={reload}>
              Refrescar
            </Btn>
          </div>
        </>
      )}
      {showModal && state.status === "success" && (
        <StatusHistoryModal data={state.data} onClose={() => setShowModal(false)} />
      )}
    </Card>
  )
}

function StatusHistoryRow({ record }: { record: StatusHistoryRecord }) {
  return (
    <div className="grid grid-cols-[150px_1fr] gap-3.5 border-t border-divider px-4 py-2.5">
      <div className="font-mono text-xs text-muted">{fmtDate(record.time)}</div>
      <div>
        <div className="text-[13px] font-bold text-title">{record.state}</div>
        <div className="mt-0.5 text-xs text-muted">
          {record.automatic ? "Automático" : "Manual"}{record.reason ? ` · ${record.reason}` : ""}{record.user ? ` · ${record.user}` : ""}
        </div>
      </div>
    </div>
  )
}

function StatusHistoryModal({ data, onClose }: { data: StatusHistoryOut; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="flex max-h-[min(86vh,720px)] w-[min(860px,100%)] max-w-[min(860px,100%)] flex-col gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Historial de estados</DialogTitle>
        <DialogDescription className="sr-only">
          Tabla completa de cambios de estado de la suscripción {data.iccid}.
        </DialogDescription>
        <ModalHeader title="Historial de estados" caption={<span>ICCID <span className="font-mono">{data.iccid}</span> · {data.records.length.toLocaleString("es-CO")} cambios</span>} onClose={onClose} />
        <div className="flex-1 overflow-auto">
          {data.records.length === 0 ? (
            <Empty text="Sin cambios de estado en el periodo." />
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-[1] bg-card">
                <tr className="border-b border-border">
                  <th className={thClass}>Fecha</th>
                  <th className={thClass}>Estado</th>
                  <th className={thClass}>Origen</th>
                  <th className={thClass}>Motivo</th>
                  <th className={thClass}>Usuario</th>
                </tr>
              </thead>
              <tbody>
                {data.records.map((record, index) => (
                  <tr key={`${record.time}-${index}`}>
                    <td className={cn(tdClass, "whitespace-nowrap font-mono")}>{fmtDate(record.time)}</td>
                    <td className={cn(tdClass, "font-bold")}>{record.state}</td>
                    <td className={tdClass}>{record.automatic ? "Automático" : "Manual"}</td>
                    <td className={tdClass}>{record.reason || "—"}</td>
                    <td className={tdClass}>{record.user || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SmsHistoryModal({ data, onClose }: { data: SmsHistoryOut; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="flex max-h-[min(86vh,720px)] w-[min(860px,100%)] max-w-[min(860px,100%)] flex-col gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Historial SMS</DialogTitle>
        <DialogDescription className="sr-only">
          Tabla completa de mensajes SMS de la suscripción {data.iccid}.
        </DialogDescription>
        <ModalHeader title="Historial SMS" caption={<span>ICCID <span className="font-mono">{data.iccid}</span> · {data.records.length.toLocaleString("es-CO")} registros</span>} onClose={onClose} />
        <div className="flex-1 overflow-auto">
          {data.records.length === 0 ? (
            <Empty text={`Sin SMS entre ${fmtDate(data.period_start)} y ${fmtDate(data.period_end)}.`} />
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-[1] bg-card">
                <tr className="border-b border-border">
                  <th className={thClass}>Fecha</th>
                  <th className={thClass}>Tipo</th>
                  <th className={thClass}>Mensaje</th>
                  <th className={thClass}>GW</th>
                  <th className={thClass}>SC</th>
                </tr>
              </thead>
              <tbody>
                {data.records.map((record, index) => <SmsRow key={`${record.date}-${index}`} record={record} />)}
              </tbody>
            </table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ModalHeader({ title, caption, onClose }: { title: string; caption: ReactNode; onClose: () => void }) {
  return (
    <div className="flex items-center gap-3 border-b border-divider px-[18px] py-3.5">
      <h3 className="m-0 flex-1 text-base text-title">{title}</h3>
      <span className="text-xs text-muted">{caption}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="rounded px-1.5 text-lg text-muted transition-colors hover:text-title focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-header-accent"
      >
        ×
      </button>
    </div>
  )
}

function SmsRow({ record }: { record: SmsHistoryRecord }) {
  return (
    <tr>
      <td className={cn(tdClass, "whitespace-nowrap font-mono")}>{fmtDate(record.date)}</td>
      <td className={cn(tdClass, "font-bold", record.sms_type === "MO" ? "text-success-bg" : "text-header-bg")}>{record.sms_type}</td>
      <td className={cn(tdClass, "max-w-[380px] break-words")}>{record.message || "—"}</td>
      <td className={cn(tdClass, "font-mono")}>{deliveryGlyph(record.gateway_delivered)}</td>
      <td className={cn(tdClass, "font-mono")}>{deliveryGlyph(record.sms_center_delivered)}</td>
    </tr>
  )
}

function deliveryGlyph(value: boolean | null): string {
  if (value === true) return "✓"
  if (value === false) return "✗"
  return "—"
}

function truncate(text: string, max: number): string {
  if (!text) return ""
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}
