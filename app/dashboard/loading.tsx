export default function DashboardLoading() {
  const providerSkeletonColors = ["bg-provider-kite-soft", "bg-provider-tele2-soft", "bg-provider-moabits-soft"]
  const metricSkeletonColors = [
    "from-white to-metric-soft",
    "from-white to-provider-tele2-soft",
    "from-white to-provider-moabits-soft",
  ]
  const metricIconColors = ["bg-accent-soft", "bg-provider-tele2-soft", "bg-provider-moabits-soft"]

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 rounded-lg bg-panel-soft p-5 shadow-sm shadow-header-top/5 sm:mb-8 sm:p-6">
        <div className="flex animate-pulse flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 h-10 w-64 rounded bg-zebra" />
            <div className="h-4 w-80 max-w-full rounded bg-zebra" />
          </div>
          <div className="self-start flex max-w-full shrink-0 items-center gap-3 rounded-md bg-white px-3 py-2.5 shadow-sm shadow-header-top/5 md:self-auto">
            <div className="h-9 w-9 shrink-0 rounded-md bg-accent-soft" />
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 h-3 w-16 rounded bg-zebra" />
              <div className="h-4 w-28 rounded bg-zebra" />
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="grid gap-3 sm:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className={`flex min-h-32 animate-pulse flex-col justify-between rounded-lg bg-gradient-to-b px-4 py-4 shadow-sm shadow-header-top/5 ${metricSkeletonColors[item - 1]}`}>
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-md ${metricIconColors[item - 1]}`} />
                  <div className="h-4 w-24 rounded bg-white/75" />
                </div>
                <div className="h-9 w-20 rounded bg-white/75" />
                <div className="h-3 w-28 rounded bg-white/75" />
              </div>
            ))}
          </div>

          <div className="animate-pulse rounded-lg bg-gradient-to-br from-ink-teal via-header-bg to-action-soft p-4 shadow-sm shadow-header-top/10">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="h-3 w-24 rounded bg-header-client/45" />
                <div className="h-6 w-52 rounded bg-white/25" />
              </div>
              <div className="h-5 w-5 rounded bg-header-client/45" />
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-4 w-full rounded bg-white/20" />
              <div className="h-4 w-2/3 rounded bg-white/20" />
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <div className="h-10 w-40 rounded-md bg-white" />
              <div className="h-10 w-32 rounded-md bg-white/15" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className={`animate-pulse rounded-lg px-4 py-2.5 shadow-sm shadow-header-top/5 ${providerSkeletonColors[item - 1]}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-2">
                  <div className="h-4 w-20 rounded bg-zebra" />
                  <div className="h-3 w-24 rounded bg-zebra" />
                </div>
                <div className="h-6 w-16 rounded-full bg-success-soft" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-10 rounded-lg bg-panel-soft p-5 shadow-sm shadow-header-top/5 sm:p-6">
        <div className="mb-4 h-6 w-44 animate-pulse rounded bg-zebra" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="animate-pulse rounded-lg bg-white/75 p-4 shadow-sm shadow-header-top/5 sm:p-6">
              <div className="mb-3 h-4 w-20 rounded bg-zebra" />
              <div className="h-5 w-36 rounded bg-zebra" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
