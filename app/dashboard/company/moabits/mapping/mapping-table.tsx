"use client"

import { Trash2 } from "lucide-react"
import type { LocalCompanyMoabitsMappingOut } from "@/lib/types/api"
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui"
import type { MoabitsOption } from "./types"
import { findMoabitsOption, formatDate } from "./utils"

export function MappingTable({
  rows,
  query,
  moabitsOptions,
  confirmingId,
  deletingId,
  onEdit,
  onConfirmRemove,
  onCancelRemove,
  onRemove,
}: {
  rows: LocalCompanyMoabitsMappingOut[]
  query: string
  moabitsOptions: MoabitsOption[]
  confirmingId: string | null
  deletingId: string | null
  onEdit: (row: LocalCompanyMoabitsMappingOut) => void
  onConfirmRemove: (companyId: string) => void
  onCancelRemove: () => void
  onRemove: (companyId: string) => void
}) {
  return (
    <div className="mt-4 overflow-hidden rounded-lg bg-white/65 shadow-sm shadow-header-top/5">
      <Table>
        <TableHeader className="bg-hover-soft">
          <TableRow className="border-0 hover:bg-transparent">
            <TableHead>Empresa BD</TableHead>
            <TableHead>Moabits</TableHead>
            <TableHead>Actualizacion BD</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((row) => {
              const mapping = row.mapping
              const moabitsCompany = mapping ? findMoabitsOption(moabitsOptions, mapping.companyCode) : null
              return (
                <TableRow key={row.company_id} className="border-0 hover:bg-white/70">
                  <TableCell>
                    <span className="block truncate font-medium text-title">{row.company_name}</span>
                    <span className="block truncate font-mono text-xs text-muted">{row.company_id}</span>
                  </TableCell>
                  <TableCell>
                    <span className="block truncate font-medium text-title">
                      {mapping?.companyName ?? moabitsCompany?.companyName ?? mapping?.companyCode}
                    </span>
                    <span className="block font-mono text-xs text-muted">
                      {mapping?.companyCode} · clie_id {mapping?.clie_id ?? "sin dato"}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted">{formatDate(mapping?.updated_at)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onEdit(row)}
                        className="border-0 bg-hover-soft text-action-soft shadow-sm shadow-header-top/5 hover:bg-accent-soft hover:text-ink-teal"
                      >
                        Editar vinculo
                      </Button>
                      {confirmingId === row.company_id ? (
                        <>
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => onRemove(row.company_id)}
                            disabled={deletingId === row.company_id}
                            loading={deletingId === row.company_id}
                            loadingText="Quitando..."
                            className="gap-1.5 border-0"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                            ¿Confirmar?
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={onCancelRemove}
                            className="border-0 bg-white/80 text-action-soft shadow-sm shadow-header-top/5 hover:bg-white hover:text-ink-teal"
                          >
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => onConfirmRemove(row.company_id)}
                          disabled={deletingId === row.company_id}
                          className="gap-1.5 border-0 bg-danger-soft text-danger-text-soft shadow-sm shadow-header-top/5 hover:bg-danger-tint hover:text-danger-action-dark"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          Quitar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          ) : (
            <TableRow className="border-0 hover:bg-transparent">
              <TableCell colSpan={4} className="py-8 text-center text-sm text-muted">
                {query
                  ? `No se encontraron vinculaciones con "${query}".`
                  : "No hay vinculaciones Moabits guardadas."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
