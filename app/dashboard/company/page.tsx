import { getCompany, requireCompanyUser } from "@/lib/auth/current-user"
import { ROLES } from "@/lib/types/user"
import CompanyForm from "./company-form"

export default async function CompanyPage() {
  const profile = await requireCompanyUser()
  const company = await getCompany()
  const canEdit = profile.role === ROLES.ADMIN

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-title mb-2">Empresa</h1>
        <p className="text-muted">
          {canEdit ? "Administra la información de tu cuenta corporativa" : "Información de tu cuenta corporativa"}
        </p>
      </div>

      <div className="bg-[#DDF1F2] rounded-lg shadow-sm shadow-header-top/5 p-6 sm:p-8">
        <CompanyForm
          initialName={company?.name || ""}
          canEdit={canEdit}
        />
      </div>
    </div>
  )
}
