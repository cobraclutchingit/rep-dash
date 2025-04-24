import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canManageOnboarding } from '@/lib/utils/permissions';

// POST /api/onboarding/users/[userId]/steps/[stepId]/reset
// Admin endpoint to reset a user's progress on a specific step
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string; stepId: string }> }
) {
  try {
    const { params } = context;
    const resolvedParams = await params;
    const { userId, stepId } = resolvedParams;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be signed in to access this endpoint' },
        { status: 401 }
      );
    }

    // Check if user can manage onboarding
    if (!canManageOnboarding(session)) {
      return NextResponse.json(
        { error: "You don't have permission to reset user progress" },
        { status: 403 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if step exists
    const step = await prisma.onboardingStep.findUnique({
      where: { id: stepId },
    });

    if (!step) {
      return NextResponse.json({ error: 'Onboarding step not found' }, { status: 404 });
    }

    // Check if progress record exists
    const existingProgress = await prisma.onboardingProgress.findUnique({
      where: {
        userId_stepId: {
          userId,
          stepId,
        },
      },
    });

    if (!existingProgress) {
      return NextResponse.json({ error: 'No progress record found to reset' }, { status: 404 });
    }

    // Delete the progress record
    await prisma.onboardingProgress.delete({
      where: {
        userId_stepId: {
          userId,
          stepId,
        },
      },
    });

    return NextResponse.json(
      { message: "User's step progress reset successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error resetting user step progress:', error);
    return NextResponse.json({ error: 'Failed to reset user step progress' }, { status: 500 });
  }
}