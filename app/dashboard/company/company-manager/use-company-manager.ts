"use client"

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import {
  createCompany,
  deleteCompany,
  searchCompanies,
  updateCompany,
} from "@/app/actions/company"
import type { Company } from "@/lib/types/user"
import type { CompanyManagerProps } from "./types"

export function useCompanyManager({
  initialCompanies,
  initialTotal,
  initialPage,
  initialSize,
  initialPages,
  initialQuery,
  initialError,
}: CompanyManagerProps) {
  const [query, setQuery] = useState(initialQuery)
  const [companies, setCompanies] = useState(initialCompanies)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialSize)
  const [pages, setPages] = useState(initialPages)
  const [selected, setSelected] = useState<Company | null>(null)
  const selectedIdRef = useRef<string | null>(null)
  const [draftName, setDraftName] = useState("")
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(initialError ?? null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      async function loadCompanies() {
        setIsSearching(true)
        setSearchError(null)

        try {
          const result = await searchCompanies({ q: query, page, size: pageSize })

          if (!active) return

          if (result.success !== true) {
            setSearchError(result.error ?? "No se pudieron cargar las empresas")
            return
          }

          const params = new URLSearchParams({
            page: String(result.page),
            size: String(result.size),
          })
          const cleanQuery = query.trim()
          if (cleanQuery) params.set("q", cleanQuery)
          window.history.replaceState(null, "", `/dashboard/company?${params.toString()}`)

          setCompanies(result.companies)
          const selectedId = selectedIdRef.current
          if (selectedId && !result.companies.some((company) => company.id === selectedId)) {
            clearSelectedCompany()
          }
          setTotal(result.total)
          setPage(result.page)
          setPageSize(result.size)
          setPages(result.pages)
        } finally {
          if (active) setIsSearching(false)
        }
      }

      void loadCompanies()
    }, 250)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [query, page, pageSize, reloadToken])

  const selectedCreatedAt = useMemo(() => {
    if (!selected) return null
    const date = new Date(selected.created_at)
    if (Number.isNaN(date.getTime())) return "N/A"
    return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(date)
  }, [selected])

  function selectCompany(company: Company) {
    selectedIdRef.current = company.id
    setSelected(company)
    setDraftName(company.name)
    setIsCreatingNew(false)
    setDeleteTarget(null)
    setSaveError(null)
    setSuccess(null)
  }

  function clearSelectedCompany() {
    selectedIdRef.current = null
    setSelected(null)
    setDraftName("")
    setIsCreatingNew(false)
    setDeleteTarget(null)
    setSaveError(null)
    setSuccess(null)
  }

  function startCreateCompany() {
    selectedIdRef.current = null
    setSelected(null)
    setDraftName("")
    setIsCreatingNew(true)
    setDeleteTarget(null)
    setSaveError(null)
    setSuccess(null)
  }

  function requestDeleteCompany(company: Company) {
    setDeleteTarget(company)
    setSaveError(null)
    setSuccess(null)
  }

  function updateDeleteDialogOpen(open: boolean) {
    if (!open && !isDeleting) {
      setDeleteTarget(null)
    }
  }

  function updateQuery(value: string) {
    setQuery(value)
    setPage(1)
  }

  function goToPage(nextPage: number) {
    if (nextPage === page || nextPage < 1) return
    if (pages !== null && nextPage > pages) return
    setPage(nextPage)
  }

  function updatePageSize(nextSize: number) {
    setPageSize(nextSize)
    setPage(1)
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isCreatingNew && !selected) return

    setIsSaving(true)
    setSaveError(null)
    setSuccess(null)

    const formData = new FormData()
    formData.append("name", draftName)

    if (isCreatingNew) {
      const result = await createCompany(formData).finally(() => setIsSaving(false))

      if (result.success !== true) {
        setSaveError(result.error ?? "No se pudo crear la empresa")
        return
      }

      selectedIdRef.current = result.company.id
      setSelected(result.company)
      setDraftName(result.company.name)
      setIsCreatingNew(false)
      setQuery("")
      setPage(1)
      setReloadToken((value) => value + 1)
      setSuccess(result.message || "Empresa creada")
      return
    }

    if (!selected) {
      setIsSaving(false)
      return
    }

    formData.append("id", selected.id)
    const result = await updateCompany(formData).finally(() => setIsSaving(false))

    if (result.success !== true) {
      setSaveError(result.error ?? "No se pudo actualizar la empresa")
      return
    }

    const updated = result.company
    selectedIdRef.current = updated.id
    setSelected(updated)
    setCompanies((items) => items.map((company) => company.id === updated.id ? updated : company))
    setSuccess(result.message || "Empresa actualizada")
  }

  async function onDeleteTarget() {
    if (!deleteTarget) return

    setIsDeleting(true)
    setSaveError(null)
    setSuccess(null)

    const companyToDelete = deleteTarget
    const deletedId = companyToDelete.id
    const isLastCompanyOnPage = companies.length === 1
    const formData = new FormData()
    formData.append("id", deletedId)

    const result = await deleteCompany(formData).finally(() => setIsDeleting(false))

    if (result.success !== true) {
      setDeleteTarget(null)
      setSaveError(result.error ?? "No se pudo eliminar la empresa")
      return
    }

    setDeleteTarget(null)
    if (selectedIdRef.current === deletedId) {
      selectedIdRef.current = null
      setSelected(null)
      setDraftName("")
      setIsCreatingNew(false)
    }
    setCompanies((items) => items.filter((company) => company.id !== deletedId))
    setTotal((current) => current === null ? current : Math.max(0, current - 1))
    if (isLastCompanyOnPage && page > 1) {
      setPage(page - 1)
    } else {
      setReloadToken((value) => value + 1)
    }
    setSuccess(result.message || "Empresa eliminada")
  }

  return {
    clearSelectedCompany,
    companies,
    deleteTarget,
    draftName,
    goToPage,
    isCreatingNew,
    isDeleting,
    isSaving,
    isSearching,
    onDeleteTarget,
    onSubmit,
    page,
    pageSize,
    pages,
    query,
    requestDeleteCompany,
    saveError,
    searchError,
    selected,
    selectedCreatedAt,
    selectCompany,
    setDraftName,
    startCreateCompany,
    success,
    total,
    updateDeleteDialogOpen,
    updatePageSize,
    updateQuery,
  }
}
