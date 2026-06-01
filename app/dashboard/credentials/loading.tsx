import { DashboardHeaderSkeleton, DashboardPanelSkeleton, DashboardTableSkeleton } from "../_components/page-skeletons"

export default function CredentialsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

      <DashboardHeaderSkeleton />

      {/* Admin layout: sidebar + table */}
      <div className="grid gap-6 min-[480px]:grid-cols-[200px_minmax(0,1fr)] sm:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]">

        {/* Company sidebar */}
        <div>
          <DashboardPanelSkeleton />
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-divider-soft/45 pt-4">
            <div className="h-8 rounded-md bg-previous-soft" />
            <div className="h-8 rounded-md bg-next-soft" />
          </div>
        </div>

        {/* Credentials table */}
        <div className="overflow-hidden rounded-lg bg-panel-soft shadow-sm shadow-header-top/5">
          <div className="animate-pulse border-b border-divider-soft/45 p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="h-6 w-48 rounded bg-zebra" />
              <div className="flex items-center gap-3">
                <div className="h-9 w-36 rounded-md bg-white shadow-sm" />
                <div className="h-9 w-28 rounded-md bg-header-top/80" />
              </div>
            </div>
          </div>

          <DashboardTableSkeleton />
        </div>
      </div>
    </div>
  )
}
