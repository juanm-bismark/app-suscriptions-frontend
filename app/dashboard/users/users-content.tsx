"use client"

import { useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"
import { type Page, type User, type UserRole } from "@/lib/types/user"
import CreateUserForm from "./create-user-form"
import { EditUserForm } from "./edit-user-form"
import UsersTable from "./users-table"
import PaginationControls from "./pagination-controls"
import { SearchSubmitButton } from "../_components/search-submit-button"

export function UsersContent({
  users,
  currentRole,
  pageData,
  query,
  pageSize,
}: {
  users: User[]
  currentRole: UserRole
  pageData: Page<User> | null
  query: string
  pageSize: number
}) {
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const clearSearchHref = `/dashboard/users?page=1&size=${pageSize}`

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 bg-[#F5FAFA] rounded-lg shadow-sm shadow-header-top/5 p-6 sm:p-8">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-title">Usuarios de la empresa</h2>
          <form className="flex w-full gap-2 sm:max-w-md" action="/dashboard/users" method="get">
            <input type="hidden" name="page" value="1" />
            <input type="hidden" name="size" value={pageSize} />
            <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-md border border-[#C9DFE3] bg-white px-3 shadow-sm shadow-header-top/5 focus-within:ring-2 focus-within:ring-header-accent">
              <input
                name="q"
                defaultValue={query}
                placeholder="Buscar usuario..."
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
            <SearchSubmitButton loadingText="Buscando...">Buscar</SearchSubmitButton>
          </form>
        </div>

        <UsersTable
          users={users}
          currentRole={currentRole}
          editingUserId={editingUser?.id ?? null}
          onEdit={setEditingUser}
          emptyMessage={
            query
              ? "No se encontraron usuarios con ese filtro."
              : "No hay usuarios adicionales en la empresa."
          }
        />

        {pageData && (
          <PaginationControls
            page={pageData.page}
            pages={pageData.pages}
            size={pageData.size}
            total={pageData.total}
            query={query}
          />
        )}
      </div>

      <div className="bg-[#DDF1F2] rounded-lg shadow-sm shadow-header-top/5 p-6 sm:p-8 self-start">
        {editingUser ? (
          <>
            <h2 className="text-xl font-semibold mb-1 text-title">Editar usuario</h2>
            <p className="text-sm text-muted mb-4">{editingUser.full_name || editingUser.email}</p>
            <EditUserForm
              user={editingUser}
              currentRole={currentRole}
              onCancel={() => setEditingUser(null)}
            />
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-4 text-title">Añadir usuario</h2>
            <CreateUserForm currentRole={currentRole} />
          </>
        )}
      </div>
    </div>
  )
}
