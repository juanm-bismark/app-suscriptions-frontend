"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Check, Link2, Plus, RefreshCw, Save, Search, Trash2, X } from "lucide-react"
import Link from "next/link"
import {
  deleteMoabitsProviderMapping,
  discoverMoabitsProviderMappings,
  listMoabitsProviderMappings,
  listMoabitsSourceCompanies,
  upsertMoabitsProviderMapping,
} from "@/app/actions/company"
import { SearchSubmitButton } from "@/app/dashboard/_components/search-submit-button"
import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui"
import { getClientActionErrorMessage } from "@/lib/client-action-error"
import type { Page } from "@/lib/types/user"
import type {
  LocalCompanyMoabitsMappingOut,
  MoabitsCompanyOut,
  MoabitsProviderMappingDiscoveryOut,
} from "@/lib/types/api"
import { MoabitsPaginationControls } from "./moabits-pagination-controls"

type Draft = {
  companyId: string
  companyCode: string
  companyName: string
  clieId: string
}

type MoabitsOption = MoabitsCompanyOut & {
  source: "live" | "cache" | "mapping"
}

type SearchOption = {
  value: string
  title: string
  detail?: string
  searchText: string
}

const EMPTY_DRAFT: Draft = {
  companyId: "",
  companyCode: "",
  companyName: "",
  clieId: "",
}

const EDITOR_COMPANY_PAGE_SIZE = 100
const MOABITS_SOURCE_PAGE_SIZE = 100

export function MoabitsMappingManager({
  initialPage,
  currentPage,
  pageSize,
  query,
}: {
  initialPage: Page<LocalCompanyMoabitsMappingOut>
  currentPage: number
  pageSize: number
  query: string
}) {
  const [linkedRows, setLinkedRows] = useState(initialPage.items)
  const [pageInfo, setPageInfo] = useState<{
    page: number
    pages: number | null
    size: number
    total: number | null
  }>({
    page: initialPage.page,
    pages: initialPage.pages,
    size: initialPage.size,
    total: initialPage.total,
  })

  const [allMappings, setAllMappings] = useState<LocalCompanyMoabitsMappingOut[]>(initialPage.items)
  const [cachedMoabitsCompanies, setCachedMoabitsCompanies] = useState<MoabitsCompanyOut[]>([])

  useEffect(() => {
    let cancelled = false

    void loadAllMappingsFromDb().then((result) => {
      if (!cancelled && result.success) {
        setAllMappings((current) => mergeMappings(current, result.data))
      }
    })
    void loadMoabitsSourceCompaniesFromCache().then((result) => {
      if (!cancelled && result.success) {
        setCachedMoabitsCompanies(result.data)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  const [discovery, setDiscovery] = useState<MoabitsProviderMappingDiscoveryOut | null>(null)
  const [editing, setEditing] = useState(false)
  const [editorMode, setEditorMode] = useState<"create" | "edit" | null>(null)
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [loadingDb, setLoadingDb] = useState(false)
  const [loadingDiscovery, setLoadingDiscovery] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const linkedCount = pageInfo.total ?? linkedRows.length

  const localCompanyOptions = useMemo(
    () => allMappings.map((company) => ({
      value: company.company_id,
      title: company.company_name,
      detail: company.company_id,
      searchText: [
        company.company_name,
        company.company_id,
        company.mapping?.companyCode,
        company.mapping?.companyName,
        company.mapping?.clie_id,
      ].filter(Boolean).join(" "),
    })),
    [allMappings]
  )
  const editorLocalCompanyOptions = localCompanyOptions
  const moabitsOptions = useMemo(
    () =>
      buildMoabitsOptions({
        liveCompanies: discovery?.moabits_companies ?? null,
        cachedCompanies: cachedMoabitsCompanies,
        mappings: allMappings,
      }),
    [discovery, cachedMoabitsCompanies, allMappings]
  )
  const baseMoabitsSearchOptions = useMemo(
    () => moabitsOptions.map((company) => ({
      value: company.companyCode,
      title: company.companyName,
      detail: `${company.companyCode} · clie_id ${company.clie_id ?? "sin dato"} · ${sourceLabel(company.source)}`,
      searchText: [
        company.companyName,
        company.companyCode,
        company.clie_id,
        sourceLabel(company.source),
      ].filter(Boolean).join(" "),
    })),
    [moabitsOptions]
  )
  const moabitsSearchOptions = useMemo(
    () => withSelectedMoabitsOption(baseMoabitsSearchOptions, draft),
    [baseMoabitsSearchOptions, draft]
  )
  const selectedLocalCompany = findMappedCompany(allMappings, draft.companyId)
  const selectedMoabitsCompany = findMoabitsOption(moabitsOptions, draft.companyCode)
  const selectedMoabitsTitle =
    selectedMoabitsCompany?.companyName || draft.companyName || (draft.companyCode ? draft.companyCode : "Sin seleccionar")
  const selectedMoabitsDetail =
    selectedMoabitsCompany?.companyCode || draft.companyCode || "Selecciona una empresa Moabits"
  const selectedMapping = selectedLocalCompany?.mapping ?? null
  const linkedElsewhere = allMappings.filter(
    (item) => item.company_id !== draft.companyId && item.mapping?.companyCode === draft.companyCode
  )
  const namesMatch = namesAreEqual(selectedLocalCompany?.company_name, selectedMoabitsCompany?.companyName)
  const moabitsOptionSource = discovery ? "Moabits en vivo" : "Cache Moabits"

  function closeEditor() {
    setEditing(false)
    setEditorMode(null)
    setDraft(EMPTY_DRAFT)
    setError(null)
  }

  function startCreate() {
    setError(null)
    setSuccess(null)
    setEditorMode("create")
    setEditing(true)
    setDraft(EMPTY_DRAFT)
  }

  function startEdit(row: LocalCompanyMoabitsMappingOut) {
    const company = findMappedCompany(allMappings, row.company_id) ?? row
    if (!company) {
      setError("No se encontro la empresa en los datos cargados desde BD.")
      return
    }

    setAllMappings((current) => mergeMappings(current, [company]))
    setEditing(true)
    setEditorMode("edit")
    setError(null)
    setSuccess(null)
    setDraftFromLocal(company)
  }

  function setDraftFromLocal(companyOrId: string | LocalCompanyMoabitsMappingOut) {
    const companyId = typeof companyOrId === "string" ? companyOrId : companyOrId.company_id
    const localCompany = typeof companyOrId === "string" ? findMappedCompany(allMappings, companyId) : companyOrId
    const mapping = localCompany?.mapping ?? null

    setDraft({
      companyId,
      companyCode: mapping?.companyCode ?? "",
      companyName: mapping?.companyName ?? "",
      clieId: mapping?.clie_id != null ? String(mapping.clie_id) : "",
    })
  }

  function applyMoabitsCompany(companyCode: string) {
    const company = findMoabitsOption(moabitsOptions, companyCode)
    setDraft((current) => ({
      ...current,
      companyCode,
      companyName: company?.companyName ?? current.companyName,
      clieId: company?.clie_id != null ? String(company.clie_id) : "",
    }))
    setError(null)
    setSuccess(null)
  }

  async function refreshDiscoveryOnly() {
    setLoadingDiscovery(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await discoverMoabitsProviderMappings()
      if (result.success !== true) {
        setError(result.error ?? "No se pudo actualizar el descubrimiento Moabits.")
        return null
      }

      setDiscovery(result.data)
      setCachedMoabitsCompanies(result.data.moabits_companies)
      setAllMappings((current) => mergeMappings(current, result.data.local_companies))
      setSuccess("Consulta de Moabits finalizada. La cache de companias Moabits fue actualizada.")
      return result.data
    } catch (error) {
      setError(getClientActionErrorMessage(error, "No se pudo actualizar el descubrimiento Moabits."))
      return null
    } finally {
      setLoadingDiscovery(false)
    }
  }

  async function refreshFromDb({ showSuccess = true }: { showSuccess?: boolean } = {}) {
    setLoadingDb(true)
    setError(null)
    if (showSuccess) setSuccess(null)

    try {
      const [tableResult, allResult, cacheResult] = await Promise.all([
        listMoabitsProviderMappings({ page: currentPage, size: pageSize, q: query, linkedOnly: true }),
        loadAllMappingsFromDb(),
        loadMoabitsSourceCompaniesFromCache(),
      ])

      if (tableResult.success !== true) {
        setError(tableResult.error ?? "No se pudieron actualizar las vinculaciones Moabits.")
        return null
      }
      if (allResult.success !== true) {
        setError(allResult.error ?? "No se pudieron actualizar los datos de empresas.")
        return null
      }
      if (cacheResult.success !== true) {
        setError(cacheResult.error ?? "No se pudo actualizar la cache de companias Moabits.")
        return null
      }

      setLinkedRows(tableResult.data.items)
      setPageInfo({
        page: tableResult.data.page,
        pages: tableResult.data.pages,
        size: tableResult.data.size,
        total: tableResult.data.total,
      })
      setAllMappings(mergeMappings(tableResult.data.items, allResult.data))
      setCachedMoabitsCompanies(cacheResult.data)
      setDiscovery(null)

      if (showSuccess) setSuccess("Cache de companias y vinculaciones actualizadas desde BD.")
      return tableResult.data.items
    } catch (error) {
      setError(getClientActionErrorMessage(error, "No se pudo consultar la cache de companias desde BD."))
      return null
    } finally {
      setLoadingDb(false)
    }
  }

  async function saveMapping() {
    const cleanCompanyId = draft.companyId.trim()
    const cleanCode = draft.companyCode.trim()
    const cleanName = draft.companyName.trim()
    const cleanClieId = draft.clieId.trim()

    if (!cleanCompanyId) {
      setError("Selecciona una empresa de la BD.")
      return
    }

    if (!cleanCode) {
      setError("Selecciona o ingresa el codigo de compania Moabits.")
      return
    }

    if (cleanClieId && !Number.isInteger(Number(cleanClieId))) {
      setError("clie_id debe ser un numero entero.")
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await upsertMoabitsProviderMapping(cleanCompanyId, {
        companyCode: cleanCode,
        companyName: cleanName || null,
        clie_id: cleanClieId ? Number(cleanClieId) : null,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      const refreshed = await refreshFromDb({ showSuccess: false })
      if (!refreshed) return
      setSuccess(
        editorMode === "create"
          ? "Vinculacion Moabits creada para esta empresa."
          : "Vinculacion Moabits actualizada para esta empresa."
      )
      if (editorMode === "create") {
        setEditing(false)
        setEditorMode(null)
        setDraft(EMPTY_DRAFT)
      }
    } catch (error) {
      setError(getClientActionErrorMessage(error, "No se pudo guardar la vinculacion Moabits."))
    } finally {
      setSaving(false)
    }
  }

  async function removeMappingById(companyId: string) {
    setConfirmingId(null)
    setDeletingId(companyId)
    setError(null)
    setSuccess(null)

    try {
      const result = await deleteMoabitsProviderMapping(companyId)
      if (result.error) {
        setError(result.error)
        return
      }

      const refreshed = await refreshFromDb({ showSuccess: false })
      if (!refreshed) return
      if (editing && draft.companyId === companyId) {
        setEditing(false)
        setEditorMode(null)
      }
      setSuccess("Vinculacion Moabits eliminada para esta empresa.")
    } catch (error) {
      setError(getClientActionErrorMessage(error, "No se pudo quitar la vinculacion Moabits."))
    } finally {
      setDeletingId(null)
    }
  }

  const clearSearchHref = `/dashboard/company/moabits?page=1&size=${pageSize}`

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert variant="success">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <section className="rounded-lg bg-[#F5FAFA] p-5 shadow-sm shadow-header-top/5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-title">Vinculaciones actuales</h2>
            <p className="mt-1 text-sm text-muted">
              {linkedCount} vinculacion{linkedCount !== 1 ? "es" : ""} guardada{linkedCount !== 1 ? "s" : ""} en BD.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => void refreshFromDb()}
              loading={loadingDb}
              loadingText="Consultando cache..."
              className="gap-2 border-0 bg-white/80 text-[#285F68] shadow-sm shadow-header-top/5 hover:bg-white hover:text-[#12343B]"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Consultar cache desde BD
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={loadingDiscovery}
                  loading={loadingDiscovery}
                  loadingText="Consultando..."
                  className="gap-2 border-0 bg-white/80 text-[#285F68] shadow-sm shadow-header-top/5 hover:bg-white hover:text-[#12343B]"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Consultar Moabits
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="gap-5">
                <AlertDialogHeader className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#FFF7E7] text-[#765315]">
                      <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <AlertDialogTitle>Consultar Moabits</AlertDialogTitle>
                      <AlertDialogDescription className="mt-1">
                        Al continuar, el backend consultara Moabits y sobreescribira la tabla cache que se usa para
                        linkear companias.
                      </AlertDialogDescription>
                    </div>
                  </div>
                </AlertDialogHeader>
                <div className="rounded-md border border-[#F2D49B] bg-[#FFF7E7] px-3 py-2 text-sm font-medium text-[#6D4D16]">
                  Si en Moabits hubo actualizaciones de codigos para cada compania, esta consulta puede generar
                  informacion incongruente entre companias hasta que se revisen las vinculaciones.
                </div>
                <AlertDialogFooter className="pt-1">
                  <AlertDialogCancel disabled={loadingDiscovery}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction disabled={loadingDiscovery} onClick={() => void refreshDiscoveryOnly()}>
                    Confirmar consulta
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              type="button"
              onClick={startCreate}
              className="gap-2 bg-[#0F202A] text-white shadow-sm shadow-header-top/20 hover:bg-[#163C41] hover:text-white"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nueva vinculacion
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Metric label="BD: empresas locales" value={String(allMappings.length)} />
          <Metric label="BD: vinculos guardados" value={String(linkedCount)} />
          <Metric
            label={discovery ? "Moabits en vivo" : "Cache Moabits"}
            value={String(discovery ? discovery.moabits_companies.length : cachedMoabitsCompanies.length)}
          />
        </div>

        <form
          className="mt-4 flex gap-2"
          action="/dashboard/company/moabits"
          method="get"
        >
          <input type="hidden" name="page" value="1" />
          <input type="hidden" name="size" value={pageSize} />
          <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-md bg-white/80 px-3 shadow-sm shadow-header-top/5 focus-within:ring-2 focus-within:ring-header-accent">
            <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
            <input
              name="q"
              defaultValue={query}
              placeholder="Buscar por empresa, código Moabits o nombre..."
              className="h-full min-w-0 flex-1 bg-transparent text-sm text-title outline-none placeholder:text-muted"
            />
            {query && (
              <Link
                href={clearSearchHref}
                title="Limpiar busqueda"
                aria-label="Limpiar busqueda"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted hover:bg-[#EAF6F7] hover:text-title"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Link>
            )}
          </div>
          <SearchSubmitButton loadingText="Buscando...">
            Buscar
          </SearchSubmitButton>
        </form>

        <div className="mt-4 overflow-hidden rounded-lg bg-white/65 shadow-sm shadow-header-top/5">
          <Table>
            <TableHeader className="bg-[#EAF6F7]">
              <TableRow className="border-0 hover:bg-transparent">
                <TableHead>Empresa BD</TableHead>
                <TableHead>Moabits</TableHead>
                <TableHead>Actualizacion BD</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linkedRows.length > 0 ? (
                linkedRows.map((row) => {
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
                            onClick={() => startEdit(row)}
                            className="border-0 bg-[#EAF6F7] text-[#285F68] shadow-sm shadow-header-top/5 hover:bg-[#DDF1F2] hover:text-[#12343B]"
                          >
                            Editar vinculo
                          </Button>
                          {confirmingId === row.company_id ? (
                            <>
                              <Button
                                type="button"
                                variant="destructive"
                                onClick={() => void removeMappingById(row.company_id)}
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
                                onClick={() => setConfirmingId(null)}
                                className="border-0 bg-white/80 text-[#285F68] shadow-sm shadow-header-top/5 hover:bg-white hover:text-[#12343B]"
                              >
                                Cancelar
                              </Button>
                            </>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setConfirmingId(row.company_id)}
                              disabled={deletingId === row.company_id}
                              className="gap-1.5 border-0 bg-[#F5EAEA] text-[#7A3535] shadow-sm shadow-header-top/5 hover:bg-[#FCEADC] hover:text-[#5C2020]"
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

        <MoabitsPaginationControls
          page={pageInfo.page}
          pages={pageInfo.pages}
          size={pageInfo.size}
          total={pageInfo.total}
          query={query}
        />
      </section>

      {editing && (
        <section className="rounded-lg bg-[#FCEADC] p-5 shadow-sm shadow-header-top/5 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/70 text-[#12343B]">
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
              onClick={closeEditor}
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
                onSelect={(value) => {
                  setDraftFromLocal(value)
                  setError(null)
                  setSuccess(null)
                }}
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
                onSelect={applyMoabitsCompany}
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
              label={discovery ? "Moabits en vivo" : "Cache Moabits"}
              title={selectedMoabitsTitle}
              detail={selectedMoabitsDetail}
            />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block space-y-2 text-sm font-medium text-title">
              <span>Codigo Moabits</span>
              <Input
                value={draft.companyCode}
                onChange={(event) => setDraft((current) => ({ ...current, companyCode: event.target.value }))}
                placeholder="Ej. A123"
                className="border-0 bg-white/85 font-mono shadow-sm shadow-header-top/5 focus-visible:ring-header-accent"
              />
            </label>
            <label className="block space-y-2 text-sm font-medium text-title">
              <span>clie_id</span>
              <Input
                value={draft.clieId}
                onChange={(event) => setDraft((current) => ({ ...current, clieId: event.target.value }))}
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
              onChange={(event) => setDraft((current) => ({ ...current, companyName: event.target.value }))}
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
              onClick={saveMapping}
              disabled={saving || !draft.companyId || !draft.companyCode.trim()}
              loading={saving}
              loadingText="Guardando..."
              className="gap-2 bg-[#0F202A] text-white shadow-sm shadow-header-top/20 hover:bg-[#163C41] hover:text-white"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              {editorMode === "create" ? "Crear vinculacion" : "Actualizar solo esta empresa"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={closeEditor}
              disabled={saving || deletingId === draft.companyId}
              className="gap-2 border-0 bg-white/80 text-[#285F68] shadow-sm shadow-header-top/5 hover:bg-white hover:text-[#12343B]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Cancelar
            </Button>
            {editorMode === "edit" && selectedMapping && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => void removeMappingById(draft.companyId)}
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
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/70 px-3 py-2.5 shadow-sm shadow-header-top/5">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-title">{value}</p>
    </div>
  )
}

function CompareBox({ label, title, detail }: { label: string; title: string; detail: string }) {
  return (
    <div className="rounded-md bg-white/65 p-3 text-sm shadow-sm shadow-header-top/5">
      <p className="text-xs font-medium uppercase text-muted">{label}</p>
      <p className="mt-1 truncate font-semibold text-title">{title}</p>
      <p className="mt-1 truncate font-mono text-xs text-muted">{detail}</p>
    </div>
  )
}

async function loadAllMappingsFromDb(): Promise<
  | { success: true; data: LocalCompanyMoabitsMappingOut[] }
  | { success: false; error: string }
> {
  const firstResult = await listMoabitsProviderMappings({ page: 1, size: EDITOR_COMPANY_PAGE_SIZE })
  if (firstResult.success !== true) {
    return {
      success: false,
      error: ("error" in firstResult ? firstResult.error : null) ?? "No se pudieron cargar los datos de empresas.",
    }
  }

  const items = [...firstResult.data.items]
  const pageSize = firstResult.data.size || EDITOR_COMPANY_PAGE_SIZE
  const pages = firstResult.data.pages ?? (firstResult.data.total ? Math.ceil(firstResult.data.total / pageSize) : 1)

  if (pages > 1) {
    const pageResults = await Promise.all(
      Array.from({ length: pages - 1 }, (_, index) =>
        listMoabitsProviderMappings({ page: index + 2, size: pageSize })
      )
    )

    for (const result of pageResults) {
      if (result.success !== true) {
        return {
          success: false,
          error: ("error" in result ? result.error : null) ?? "No se pudieron cargar todos los datos de empresas.",
        }
      }
      items.push(...result.data.items)
    }
  }

  return { success: true, data: mergeMappings([], items) }
}

async function loadMoabitsSourceCompaniesFromCache(): Promise<
  | { success: true; data: MoabitsCompanyOut[] }
  | { success: false; error: string }
> {
  const firstResult = await listMoabitsSourceCompanies({ page: 1, size: MOABITS_SOURCE_PAGE_SIZE, activeOnly: true })
  if (firstResult.success !== true) {
    return {
      success: false,
      error: ("error" in firstResult ? firstResult.error : null) ?? "No se pudieron cargar las companias Moabits en cache.",
    }
  }

  const items: MoabitsCompanyOut[] = [...firstResult.data.items]
  const pageSize = firstResult.data.size || MOABITS_SOURCE_PAGE_SIZE
  const pages = firstResult.data.pages ?? (firstResult.data.total ? Math.ceil(firstResult.data.total / pageSize) : 1)

  if (pages > 1) {
    const pageResults = await Promise.all(
      Array.from({ length: pages - 1 }, (_, index) =>
        listMoabitsSourceCompanies({ page: index + 2, size: pageSize, activeOnly: true })
      )
    )

    for (const result of pageResults) {
      if (result.success !== true) {
        return {
          success: false,
          error: ("error" in result ? result.error : null) ?? "No se pudieron cargar todas las companias Moabits en cache.",
        }
      }
      items.push(...result.data.items)
    }
  }

  return { success: true, data: mergeMoabitsCompanies([], items) }
}

function mergeMappings(
  current: LocalCompanyMoabitsMappingOut[],
  incoming: LocalCompanyMoabitsMappingOut[]
) {
  const byCompanyId = new Map<string, LocalCompanyMoabitsMappingOut>()
  current.forEach((company) => byCompanyId.set(company.company_id, company))
  incoming.forEach((company) => byCompanyId.set(company.company_id, company))

  return Array.from(byCompanyId.values()).sort((a, b) => a.company_name.localeCompare(b.company_name))
}

function mergeMoabitsCompanies(current: MoabitsCompanyOut[], incoming: MoabitsCompanyOut[]) {
  const byCompanyCode = new Map<string, MoabitsCompanyOut>()
  current.forEach((company) => byCompanyCode.set(company.companyCode, company))
  incoming.forEach((company) => byCompanyCode.set(company.companyCode, company))

  return Array.from(byCompanyCode.values()).sort((a, b) => a.companyName.localeCompare(b.companyName))
}

function findMappedCompany(mappings: LocalCompanyMoabitsMappingOut[], companyId: string) {
  return mappings.find((company) => company.company_id === companyId) ?? null
}

function buildMoabitsOptions({
  liveCompanies,
  cachedCompanies,
  mappings,
}: {
  liveCompanies: MoabitsProviderMappingDiscoveryOut["moabits_companies"] | null
  cachedCompanies: MoabitsCompanyOut[]
  mappings: LocalCompanyMoabitsMappingOut[]
}) {
  const options = new Map<string, MoabitsOption>()

  function addCompany(company: MoabitsCompanyOut, source: MoabitsOption["source"]) {
    if (!company.companyCode) return
    options.set(company.companyCode, {
      companyCode: company.companyCode,
      companyName: company.companyName,
      clie_id: company.clie_id,
      source,
    })
  }

  if (liveCompanies) {
    liveCompanies.forEach((company) => addCompany(company, "live"))
  }

  cachedCompanies.forEach((company) => {
    if (options.has(company.companyCode)) return
    addCompany(company, "cache")
  })

  mappings.forEach((company) => {
    const mapping = company.mapping
    if (!mapping || options.has(mapping.companyCode)) return

    addCompany({
      companyCode: mapping.companyCode,
      companyName: mapping.companyName ?? mapping.companyCode,
      clie_id: mapping.clie_id,
    }, "mapping")
  })

  return Array.from(options.values()).sort((a, b) => a.companyName.localeCompare(b.companyName))
}

function findMoabitsOption(options: MoabitsOption[], companyCode: string) {
  return options.find((company) => company.companyCode === companyCode) ?? null
}

function namesAreEqual(localName?: string, moabitsName?: string) {
  if (!localName || !moabitsName) return false
  return localName.trim().toLowerCase() === moabitsName.trim().toLowerCase()
}

function formatDate(value?: string | null) {
  if (!value) return "Sin dato"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Fecha invalida"
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(date)
}

function sourceLabel(source: MoabitsOption["source"]) {
  if (source === "live") return "Moabits en vivo"
  if (source === "cache") return "Cache Moabits"
  return "Vinculo guardado"
}

function sourceDetail(source: MoabitsOption["source"]) {
  if (source === "live") return "catalogo en vivo"
  if (source === "cache") return "cache Moabits"
  return "guardado en vinculaciones"
}

function withSelectedMoabitsOption(options: SearchOption[], draft: Draft) {
  const code = draft.companyCode
  const cleanCode = code.trim()
  if (!cleanCode || options.some((option) => option.value === code || option.value === cleanCode)) {
    return options
  }

  const cleanName = draft.companyName.trim()
  const cleanClieId = draft.clieId.trim()
  return [
    {
      value: code,
      title: cleanName || cleanCode,
      detail: `${cleanCode} · clie_id ${cleanClieId || "sin dato"} · valor actual`,
      searchText: [cleanName, cleanCode, cleanClieId, "valor actual"].filter(Boolean).join(" "),
    },
    ...options,
  ]
}

type SearchableSelectProps = {
  value: string
  options: SearchOption[]
  onSelect: (value: string) => void
  placeholder?: string
  disabled?: boolean
  emptyText?: string
}

function SearchableSelect({
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
        <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-md border border-[#C9DFE3] bg-white shadow-lg shadow-header-top/10">
          <div className="border-b border-[#EAF6F7] p-2">
            <div className="flex h-8 items-center gap-2 rounded-md bg-[#F5FAFA] px-2">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
                  className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-[#F5FAFA]"
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
