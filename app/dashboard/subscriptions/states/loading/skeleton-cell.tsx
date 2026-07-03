"use client"

export function SkeletonCell({ width }: { width: number }) {
  return (
    <div className="px-3 py-[9px]">
      <div className="skeleton-shimmer h-2.5 max-w-full rounded-xs" style={{ width }} />
    </div>
  )
}
