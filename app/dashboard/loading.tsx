export default function DashboardLoading() {
  return (
    <div className="flex-1 flex flex-col bg-page">
      {/* Header skeleton */}
      <div className="bg-card border-b border-divider px-8 py-6">
        <div className="animate-pulse space-y-2">
          <div className="h-9 bg-zebra rounded w-48"></div>
          <div className="h-4 bg-zebra rounded w-96"></div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 px-8 py-6 overflow-auto">
        {/* Quick Stats - 4 cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white border border-divider rounded-lg p-4 animate-pulse"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="h-3 bg-zebra rounded w-24"></div>
                <div className="h-5 bg-zebra rounded w-5"></div>
              </div>
              <div className="h-8 bg-zebra rounded w-16"></div>
            </div>
          ))}
        </div>

        {/* CTA Box skeleton */}
        <div className="bg-white border border-divider rounded-lg p-8 text-center max-w-2xl mx-auto animate-pulse">
          <div className="mb-4 inline-flex items-center justify-center w-14 h-14 bg-zebra rounded-lg"></div>
          <div className="h-8 bg-zebra rounded w-48 mx-auto mb-2"></div>
          <div className="space-y-2 mb-6">
            <div className="h-4 bg-zebra rounded w-full"></div>
            <div className="h-4 bg-zebra rounded w-3/4 mx-auto"></div>
          </div>
          <div className="h-10 bg-zebra rounded w-40 mx-auto"></div>
        </div>

        {/* Quick Links skeleton */}
        <div className="mt-12">
          <div className="h-6 bg-zebra rounded w-32 mb-4 animate-pulse"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 bg-white border border-divider rounded-lg animate-pulse"
              >
                <div className="h-5 bg-zebra rounded w-5 mx-auto mb-2"></div>
                <div className="h-4 bg-zebra rounded w-20 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Account Info skeleton */}
        <div className="mt-12 max-w-2xl animate-pulse">
          <div className="h-6 bg-zebra rounded w-40 mb-4"></div>
          <div className="bg-white border border-divider rounded-lg p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-start">
                <div className="h-4 bg-zebra rounded w-20"></div>
                <div className="h-4 bg-zebra rounded w-32"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
