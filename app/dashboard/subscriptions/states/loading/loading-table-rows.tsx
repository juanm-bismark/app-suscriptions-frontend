"use client"

import { SOURCES, type SourceId, T } from "../../tokens"
import { SkeletonCell } from "./skeleton-cell"
import { CELL_STYLE, GRID_COLS, SHIMMER_BG } from "./utils"

export function LoadingTableRows({ rowsSourceCycle }: { rowsSourceCycle: readonly SourceId[] }) {
  return (
    <div style={{ flex: 1, overflow: "auto", background: T.cardBg }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: GRID_COLS,
          fontSize: 10.5,
          letterSpacing: 0.6,
          color: T.tableHeaderText,
          fontWeight: 700,
          textTransform: "uppercase",
          background: T.tableHeaderBg,
          borderBottom: `1px solid ${T.border}`,
          position: "sticky",
          top: 0,
          zIndex: 2,
        }}
      >
        <div />
        <div style={CELL_STYLE}>ICCID</div>
        <div style={CELL_STYLE}>MSISDN</div>
        <div style={CELL_STYLE}>IMSI</div>
        <div style={CELL_STYLE}>Plan</div>
        <div style={CELL_STYLE}>Operador</div>
        <div style={CELL_STYLE}>Estado</div>
        <div style={CELL_STYLE}>Última actualización</div>
        <div style={{ ...CELL_STYLE, textAlign: "right", paddingRight: 16 }} />
      </div>

      {[0, 1, 2, 3, 4, 5].map((index) => (
        <div
          key={index}
          style={{
            display: "grid",
            gridTemplateColumns: GRID_COLS,
            alignItems: "center",
            borderBottom: `1px solid ${T.rowDivider}`,
            minHeight: 54,
          }}
        >
          <div style={{ alignSelf: "stretch", background: SOURCES[rowsSourceCycle[index % rowsSourceCycle.length]].color }} />
          <SkeletonCell width={116} />
          <SkeletonCell width={90} />
          <SkeletonCell width={112} />
          <SkeletonCell width={124} />
          <div style={{ padding: "9px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                background: SHIMMER_BG,
                backgroundSize: "200% 100%",
                animation: "bismark-shimmer 1.3s infinite",
              }}
            />
            <div
              style={{
                width: 48,
                height: 10,
                borderRadius: 2,
                background: SHIMMER_BG,
                backgroundSize: "200% 100%",
                animation: "bismark-shimmer 1.3s infinite",
              }}
            />
          </div>
          <div style={{ padding: "9px 12px" }}>
            <div
              style={{
                width: 86,
                height: 22,
                borderRadius: 999,
                background: SHIMMER_BG,
                backgroundSize: "200% 100%",
                animation: "bismark-shimmer 1.3s infinite",
              }}
            />
          </div>
          <SkeletonCell width={84} />
          <div style={{ padding: "9px 16px 9px 12px", display: "flex", justifyContent: "flex-end" }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 4,
                background: SHIMMER_BG,
                backgroundSize: "200% 100%",
                animation: "bismark-shimmer 1.3s infinite",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

