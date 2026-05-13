import Link from "next/link"
import { Link2 } from "lucide-react"
import { listMoabitsProviderMappings } from "@/app/actions/company"
import { requireAdmin } from "@/lib/auth/current-user"
import { Alert, AlertDescription } from "@/components/ui"
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
      <div className="mb-8 rounded-lg bg-[#F5FAFA] p-5 shadow-sm shadow-header-top/5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <Link className="text-sm font-medium text-header-bg hover:underline" href="/dashboard/company">
              Volver a empresas
            </Link>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#DDF1F2] text-[#12343B]">
                <Link2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h1 className="text-3xl font-bold text-title">Vinculaciones Moabits</h1>
                <p className="text-muted">
                  Revisa los vinculos entre empresas en BD y empresas traidas desde Moabits.
                </p>
              </div>
            </div>
          </div>
        </div>
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

function positiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}
