'use client';

interface AdminStatsProps {
  totalPublishedModules: number;
  totalSections: number;
  totalCompletions: number;
  totalProgress: number;
  usersCount: number;
  usersWithTraining: number;
}

export default function AdminStats({
  totalPublishedModules,
  totalSections,
  totalCompletions,
  totalProgress,
  usersCount,
  usersWithTraining,
}: AdminStatsProps) {
  // Calculate completion rate
  const completionRate =
    totalProgress > 0 ? Math.round((totalCompletions / totalProgress) * 100) : 0;

  // Calculate user engagement rate
  const userEngagementRate =
    usersCount > 0 ? Math.round((usersWithTraining / usersCount) * 100) : 0;

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="bg-card text-card-foreground rounded-lg p-6 shadow">
        <h3 className="text-muted-foreground mb-2 text-sm font-medium">Content</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Modules</span>
              <span className="text-2xl font-bold">{totalPublishedModules}</span>
            </div>
            <div className="text-muted-foreground text-xs">published</div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Sections</span>
              <span className="text-2xl font-bold">{totalSections}</span>
            </div>
            <div className="text-muted-foreground text-xs">total content sections</div>
          </div>
        </div>
      </div>

      <div className="bg-card text-card-foreground rounded-lg p-6 shadow">
        <h3 className="text-muted-foreground mb-2 text-sm font-medium">Completions</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Total</span>
              <span className="text-2xl font-bold">{totalCompletions}</span>
            </div>
            <div className="text-muted-foreground text-xs">module completions</div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Completion Rate</span>
              <span className="text-2xl font-bold">{completionRate}%</span>
            </div>
            <div className="bg-secondary mt-1 h-2 w-full rounded-full">
              <div
                className="bg-primary h-2 rounded-full"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card text-card-foreground rounded-lg p-6 shadow">
        <h3 className="text-muted-foreground mb-2 text-sm font-medium">User Engagement</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Active Users</span>
              <span className="text-2xl font-bold">{usersCount}</span>
            </div>
            <div className="text-muted-foreground text-xs">total users</div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Engagement</span>
              <span className="text-2xl font-bold">{userEngagementRate}%</span>
            </div>
            <div className="text-muted-foreground text-xs">
              {usersWithTraining} users with training activity
            </div>
            <div className="bg-secondary mt-1 h-2 w-full rounded-full">
              <div
                className="bg-primary h-2 rounded-full"
                style={{ width: `${userEngagementRate}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
