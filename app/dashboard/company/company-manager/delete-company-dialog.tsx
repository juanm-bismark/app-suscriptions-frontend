"use client"

import type { Company } from "@/lib/types/user"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

export function DeleteCompanyDialog({
  company,
  deleting,
  open,
  onOpenChange,
  onConfirm,
}: {
  company: Company
  deleting: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar empresa</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará {company.name}. No se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            loading={deleting}
            loadingText="Eliminando..."
            onClick={onConfirm}
            className="border-[#DC2626] bg-[#DC2626] text-white hover:bg-[#B91C1C] hover:text-white"
          >
            Eliminar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
