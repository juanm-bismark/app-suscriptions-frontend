"use client"

import { useMemo, useState } from "react"
import { Check, Search } from "lucide-react"
import type { SearchOption } from "./types"

type SearchableSelectProps = {
  value: string
  options: SearchOption[]
  onSelect: (value: string) => void
  placeholder?: string
  disabled?: boolean
  emptyText?: string
}

export function SearchableSelect({
  value,
  options,
  onSelect,
  placeholder = "Selecciona...",
  disabled = false,
  emptyText = "Sin resultados.",
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    if (!normalized) return options
    return options.filter((option) => option.searchText.toLowerCase().includes(normalized))
  }, [options, search])

  const selected = options.find((option) => option.value === value)

  function handleSelect(optionValue: string) {
    onSelect(optionValue)
    setOpen(false)
    setSearch("")
  }

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-md border-0 bg-white/85 px-3 py-2 text-left text-sm shadow-sm shadow-header-top/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-header-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={selected ? "text-title" : "text-muted"}>
          {selected ? selected.title : placeholder}
        </span>
        <Check className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-md border border-soft-border bg-white shadow-lg shadow-header-top/10">
          <div className="border-b border-metric-soft p-2">
            <div className="flex h-8 items-center gap-2 rounded-md bg-panel-soft px-2">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
              <input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar..."
                className="h-full min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length > 0 ? (
              filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-panel-soft"
                >
                  <span className="font-medium text-title">{option.title}</span>
                  {option.detail && (
                    <span className="font-mono text-xs text-muted">{option.detail}</span>
                  )}
                </button>
              ))
            ) : (
              <p className="px-3 py-4 text-center text-xs text-muted">{emptyText}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
