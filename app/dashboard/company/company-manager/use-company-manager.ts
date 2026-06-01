"use client"

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import {
  createCompany,
  deleteCompany,
  updateCompany,
} from "@/app/actions/company"
import type { Company } from "@/lib/types/user"
import type { CompanyManagerProps } from "./types"
import { useCompanyListing } from "./use-company-listing"

export function useCompanyManager({
  initialCompanies,
  initialTotal,
  initialPage,
  initialSize,
  initialPages,
  initialQuery,
  initialError,
}: CompanyManagerProps) {
  const listing = useCompanyListing({
    initialCompanies,
    initialTotal,
    initialPage,
    initialSize,
    initialPages,
    initialQuery,
    initialError,
  })
  const [selected, setSelected] = useState<Company | null>(null)
  const selectedIdRef = useRef<string | null>(null)
  const [draftName, setDraftName] = useState("")
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null)

  useEffect(() => {
    const selectedId = selectedIdRef.current
    if (selectedId && !listing.companies.some((company) => company.id === selectedId)) {
      clearSelectedCompany()
    }
  }, [listing.companies])

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
    listing.updateQuery(value)
  }

  function goToPage(nextPage: number) {
    listing.goToPage(nextPage)
  }

  function updatePageSize(nextSize: number) {
    listing.updatePageSize(nextSize)
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
      listing.setQuery("")
      listing.resetToFirstPage()
      listing.reload()
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
    listing.replaceCompany(updated)
    setSuccess(result.message || "Empresa actualizada")
  }

  async function onDeleteTarget() {
    if (!deleteTarget) return

    setIsDeleting(true)
    setSaveError(null)
    setSuccess(null)

    const companyToDelete = deleteTarget
    const deletedId = companyToDelete.id
    const isLastCompanyOnPage = listing.companies.length === 1
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
    listing.removeCompany(deletedId)
    if (isLastCompanyOnPage && listing.page > 1) {
      listing.goToPage(listing.page - 1)
    } else {
      listing.reload()
    }
    setSuccess(result.message || "Empresa eliminada")
  }

  return {
    clearSelectedCompany,
    companies: listing.companies,
    deleteTarget,
    draftName,
    goToPage,
    isCreatingNew,
    isDeleting,
    isSaving,
    isSearching: listing.isSearching,
    onDeleteTarget,
    onSubmit,
    page: listing.page,
    pageSize: listing.pageSize,
    pages: listing.pages,
    query: listing.query,
    requestDeleteCompany,
    saveError,
    searchError: listing.searchError,
    selected,
    selectedCreatedAt,
    selectCompany,
    setDraftName,
    startCreateCompany,
    success,
    total: listing.total,
    updateDeleteDialogOpen,
    updatePageSize,
    updateQuery,
  }
}
