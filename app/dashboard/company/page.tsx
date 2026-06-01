import Link from "next/link"
import { requireAdmin } from "@/lib/auth/current-user"
import { positiveInt } from "@/lib/utils"
import { searchCompanies } from "@/app/actions/company"
import { Building2, Link2 } from "lucide-react"
import { PageHeader } from "../_components/page-header"
import { dashboardStyles } from "../_components/dashboard-styles"
import { DashboardSummaryBadge } from "../_components/dashboard-ui"
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
      <PageHeader
        title="Empresas"
        description="Administra las empresas registradas en la aplicación"
        className="mb-8"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/dashboard/company/moabits"
            className={dashboardStyles.primaryAction}
          >
            <Link2 className="h-4 w-4" aria-hidden="true" />
            Vinculaciones Moabits
          </Link>
          <DashboardSummaryBadge
            icon={<Building2 className="h-4 w-4" aria-hidden="true" />}
            label="Registro"
            value={total !== null ? `${total} ${total === 1 ? "empresa" : "empresas"}` : "Sin total"}
          />
        </div>
      </PageHeader>

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
