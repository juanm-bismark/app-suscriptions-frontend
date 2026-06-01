"use client"

import { GRID_COLS_DEFAULT, GRID_COLS_MOABITS } from "./table-parts/constants"
import { DefaultSubscriptionRow } from "./table-parts/default-row"
import { MoabitsSubscriptionRow } from "./table-parts/moabits-row"
import { TableHeader } from "./table-parts/primitives"
import type { TableProps } from "./table-parts/types"

export function DefaultTable({ rows, detailsQuery, hovered, setHovered, setOpenRecord, emptyState }: TableProps) {
  return (
    <>
      <TableHeader columns={["ICCID", "MSISDN", "IMSI", "Plan", "Operador", "Estado", "Última actualización"]} gridTemplateColumns={GRID_COLS_DEFAULT} />
      {emptyState}
      {rows.map((row, index) => (
        <DefaultSubscriptionRow
          key={`${row.provider}:${row.iccid}`}
          row={row}
          index={index}
          detailsQuery={detailsQuery}
          hovered={hovered}
          setHovered={setHovered}
          setOpenRecord={setOpenRecord}
        />
      ))}
    </>
  )
}

export function MoabitsTable({ rows, detailsQuery, hovered, setHovered, setOpenRecord, emptyState }: TableProps) {
  return (
    <>
      <TableHeader columns={["ICCID", "Estado", "LastLu", "LastCdr", "IMEI", "Operador", "IMSI", "Servicios"]} gridTemplateColumns={GRID_COLS_MOABITS} />
      {emptyState}
      {rows.map((row, index) => (
        <MoabitsSubscriptionRow
          key={`${row.provider}:${row.iccid}`}
          row={row}
          index={index}
          detailsQuery={detailsQuery}
          hovered={hovered}
          setHovered={setHovered}
          setOpenRecord={setOpenRecord}
        />
      ))}
    </>
  )
}

