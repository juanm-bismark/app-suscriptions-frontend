import Link from "next/link"
import { getCredential } from "@/app/actions/credentials"
import { getMyMoabitsProviderMapping } from "@/app/actions/company"
import { requireManagerOrAdmin } from "@/lib/auth/current-user"
import { ROLES } from "@/lib/types/user"
import { CredentialForm } from "../credential-form"
import { MoabitsCompanyMappingInfo } from "./moabits-company-mapping-info"

export default async function MoabitsCredentialsPage() {
  const profile = await requireManagerOrAdmin()
  const isAdmin = profile.role === ROLES.ADMIN

  const [credentialResult, mappingResult] = await Promise.all([
    getCredential("moabits"),
    getMyMoabitsProviderMapping(),
  ])

  const credential = credentialResult.ok ? credentialResult.data : null
  const mapping = mappingResult.ok ? mappingResult.data : null

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <Link className="text-sm font-medium text-header-bg hover:underline" href="/dashboard/credentials">
          Volver a credenciales
        </Link>
        <h1 className="mt-3 text-3xl font-bold text-title">Moabits</h1>
        <p className="text-muted">Configura credenciales y administra las vinculaciones por empresa.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <section className="bg-[#DDF1F2] rounded-lg shadow-sm shadow-header-top/5 p-6 sm:p-8 self-start">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-title">Credenciales</h2>
            {isAdmin && credential?.active && (
              <Link
                href="/dashboard/company/moabits"
                className="inline-flex items-center justify-center rounded-md bg-white/75 px-3 py-2 text-sm font-semibold text-[#285F68] shadow-sm shadow-header-top/5 hover:bg-white hover:text-[#12343B]"
              >
                Gestionar vinculaciones Moabits
              </Link>
            )}
          </div>
          {!credentialResult.ok && credentialResult.status !== 404 && (
            <div className="mb-4 rounded-lg bg-[#FFF7E7] p-4 text-sm text-[#6D4D16] shadow-sm shadow-warn-bg/5">
              {credentialResult.error}
            </div>
          )}
          {!isAdmin && (!mapping || !mapping.companyCode) ? (
            <div className="rounded-lg bg-white/60 p-4 text-sm text-muted shadow-sm shadow-header-top/5">
              Tu empresa no está vinculada a un código de empresa Moabits. Por favor, contacta a un administrador para configurar la vinculación antes de continuar.
            </div>
          ) : (
            <CredentialForm
              provider="moabits"
              credential={credential}
              isAdmin={isAdmin}
              autoParentCompanyCode={mapping?.companyCode}
            />
          )}
        </section>

        {credential?.active && (
          <MoabitsCompanyMappingInfo
            mapping={mapping}
            error={mappingResult.ok ? null : mappingResult.error}
          />
        )}
      </div>
    </div>
  )
}
