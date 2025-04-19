"use client";

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
  const completionRate = totalProgress > 0 
    ? Math.round((totalCompletions / totalProgress) * 100) 
    : 0;
  
  // Calculate user engagement rate
  const userEngagementRate = usersCount > 0 
    ? Math.round((usersWithTraining / usersCount) * 100) 
    : 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-card text-card-foreground rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Content</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Modules</span>
              <span className="text-2xl font-bold">{totalPublishedModules}</span>
            </div>
            <div className="text-xs text-muted-foreground">published</div>
          </div>
          
          <div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Sections</span>
              <span className="text-2xl font-bold">{totalSections}</span>
            </div>
            <div className="text-xs text-muted-foreground">total content sections</div>
          </div>
        </div>
      </div>
      
      <div className="bg-card text-card-foreground rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Completions</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Total</span>
              <span className="text-2xl font-bold">{totalCompletions}</span>
            </div>
            <div className="text-xs text-muted-foreground">module completions</div>
          </div>
          
          <div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Completion Rate</span>
              <span className="text-2xl font-bold">{completionRate}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2 mt-1">
              <div 
                className="bg-primary h-2 rounded-full" 
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-card text-card-foreground rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">User Engagement</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Active Users</span>
              <span className="text-2xl font-bold">{usersCount}</span>
            </div>
            <div className="text-xs text-muted-foreground">total users</div>
          </div>
          
          <div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Engagement</span>
              <span className="text-2xl font-bold">{userEngagementRate}%</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {usersWithTraining} users with training activity
            </div>
            <div className="w-full bg-secondary rounded-full h-2 mt-1">
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