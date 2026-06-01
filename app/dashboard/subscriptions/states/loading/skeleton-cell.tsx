"use client"

import { SHIMMER_BG } from "./utils"

export function SkeletonCell({ width }: { width: number }) {
  return (
    <div style={{ padding: "9px 12px" }}>
      <div
        style={{
          width,
          maxWidth: "100%",
          height: 10,
          borderRadius: 2,
          background: SHIMMER_BG,
          backgroundSize: "200% 100%",
          animation: "bismark-shimmer 1.3s infinite",
        }}
      />
    </div>
  )
}

