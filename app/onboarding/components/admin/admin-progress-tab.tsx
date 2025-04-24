'use client';

import { SalesPosition } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';

// Export these interfaces so they can be imported in other files
export interface Track {
  id: string;
  name: string;
  steps: Step[];
}

export interface Step {
  id: string;
  title: string;
  description: string;
  order: number;
  trackId: string;
}

export interface UserProgress {
  step: Step;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
}

export interface UserStat {
  id: string;
  name: string | null;
  email: string;
  position: SalesPosition | null;
  createdAt: string;
  onboardingProgress: UserProgress[];
  // Add these computed fields that are used in the component
  percentComplete?: number;
  completedSteps?: number;
  totalSteps?: number;
}

interface AdminProgressTabProps {
  userStats: UserStat[];
  tracks: Track[];
}

export default function AdminProgressTab({ userStats, tracks }: AdminProgressTabProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedUser, setSelectedUser] = useState<UserStat | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Process user data to add computed properties
  const processedUsers = useMemo(() => {
    return userStats.map((user) => {
      // Calculate overall progress percentage
      const totalSteps = user.onboardingProgress.length;
      const completedSteps = user.onboardingProgress.filter(
        (progress) => progress.status === 'COMPLETED'
      ).length;
      const inProgressSteps = user.onboardingProgress.filter(
        (progress) => progress.status === 'IN_PROGRESS'
      ).length;

      const percentComplete = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

      // Determine overall status
      let overallStatus = 'NOT_STARTED';
      if (completedSteps > 0) {
        overallStatus = completedSteps === totalSteps ? 'COMPLETED' : 'IN_PROGRESS';
      } else if (inProgressSteps > 0) {
        overallStatus = 'IN_PROGRESS';
      }

      // Calculate time since joined
      const daysSinceJoined = Math.floor(
        (new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        ...user,
        completedSteps,
        totalSteps,
        percentComplete,
        overallStatus,
        daysSinceJoined,
      };
    });
  }, [userStats]);

  // Filter users based on search and filters
  const filteredUsers = useMemo(() => {
    return processedUsers.filter((user) => {
      // Filter by search term
      const matchesSearch =
        !searchTerm ||
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());

      // Filter by position
      const matchesPosition = positionFilter === 'ALL' || user.position === positionFilter;

      // Filter by status
      const matchesStatus = statusFilter === 'ALL' || user.overallStatus === statusFilter;

      return matchesSearch && matchesPosition && matchesStatus;
    });
  }, [processedUsers, searchTerm, positionFilter, statusFilter]);

  // Handle user selection for detailed view
  const handleUserSelect = (user: UserStat) => {
    setSelectedUser(user);
  };

  // Reset progress for a specific step
  const handleResetStep = async (userId: string, stepId: string) => {
    if (
      !confirm('Are you sure you want to reset this step? The user will need to complete it again.')
    ) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/onboarding/users/${userId}/steps/${stepId}/reset`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to reset step');
      }

      // Refresh the page to show updated data
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Get color class based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-500/10 text-green-500';
      case 'IN_PROGRESS':
        return 'bg-blue-500/10 text-blue-500';
      case 'NOT_STARTED':
      default:
        return 'bg-amber-500/10 text-amber-500';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Position display name
  const getPositionDisplayName = (position: string | null) => {
    if (!position) return 'Not assigned';
    return position.replace(/_/g, ' ');
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">User Onboarding Progress</h2>
          <p className="text-muted-foreground text-sm">
            Track and manage user progress through onboarding
          </p>
        </div>
      </div>

      {/* Search and filters */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-input bg-background w-full rounded-md border p-3 pl-10"
            />
            <span className="text-muted-foreground absolute top-3 left-3">🔍</span>
          </div>
        </div>

        <div>
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="border-input bg-background w-full rounded-md border p-3"
          >
            <option value="ALL">All Positions</option>
            {Object.values(SalesPosition).map((position) => (
              <option key={position} value={position}>
                {position.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border-input bg-background w-full rounded-md border p-3"
          >
            <option value="ALL">All Statuses</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 text-destructive mb-6 rounded-md p-3">{error}</div>
      )}

      {/* No users message */}
      {userStats.length === 0 && (
        <div className="bg-card rounded-lg border p-12 text-center">
          <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl">
            👥
          </div>
          <h3 className="mb-2 text-lg font-medium">No Users Found</h3>
          <p className="text-muted-foreground">There are no active users in the system</p>
        </div>
      )}

      {/* Users exist but none match filters */}
      {userStats.length > 0 && filteredUsers.length === 0 && (
        <div className="bg-card rounded-lg border p-8 text-center">
          <h3 className="mb-2 text-lg font-medium">No Matching Users</h3>
          <p className="text-muted-foreground">
            No users match your search criteria. Try adjusting your filters or{' '}
            <button
              onClick={() => {
                setSearchTerm('');
                setPositionFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="text-primary hover:underline"
            >
              clear all filters
            </button>
            .
          </p>
        </div>
      )}

      {/* User progress table */}
      {filteredUsers.length > 0 && !selectedUser && (
        <div className="bg-card overflow-hidden rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">User</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Position</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Joined</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Progress</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-muted/30 cursor-pointer"
                    onClick={() => handleUserSelect(user)}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium">{user.name || 'Unnamed User'}</div>
                        <div className="text-muted-foreground text-sm">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{getPositionDisplayName(user.position)}</td>
                    <td className="px-4 py-3">
                      <div>
                        <div>{formatDate(user.createdAt)}</div>
                        <div className="text-muted-foreground text-sm">
                          {user.daysSinceJoined} days ago
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-xs ${getStatusColor(
                          user.overallStatus
                        )}`}
                      >
                        {user.overallStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="bg-muted mr-3 h-2 w-full max-w-xs rounded-full">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${user.percentComplete}%` }}
                          ></div>
                        </div>
                        <span className="text-sm whitespace-nowrap">
                          {user.completedSteps}/{user.totalSteps} ({user.percentComplete}%)
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUserSelect(user);
                        }}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-2 py-1 text-xs"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User detail view */}
      {selectedUser && (
        <div className="bg-card rounded-lg border">
          <div className="border-b p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold">{selectedUser.name || 'Unnamed User'}</h3>
                <p className="text-muted-foreground">{selectedUser.email}</p>
                <div className="mt-2 space-x-2">
                  <span className="bg-secondary rounded-full px-2 py-1 text-sm">
                    {getPositionDisplayName(selectedUser.position)}
                  </span>
                  <span className="bg-secondary rounded-full px-2 py-1 text-sm">
                    Joined {formatDate(selectedUser.createdAt)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="hover:bg-muted rounded-md p-2"
              >
                ← Back to List
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <h4 className="mb-2 text-lg font-medium">Overall Progress</h4>
              <div className="mb-2 flex items-center">
                <div className="bg-muted mr-3 h-3 w-full rounded-full">
                  <div
                    className="bg-primary h-3 rounded-full"
                    style={{ width: `${selectedUser.percentComplete}%` }}
                  ></div>
                </div>
                <span>{selectedUser.percentComplete}%</span>
              </div>
              <div className="text-muted-foreground text-sm">
                {selectedUser.completedSteps} of {selectedUser.totalSteps} steps completed
              </div>
            </div>

            {/* Group progress by track */}
            {tracks.map((track) => {
              // Filter progress items that belong to this track
              const trackStepIds = track.steps.map((step) => step.id);
              const userTrackProgress = selectedUser.onboardingProgress.filter((progress) =>
                trackStepIds.includes(progress.step.id)
              );

              // Skip tracks with no progress
              if (userTrackProgress.length === 0) return null;

              // Calculate track completion percentage
              const trackCompletedSteps = userTrackProgress.filter(
                (progress) => progress.status === 'COMPLETED'
              ).length;
              const trackPercentComplete =
                userTrackProgress.length > 0
                  ? Math.round((trackCompletedSteps / userTrackProgress.length) * 100)
                  : 0;

              return (
                <div key={track.id} className="mb-8">
                  <h4 className="mb-3 text-lg font-medium">{track.name}</h4>
                  <div className="mb-3 flex items-center">
                    <div className="bg-muted mr-3 h-2 w-full rounded-full">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${trackPercentComplete}%` }}
                      ></div>
                    </div>
                    <span className="text-sm">
                      {trackCompletedSteps}/{userTrackProgress.length} ({trackPercentComplete}%)
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {track.steps
                      .sort((a, b) => a.order - b.order)
                      .map((step) => {
                        // Find user progress for this step
                        const progress = selectedUser.onboardingProgress.find(
                          (p) => p.step.id === step.id
                        );

                        return (
                          <div key={step.id} className="bg-card rounded-lg border p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center">
                                  <span className="mr-2 text-lg">
                                    {progress?.status === 'COMPLETED'
                                      ? '✅'
                                      : progress?.status === 'IN_PROGRESS'
                                        ? '🔄'
                                        : '⏳'}
                                  </span>
                                  <h5 className="font-medium">{step.title}</h5>
                                </div>
                                <p className="text-muted-foreground mt-1 ml-7 text-sm">
                                  {step.description}
                                </p>
                              </div>
                              <span
                                className={`inline-block rounded-full px-2 py-1 text-xs ${getStatusColor(
                                  progress?.status || 'NOT_STARTED'
                                )}`}
                              >
                                {(progress?.status || 'NOT_STARTED').replace(/_/g, ' ')}
                              </span>
                            </div>

                            {progress && (
                              <div className="mt-3 ml-7 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                                {progress.startedAt && (
                                  <div>
                                    <span className="text-muted-foreground">Started: </span>
                                    {formatDate(progress.startedAt)}
                                  </div>
                                )}

                                {progress.completedAt && (
                                  <div>
                                    <span className="text-muted-foreground">Completed: </span>
                                    {formatDate(progress.completedAt)}
                                  </div>
                                )}

                                {progress.notes && (
                                  <div className="bg-muted/30 mt-2 rounded p-2 md:col-span-2">
                                    <div className="text-muted-foreground mb-1">Notes:</div>
                                    <div>{progress.notes}</div>
                                  </div>
                                )}
                              </div>
                            )}

                            {progress && (
                              <div className="mt-3 ml-7 flex justify-end">
                                <button
                                  onClick={() => handleResetStep(selectedUser.id, step.id)}
                                  className="rounded bg-amber-500/10 px-2 py-1 text-xs text-amber-500 hover:bg-amber-500/20"
                                  disabled={loading}
                                >
                                  Reset Step
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
