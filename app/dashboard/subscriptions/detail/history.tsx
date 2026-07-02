"use client"

import type { SmsHistoryOut, SmsHistoryRecord, StatusHistoryOut, StatusHistoryRecord, SubscriptionOut } from "@/lib/types/api"
import { type ReactNode, useState } from "react"
import { fmtDate } from "../data"
import { Btn, Icon } from "../primitives"
import { T } from "../tokens"
import { useSmsHistory, useStatusHistory } from "./hooks"
import { Card, Empty, KV } from "./primitives"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"

const smsTh = { textAlign: "left", padding: "8px 12px", color: T.muted, fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", fontWeight: 700 } as const
const smsTd = { padding: "8px 12px", color: T.text, borderBottom: `1px solid ${T.divider}`, verticalAlign: "top" } as const

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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
              <KV label="Último SMS recibido (MO)" value={moLabel} sub={lastMo ? truncate(lastMo.message, 60) : undefined} />
              <KV label="Último SMS enviado (MT)" value={mtLabel} sub={lastMt ? truncate(lastMt.message, 60) : undefined} />
              <KV label="Delivery último MT" value={deliveryLabel} mono />
              <KV label="Total registros" value={state.data.records.length.toLocaleString("es-CO")} sub={`Periodo: ${fmtDate(state.data.period_start)} a ${fmtDate(state.data.period_end)}`} />
            </div>
            <div style={{ padding: "12px 16px", borderTop: `1px solid ${T.divider}`, display: "flex", gap: 8 }}>
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
          <div style={{ display: "grid" }}>
            {state.data.records.slice(0, 8).map((record, index) => (
              <StatusHistoryRow key={`${record.time}-${index}`} record={record} />
            ))}
          </div>
          <div style={{ padding: "12px 16px", borderTop: `1px solid ${T.divider}`, display: "flex", gap: 8 }}>
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
    <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 14, padding: "10px 16px", borderTop: `1px solid ${T.divider}` }}>
      <div style={{ fontFamily: T.fontMono, color: T.muted, fontSize: 12 }}>{fmtDate(record.time)}</div>
      <div>
        <div style={{ color: T.title, fontWeight: 750, fontSize: 13 }}>{record.state}</div>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 2 }}>
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
        <ModalHeader title="Historial de estados" caption={<span>ICCID <span style={{ fontFamily: T.fontMono }}>{data.iccid}</span> · {data.records.length.toLocaleString("es-CO")} cambios</span>} onClose={onClose} />
        <div style={{ overflow: "auto", flex: 1 }}>
          {data.records.length === 0 ? (
            <Empty text="Sin cambios de estado en el periodo." />
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead style={{ position: "sticky", top: 0, background: T.cardBg, zIndex: 1 }}>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  <th style={smsTh}>Fecha</th>
                  <th style={smsTh}>Estado</th>
                  <th style={smsTh}>Origen</th>
                  <th style={smsTh}>Motivo</th>
                  <th style={smsTh}>Usuario</th>
                </tr>
              </thead>
              <tbody>
                {data.records.map((record, index) => (
                  <tr key={`${record.time}-${index}`}>
                    <td style={{ ...smsTd, fontFamily: T.fontMono, whiteSpace: "nowrap" }}>{fmtDate(record.time)}</td>
                    <td style={{ ...smsTd, fontWeight: 700 }}>{record.state}</td>
                    <td style={smsTd}>{record.automatic ? "Automático" : "Manual"}</td>
                    <td style={smsTd}>{record.reason || "—"}</td>
                    <td style={smsTd}>{record.user || "—"}</td>
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
        <ModalHeader title="Historial SMS" caption={<span>ICCID <span style={{ fontFamily: T.fontMono }}>{data.iccid}</span> · {data.records.length.toLocaleString("es-CO")} registros</span>} onClose={onClose} />
        <div style={{ overflow: "auto", flex: 1 }}>
          {data.records.length === 0 ? (
            <Empty text={`Sin SMS entre ${fmtDate(data.period_start)} y ${fmtDate(data.period_end)}.`} />
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead style={{ position: "sticky", top: 0, background: T.cardBg, zIndex: 1 }}>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  <th style={smsTh}>Fecha</th>
                  <th style={smsTh}>Tipo</th>
                  <th style={smsTh}>Mensaje</th>
                  <th style={smsTh}>GW</th>
                  <th style={smsTh}>SC</th>
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
    <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.divider}`, display: "flex", alignItems: "center", gap: 12 }}>
      <h3 style={{ margin: 0, color: T.title, fontSize: 16, flex: 1 }}>{title}</h3>
      <span style={{ fontSize: 12, color: T.muted }}>{caption}</span>
      <button type="button" onClick={onClose} aria-label="Cerrar" style={{ background: "transparent", border: "none", cursor: "pointer", color: T.muted, fontSize: 18, padding: "0 6px" }}>×</button>
    </div>
  )
}

function SmsRow({ record }: { record: SmsHistoryRecord }) {
  const typeColor = record.sms_type === "MO" ? T.success : T.headerBg
  return (
    <tr>
      <td style={{ ...smsTd, fontFamily: T.fontMono, whiteSpace: "nowrap" }}>{fmtDate(record.date)}</td>
      <td style={{ ...smsTd, fontWeight: 700, color: typeColor }}>{record.sms_type}</td>
      <td style={{ ...smsTd, maxWidth: 380, wordBreak: "break-word" }}>{record.message || "—"}</td>
      <td style={{ ...smsTd, fontFamily: T.fontMono }}>{deliveryGlyph(record.gateway_delivered)}</td>
      <td style={{ ...smsTd, fontFamily: T.fontMono }}>{deliveryGlyph(record.sms_center_delivered)}</td>
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
