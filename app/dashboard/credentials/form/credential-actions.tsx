"use client"

import { AlertTriangle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from "@/components/ui"
import type { Provider } from "@/lib/types/api"
import { dashboardStyles } from "../../_components/dashboard-styles"
import { providerName } from "../credential-utils"

export function CredentialActions({
  provider,
  isAdmin,
  credentialActive,
  submitting,
  submittingMode,
  deactivating,
  onTest,
  onDeactivate,
}: {
  provider: Provider
  isAdmin: boolean
  credentialActive: boolean
  submitting: boolean
  submittingMode: "test" | "save" | null
  deactivating: boolean
  onTest: () => void
  onDeactivate: () => void
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-header-top/10 pt-3 sm:flex-row">
      <Button
        type="button"
        disabled={submitting}
        loading={submittingMode === "test"}
        loadingText="Probando..."
        onClick={onTest}
        className={dashboardStyles.softButton}
      >
        Probar
      </Button>
      <Button
        type="submit"
        disabled={submitting}
        loading={submittingMode === "save"}
        loadingText="Guardando..."
        className={dashboardStyles.primaryAction}
      >
        Guardar
      </Button>
      {isAdmin && credentialActive && (
        <DeactivateCredentialDialog
          provider={provider}
          deactivating={deactivating}
          submitting={submitting}
          onDeactivate={onDeactivate}
        />
      )}
    </div>
  )
}

function DeactivateCredentialDialog({
  provider,
  deactivating,
  submitting,
  onDeactivate,
}: {
  provider: Provider
  deactivating: boolean
  submitting: boolean
  onDeactivate: () => void
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          disabled={submitting || deactivating}
          className="border-0 bg-white/80 text-warning-text-soft shadow-sm shadow-header-top/5 hover:bg-warning-soft hover:text-warning-hover-soft sm:ml-auto"
        >
          Desactivar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="gap-5">
        <AlertDialogHeader className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-warning-soft text-warning-icon-soft">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <AlertDialogTitle>Desactivar credenciales</AlertDialogTitle>
              <AlertDialogDescription className="mt-1">
                {providerName(provider)} quedara sin credenciales activas para sincronizacion y pruebas hasta que guardes unas nuevas.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <div className="rounded-md border border-warning-border-soft/45 bg-warning-soft px-3 py-2 text-sm font-medium text-warning-text-soft">
          Esta accion no elimina datos historicos, pero detiene el uso de estas credenciales.
        </div>
        <AlertDialogFooter className="pt-1">
          <AlertDialogCancel disabled={deactivating}>Mantener activas</AlertDialogCancel>
          <Button
            type="button"
            disabled={deactivating}
            loading={deactivating}
            loadingText="Desactivando..."
            onClick={onDeactivate}
            className="border-0 bg-warning-text-soft text-white shadow-sm hover:bg-warning-hover-soft"
          >
            Desactivar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
