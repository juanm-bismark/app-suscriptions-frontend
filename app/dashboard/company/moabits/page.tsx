import Link from "next/link"
import { Link2 } from "lucide-react"
import { listMoabitsProviderMappings } from "@/app/actions/company"
import { requireAdmin } from "@/lib/auth/current-user"
import { positiveInt } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui"
import { PageHeader } from "../../_components/page-header"
import { MoabitsMappingManager } from "./moabits-mapping-manager"

type SearchParams = Promise<{ page?: string; size?: string; q?: string }>

export default async function CompanyMoabitsMappingsPage({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  await requireAdmin()
  const params = await searchParams
  const currentPage = positiveInt(params?.page, 1)
  const pageSize = positiveInt(params?.size, 20)
  const query = params?.q?.trim() ?? ""

  const tableResult = await listMoabitsProviderMappings({ page: currentPage, size: pageSize, q: query, linkedOnly: true })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mb-8">
        <Link className="text-sm font-medium text-header-bg hover:underline" href="/dashboard/company">
          ← Volver a empresas
        </Link>
        <PageHeader
          title="Vinculaciones Moabits"
          description="Revisa los vinculos entre empresas en BD y empresas traidas desde Moabits."
          className="mt-3"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#DDF1F2] text-[#12343B]">
            <Link2 className="h-5 w-5" aria-hidden="true" />
          </span>
        </PageHeader>
      </div>

      {tableResult.success === true ? (
        <MoabitsMappingManager
          initialPage={tableResult.data}
          currentPage={currentPage}
          pageSize={pageSize}
          query={query}
        />
      ) : (
        <Alert variant="destructive">
          <AlertDescription>
            {("error" in tableResult ? tableResult.error : null) ??
              "No se pudieron cargar las vinculaciones Moabits."}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
