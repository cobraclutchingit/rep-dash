import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canManageOnboarding } from '@/lib/utils/permissions';

// GET /api/onboarding/steps/[stepId]
// Get a specific onboarding step by ID
export async function GET(request: NextRequest, context: { params: Promise<{ stepId: string }> }) {
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

    const step = await prisma.onboardingStep.findUnique({
      where: { id: stepId },
      include: {
        resources: true,
        track: {
          select: {
            id: true,
            name: true,
            forPositions: true,
          },
        },
      },
    });

    if (!step) {
      return NextResponse.json({ error: 'Onboarding step not found' }, { status: 404 });
    }

    // If not an admin, check if the step's track is for the user's position
    if (!canManageOnboarding(session)) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { position: true },
      });

      const isForUser =
        !step.track.forPositions.length ||
        (user?.position && step.track.forPositions.includes(user.position));

      if (!isForUser) {
        return NextResponse.json(
          { error: "You don't have access to this onboarding step" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(step);
  } catch (error) {
    console.error('Error fetching onboarding step:', error);
    return NextResponse.json({ error: 'Failed to fetch onboarding step' }, { status: 500 });
  }
}

// PUT /api/onboarding/steps/[stepId]
// Update an existing onboarding step
export async function PUT(request: NextRequest, context: { params: Promise<{ stepId: string }> }) {
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

    // Check if user can manage onboarding
    if (!canManageOnboarding(session)) {
      return NextResponse.json(
        { error: "You don't have permission to update onboarding steps" },
        { status: 403 }
      );
    }

    const {
      trackId,
      title,
      description,
      instructions,
      order,
      estimatedDuration,
      isRequired,
      resourceIds,
    } = await request.json();

    // Check if step exists
    const existingStep = await prisma.onboardingStep.findUnique({
      where: { id: stepId },
      include: {
        resources: true,
      },
    });

    if (!existingStep) {
      return NextResponse.json({ error: 'Onboarding step not found' }, { status: 404 });
    }

    // Validate required fields if provided
    if (title === undefined || title === '' || description === undefined || description === '') {
      return NextResponse.json({ error: 'Title and description cannot be empty' }, { status: 400 });
    }

    // If trackId is changing, verify the target track exists
    if (trackId && trackId !== existingStep.trackId) {
      const track = await prisma.onboardingTrack.findUnique({
        where: { id: trackId },
      });

      if (!track) {
        return NextResponse.json({ error: 'Target onboarding track not found' }, { status: 404 });
      }
    }

    // Prepare the update data
    const updateData: Prisma.OnboardingStepUpdateInput = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (trackId !== undefined) updateData.track = { connect: { id: trackId } };
    if (instructions !== undefined) updateData.instructions = instructions;
    if (order !== undefined) updateData.order = order;
    if (estimatedDuration !== undefined) updateData.estimatedDuration = estimatedDuration;
    if (isRequired !== undefined) updateData.isRequired = isRequired;

    // Handle resource connections if resourceIds are provided
    if (resourceIds !== undefined) {
      // Get current resource IDs
      const currentResourceIds = existingStep.resources.map((r) => r.id);

      // Disconnect all current resources
      updateData.resources = {
        disconnect: currentResourceIds.map((id) => ({ id })),
      };

      // Connect new resources if any
      if (resourceIds.length > 0) {
        updateData.resources = {
          ...updateData.resources,
          connect: resourceIds.map((id: string) => ({ id })),
        };
      }
    }

    // Update the step
    const updatedStep = await prisma.onboardingStep.update({
      where: { id: stepId },
      data: updateData,
      include: {
        resources: true,
      },
    });

    return NextResponse.json(updatedStep);
  } catch (error) {
    console.error('Error updating onboarding step:', error);
    return NextResponse.json({ error: 'Failed to update onboarding step' }, { status: 500 });
  }
}

// DELETE /api/onboarding/steps/[stepId]
// Delete an onboarding step
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

    // Check if user can manage onboarding
    if (!canManageOnboarding(session)) {
      return NextResponse.json(
        { error: "You don't have permission to delete onboarding steps" },
        { status: 403 }
      );
    }

    // Check if step exists
    const existingStep = await prisma.onboardingStep.findUnique({
      where: { id: stepId },
    });

    if (!existingStep) {
      return NextResponse.json({ error: 'Onboarding step not found' }, { status: 404 });
    }

    // Delete the step (this will cascade delete progress and disconnect resources)
    await prisma.onboardingStep.delete({
      where: { id: stepId },
    });

    return NextResponse.json({ message: 'Onboarding step deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting onboarding step:', error);
    return NextResponse.json({ error: 'Failed to delete onboarding step' }, { status: 500 });
  }
}