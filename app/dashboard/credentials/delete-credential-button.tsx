"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Trash2 } from "lucide-react"
import { deactivateCompanyCredential, deactivateCredential } from "@/app/actions/credentials"
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
  toast,
} from "@/components/ui"
import type { Provider } from "@/lib/types/api"
import { providerName } from "./credential-utils"

export function DeleteCredentialButton({
  provider,
  companyId,
}: {
  provider: Provider
  companyId?: string
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setLoading(true)
    try {
      const result = companyId
        ? await deactivateCompanyCredential(companyId, provider)
        : await deactivateCredential(provider)

      if (!result.ok) {
        toast.error(result.error)
        return
      }

      toast.success(`Credencial de ${providerName(provider)} desactivada`)
      setOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo desactivar la credencial")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          title="Eliminar credencial"
          aria-label={`Eliminar credencial de ${providerName(provider)}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-warning-soft text-warning-text-soft hover:bg-[#FEEAC8] hover:text-warning-hover-soft"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </AlertDialogTrigger>

      <AlertDialogContent className="gap-5">
        <AlertDialogHeader className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-warning-soft text-warning-icon-soft">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <AlertDialogTitle>Desactivar credencial de {providerName(provider)}</AlertDialogTitle>
              <AlertDialogDescription className="mt-1">
                {providerName(provider)} quedará sin credenciales activas para sincronización y operaciones hasta que configures unas nuevas.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="rounded-md border border-warning-border-soft bg-warning-soft px-3 py-2 text-sm font-medium text-warning-text-soft">
          Esta acción no elimina datos históricos, pero detiene el uso de estas credenciales de inmediato.
        </div>

        <AlertDialogFooter className="pt-1">
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <Button
            type="button"
            disabled={loading}
            loading={loading}
            loadingText="Desactivando..."
            onClick={() => void handleDelete()}
            className="border-0 bg-warning-text-soft text-white shadow-sm hover:bg-warning-hover-soft"
          >
            Desactivar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
