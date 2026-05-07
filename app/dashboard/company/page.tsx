import { getCompany, requireAdmin } from "@/lib/auth/current-user"
import CompanyForm from "./company-form"

export default async function CompanyPage() {
  await requireAdmin()
  const company = await getCompany()

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-title mb-2">Empresa</h1>
        <p className="text-muted">Administra la información de tu cuenta corporativa</p>
      </div>

      <div className="bg-card rounded-lg shadow border border-border p-6 sm:p-8">
        <CompanyForm
          initialName={company?.name || ""}
        />
      </div>
    </div>
  )
}
