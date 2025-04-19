"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "h-4 w-full animate-pulse rounded-md bg-secondary/70",
        className
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="border rounded-lg p-6 bg-card">
      <Skeleton className="h-8 w-3/4 mb-4" />
      <Skeleton className="mb-2" />
      <Skeleton className="mb-2" />
      <Skeleton className="mb-2" />
      <Skeleton className="h-10 w-1/4 mt-6" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex space-x-4 py-3 border-b">
      <Skeleton className="h-6 w-1/4" />
      <Skeleton className="h-6 w-1/4" />
      <Skeleton className="h-6 w-1/4" />
      <Skeleton className="h-6 w-1/4" />
    </div>
  );
}

export function TableSkeleton({ rowCount = 5 }: { rowCount?: number }) {
  return (
    <div className="border rounded-lg p-4 bg-card">
      <Skeleton className="h-8 w-1/2 mb-6" />
      <div className="space-y-4">
        {Array.from({ length: rowCount }).map((_, i) => (
          <TableRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}