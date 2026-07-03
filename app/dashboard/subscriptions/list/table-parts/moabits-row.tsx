"use client"

import type { SubscriptionRow } from "@/lib/api/sim-mapper"
import { cn } from "@/lib/utils"
import { fmtShortDate } from "../../data"
import { isStaleLu } from "../kpi-strip"
import { SOURCES } from "../../tokens"
import { rowKey, secondary } from "../rows"
import { CELL_CLASS, GRID_COLS_MOABITS } from "./constants"
import { DetailCellSkeleton, IccidCell, MonoCell, OpenCell, ServicePill, StatusCell, TableRowShell, TextCell } from "./primitives"
import { RowDetailState } from "./row-detail-state"
import type { DetailsQueryLike } from "./types"

export function MoabitsSubscriptionRow({
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
  const luStale = isStaleLu(row.lastLuAt)

  return (
    <TableRowShell
      key={rowKey(row)}
      row={row}
      index={index}
      gridTemplateColumns={GRID_COLS_MOABITS}
      isDisabled={isNotFound}
      isHovered={hovered === rowKey(row)}
      onHover={setHovered}
      onOpen={setOpenRecord}
    >
      <div style={{ background: source.color }} />
      <IccidCell row={row} />
      <StatusCell row={row} />
      <div className={cn(CELL_CLASS, "flex items-center", luStale ? "font-bold text-warning-action" : "font-medium text-text")}>
        {isDetailPending ? <DetailCellSkeleton /> : fmtShortDate(row.lastLuAt)}
      </div>
      <div className={cn(CELL_CLASS, "flex items-center text-text")}>
        {isDetailPending ? <DetailCellSkeleton /> : fmtShortDate(row.lastCdrAt)}
      </div>
      <MonoCell>{isDetailPending ? <DetailCellSkeleton /> : secondary(row.imei)}</MonoCell>
      <TextCell strong>
        {rowIssue ? <RowDetailState detail={rowIssue} fallbackValue={row.operator ?? "—"} onRetry={() => detailsQuery.refetch()} /> : isDetailPending ? <DetailCellSkeleton /> : (row.operator ?? "—")}
      </TextCell>
      <MonoCell>{isDetailPending ? <DetailCellSkeleton /> : secondary(row.imsi)}</MonoCell>
      <div className={cn(CELL_CLASS, "flex flex-wrap items-center gap-1.5")}>
        <ServicePill enabled={row.dataService} label="Datos" />
        <ServicePill enabled={row.smsService} label="SMS" />
      </div>
      <OpenCell row={row} isDisabled={isNotFound} onOpen={setOpenRecord} />
    </TableRowShell>
  )
}
