"use client";

import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { Shipment } from "@/lib/types";

export default function ShipmentsTable({ shipments }: { shipments: Shipment[] }) {
  const [sorting, setSorting] = useState([]);

  const columns = useMemo<ColumnDef<Shipment>[]>(
    () => [
      {
        header: "AWB",
        accessorKey: "awb",
        cell: ({ row }) => (
          <Link href={`/shipments/${row.original.awb}`} className="text-slate-900 hover:underline">
            {row.original.awb}
          </Link>
        )
      },
      {
        header: "Customer",
        accessorKey: "customer_name"
      },
      {
        header: "Status",
        accessorKey: "current_status",
        cell: ({ row }) => row.original.current_status ?? "—"
      },
      {
        header: "Last Updated",
        accessorKey: "last_updated_at",
        cell: ({ row }) => new Date(row.original.last_updated_at).toLocaleString()
      }
    ],
    []
  );

  const table = useReactTable({
    data: shipments,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-100">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-2 text-left font-semibold text-slate-700"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <span className="flex items-center gap-2">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{
                      asc: "↑",
                      desc: "↓"
                    }[header.column.getIsSorted() as string] ?? null}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-slate-100">
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-slate-500">
                No shipments yet.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-slate-700">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
