"use client"

import { Loader2 } from "lucide-react"
import type { SubscriptionOut } from "@/lib/types/api"
import { T } from "../../tokens"
import type { PendingAction } from "./types"

export function ConfirmationDialog({
  pending,
  busy,
  subscription,
  sourceName,
  isMoabitsServiceTarget,
  servicesValid,
  purgeConfirmValid,
  onPendingChange,
  onCancel,
  onSubmit,
}: {
  pending: PendingAction
  busy: boolean
  subscription: SubscriptionOut
  sourceName: string
  isMoabitsServiceTarget: boolean
  servicesValid: boolean
  purgeConfirmValid: boolean
  onPendingChange: (pending: PendingAction) => void
  onCancel: () => void
  onSubmit: () => void
}) {
  return (
    <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(15, 23, 42, 0.42)", display: "grid", placeItems: "center", padding: 18 }}>
      <div style={{ width: "min(520px, 100%)", background: T.cardBg, borderRadius: 8, border: `1px solid ${T.border}`, boxShadow: "0 24px 80px rgba(15, 23, 42, 0.22)", overflow: "hidden" }}>
        <div style={{ padding: "16px 18px", borderBottom: `1px solid ${T.divider}` }}>
          <h3 style={{ margin: 0, color: T.title, fontSize: 16 }}>
            {pending.kind === "status" ? "Confirmar cambio de estado" : "Confirmar purga"}
          </h3>
          <p style={{ margin: "6px 0 0", color: T.muted, fontSize: 13 }}>
            ICCID <span style={{ fontFamily: T.fontMono }}>{subscription.iccid}</span>
          </p>
        </div>
        <div style={{ padding: 18, display: "grid", gap: 14 }}>
          {pending.kind === "status" ? (
            <>
              <p style={{ margin: 0, color: T.text, fontSize: 14 }}>
                Enviar cambio a <span style={{ fontFamily: T.fontMono, fontWeight: 800 }}>{pending.target}</span> en {sourceName}.
              </p>
              {isMoabitsServiceTarget && (
                <div style={{ display: "grid", gap: 8 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, color: T.text, fontSize: 13, fontWeight: 700 }}>
                    <input type="checkbox" checked={pending.dataService} onChange={(event) => onPendingChange({ ...pending, dataService: event.target.checked })} />
                    Habilitar servicio de datos
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, color: T.text, fontSize: 13, fontWeight: 700 }}>
                    <input type="checkbox" checked={pending.smsService} onChange={(event) => onPendingChange({ ...pending, smsService: event.target.checked })} />
                    Habilitar servicio SMS
                  </label>
                  {!servicesValid && <p style={{ margin: 0, color: T.danger, fontSize: 12 }}>Moabits requiere datos o SMS activo para este cambio.</p>}
                </div>
              )}
            </>
          ) : (
            <label style={{ display: "grid", gap: 7, color: T.text, fontSize: 13, fontWeight: 700 }}>
              Escribe el ICCID para confirmar
              <input
                value={pending.confirmText ?? ""}
                onChange={(event) => onPendingChange({ ...pending, confirmText: event.target.value })}
                style={{ border: `1px solid ${T.border}`, borderRadius: 5, padding: "9px 10px", fontFamily: T.fontMono, color: T.text }}
                autoFocus
              />
            </label>
          )}
        </div>
        <div style={{ padding: 14, borderTop: `1px solid ${T.divider}`, display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" onClick={onCancel} disabled={busy} style={{ border: `1px solid ${T.border}`, background: T.cardBg, color: T.text, borderRadius: 5, padding: "9px 11px", cursor: busy ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 800 }}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={busy || !servicesValid || !purgeConfirmValid}
            aria-busy={busy || undefined}
            style={{ border: "1px solid transparent", background: busy || !servicesValid || !purgeConfirmValid ? "#C7CDD4" : T.title, color: "#FFFFFF", borderRadius: 5, padding: "9px 11px", cursor: busy || !servicesValid || !purgeConfirmValid ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 7 }}
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
            {busy ? "Cargando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  )
}

