import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { fetchApi } from "@/lib/api-client"
import CreateUserForm from "./create-user-form"

export default async function UsersPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  let profile = null
  let users = []
  try {
    profile = await fetchApi<any>("/me")
    if (profile?.role === "member") {
      redirect("/dashboard")
    }

    // GET /users requires Admin or Manager role
    users = await fetchApi<any[]>("/users")
  } catch (error) {
    console.error("Error fetching users view:", error)
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

        {/* User List */}
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
                    <th scope="col" className="px-6 py-3">Correo</th>
                    <th scope="col" className="px-6 py-3 rounded-tr-lg">Rol</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: any) => (
                    <tr key={user.id} className="border-b border-border last:border-0 hover:bg-page/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-title">{user.full_name || "Sin nombre"}</td>
                      <td className="px-6 py-4 text-muted">{user.email}</td>
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

        {/* Invite Form */}
        <div className="bg-card rounded-lg shadow border border-border p-6 sm:p-8 self-start">
          <h2 className="text-xl font-semibold mb-4 text-title">Añadir usuario</h2>
          <CreateUserForm currentRole={profile?.role || "manager"} />
        </div>

      </div>
    </div>
  )
}
