export default function DashboardLoading() {
  const providerSkeletonColors = ["bg-[#E5F5F6]", "bg-[#F0EAFB]", "bg-[#FCEADC]"]

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 animate-pulse space-y-2 sm:mb-8">
        <div className="h-10 w-64 rounded bg-zebra" />
        <div className="h-4 w-80 max-w-full rounded bg-zebra" />
      </div>

      <section className="space-y-4">
        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="grid gap-3 sm:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex min-h-32 animate-pulse flex-col justify-between rounded-lg bg-gradient-to-b from-white to-[#EAF6F7] px-4 py-4 shadow-sm shadow-header-top/5">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-md bg-[#DDF1F2]" />
                  <div className="h-4 w-24 rounded bg-zebra" />
                </div>
                <div className="h-9 w-20 rounded bg-zebra" />
                <div className="h-3 w-28 rounded bg-zebra" />
              </div>
            ))}
          </div>

          <div className="animate-pulse rounded-lg bg-[#DDF1F2] p-4 shadow-sm shadow-header-top/5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="h-3 w-24 rounded bg-zebra" />
                <div className="h-6 w-52 rounded bg-zebra" />
              </div>
              <div className="h-5 w-5 rounded bg-[#326472]" />
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-4 w-full rounded bg-zebra" />
              <div className="h-4 w-2/3 rounded bg-zebra" />
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <div className="h-10 w-40 rounded-md bg-header-bg" />
              <div className="h-10 w-32 rounded-md bg-white/75" />
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
                <div className="h-6 w-16 rounded-full bg-[#DDF4EA]" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-12 pt-8">
        <div className="mb-6 h-6 w-44 animate-pulse rounded bg-zebra" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="animate-pulse rounded-lg bg-[#F5FAFA] p-4 shadow-sm shadow-header-top/5 sm:p-6">
              <div className="mb-3 h-4 w-20 rounded bg-zebra" />
              <div className="h-5 w-36 rounded bg-zebra" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
