'use client';

import { OnboardingStats as StatsType } from '../providers/onboarding-provider';

interface OnboardingStatsProps {
  stats: StatsType;
}

export default function OnboardingStats({ stats }: OnboardingStatsProps) {
  // Format estimated time
  const formatEstimatedTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} mins`;
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (mins === 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }

    return `${hours} ${hours === 1 ? 'hour' : 'hours'}, ${mins} mins`;
  };

  return (
    <div className="bg-card text-card-foreground rounded-lg shadow">
      <div className="border-b p-6">
        <h2 className="text-lg font-semibold">Onboarding Statistics</h2>
      </div>

      <div className="space-y-4 p-6">
        <div>
          <div className="text-muted-foreground mb-1 text-sm">Step Status</div>
          <div className="flex space-x-2">
            <div className="bg-muted flex-1 rounded-md p-3">
              <div className="text-center">
                <div className="mb-1 text-2xl font-bold">{stats.completedSteps}</div>
                <div className="text-muted-foreground text-xs">Completed</div>
              </div>
            </div>
            <div className="bg-muted flex-1 rounded-md p-3">
              <div className="text-center">
                <div className="mb-1 text-2xl font-bold">{stats.inProgressSteps}</div>
                <div className="text-muted-foreground text-xs">In Progress</div>
              </div>
            </div>
            <div className="bg-muted flex-1 rounded-md p-3">
              <div className="text-center">
                <div className="mb-1 text-2xl font-bold">{stats.notStartedSteps}</div>
                <div className="text-muted-foreground text-xs">Not Started</div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="text-muted-foreground mb-2 text-sm">Estimated Time Remaining</div>
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="text-muted-foreground mr-2 h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-lg font-medium">
              {formatEstimatedTime(stats.estimatedTimeRemaining)}
            </span>
          </div>
        </div>

        {stats.totalSteps > 0 && stats.completedSteps > 0 && (
          <div className="border-t pt-4">
            <div className="text-muted-foreground mb-1 text-sm">Achievement Progress</div>
            <div className="flex items-center space-x-2">
              <div className="relative h-10 w-10">
                {stats.completedSteps === stats.totalSteps ? (
                  <div className="absolute inset-0 flex items-center justify-center text-xl">
                    🏆
                  </div>
                ) : (
                  <>
                    <svg viewBox="0 0 36 36" className="stroke-primary h-10 w-10">
                      <path
                        className="fill-none stroke-2"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        strokeDasharray="100"
                        strokeDashoffset={100 - stats.percentComplete}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
                      {stats.percentComplete}%
                    </div>
                  </>
                )}
              </div>
              <div className="text-sm">
                {stats.completedSteps === stats.totalSteps ? (
                  <span className="text-primary font-medium">All steps completed!</span>
                ) : (
                  <span>
                    {stats.completedSteps} of {stats.totalSteps} steps completed
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
