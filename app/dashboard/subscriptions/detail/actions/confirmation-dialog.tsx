"use client"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Input,
} from "@/components/ui"
import type { SubscriptionOut } from "@/lib/types/api"
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
  const confirmDisabled = busy || !servicesValid || !purgeConfirmValid

  return (
    <AlertDialog open onOpenChange={(open) => { if (!open && !busy) onCancel() }}>
      <AlertDialogContent className="w-[min(92vw,520px)] gap-0 overflow-hidden p-0">
        <AlertDialogHeader className="border-b border-divider px-[18px] py-4">
          <AlertDialogTitle className="text-base">
            {pending.kind === "status" ? "Confirmar cambio de estado" : "Confirmar purga"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            ICCID <span className="font-mono">{subscription.iccid}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-3.5 p-[18px]">
          {pending.kind === "status" ? (
            <>
              <p className="m-0 text-sm text-text">
                Enviar cambio a <span className="font-mono font-extrabold">{pending.target}</span> en {sourceName}.
              </p>
              {isMoabitsServiceTarget && (
                <div className="grid gap-2">
                  <label className="flex items-center gap-2 text-[13px] font-bold text-text">
                    <input
                      type="checkbox"
                      checked={pending.dataService}
                      onChange={(event) => onPendingChange({ ...pending, dataService: event.target.checked })}
                      className="h-4 w-4 accent-header-accent"
                    />
                    Habilitar servicio de datos
                  </label>
                  <label className="flex items-center gap-2 text-[13px] font-bold text-text">
                    <input
                      type="checkbox"
                      checked={pending.smsService}
                      onChange={(event) => onPendingChange({ ...pending, smsService: event.target.checked })}
                      className="h-4 w-4 accent-header-accent"
                    />
                    Habilitar servicio SMS
                  </label>
                  {!servicesValid && (
                    <p role="alert" className="m-0 text-xs text-danger-action">
                      Moabits requiere datos o SMS activo para este cambio.
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <label className="grid gap-2 text-[13px] font-bold text-text">
              Escribe el ICCID para confirmar
              <Input
                value={pending.confirmText ?? ""}
                onChange={(event) => onPendingChange({ ...pending, confirmText: event.target.value })}
                className="font-mono"
                autoFocus
              />
            </label>
          )}
        </div>
        <AlertDialogFooter className="border-t border-divider p-3.5">
          <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={confirmDisabled}
            aria-busy={busy || undefined}
            loading={busy}
            loadingText="Cargando..."
            variant={pending.kind === "purge" ? "destructive" : "default"}
          >
            Confirmar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
