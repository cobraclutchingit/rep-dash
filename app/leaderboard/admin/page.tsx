import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canManageLeaderboards } from '@/lib/utils/permissions';

export const metadata: Metadata = {
  title: 'Leaderboard Management | Sales Rep Dashboard',
  description: 'Manage sales leaderboards and rankings',
};

export default async function LeaderboardAdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Check if user has permission to manage leaderboards
  if (!canManageLeaderboards(session)) {
    redirect('/leaderboard');
  }

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

  // Format enum values for display
  const formatEnumValue = (value: string) => {
    return value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Leaderboard Management</h1>
        <Link
          href="/leaderboard/admin/new"
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2"
        >
          Create Leaderboard
        </Link>
      </div>

      <div className="bg-card text-card-foreground overflow-hidden rounded-lg shadow">
        {leaderboards.length === 0 ? (
          <div className="p-12 text-center">
            <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl">
              🏆
            </div>
            <h3 className="mb-2 text-lg font-medium">No Leaderboards</h3>
            <p className="text-muted-foreground mb-6">
              Get started by creating your first leaderboard
            </p>
            <Link
              href="/leaderboard/admin/new"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2"
            >
              Create Leaderboard
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                {leaderboards.map((leaderboard) => (
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
                        <Link
                          href={`/leaderboard/admin/board/${leaderboard.id}`}
                          className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-md px-3 py-1 text-sm"
                        >
                          Manage
                        </Link>
                        <Link
                          href={`/leaderboard/admin/edit/${leaderboard.id}`}
                          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-1 text-sm"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
