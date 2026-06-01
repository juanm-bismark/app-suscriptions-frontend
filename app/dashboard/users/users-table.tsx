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
      {error && <div className="text-sm bg-warn-bg text-warn-text p-3 rounded-md">{error}</div>}
      {success && <div className="text-sm bg-success-soft text-success-text-soft p-3 rounded-md">{success}</div>}

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
                      ? "bg-white shadow-[inset_3px_0_0_#33A6B2] transition-colors"
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
                            variant="outline"
                            size="icon"
                            title="Editar usuario"
                            aria-label="Editar usuario"
                            className="h-9 w-9 border-[#0891B2]/30 bg-white text-[#0E7490] shadow-sm shadow-[#0891B2]/10 hover:border-[#0E7490] hover:bg-[#ECFEFF] hover:text-[#0F4C5C]"
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
          variant="outline"
          size="icon"
          title="Eliminar usuario"
          aria-label="Eliminar usuario"
          className="h-9 w-9 border-[#DC2626]/25 bg-white text-[#B91C1C] shadow-sm shadow-[#DC2626]/10 hover:border-[#B91C1C] hover:bg-[#FEE2E2] hover:text-[#7F1D1D]"
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
            className="border-[#DC2626] bg-[#DC2626] text-white hover:bg-[#B91C1C] hover:text-white"
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
  if (role === "admin") return `${base} bg-[#FCEADC] text-[#7A3A10]`
  if (role === "manager") return `${base} bg-[#EDE5FB] text-[#422889]`
  return `${base} bg-success-soft text-success-text-soft`
}
