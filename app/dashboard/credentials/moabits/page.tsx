import Link from "next/link"
import { discoverMoabitsCompanies, getCredential } from "@/app/actions/credentials"
import { requireManagerOrAdmin } from "@/lib/auth/current-user"
import { CredentialForm } from "../credential-form"
import { MoabitsCompanySelector } from "./company-selector"

export default async function MoabitsCredentialsPage() {
  await requireManagerOrAdmin()
  const [credentialResult, discoveryResult] = await Promise.all([
    getCredential("moabits"),
    discoverMoabitsCompanies(),
  ])
  const credential = credentialResult.ok ? credentialResult.data : null

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <Link className="text-sm font-medium text-header-bg hover:underline" href="/dashboard/credentials">
          Volver a credenciales
        </Link>
        <h1 className="mt-3 text-3xl font-bold text-title">Moabits</h1>
        <p className="text-muted">Configura credenciales y selecciona las companias disponibles para sincronizacion.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-[#DDF1F2] rounded-lg shadow-sm shadow-header-top/5 p-6 sm:p-8 self-start">
          <h2 className="text-xl font-semibold text-title mb-4">Credenciales</h2>
          {!credentialResult.ok && credentialResult.status !== 404 && (
            <div className="mb-4 rounded-lg bg-[#FFF7E7] p-4 text-sm text-[#6D4D16] shadow-sm shadow-warn-bg/5">
              {credentialResult.error}
            </div>
          )}
          <CredentialForm provider="moabits" credential={credential} />
        </section>

        <section className="bg-[#FCEADC] rounded-lg shadow-sm shadow-header-top/5 p-6 sm:p-8 self-start">
          <h2 className="text-xl font-semibold text-title mb-2">Companias Moabits</h2>
          <p className="text-sm text-muted mb-4">
            {discoveryResult.ok
              ? `Cuenta actual: ${discoveryResult.data.current_company_name}`
              : "Guarda credenciales validas antes de descubrir companias."}
          </p>
          {discoveryResult.ok ? (
            <MoabitsCompanySelector discovery={discoveryResult.data} />
          ) : (
            <div className="rounded-lg bg-[#FFF7E7] p-4 text-sm text-[#6D4D16] shadow-sm shadow-warn-bg/5">
              {discoveryResult.error}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
