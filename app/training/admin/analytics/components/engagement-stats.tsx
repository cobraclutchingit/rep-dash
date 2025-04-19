"use client";

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-card text-card-foreground rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Users</h3>
        <p className="text-2xl font-bold">{stats.totalUsers}</p>
        <p className="text-xs text-muted-foreground">
          Active users in the system
        </p>
      </div>
      
      <div className="bg-card text-card-foreground rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Training Engagement</h3>
        <p className="text-2xl font-bold">{Math.round(stats.engagementRate)}%</p>
        <div className="w-full bg-secondary rounded-full h-2 mt-1 mb-1">
          <div 
            className="bg-primary h-2 rounded-full" 
            style={{ width: `${stats.engagementRate}%` }}
          ></div>
        </div>
        <p className="text-xs text-muted-foreground">
          {stats.usersWithProgress} users engaged with training
        </p>
      </div>
      
      <div className="bg-card text-card-foreground rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Completion Rate</h3>
        <p className="text-2xl font-bold">{Math.round(stats.completionRate)}%</p>
        <div className="w-full bg-secondary rounded-full h-2 mt-1 mb-1">
          <div 
            className="bg-green-500 h-2 rounded-full" 
            style={{ width: `${stats.completionRate}%` }}
          ></div>
        </div>
        <p className="text-xs text-muted-foreground">
          {stats.usersWithCompletions} users completed modules
        </p>
      </div>
      
      <div className="bg-card text-card-foreground rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Training Gap</h3>
        <p className="text-2xl font-bold">
          {stats.totalUsers - stats.usersWithProgress}
        </p>
        <p className="text-xs text-muted-foreground">
          Users with no training activity
        </p>
      </div>
    </div>
  );
}