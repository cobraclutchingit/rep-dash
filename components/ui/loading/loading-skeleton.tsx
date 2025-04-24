'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('bg-secondary/70 h-4 w-full animate-pulse rounded-md', className)} />;
}

export function CardSkeleton() {
  return (
    <div className="bg-card rounded-lg border p-6">
      <Skeleton className="mb-4 h-8 w-3/4" />
      <Skeleton className="mb-2" />
      <Skeleton className="mb-2" />
      <Skeleton className="mb-2" />
      <Skeleton className="mt-6 h-10 w-1/4" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex space-x-4 border-b py-3">
      <Skeleton className="h-6 w-1/4" />
      <Skeleton className="h-6 w-1/4" />
      <Skeleton className="h-6 w-1/4" />
      <Skeleton className="h-6 w-1/4" />
    </div>
  );
}

export function TableSkeleton({ rowCount = 5 }: { rowCount?: number }) {
  return (
    <div className="bg-card rounded-lg border p-4">
      <Skeleton className="mb-6 h-8 w-1/2" />
      <div className="space-y-4">
        {Array.from({ length: rowCount }).map((_, i) => (
          <TableRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
