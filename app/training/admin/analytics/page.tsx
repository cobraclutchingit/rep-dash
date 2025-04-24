import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import EngagementStats from '@/app/training/admin/analytics/components/engagement-stats';
import ModulesCompletionChart from '@/app/training/admin/analytics/components/modules-completion-chart';
import ProgressOverTimeChart from '@/app/training/admin/analytics/components/progress-over-time-chart';
import TopModulesTable from '@/app/training/admin/analytics/components/top-modules-table';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Training Analytics | Admin Dashboard',
  description: 'Training module analytics and insights',
};

export default async function TrainingAnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Check if user has admin role
  if (session.user.role !== 'ADMIN') {
    redirect('/training');
  }

  // Get module completion data
  const moduleCompletions = await prisma.trainingModule.findMany({
    where: {
      isPublished: true,
    },
    select: {
      id: true,
      title: true,
      category: true,
      _count: {
        select: {
          progress: {
            where: {
              status: 'COMPLETED',
            },
          },
        },
      },
      progress: {
        where: {
          status: 'IN_PROGRESS',
        },
        select: {
          id: true,
        },
      },
    },
    orderBy: [{ category: 'asc' }, { title: 'asc' }],
  });

  // Transform data for charts
  const moduleCompletionData = moduleCompletions.map((module) => ({
    id: module.id,
    title: module.title,
    category: module.category,
    completed: module._count.progress,
    inProgress: module.progress.length,
  }));

  // Get top modules by completion rate
  const topModules = [...moduleCompletionData]
    .sort((a, b) => b.completed - a.completed)
    .slice(0, 10);

  // Get recent completions
  const recentCompletions = await prisma.trainingProgress.findMany({
    where: {
      status: 'COMPLETED',
      completedAt: {
        not: null,
      },
    },
    orderBy: {
      completedAt: 'desc',
    },
    take: 10,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          position: true,
        },
      },
      module: {
        select: {
          id: true,
          title: true,
          category: true,
        },
      },
    },
  });

  // Get completion data over time (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const completionsOverTime = await prisma.trainingProgress.groupBy({
    by: ['completedAt'],
    where: {
      status: 'COMPLETED',
      completedAt: {
        gte: thirtyDaysAgo,
      },
    },
    _count: {
      id: true,
    },
    orderBy: {
      completedAt: 'asc',
    },
  });

  // Transform data for time series chart
  const progressOverTimeData = completionsOverTime.map((item) => ({
    date: item.completedAt,
    count: item._count.id,
  }));

  // Get user engagement stats
  const totalUsers = await prisma.user.count({
    where: { isActive: true },
  });

  const usersWithCompletions = await prisma.user.count({
    where: {
      isActive: true,
      trainingProgress: {
        some: {
          status: 'COMPLETED',
        },
      },
    },
  });

  const usersWithProgress = await prisma.user.count({
    where: {
      isActive: true,
      trainingProgress: {
        some: {},
      },
    },
  });

  const engagementStats = {
    totalUsers,
    usersWithCompletions,
    usersWithProgress,
    completionRate: totalUsers > 0 ? (usersWithCompletions / totalUsers) * 100 : 0,
    engagementRate: totalUsers > 0 ? (usersWithProgress / totalUsers) * 100 : 0,
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex flex-col justify-between md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold">Training Analytics</h1>
          <p className="text-muted-foreground">
            View training engagement metrics and completion statistics
          </p>
        </div>
        <div className="mt-4 space-x-2 md:mt-0">
          <Link
            href="/training/admin/reports"
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-md px-4 py-2"
          >
            View Reports
          </Link>
          <Link
            href="/training/admin"
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-md px-4 py-2"
          >
            Back to Admin
          </Link>
        </div>
      </div>

      <EngagementStats stats={engagementStats} />

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-card text-card-foreground rounded-lg p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Module Completion Rates</h2>
          <ModulesCompletionChart data={moduleCompletionData} />
        </div>

        <div className="bg-card text-card-foreground rounded-lg p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Completions Over Time</h2>
          <ProgressOverTimeChart data={progressOverTimeData} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-card text-card-foreground rounded-lg p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Top Modules by Completion</h2>
          <TopModulesTable modules={topModules} />
        </div>

        <div className="bg-card text-card-foreground rounded-lg p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Recent Completions</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-2 text-left text-sm font-semibold">User</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Module</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-muted/50 divide-y">
                {recentCompletions.map((completion) => (
                  <tr key={completion.id} className="hover:bg-muted/40">
                    <td className="px-4 py-2 text-sm">
                      <div className="font-medium">{completion.user.name}</div>
                      <div className="text-muted-foreground text-xs">
                        {completion.user.position?.replace(/_/g, ' ')}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <Link
                        href={`/training/admin/modules/${completion.module.id}`}
                        className="hover:text-primary"
                      >
                        {completion.module.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {completion.completedAt
                        ? new Date(completion.completedAt).toLocaleDateString()
                        : 'N/A'}
                    </td>
                  </tr>
                ))}

                {recentCompletions.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-muted-foreground px-4 py-8 text-center">
                      No recent completions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
