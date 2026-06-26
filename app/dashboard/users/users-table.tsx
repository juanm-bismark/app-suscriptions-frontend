"use client"

import { useState } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { deleteUser } from "@/app/actions/users"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { dashboardStyles } from "../_components/dashboard-styles"
import { ROLES, type Company, type User, type UserRole } from "@/lib/types/user"

type UsersTableProps = {
  users: User[]
  currentRole: UserRole
  companies?: Company[]
  editingUserId: string | null
  onEdit: (user: User) => void
  emptyMessage?: string
}

export default function UsersTable({
  users,
  currentRole,
  companies = [],
  editingUserId,
  onEdit,
  emptyMessage = "No hay usuarios adicionales en la empresa.",
}: UsersTableProps) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (users.length === 0) {
    return <p className="text-sm text-muted">{emptyMessage}</p>
  }

  const isAdminView = currentRole === ROLES.ADMIN
  const companyById = new Map(companies.map((company) => [company.id, company.name]))

  async function onDelete(userId: string) {
    setError(null)
    setSuccess(null)
    setDeletingId(userId)

    const formData = new FormData()
    formData.append("id", userId)

    const result = await deleteUser(formData).finally(() => setDeletingId(null))

    if (result.error) {
      setError(result.error)
      return
    }

    setSuccess(result.message || "Usuario eliminado")
  }

  return (
    <div className="space-y-3">
      {error && (
        <div role="alert" className="rounded-md border border-danger-action/20 bg-danger-tint p-3 text-sm text-danger-strong-text">
          {error}
        </div>
      )}
      {success && (
        <div role="status" aria-live="polite" className="rounded-md bg-success-soft p-3 text-sm text-success-text-soft">
          {success}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-action-soft uppercase bg-hover-soft">
            <tr>
              <th scope="col" className="px-6 py-3 rounded-tl-lg">Nombre</th>
              <th scope="col" className="px-6 py-3">Correo</th>
              {isAdminView && <th scope="col" className="px-6 py-3">Empresa</th>}
              <th scope="col" className="px-6 py-3">Rol</th>
              <th scope="col" className="px-6 py-3 rounded-tr-lg text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const canEdit = currentRole === ROLES.ADMIN || user.role === ROLES.MEMBER
              const isSelected = editingUserId === user.id

              return (
                <tr
                  key={user.id}
                  className={
                    isSelected
                      ? dashboardStyles.selectedRow
                      : "transition-colors hover:bg-white/65"
                  }
                >
                  <td className="px-6 py-4 font-medium text-title">{user.full_name || "Sin nombre"}</td>
                  <td className="px-6 py-4 text-muted">{user.email || "—"}</td>
                  {isAdminView && (
                    <td className="px-6 py-4 text-muted">
                      {user.company_id ? companyById.get(user.company_id) ?? "Empresa no encontrada" : "Sin empresa"}
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <span className={roleBadgeClassName(user.role)}>{user.role}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      {canEdit && (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title="Editar usuario"
                            aria-label="Editar usuario"
                            className={dashboardStyles.editIconButton}
                            onClick={() => onEdit(user)}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <DeleteUserDialog
                            user={user}
                            deleting={deletingId === user.id}
                            onConfirm={() => onDelete(user.id)}
                          />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DeleteUserDialog({
  user,
  deleting,
  onConfirm,
}: {
  user: User
  deleting: boolean
  onConfirm: () => void
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Eliminar usuario"
          aria-label="Eliminar usuario"
          className={dashboardStyles.dangerIconButton}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar usuario</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará el acceso de {user.full_name || "este usuario"}. No se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            loading={deleting}
            loadingText="Eliminando..."
            onClick={onConfirm}
            className={dashboardStyles.dangerAction}
          >
            Eliminar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function roleBadgeClassName(role: User["role"]) {
  const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase"
  if (role === "admin") return `${base} ${dashboardStyles.roleAdminBadge}`
  if (role === "manager") return `${base} ${dashboardStyles.roleManagerBadge}`
  return `${base} bg-success-soft text-success-text-soft`
}
