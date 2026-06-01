"use client"

import { useEffect, useState } from "react"
import { searchCompanies } from "@/app/actions/company"
import type { Company } from "@/lib/types/user"

export function useCompanyListing({
  initialCompanies,
  initialTotal,
  initialPage,
  initialSize,
  initialPages,
  initialQuery,
  initialError,
}: {
  initialCompanies: Company[]
  initialTotal: number | null
  initialPage: number
  initialSize: number
  initialPages: number | null
  initialQuery: string
  initialError?: string | null
}) {
  const [query, setQuery] = useState(initialQuery)
  const [companies, setCompanies] = useState(initialCompanies)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialSize)
  const [pages, setPages] = useState(initialPages)
  const [searchError, setSearchError] = useState<string | null>(initialError ?? null)
  const [isSearching, setIsSearching] = useState(false)
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

  function reload() {
    setReloadToken((value) => value + 1)
  }

  function replaceCompany(updated: Company) {
    setCompanies((items) => items.map((company) => company.id === updated.id ? updated : company))
  }

  function removeCompany(deletedId: string) {
    setCompanies((items) => items.filter((company) => company.id !== deletedId))
    setTotal((current) => current === null ? current : Math.max(0, current - 1))
  }

  function resetToFirstPage() {
    setPage(1)
  }

  return {
    companies,
    goToPage,
    isSearching,
    page,
    pageSize,
    pages,
    query,
    reload,
    removeCompany,
    replaceCompany,
    resetToFirstPage,
    searchError,
    setQuery,
    total,
    updatePageSize,
    updateQuery,
  }
}
