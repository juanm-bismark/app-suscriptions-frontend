"use client"

import { useState } from "react"
import { Pencil, Save, X } from "lucide-react"
import { updateUser } from "@/app/actions/users"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ROLES, type User, type UserRole } from "@/lib/types/user"

type UsersTableProps = {
  users: User[]
  currentRole: UserRole
}

export default function UsersTable({ users, currentRole }: UsersTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  if (users.length === 0) {
    return <p className="text-sm text-muted">No hay usuarios adicionales en la empresa.</p>
  }

  async function onSubmit(formData: FormData) {
    setError(null)
    setSuccess(null)
    setIsSaving(true)

    const result = await updateUser(formData)
    setIsSaving(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setSuccess(result.message || "Usuario actualizado")
    setEditingId(null)
  }

  return (
    <div className="space-y-3">
      {error && <div className="text-sm bg-warn-bg text-warn-text p-3 rounded-md">{error}</div>}
      {success && <div className="text-sm bg-[#DDF4EA] text-[#16603B] p-3 rounded-md">{success}</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-[#285F68] uppercase bg-[#EAF6F7]">
            <tr>
              <th scope="col" className="px-6 py-3 rounded-tl-lg">Nombre</th>
              <th scope="col" className="px-6 py-3">Rol</th>
              <th scope="col" className="px-6 py-3 rounded-tr-lg text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isEditing = editingId === user.id
              const canEdit = currentRole === ROLES.ADMIN || user.role === ROLES.MEMBER

              return (
                <tr key={user.id} className="hover:bg-white/65 transition-colors">
                  {isEditing ? (
                    <EditableUserRow
                      user={user}
                      currentRole={currentRole}
                      isSaving={isSaving}
                      onSubmit={onSubmit}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <>
                      <td className="px-6 py-4 font-medium text-title">{user.full_name || "Sin nombre"}</td>
                      <td className="px-6 py-4">
                        <span className={roleBadgeClassName(user.role)}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end">
                          {canEdit && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              title="Editar usuario"
                              aria-label="Editar usuario"
                              className="h-9 w-9 border-[#0891B2]/30 bg-[#ECFEFF] text-[#0E7490] shadow-sm shadow-[#0891B2]/10 hover:bg-[#CFFAFE] hover:text-[#155E75]"
                              onClick={() => {
                                setError(null)
                                setSuccess(null)
                                setEditingId(user.id)
                              }}
                            >
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EditableUserRow({
  user,
  currentRole,
  isSaving,
  onSubmit,
  onCancel,
}: {
  user: User
  currentRole: UserRole
  isSaving: boolean
  onSubmit: (formData: FormData) => void
  onCancel: () => void
}) {
  return (
    <td colSpan={3} className="px-6 py-4">
      <form action={onSubmit} className="grid gap-3 md:grid-cols-[minmax(180px,1fr)_180px_auto] md:items-center">
        <input type="hidden" name="id" value={user.id} />
        <Input
          name="full_name"
          defaultValue={user.full_name || ""}
          placeholder="Nombre completo"
          className="border-0 bg-white/85 shadow-sm shadow-header-top/5 focus-visible:ring-header-accent"
        />
        {currentRole === ROLES.ADMIN ? (
          <select
            name="role"
            defaultValue={user.role}
            className="h-10 rounded-md bg-white/85 px-3 text-sm text-title shadow-sm shadow-header-top/5 focus:outline-none focus:ring-2 focus:ring-header-accent"
          >
            <option value="member">Miembro</option>
            <option value="manager">Manager</option>
            <option value="admin">Administrador</option>
          </select>
        ) : (
          <input type="hidden" name="role" value="member" />
        )}
        <div className="flex justify-end gap-2">
          <Button
            type="submit"
            size="icon"
            disabled={isSaving}
            title="Guardar cambios"
            aria-label="Guardar cambios"
            className="h-10 w-10 bg-header-bg text-header-text shadow-sm shadow-header-top/15 hover:bg-header-top hover:text-header-text"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={isSaving}
            title="Cancelar edición"
            aria-label="Cancelar edición"
            className="h-10 w-10 bg-card text-header-bg shadow-sm shadow-header-top/5 hover:bg-badge-bg hover:text-header-bg"
            onClick={onCancel}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </form>
    </td>
  )
}

function roleBadgeClassName(role: User["role"]) {
  const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase"
  if (role === "admin") return `${base} bg-[#FCEADC] text-[#7A3A10]`
  if (role === "manager") return `${base} bg-[#EDE5FB] text-[#422889]`
  return `${base} bg-[#DDF4EA] text-[#16603B]`
}
