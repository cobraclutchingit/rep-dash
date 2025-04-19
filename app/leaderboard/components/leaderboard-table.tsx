"use client";

import React, { useState, useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
} from "@tanstack/react-table";
import { useLeaderboard, LeaderboardEntry } from "../providers/leaderboard-provider";
import { useSession } from "next-auth/react";

export default function LeaderboardTable() {
  const { getFilteredEntries, loading, error } = useLeaderboard();
  const { data: session } = useSession();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "rank", desc: false },
  ]);

  // Get filtered entries from provider
  const data = useMemo(() => getFilteredEntries(), [getFilteredEntries]);

  // Define columns for our table
  const columns = useMemo(
    () => [
      {
        accessorKey: "rank",
        header: "Rank",
        size: 80,
        cell: ({ row }) => {
          const rank = row.getValue("rank") || row.index + 1;
          const isCurrentUser = session?.user?.id === row.original.userId;
          
          // Different styling for top 3 and current user
          let rankClass = "bg-muted text-muted-foreground";
          
          if (rank === 1) {
            rankClass = "bg-yellow-500 text-black";
          } else if (rank === 2) {
            rankClass = "bg-gray-300 text-black";
          } else if (rank === 3) {
            rankClass = "bg-amber-600 text-white";
          }
          
          if (isCurrentUser) {
            rankClass = "bg-primary text-primary-foreground";
          }
          
          return (
            <div className="flex items-center">
              <span className={`${rankClass} w-7 h-7 rounded-full flex items-center justify-center text-sm`}>
                {rank}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "user.name",
        header: "Name",
        cell: ({ row }) => {
          const entry = row.original as LeaderboardEntry;
          const isCurrentUser = session?.user?.id === entry.userId;
          
          return (
            <div className="flex items-center">
              {entry.user?.profileImageUrl ? (
                <div className="w-8 h-8 rounded-full mr-2 overflow-hidden">
                  <img 
                    src={entry.user.profileImageUrl} 
                    alt={entry.user?.name || "User"} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                  {entry.user?.name?.charAt(0) || "U"}
                </div>
              )}
              <span className={`font-medium ${isCurrentUser ? "text-primary" : ""}`}>
                {entry.user?.name || "Unknown User"}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "user.position",
        header: "Position",
        cell: ({ row }) => {
          const position = (row.original as LeaderboardEntry).user?.position;
          return position ? position.replace(/_/g, " ") : "N/A";
        },
      },
      {
        accessorKey: "score",
        header: "Score",
        cell: ({ row }) => {
          const score = parseFloat(row.getValue("score"));
          const isCurrentUser = session?.user?.id === row.original.userId;
          
          return (
            <div className="text-right">
              <span className={`font-bold ${isCurrentUser ? "text-primary" : ""}`}>
                {score.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          );
        },
      },
      {
        id: "metrics",
        header: "Metrics",
        cell: ({ row }) => {
          const entry = row.original as LeaderboardEntry;
          const metrics = entry.metrics || {};
          
          return (
            <div className="flex flex-wrap gap-1 justify-end">
              {Object.entries(metrics).map(([key, value]) => (
                <span 
                  key={key} 
                  className="px-2 py-1 bg-secondary/50 text-secondary-foreground rounded-md text-xs"
                  title={`${key}: ${value}`}
                >
                  {key}: {value}
                </span>
              ))}
            </div>
          );
        },
      },
    ],
    [session]
  );

  // Initialize table
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
        <p>Error loading leaderboard: {error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-card text-card-foreground rounded-lg p-12 text-center border">
        <div className="text-4xl mb-3">🏆</div>
        <h3 className="text-lg font-medium mb-2">No Entries Found</h3>
        <p className="text-muted-foreground">
          There are no entries matching your current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card text-card-foreground rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-left py-3 px-4 font-medium"
                    style={{ width: header.getSize() }}
                  >
                    <div
                      className={`flex items-center gap-1 ${
                        header.column.getCanSort() ? "cursor-pointer select-none" : ""
                      }`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: " 🔼",
                        desc: " 🔽",
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {table.getRowModel().rows.map((row) => {
              const isCurrentUser = session?.user?.id === row.original.userId;
              return (
                <tr
                  key={row.id}
                  className={`${isCurrentUser ? "bg-primary/5" : ""} hover:bg-muted/50`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-3 px-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between p-4 border-t">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            data.length
          )}{" "}
          of {data.length} entries
        </div>
        <div className="flex items-center space-x-2">
          <button
            className="px-3 py-1 rounded-md border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </button>
          <span className="text-sm">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <button
            className="px-3 py-1 rounded-md border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}