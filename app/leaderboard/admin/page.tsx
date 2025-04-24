import { LeaderboardPeriod, LeaderboardType } from '@prisma/client';
import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorBoundary, ErrorUI } from '@/components/ui/error-boundary';
import { Loading } from '@/components/ui/loading';
import { TypographyH1 } from '@/components/ui/typography';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/utils/auth-utils';

export const metadata: Metadata = {
  title: 'Leaderboard Management | Sales Rep Dashboard',
  description: 'Manage sales leaderboards and rankings',
};

interface LeaderboardWithCounts {
  id: string;
  name: string;
  description: string | null;
  type: LeaderboardType;
  period: LeaderboardPeriod;
  isActive: boolean;
  _count: {
    entries: number;
  };
}

// Format enum values for display
function formatEnumValue(value: string): string {
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Separate Leaderboard List component to allow for Suspense
async function LeaderboardList() {
  // Check authorization on server side
  await requireAuth('/login', {
    requiredRoles: ['ADMIN'],
    redirectUnauthorizedTo: '/leaderboard'
  });
  
  // Get all leaderboards
  const leaderboards = await prisma.leaderboard.findMany({
    include: {
      _count: {
        select: {
          entries: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  if (leaderboards.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl">
          🏆
        </div>
        <h3 className="mb-2 text-lg font-medium">No Leaderboards</h3>
        <p className="text-muted-foreground mb-6">
          Get started by creating your first leaderboard
        </p>
        <Button asChild>
          <Link href="/leaderboard/admin/new">Create Leaderboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto" data-testid="leaderboard-list">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            <th className="px-4 py-3 text-left">Name</th>
            <th className="px-4 py-3 text-left">Type</th>
            <th className="px-4 py-3 text-left">Period</th>
            <th className="px-4 py-3 text-center">Entries</th>
            <th className="px-4 py-3 text-center">Status</th>
            <th className="px-4 py-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {leaderboards.map((leaderboard: LeaderboardWithCounts) => (
            <tr key={leaderboard.id} className="hover:bg-muted/50">
              <td className="px-4 py-3">
                <div className="font-medium">{leaderboard.name}</div>
                <div className="text-muted-foreground line-clamp-1 text-xs">
                  {leaderboard.description || 'No description'}
                </div>
              </td>
              <td className="px-4 py-3">{formatEnumValue(leaderboard.type)}</td>
              <td className="px-4 py-3">{formatEnumValue(leaderboard.period)}</td>
              <td className="px-4 py-3 text-center">{leaderboard._count.entries}</td>
              <td className="px-4 py-3 text-center">
                <span
                  className={`rounded-full px-2 py-1 text-xs ${
                    leaderboard.isActive
                      ? 'bg-green-500/10 text-green-500'
                      : 'bg-amber-500/10 text-amber-500'
                  }`}
                >
                  {leaderboard.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-center space-x-2">
                  <Button variant="secondary" size="sm" asChild>
                    <Link href={`/leaderboard/admin/board/${leaderboard.id}`}>
                      Manage
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href={`/leaderboard/admin/edit/${leaderboard.id}`}>
                      Edit
                    </Link>
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function LeaderboardAdminPage() {
  // Server-side auth check
  await requireAuth('/login', {
    requiredRoles: ['ADMIN'],
    redirectUnauthorizedTo: '/leaderboard'
  });
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <TypographyH1>Leaderboard Management</TypographyH1>
        <Button asChild>
          <Link href="/leaderboard/admin/new">Create Leaderboard</Link>
        </Button>
      </div>

      <Card>
        <ErrorBoundary fallback={
          <ErrorUI 
            error={new Error("Failed to load leaderboard data")}
            reset={() => window.location.reload()}
          />
        }>
          <Suspense fallback={<Loading text="Loading leaderboards..." />}>
            <LeaderboardList />
          </Suspense>
        </ErrorBoundary>
      </Card>
    </div>
  );
}
