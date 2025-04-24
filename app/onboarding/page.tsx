import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

import OnboardingDashboard from './components/onboarding-dashboard';
import OnboardingWelcome from './components/onboarding-welcome';
import { OnboardingProvider } from './providers/onboarding-provider';

export const metadata: Metadata = {
  title: 'Onboarding | Sales Rep Dashboard',
  description: 'Complete your onboarding steps',
};

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Check if the user has onboarding progress
  const userProgress = await prisma.onboardingProgress.findMany({
    where: {
      userId: session.user.id,
    },
  });

  // Check if user is new (created in the last 7 days)
  const isNewUser = await prisma.user
    .findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        createdAt: true,
      },
    })
    .then((user) => {
      if (!user) return false;

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      return user.createdAt > oneWeekAgo;
    });

  const showWelcome = isNewUser && userProgress.length === 0;

  return (
    <OnboardingProvider>
      <div className="container mx-auto p-6">
        {showWelcome ? <OnboardingWelcome /> : <OnboardingDashboard />}
      </div>
    </OnboardingProvider>
  );
}
