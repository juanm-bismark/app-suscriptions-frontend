import { fetchApi, ApiError } from "@/lib/api-client"
import { requireManagerOrAdmin } from "@/lib/auth/current-user"
import { ROLES, type Company, type Page, type User, type UserRole } from "@/lib/types/user"
import { positiveInt } from "@/lib/utils"
import { searchCompanies } from "@/app/actions/company"
import { UsersRound } from "lucide-react"
import { PageHeader } from "../_components/page-header"
import { WarningAlert } from "../_components/alerts"
import { UsersContent } from "./users-content"

type UsersPageProps = {
  searchParams?: Promise<{ page?: string; size?: string; q?: string }>
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const profile = await requireManagerOrAdmin()
  const params = await searchParams
  const currentPage = positiveInt(params?.page, 1)
  const pageSize = positiveInt(params?.size, 50)
  const query = params?.q?.trim() ?? ""
  const usersParams = new URLSearchParams({
    page: String(currentPage),
    size: String(pageSize),
  })
  if (query) usersParams.set("q", query)
  let users: User[] = []
  let pageData: Page<User> | null = null
  let networkError = false
  let companies: Company[] = []

  const [usersResult, companiesResult] = await Promise.allSettled([
    fetchApi<Page<User>>(`/users?${usersParams.toString()}`, { cache: "no-store" }),
    profile.role === ROLES.ADMIN ? searchCompanies({ size: 200 }) : Promise.resolve(null),
  ])

  if (usersResult.status === "fulfilled") {
    pageData = usersResult.value
    users = visibleUsersForRole(pageData.items, profile.role, profile.company_id)
  } else {
    console.error("Error loading users:", usersResult.reason)
    if (usersResult.reason instanceof ApiError && usersResult.reason.status === 0) {
      networkError = true
    }
  }

  if (companiesResult.status === "fulfilled" && companiesResult.value && "companies" in companiesResult.value) {
    companies = companiesResult.value.companies ?? []
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <PageHeader
        title="Usuarios"
        description="Administra los accesos del equipo a la plataforma"
        className="mb-8"
      >
        <div className="flex max-w-full items-center gap-3 rounded-md border border-[#C9DFE3] bg-white px-3 py-2.5 shadow-sm shadow-header-top/5 sm:max-w-xs">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#DDF1F2] text-[#12343B]">
            <UsersRound className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted">Equipo</p>
            <p className="truncate text-sm font-semibold text-title">{users.length} {users.length === 1 ? "usuario visible" : "usuarios visibles"}</p>
          </div>
        </div>
      </PageHeader>

      {networkError && (
        <WarningAlert className="mb-4">
          No se puede conectar al servidor API. Algunas funcionalidades pueden no estar disponibles.
        </WarningAlert>
      )}
      <UsersContent
        key={`${query}:${currentPage}:${pageSize}`}
        users={users}
        currentRole={profile.role}
        pageData={pageData}
        query={query}
        pageSize={pageSize}
        companies={companies}
      />
    </div>
  )
}

function visibleUsersForRole(users: User[], currentRole: UserRole, companyId: string | null) {
  if (currentRole !== ROLES.MANAGER) return users

  return users.filter((user) => {
    const sameCompany = companyId ? user.company_id === companyId : true
    return sameCompany && (user.role === ROLES.MANAGER || user.role === ROLES.MEMBER)
  })
}
