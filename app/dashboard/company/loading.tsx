export default function CompanyLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-pulse">
      <div className="mb-8">
        <div className="h-9 bg-zebra rounded w-36 mb-2" />
        <div className="h-5 bg-zebra rounded w-80 max-w-full" />
      </div>

      <div className="bg-[#DDF1F2] rounded-lg shadow-sm shadow-header-top/5 p-6 sm:p-8">
        <div className="space-y-4">
          <div>
            <div className="h-4 bg-[#C8E8EA] rounded w-36 mb-2" />
            <div className="h-10 bg-white/80 rounded-md shadow-sm shadow-header-top/5" />
          </div>
          <div className="h-10 bg-[#0F202A] rounded-md w-40" />
        </div>
      </div>
    </div>
  )
}
