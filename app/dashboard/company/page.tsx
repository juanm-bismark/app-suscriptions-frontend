import Link from "next/link"
import { requireAdmin } from "@/lib/auth/current-user"
import { searchCompanies } from "@/app/actions/company"
import { Building2, Link2 } from "lucide-react"
import CompanyManager from "./company-manager"

type CompanyPageProps = {
  searchParams?: Promise<{ page?: string; size?: string; q?: string }>
}

export default async function CompanyPage({ searchParams }: CompanyPageProps) {
  await requireAdmin()
  const params = await searchParams
  const currentPage = positiveInt(params?.page, 1)
  const pageSize = positiveInt(params?.size, 20)
  const query = params?.q?.trim() ?? ""
  const result = await searchCompanies({ q: query, page: currentPage, size: pageSize })
  const companies = result.success ? result.companies : []
  const total = result.success ? result.total : null

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8 rounded-lg bg-[#F5FAFA] p-5 shadow-sm shadow-header-top/5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-title mb-2">Empresas</h1>
            <p className="text-muted">Administra las empresas registradas en la aplicación</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/dashboard/company/moabits"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[#0F202A] px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-header-top/20 hover:bg-[#163C41]"
            >
              <Link2 className="h-4 w-4" aria-hidden="true" />
              Vinculaciones Moabits
            </Link>
            <div className="flex max-w-full items-center gap-3 rounded-md border border-[#C9DFE3] bg-white px-3 py-2.5 shadow-sm shadow-header-top/5 sm:max-w-xs">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#DDF1F2] text-[#12343B]">
                <Building2 className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted">Registro</p>
                <p className="truncate text-sm font-semibold text-title">
                  {total !== null ? `${total} ${total === 1 ? "empresa" : "empresas"}` : "Sin total"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CompanyManager
        key={`${query}:${currentPage}:${pageSize}`}
        initialCompanies={companies}
        initialTotal={total}
        initialPage={result.success ? result.page : currentPage}
        initialSize={result.success ? result.size : pageSize}
        initialPages={result.success ? result.pages : null}
        initialQuery={query}
        initialError={result.error ?? null}
      />
    </div>
  )
}

function positiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}
