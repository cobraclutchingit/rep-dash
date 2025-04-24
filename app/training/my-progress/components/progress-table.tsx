'use client';

import { TrainingProgress, TrainingModule, TrainingCategory } from '@prisma/client';
import Link from 'next/link';
import { useState } from 'react';

interface ProgressTableProps {
  progress: (TrainingProgress & {
    module: TrainingModule;
  })[];
}

export default function ProgressTable({ progress }: ProgressTableProps) {
  const [filter, setFilter] = useState<string>('ALL');

  // Filter progress items based on selected filter
  const filteredProgress =
    filter === 'ALL' ? progress : progress.filter((p) => p.status === filter);

  // Status styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-500/10 text-green-500';
      case 'IN_PROGRESS':
        return 'bg-amber-500/10 text-amber-500';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Completed';
      case 'IN_PROGRESS':
        return 'In Progress';
      default:
        return 'Not Started';
    }
  };

  // Format category for display
  const formatCategory = (category: TrainingCategory) => {
    return category
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="bg-card text-card-foreground overflow-hidden rounded-lg shadow">
      <div className="border-b p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('ALL')}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filter === 'ALL'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('COMPLETED')}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filter === 'COMPLETED'
                ? 'bg-primary text-primary-foreground'
                : 'bg-green-500/10 text-green-500'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter('IN_PROGRESS')}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filter === 'IN_PROGRESS'
                ? 'bg-primary text-primary-foreground'
                : 'bg-amber-500/10 text-amber-500'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setFilter('NOT_STARTED')}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filter === 'NOT_STARTED'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            Not Started
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-semibold">Module</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Category</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Progress</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Last Activity</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-muted divide-y">
            {filteredProgress.map((item) => (
              <tr key={item.id} className="hover:bg-muted/40">
                <td className="px-4 py-3 text-sm">
                  <div className="font-medium">{item.module.title}</div>
                  {item.module.isRequired && <span className="text-primary text-xs">Required</span>}
                </td>
                <td className="px-4 py-3 text-sm">{formatCategory(item.module.category)}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`rounded-full px-2 py-1 text-xs ${getStatusBadge(item.status)}`}>
                    {getStatusText(item.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="bg-secondary h-2 w-full rounded-full">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${item.percentComplete}%` }}
                    ></div>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {Math.round(item.percentComplete)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  {item.lastAccessedAt ? (
                    <span>{new Date(item.lastAccessedAt).toLocaleDateString()}</span>
                  ) : (
                    <span className="text-muted-foreground">Never</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  <Link
                    href={`/training/modules/${item.module.id}`}
                    className="text-primary hover:underline"
                  >
                    {item.status === 'COMPLETED'
                      ? 'Review'
                      : item.status === 'IN_PROGRESS'
                        ? 'Continue'
                        : 'Start'}
                  </Link>
                </td>
              </tr>
            ))}

            {filteredProgress.length === 0 && (
              <tr>
                <td colSpan={6} className="text-muted-foreground px-4 py-8 text-center">
                  No modules found matching the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
