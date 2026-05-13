import { fetchApi, ApiError } from "@/lib/api-client"
import { requireManagerOrAdmin } from "@/lib/auth/current-user"
import { ROLES, type Page, type User, type UserRole } from "@/lib/types/user"
import { UsersRound } from "lucide-react"
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

  try {
    pageData = await fetchApi<Page<User>>(`/users?${usersParams.toString()}`, { cache: "no-store" })
    users = visibleUsersForRole(pageData.items, profile.role, profile.company_id)
  } catch (err: unknown) {
    console.error("Error loading users:", err)
    if (err instanceof ApiError && err.status === 0) {
      networkError = true
    }
    // keep users as empty array to allow rendering the page
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8 rounded-lg bg-[#F5FAFA] p-5 shadow-sm shadow-header-top/5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-title mb-2">Usuarios</h1>
            <p className="text-muted">Administra los accesos del equipo a la plataforma</p>
          </div>
          <div className="flex max-w-full items-center gap-3 rounded-md border border-[#C9DFE3] bg-white px-3 py-2.5 shadow-sm shadow-header-top/5 sm:max-w-xs">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#DDF1F2] text-[#12343B]">
              <UsersRound className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted">Equipo</p>
              <p className="truncate text-sm font-semibold text-title">{users.length} {users.length === 1 ? "usuario visible" : "usuarios visibles"}</p>
            </div>
          </div>
        </div>
      </div>

      {networkError && (
        <div className="bg-[#FFF7E7] text-[#6D4D16] rounded-lg p-4 mb-4 shadow-sm shadow-warn-bg/5">
          No se puede conectar al servidor API. Algunas funcionalidades pueden no estar disponibles.
        </div>
      )}
      <UsersContent
        key={`${query}:${currentPage}:${pageSize}`}
        users={users}
        currentRole={profile.role}
        pageData={pageData}
        query={query}
        pageSize={pageSize}
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

function positiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}
