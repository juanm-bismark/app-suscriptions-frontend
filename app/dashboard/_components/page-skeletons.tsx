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
