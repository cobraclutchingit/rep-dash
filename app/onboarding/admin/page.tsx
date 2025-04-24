import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canManageOnboarding } from '@/lib/utils/permissions';

import AdminOnboardingTabs from '../components/admin/admin-onboarding-tabs';

export const metadata: Metadata = {
  title: 'Onboarding Administration | Sales Rep Dashboard',
  description: 'Manage onboarding tracks and steps',
};

export default async function OnboardingAdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Check if user has permission to manage onboarding
  if (!canManageOnboarding(session)) {
    redirect('/onboarding');
  }

  // Get all onboarding tracks
  const tracks = await prisma.onboardingTrack.findMany({
    include: {
      steps: {
        orderBy: {
          order: 'asc',
        },
        include: {
          resources: true,
        },
      },
      _count: {
        select: {
          steps: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  // Get all resources
  const resources = await prisma.resource.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Get user progress statistics
  const userStats = await prisma.user.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      position: true,
      createdAt: true,
      onboardingProgress: {
        select: {
          id: true,
          status: true,
          completedAt: true,
          step: {
            select: {
              id: true,
              title: true,
              trackId: true,
            },
          },
        },
      },
    },
  });

  // Convert Date objects to strings for proper typing with UserStat interface
  const formattedUserStats = userStats.map((user) => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
    onboardingProgress: user.onboardingProgress.map((progress) => ({
      ...progress,
      completedAt: progress.completedAt ? progress.completedAt.toISOString() : null,
      // Add required UserProgress properties that are null in the database result
      startedAt: null,
      notes: null,
      // Convert string status to union type
      status: (progress.status || 'NOT_STARTED') as 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED',
      step: {
        ...progress.step,
        // Add the remaining fields needed for the Step interface
        description: '',
        order: 0,
      },
    })),
  }));

  // Format tracks to match expected type with string createdAt/updatedAt
  const formattedTracks = tracks.map((track) => ({
    ...track,
    updatedAt: track.updatedAt.toISOString(),
    forPositions: track.forPositions as string[], // Cast to string[] for position enum values
  }));

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">Onboarding Administration</h1>

      <AdminOnboardingTabs
        tracks={formattedTracks}
        resources={resources}
        userStats={formattedUserStats}
      />
    </div>
  );
}
