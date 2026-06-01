"use client"

import { Plus, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { dashboardStyles } from "../../_components/dashboard-styles"
import type { Company } from "@/lib/types/user"

export function CompanyEditor({
  selected,
  isCreatingNew,
  draftName,
  selectedCreatedAt,
  saveError,
  success,
  isSaving,
  isDeleting,
  deleteTarget,
  onDraftNameChange,
  onSubmit,
  onCancelCreate,
  onRequestDelete,
}: {
  selected: Company | null
  isCreatingNew: boolean
  draftName: string
  selectedCreatedAt: string | null
  saveError: string | null
  success: string | null
  isSaving: boolean
  isDeleting: boolean
  deleteTarget: Company | null
  onDraftNameChange: (value: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onCancelCreate: () => void
  onRequestDelete: (company: Company) => void
}) {
  return (
    <section className={dashboardStyles.accentPanel}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-title">
            {isCreatingNew ? "Añadir empresa" : "Editar empresa"}
          </h2>
          {selected && !isCreatingNew && (
            <p className="mt-1 break-all font-mono text-xs text-muted">{selected.id}</p>
          )}
        </div>
        {selected && !isCreatingNew && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            title="Eliminar empresa"
            aria-label={`Eliminar empresa ${selected.name}`}
            disabled={isDeleting}
            loading={isDeleting && deleteTarget?.id === selected.id}
            onClick={() => onRequestDelete(selected)}
            className={dashboardStyles.dangerIconButton}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>

      {saveError && <div className="mt-5 rounded-md bg-warn-bg p-3 text-sm text-warn-text">{saveError}</div>}
      {success && <div className={`mt-5 ${dashboardStyles.successNotice}`}>{success}</div>}

      {!selected && !isCreatingNew ? (
        <div className="mt-5 rounded-lg bg-white/65 p-6 text-sm text-muted shadow-sm shadow-header-top/5">
          Selecciona una empresa para editarla o usa el botón para añadir una nueva.
        </div>
      ) : (
        <div className="mt-5 space-y-6">
          <form onSubmit={onSubmit} className="space-y-5">
            {selected && !isCreatingNew && (
              <div>
                <label className="mb-1 block text-sm font-medium text-muted">Creada</label>
                <div className="min-h-11 rounded-md bg-white/65 px-3 py-2.5 text-sm text-muted shadow-sm shadow-header-top/5">
                  {selectedCreatedAt}
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-muted">Nombre de la empresa</label>
              <Input
                value={draftName}
                onChange={(event) => onDraftNameChange(event.target.value)}
                placeholder="Ej. Acme"
                className="border-0 bg-white/85 shadow-sm shadow-header-top/5 focus-visible:ring-header-accent"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                type="submit"
                disabled={isSaving || isDeleting || draftName.trim().length < 2}
                loading={isSaving}
                loadingText={isCreatingNew ? "Añadiendo..." : "Guardando..."}
                className={dashboardStyles.primaryAction}
              >
                {isCreatingNew ? (
                  <Plus className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Save className="h-4 w-4" aria-hidden="true" />
                )}
                {isCreatingNew ? "Añadir empresa" : "Guardar cambios"}
              </Button>
              {isCreatingNew && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving}
                  onClick={onCancelCreate}
                  className={dashboardStyles.softButton}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
