import { fetchApi, ApiError } from "@/lib/api-client"
import { requireManagerOrAdmin } from "@/lib/auth/current-user"
import type { User } from "@/lib/types/user"
import CreateUserForm from "./create-user-form"

export default async function UsersPage() {
  const profile = await requireManagerOrAdmin()
  let users: User[] = []
  let networkError = false

  try {
    users = await fetchApi<User[]>("/users")
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
          <div className="col-span-full bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-4">
            No se puede conectar al servidor API. Algunas funcionalidades pueden no estar disponibles.
          </div>
        )}
        <div className="lg:col-span-2 bg-card rounded-lg shadow border border-border p-6 sm:p-8">
          <h2 className="text-xl font-semibold mb-4 text-title">Lista de Miembros</h2>
          {users.length === 0 ? (
            <p className="text-sm text-muted">No hay usuarios adicionales en la empresa.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted uppercase bg-page">
                  <tr>
                    <th scope="col" className="px-6 py-3 rounded-tl-lg">Nombre</th>
                    <th scope="col" className="px-6 py-3 rounded-tr-lg">Rol</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-border last:border-0 hover:bg-page/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-title">{user.full_name || "Sin nombre"}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-header-accent/10 text-header-accent uppercase">
                          {user.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-card rounded-lg shadow border border-border p-6 sm:p-8 self-start">
          <h2 className="text-xl font-semibold mb-4 text-title">Añadir usuario</h2>
          <CreateUserForm currentRole={profile.role} />
        </div>
      </div>
    </div>
  )
}
