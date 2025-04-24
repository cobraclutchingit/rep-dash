'use client';

interface EngagementStatsProps {
  stats: {
    totalUsers: number;
    usersWithCompletions: number;
    usersWithProgress: number;
    completionRate: number;
    engagementRate: number;
  };
}

export default function EngagementStats({ stats }: EngagementStatsProps) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="bg-card text-card-foreground rounded-lg p-6 shadow">
        <h3 className="text-muted-foreground mb-2 text-sm font-medium">Total Users</h3>
        <p className="text-2xl font-bold">{stats.totalUsers}</p>
        <p className="text-muted-foreground text-xs">Active users in the system</p>
      </div>

      <div className="bg-card text-card-foreground rounded-lg p-6 shadow">
        <h3 className="text-muted-foreground mb-2 text-sm font-medium">Training Engagement</h3>
        <p className="text-2xl font-bold">{Math.round(stats.engagementRate)}%</p>
        <div className="bg-secondary mt-1 mb-1 h-2 w-full rounded-full">
          <div
            className="bg-primary h-2 rounded-full"
            style={{ width: `${stats.engagementRate}%` }}
          ></div>
        </div>
        <p className="text-muted-foreground text-xs">
          {stats.usersWithProgress} users engaged with training
        </p>
      </div>

      <div className="bg-card text-card-foreground rounded-lg p-6 shadow">
        <h3 className="text-muted-foreground mb-2 text-sm font-medium">Completion Rate</h3>
        <p className="text-2xl font-bold">{Math.round(stats.completionRate)}%</p>
        <div className="bg-secondary mt-1 mb-1 h-2 w-full rounded-full">
          <div
            className="h-2 rounded-full bg-green-500"
            style={{ width: `${stats.completionRate}%` }}
          ></div>
        </div>
        <p className="text-muted-foreground text-xs">
          {stats.usersWithCompletions} users completed modules
        </p>
      </div>

      <div className="bg-card text-card-foreground rounded-lg p-6 shadow">
        <h3 className="text-muted-foreground mb-2 text-sm font-medium">Training Gap</h3>
        <p className="text-2xl font-bold">{stats.totalUsers - stats.usersWithProgress}</p>
        <p className="text-muted-foreground text-xs">Users with no training activity</p>
      </div>
    </div>
  );
}
