import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/onboarding/steps/[stepId]/progress
// Update a user's progress on a specific step
export async function POST(request: NextRequest, context: { params: Promise<{ stepId: string }> }) {
  try {
    const { params } = context;
    const resolvedParams = await params;
    const { stepId } = resolvedParams;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be signed in to access this endpoint' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { status, notes } = await request.json();

    // Validate status
    if (!status || !['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: NOT_STARTED, IN_PROGRESS, COMPLETED' },
        { status: 400 }
      );
    }

    // Check if step exists
    const step = await prisma.onboardingStep.findUnique({
      where: { id: stepId },
    });

    if (!step) {
      return NextResponse.json({ error: 'Onboarding step not found' }, { status: 404 });
    }

    // Check if progress record already exists
    const existingProgress = await prisma.onboardingProgress.findUnique({
      where: {
        userId_stepId: {
          userId,
          stepId,
        },
      },
    });

    let progress;
    const now = new Date();

    if (existingProgress) {
      // Update existing progress
      progress = await prisma.onboardingProgress.update({
        where: {
          userId_stepId: {
            userId,
            stepId,
          },
        },
        data: {
          status,
          notes: notes !== undefined ? notes : existingProgress.notes,
          // Update timestamps based on status
          startedAt:
            status === 'IN_PROGRESS' && !existingProgress.startedAt
              ? now
              : existingProgress.startedAt,
          completedAt: status === 'COMPLETED' ? now : existingProgress.completedAt,
        },
      });
    } else {
      // Create new progress record
      progress = await prisma.onboardingProgress.create({
        data: {
          userId,
          stepId,
          status,
          notes,
          startedAt: status === 'IN_PROGRESS' || status === 'COMPLETED' ? now : null,
          completedAt: status === 'COMPLETED' ? now : null,
        },
      });
    }

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error updating step progress:', error);
    return NextResponse.json({ error: 'Failed to update step progress' }, { status: 500 });
  }
}

// DELETE /api/onboarding/steps/[stepId]/progress
// Reset a user's progress on a specific step
export async function DELETE(request: NextRequest, context: { params: Promise<{ stepId: string }> }) {
  try {
    const { params } = context;
    const resolvedParams = await params;
    const { stepId } = resolvedParams;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be signed in to access this endpoint' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Check if step exists
    const step = await prisma.onboardingStep.findUnique({
      where: { id: stepId },
    });

    if (!step) {
      return NextResponse.json({ error: 'Onboarding step not found' }, { status: 404 });
    }

    // Delete the progress record
    await prisma.onboardingProgress.deleteMany({
      where: {
        userId,
        stepId,
      },
    });

    return NextResponse.json({ message: 'Step progress reset successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error resetting step progress:', error);
    return NextResponse.json({ error: 'Failed to reset step progress' }, { status: 500 });
  }
}