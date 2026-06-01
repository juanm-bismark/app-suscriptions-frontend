"use client"

import { Link2, Save, Trash2, X } from "lucide-react"
import type { LocalCompanyMoabitsMappingOut } from "@/lib/types/api"
import { Button, Input } from "@/components/ui"
import { CompareBox } from "./primitives"
import { SearchableSelect } from "./searchable-select"
import type { Draft, EditorMode, MoabitsOption, SearchOption } from "./types"
import { sourceDetail, sourceLabel } from "./utils"

export function MappingEditor({
  editorMode,
  draft,
  editorLocalCompanyOptions,
  moabitsSearchOptions,
  moabitsOptions,
  moabitsOptionSource,
  discoveryActive,
  selectedLocalCompany,
  selectedMoabitsCompany,
  selectedMoabitsTitle,
  selectedMoabitsDetail,
  selectedMapping,
  linkedElsewhere,
  namesMatch,
  saving,
  deletingId,
  onClose,
  onSelectLocalCompany,
  onSelectMoabitsCompany,
  onDraftChange,
  onSave,
  onRemoveMapping,
}: {
  editorMode: EditorMode
  draft: Draft
  editorLocalCompanyOptions: SearchOption[]
  moabitsSearchOptions: SearchOption[]
  moabitsOptions: MoabitsOption[]
  moabitsOptionSource: string
  discoveryActive: boolean
  selectedLocalCompany: LocalCompanyMoabitsMappingOut | null
  selectedMoabitsCompany: MoabitsOption | null
  selectedMoabitsTitle: string
  selectedMoabitsDetail: string
  selectedMapping: LocalCompanyMoabitsMappingOut["mapping"]
  linkedElsewhere: LocalCompanyMoabitsMappingOut[]
  namesMatch: boolean
  saving: boolean
  deletingId: string | null
  onClose: () => void
  onSelectLocalCompany: (companyId: string) => void
  onSelectMoabitsCompany: (companyCode: string) => void
  onDraftChange: (patch: Partial<Draft>) => void
  onSave: () => void
  onRemoveMapping: (companyId: string) => void
}) {
  return (
    <section className="rounded-lg bg-provider-moabits-soft p-5 shadow-sm shadow-header-top/5 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/70 text-ink-teal">
            <Link2 className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-title">
              {editorMode === "create" ? "Nueva vinculacion Moabits" : "Editar vinculacion Moabits"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {editorMode === "create"
                ? "Empieza sin valores guardados. Selecciona una empresa BD y una empresa Moabits para crear el vinculo."
                : "Abre con datos guardados en BD. Usa Consultar Moabits si quieres comparar con el catalogo en vivo."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          title="Cerrar editor"
          aria-label="Cerrar editor"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-white/70 hover:text-title"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="block space-y-2 text-sm font-medium text-title">
          <span>Empresa en BD</span>
          <SearchableSelect
            value={draft.companyId}
            options={editorLocalCompanyOptions}
            onSelect={onSelectLocalCompany}
            placeholder="Selecciona una empresa local"
            emptyText={
              editorMode === "create"
                ? "No hay empresas locales cargadas."
                : "No hay empresas locales que coincidan."
            }
          />
        </div>

        <div className="block space-y-2 text-sm font-medium text-title">
          <span>Empresa Moabits ({moabitsOptionSource})</span>
          <SearchableSelect
            value={draft.companyCode}
            options={moabitsSearchOptions}
            onSelect={onSelectMoabitsCompany}
            placeholder="Selecciona una empresa Moabits"
            disabled={moabitsSearchOptions.length < 1}
            emptyText="No hay companias Moabits que coincidan."
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <CompareBox
          label="BD propia"
          title={selectedLocalCompany?.company_name ?? "Sin seleccionar"}
          detail={selectedLocalCompany?.company_id ?? "Selecciona una empresa de la BD"}
        />
        <CompareBox
          label={discoveryActive ? "Moabits en vivo" : "Cache Moabits"}
          title={selectedMoabitsTitle}
          detail={selectedMoabitsDetail}
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block space-y-2 text-sm font-medium text-title">
          <span>Codigo Moabits</span>
          <Input
            value={draft.companyCode}
            onChange={(event) => onDraftChange({ companyCode: event.target.value })}
            placeholder="Ej. A123"
            className="border-0 bg-white/85 font-mono shadow-sm shadow-header-top/5 focus-visible:ring-header-accent"
          />
        </label>
        <label className="block space-y-2 text-sm font-medium text-title">
          <span>clie_id</span>
          <Input
            value={draft.clieId}
            onChange={(event) => onDraftChange({ clieId: event.target.value })}
            inputMode="numeric"
            placeholder="Ej. 42"
            className="border-0 bg-white/85 font-mono shadow-sm shadow-header-top/5 focus-visible:ring-header-accent"
          />
        </label>
      </div>

      <label className="mt-4 block space-y-2 text-sm font-medium text-title">
        <span>Nombre guardado para Moabits</span>
        <Input
          value={draft.companyName}
          onChange={(event) => onDraftChange({ companyName: event.target.value })}
          placeholder={selectedLocalCompany?.company_name ?? "Nombre Moabits"}
          className="border-0 bg-white/85 shadow-sm shadow-header-top/5 focus-visible:ring-header-accent"
        />
      </label>

      <div className="mt-4 space-y-2">
        {moabitsOptions.length < 1 && (
          <div className="rounded-md bg-white/65 p-3 text-sm text-muted shadow-sm shadow-header-top/5">
            No hay companias Moabits cargadas. Puedes escribir el codigo manualmente o usar Consultar Moabits.
          </div>
        )}
        {selectedMoabitsCompany && (
          <div className="rounded-md bg-white/65 p-3 text-sm text-muted shadow-sm shadow-header-top/5">
            <span>{sourceLabel(selectedMoabitsCompany.source)}: </span>
            <span className="font-semibold text-title">{selectedMoabitsCompany.companyName}</span>
            <span className="font-mono"> ({selectedMoabitsCompany.companyCode})</span>
            <span> · clie_id {selectedMoabitsCompany.clie_id ?? "sin dato"}</span>
            <span> · {sourceDetail(selectedMoabitsCompany.source)}</span>
            {selectedLocalCompany && <span> · nombre {namesMatch ? "coincide" : "distinto"}</span>}
          </div>
        )}
        {linkedElsewhere.length > 0 && (
          <div className="rounded-md bg-warn-bg p-3 text-sm text-warn-text">
            Esta empresa Moabits ya esta vinculada con {linkedElsewhere.map((item) => item.company_name).join(", ")}.
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          onClick={onSave}
          disabled={saving || !draft.companyId || !draft.companyCode.trim()}
          loading={saving}
          loadingText="Guardando..."
          className="gap-2 bg-header-top text-white shadow-sm shadow-header-top/20 hover:bg-header-bg hover:text-white"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          {editorMode === "create" ? "Crear vinculacion" : "Actualizar solo esta empresa"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={saving || deletingId === draft.companyId}
          className="gap-2 border-0 bg-white/80 text-action-soft shadow-sm shadow-header-top/5 hover:bg-white hover:text-ink-teal"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          Cancelar
        </Button>
        {editorMode === "edit" && selectedMapping && (
          <Button
            type="button"
            variant="destructive"
            onClick={() => onRemoveMapping(draft.companyId)}
            disabled={deletingId === draft.companyId}
            loading={deletingId === draft.companyId}
            loadingText="Quitando..."
            className="gap-2 border-0"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Quitar vinculo
          </Button>
        )}
      </div>
    </section>
  )
}
