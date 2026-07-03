"use client"

import type { SubscriptionRow } from "@/lib/api/sim-mapper"
import { cn } from "@/lib/utils"
import { fmtShortDate } from "../../data"
import { SourceBadge } from "../../primitives"
import { SOURCES } from "../../tokens"
import { rowKey, secondary } from "../rows"
import { CELL_CLASS, GRID_COLS_DEFAULT } from "./constants"
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
      <div className={cn(CELL_CLASS, "flex items-center gap-2")}>
        <SourceBadge source={row.provider} size="sm" />
        <span className="text-[12px] font-semibold text-title">{source.shortName}</span>
      </div>
      <StatusCell row={row} />
      <div className={cn(CELL_CLASS, "flex items-center text-[12px] text-text")}>
        {isDetailPending ? <DetailCellSkeleton /> : fmtShortDate(row.updatedAt)}
      </div>
      <OpenCell row={row} isDisabled={isNotFound} onOpen={setOpenRecord} />
    </TableRowShell>
  )
}
