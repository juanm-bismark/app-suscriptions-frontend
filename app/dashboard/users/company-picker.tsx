"use client"

import { useState } from "react"
import { Building2, ChevronDown, Search, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Company } from "@/lib/types/user"

export function CompanyPicker({
  companies,
  value,
  onChange,
  error,
}: {
  companies: Company[]
  value: string
  onChange: (id: string) => void
  error?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const selected = companies.find((c) => c.id === value) ?? null

  const filtered = query.trim()
    ? companies.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
    : companies

  function handleSelect(id: string) {
    onChange(id)
    setOpen(false)
    setQuery("")
  }

  function handleClear() {
    onChange("")
  }

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium leading-none text-title">Empresa</p>

      <div className="relative">
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className={`flex h-11 w-full items-center gap-2 rounded-md border bg-white/80 px-3 text-sm shadow-sm shadow-header-top/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-header-accent ${
            error
              ? "border-destructive"
              : selected
              ? "border-soft-focus text-title"
              : "border-soft-border text-muted"
          } ${selected ? "pr-10" : ""}`}
        >
          <Building2 className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-left">
            {selected ? (
              <span className="font-medium text-title">{selected.name}</span>
            ) : (
              <span className="text-muted">Seleccionar empresa...</span>
            )}
          </span>
          {!selected && <ChevronDown className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />}
        </button>
        {selected && (
          <button
            type="button"
            aria-label="Quitar empresa"
            onClick={handleClear}
            className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-hover-soft hover:text-title focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-header-accent"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        )}
      </div>

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setQuery("") }}>
        <DialogContent className="max-w-sm gap-0 p-0">
          <DialogHeader className="border-b border-soft-border px-4 py-3">
            <DialogTitle className="text-base text-title">Seleccionar empresa</DialogTitle>
            <DialogDescription className="sr-only">
              Busca y selecciona la empresa a la que pertenecerá el usuario.
            </DialogDescription>
          </DialogHeader>

          <div className="border-b border-soft-border px-3 py-2">
            <div className="flex h-9 items-center gap-2 rounded-md border border-soft-border/35 bg-panel-soft px-2.5 focus-within:ring-2 focus-within:ring-header-accent">
              <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar empresa..."
                className="h-full flex-1 bg-transparent text-sm text-title outline-none placeholder:text-muted"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Limpiar búsqueda"
                  onClick={() => setQuery("")}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted hover:bg-hover-soft hover:text-title"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto py-1" role="listbox" aria-label="Empresas">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 px-4 py-8 text-center">
                <Building2 className="h-8 w-8 text-muted/40" aria-hidden="true" />
                <p className="text-sm font-medium text-title">
                  {companies.length === 0 ? "No hay empresas" : "Sin resultados"}
                </p>
                <p className="text-xs text-muted">
                  {companies.length === 0
                    ? "Crea una empresa antes de añadir usuarios."
                    : `Ninguna empresa coincide con "${query}"`}
                </p>
              </div>
            ) : (
              filtered.map((company) => {
                const isSelected = company.id === value
                return (
                  <button
                    key={company.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(company.id)}
                    className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-header-accent ${
                      isSelected
                        ? "bg-accent-soft text-title"
                        : "text-title hover:bg-hover-soft"
                    }`}
                  >
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${isSelected ? "bg-header-accent/20 text-action-teal" : "bg-table-header-bg text-muted"}`}>
                      <Building2 className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">{company.name}</span>
                    {isSelected && (
                      <span className="shrink-0 text-xs text-action-teal">Seleccionada</span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
