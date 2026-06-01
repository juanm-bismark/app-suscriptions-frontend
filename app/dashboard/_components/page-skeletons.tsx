export function FormPageLoadingSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-pulse">
      {/* Header */}
      <div className="mb-8">
        <div className="h-9 bg-zebra rounded w-32 mb-2"></div>
        <div className="h-5 bg-zebra rounded w-80"></div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-lg shadow border border-divider p-6 sm:p-8 space-y-6">
        {/* Multiple form fields */}
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <div className="h-4 bg-zebra rounded w-24 mb-2"></div>
            <div className="h-10 bg-zebra rounded w-full"></div>
          </div>
        ))}
        {/* Submit button area */}
        <div className="pt-4 space-y-2">
          <div className="h-10 bg-zebra rounded w-32"></div>
        </div>
      </div>
    </div>
  )
}

export function PageLoadingSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex-1">
          <div className="h-9 bg-zebra rounded w-40 mb-2"></div>
          <div className="h-5 bg-zebra rounded w-96"></div>
        </div>
      </div>

      {/* Content placeholder */}
      <div className="bg-white rounded-lg shadow border border-divider p-6 sm:p-8 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-zebra rounded"></div>
        ))}
      </div>
    </div>
  )
}

export function DashboardHeaderSkeleton({ actions = 2 }: { actions?: number }) {
  return (
    <div className="mb-8 animate-pulse rounded-lg bg-panel-soft p-5 shadow-sm shadow-header-top/5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 h-9 w-44 rounded bg-zebra" />
          <div className="h-4 w-72 max-w-full rounded bg-zebra" />
          {actions > 0 && (
            <div className="mt-4 flex gap-2">
              {Array.from({ length: actions }).map((_, index) => (
                <div key={index} className={`h-8 w-24 rounded-md ${index === actions - 1 ? "bg-header-top/20" : "bg-zebra"}`} />
              ))}
            </div>
          )}
        </div>
        <div className="flex w-full max-w-xs items-center gap-3 rounded-md border border-soft-border bg-white px-3 py-2.5 shadow-sm shadow-header-top/5">
          <div className="h-9 w-9 shrink-0 rounded-md bg-accent-soft" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-3 w-20 rounded bg-zebra" />
            <div className="h-4 w-28 rounded bg-zebra" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function DashboardPanelSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse rounded-lg bg-panel-soft p-4 shadow-sm shadow-header-top/5 sm:p-5">
      <div className="mb-4 h-6 w-24 rounded bg-zebra" />
      <div className="mb-2 h-9 rounded-md border border-soft-border bg-white" />
      <div className="mb-4 h-8 rounded-md bg-header-top/80" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="rounded-md bg-white/75 px-3 py-3 shadow-sm shadow-header-top/5">
            <div className="h-4 w-4/5 rounded bg-zebra" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function DashboardTableSkeleton({ rows = 3, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="animate-pulse">
      <div className="grid gap-3 bg-hover-soft px-6 py-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <div key={index} className="h-3 rounded bg-[#D4E8EA]" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="grid h-[72px] items-center gap-3 px-6 py-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((_, column) => (
            <div key={column} className="h-4 rounded bg-zebra" />
          ))}
        </div>
      ))}
    </div>
  )
}
