import { fetchApi, ApiError } from "@/lib/api-client"
import { requireManagerOrAdmin } from "@/lib/auth/current-user"
import { ROLES, type Page, type User, type UserRole } from "@/lib/types/user"
import CreateUserForm from "./create-user-form"
import UsersTable from "./users-table"

type UsersPageProps = {
  searchParams?: Promise<{ page?: string; size?: string }>
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const profile = await requireManagerOrAdmin()
  const params = await searchParams
  const currentPage = positiveInt(params?.page, 1)
  const pageSize = positiveInt(params?.size, 50)
  let users: User[] = []
  let pageData: Page<User> | null = null
  let networkError = false

  try {
    pageData = await fetchApi<Page<User>>(`/users?page=${currentPage}&size=${pageSize}`)
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-title mb-2">Usuarios</h1>
          <p className="text-muted">Administra los accesos del equipo a la plataforma</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {networkError && (
          <div className="col-span-full bg-[#FFF7E7] text-[#6D4D16] rounded-lg p-4 mb-4 shadow-sm shadow-warn-bg/5">
            No se puede conectar al servidor API. Algunas funcionalidades pueden no estar disponibles.
          </div>
        )}
        <div className="lg:col-span-2 bg-[#F5FAFA] rounded-lg shadow-sm shadow-header-top/5 p-6 sm:p-8">
          <h2 className="text-xl font-semibold mb-4 text-title">Usuarios de la empresa</h2>
          <UsersTable users={users} currentRole={profile.role} />
          {pageData && (
            <PaginationControls
              page={pageData.page}
              pages={pageData.pages}
              size={pageData.size}
              total={pageData.total}
            />
          )}
        </div>

        <div className="bg-[#DDF1F2] rounded-lg shadow-sm shadow-header-top/5 p-6 sm:p-8 self-start">
          <h2 className="text-xl font-semibold mb-4 text-title">Añadir usuario</h2>
          <CreateUserForm currentRole={profile.role} />
        </div>
      </div>
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

function PaginationControls({
  page,
  pages,
  size,
  total,
}: {
  page: number
  pages: number | null
  size: number
  total: number | null
}) {
  const hasPrevious = page > 1
  const hasNext = pages !== null ? page < pages : false

  return (
    <div className="mt-5 flex flex-col gap-3 pt-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
      <span>
        Página {page}{pages ? ` de ${pages}` : ""}{total !== null ? ` · ${total} usuarios` : ""}
      </span>
      <div className="flex gap-2">
        <a
          href={`/dashboard/users?page=${Math.max(page - 1, 1)}&size=${size}`}
          aria-disabled={!hasPrevious}
          className={`rounded-md px-3 py-2 font-semibold transition-colors ${hasPrevious ? "border border-[#94A3B8]/50 bg-[#E8EEF2] text-[#334155] shadow-sm shadow-header-top/5 hover:bg-[#DCE6EA] hover:text-[#1F2937]" : "pointer-events-none border border-[#CBD5E1]/60 bg-[#EEF3F5] text-[#64748B]/60"}`}
        >
          Anterior
        </a>
        <a
          href={`/dashboard/users?page=${page + 1}&size=${size}`}
          aria-disabled={!hasNext}
          className={`rounded-md px-3 py-2 font-semibold transition-colors ${hasNext ? "border border-[#0E7490]/30 bg-[#D8F0F2] text-[#155E75] shadow-sm shadow-[#0891B2]/10 hover:bg-[#C7E7EA] hover:text-[#164E63]" : "pointer-events-none border border-[#B8DDE1]/70 bg-[#E3F1F2] text-[#326472]/55"}`}
        >
          Siguiente
        </a>
      </div>
    </div>
  )
}
