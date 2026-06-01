"use client"

import type { SubscriptionRow } from "@/lib/api/sim-mapper"
import { fmtShortDate } from "../../data"
import { SourceBadge } from "../../primitives"
import { SOURCES, T } from "../../tokens"
import { rowKey, secondary } from "../rows"
import { CELL_STYLE, GRID_COLS_DEFAULT } from "./constants"
import { DetailCellSkeleton, IccidCell, MonoCell, OpenCell, StatusCell, TableRowShell, TextCell } from "./primitives"
import { RowDetailState } from "./row-detail-state"
import type { DetailsQueryLike } from "./types"

export function DefaultSubscriptionRow({
  row,
  index,
  detailsQuery,
  hovered,
  setHovered,
  setOpenRecord,
}: {
  row: SubscriptionRow
  index: number
  detailsQuery: DetailsQueryLike
  hovered: string | null
  setHovered: (key: string | null) => void
  setOpenRecord: (row: SubscriptionRow | null) => void
}) {
  const source = SOURCES[row.provider]
  const detail = detailsQuery.data?.results[row.iccid]
  const isDetailPending = detailsQuery.isFetching && !detail
  const rowIssue = detail && detail.status !== "ok" ? detail : null
  const isNotFound = rowIssue?.status === "not_found"

  return (
    <TableRowShell
      key={rowKey(row)}
      row={row}
      index={index}
      gridTemplateColumns={GRID_COLS_DEFAULT}
      isDisabled={isNotFound}
      isHovered={hovered === rowKey(row)}
      onHover={setHovered}
      onOpen={setOpenRecord}
    >
      <div style={{ background: source.color }} />
      <IccidCell row={row} />
      <MonoCell>{isDetailPending ? <DetailCellSkeleton /> : secondary(row.msisdn)}</MonoCell>
      <MonoCell>{isDetailPending ? <DetailCellSkeleton /> : secondary(row.imsi)}</MonoCell>
      <TextCell strong>
        {rowIssue ? <RowDetailState detail={rowIssue} fallbackValue={row.planDisplay} onRetry={() => detailsQuery.refetch()} /> : isDetailPending ? <DetailCellSkeleton wide /> : row.planDisplay}
      </TextCell>
      <div style={{ ...CELL_STYLE, display: "flex", alignItems: "center", gap: 8 }}>
        <SourceBadge source={row.provider} size="sm" />
        <span style={{ fontSize: 12, color: T.title, fontWeight: 600 }}>{source.shortName}</span>
      </div>
      <StatusCell row={row} />
      <div style={{ ...CELL_STYLE, fontSize: 12, color: T.text, display: "flex", alignItems: "center" }}>
        {isDetailPending ? <DetailCellSkeleton /> : fmtShortDate(row.updatedAt)}
      </div>
      <OpenCell row={row} isDisabled={isNotFound} onOpen={setOpenRecord} />
    </TableRowShell>
  )
}

