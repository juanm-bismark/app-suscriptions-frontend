import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { fetchApi } from "@/lib/api-client"
import CompanyForm from "./company-form"

export default async function CompanyPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  let profile = null
  let company = null
  try {
    profile = await fetchApi<any>("/me")
    if (profile?.role !== "admin") {
      // Solo admins pueden ver o editar la empresa
      redirect("/dashboard")
    }
    company = await fetchApi<any>("/companies/me")
  } catch (error) {
    console.error("Error fetching company info:", error)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-title mb-2">Empresa</h1>
        <p className="text-muted">Administra la información de tu cuenta corporativa</p>
      </div>

      <div className="bg-card rounded-lg shadow border border-border p-6 sm:p-8">
        <CompanyForm
          initialName={company?.name || ""}
          subscriptionStatus={company?.subscription_status || "Activa"}
        />
      </div>
    </div>
  )
}
