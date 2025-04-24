'use client';

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
} from '@tanstack/react-table';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import React, { useState, useMemo } from 'react';

import { useLeaderboard, LeaderboardEntry } from '../providers/leaderboard-provider';

export default function LeaderboardTable() {
  const { getFilteredEntries, loading, error } = useLeaderboard();
  const { data: session } = useSession();
  const [sorting, setSorting] = useState<SortingState>([{ id: 'rank', desc: false }]);

  // Get filtered entries from provider
  const data = useMemo(() => getFilteredEntries(), [getFilteredEntries]);

  // Define columns for our table
  const columns = useMemo(
    () => [
      {
        accessorKey: 'rank',
        header: 'Rank',
        size: 80,
        cell: ({ row }) => {
          const rank = row.getValue('rank') || row.index + 1;
          const isCurrentUser = session?.user?.id === row.original.userId;

          // Different styling for top 3 and current user
          let rankClass = 'bg-muted text-muted-foreground';

          if (rank === 1) {
            rankClass = 'bg-yellow-500 text-black';
          } else if (rank === 2) {
            rankClass = 'bg-gray-300 text-black';
          } else if (rank === 3) {
            rankClass = 'bg-amber-600 text-white';
          }

          if (isCurrentUser) {
            rankClass = 'bg-primary text-primary-foreground';
          }

          return (
            <div className="flex items-center">
              <span
                className={`${rankClass} flex h-7 w-7 items-center justify-center rounded-full text-sm`}
              >
                {rank}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'user.name',
        header: 'Name',
        cell: ({ row }) => {
          const entry = row.original as LeaderboardEntry;
          const isCurrentUser = session?.user?.id === entry.userId;

          return (
            <div className="flex items-center">
              {entry.user?.profileImageUrl ? (
                <div className="mr-2 h-8 w-8 overflow-hidden rounded-full">
                  <Image
                    src={entry.user.profileImageUrl}
                    alt={entry.user?.name || 'User'}
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="bg-primary/10 mr-2 flex h-8 w-8 items-center justify-center rounded-full">
                  {entry.user?.name?.[0] || 'U'}
                </div>
              )}
              <span className={`font-medium ${isCurrentUser ? 'text-primary' : ''}`}>
                {entry.user?.name || 'Unknown User'}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'user.position',
        header: 'Position',
        cell: ({ row }) => {
          const position = (row.original as LeaderboardEntry).user?.position;
          return position ? position.replace(/_/g, ' ') : 'N/A';
        },
      },
      {
        accessorKey: 'score',
        header: 'Score',
        cell: ({ row }) => {
          const score = parseFloat(row.getValue('score'));
          const isCurrentUser = session?.user?.id === row.original.userId;

          return (
            <div className="text-right">
              <span className={`font-bold ${isCurrentUser ? 'text-primary' : ''}`}>
                {score.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          );
        },
      },
      {
        id: 'metrics',
        header: 'Metrics',
        cell: ({ row }) => {
          const entry = row.original as LeaderboardEntry;
          const metrics = entry.metrics || {};

          return (
            <div className="flex flex-wrap justify-end gap-1">
              {Object.entries(metrics).map(([key, value]) => (
                <span
                  key={key}
                  className="bg-secondary/50 text-secondary-foreground rounded-md px-2 py-1 text-xs"
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
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive rounded-lg p-4">
        <p>Error loading leaderboard: {error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-card text-card-foreground rounded-lg border p-12 text-center">
        <div className="mb-3 text-4xl">🏆</div>
        <h3 className="mb-2 text-lg font-medium">No Entries Found</h3>
        <p className="text-muted-foreground">There are no entries matching your current filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-card text-card-foreground overflow-hidden rounded-lg shadow">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left font-medium"
                    style={{ width: header.getSize() }}
                  >
                    <div
                      className={`flex items-center gap-1 ${
                        header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                      }`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: ' 🔼',
                        desc: ' 🔽',
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y">
            {table.getRowModel().rows.map((row) => {
              const isCurrentUser = session?.user?.id === row.original.userId;
              return (
                <tr
                  key={row.id}
                  className={`${isCurrentUser ? 'bg-primary/5' : ''} hover:bg-muted/50`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
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
      <div className="flex items-center justify-between border-t p-4">
        <div className="text-muted-foreground flex-1 text-sm">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}{' '}
          to{' '}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            data.length
          )}{' '}
          of {data.length} entries
        </div>
        <div className="flex items-center space-x-2">
          <button
            className="hover:bg-muted rounded-md border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </button>
          <span className="text-sm">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <button
            className="hover:bg-muted rounded-md border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
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
