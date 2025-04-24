import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canManageOnboarding } from '@/lib/utils/permissions';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/onboarding/tracks/[id]
// Get a specific onboarding track by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
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
        { error: "You don't have permission to access onboarding tracks" },
        { status: 403 }
      );
    }

    const track = await prisma.onboardingTrack.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: {
            order: 'asc',
          },
          include: {
            resources: true,
          },
        },
      },
    });

    if (!track) {
      return NextResponse.json({ error: 'Onboarding track not found' }, { status: 404 });
    }

    return NextResponse.json(track);
  } catch (error) {
    console.error('Error fetching onboarding track:', error);
    return NextResponse.json({ error: 'Failed to fetch onboarding track' }, { status: 500 });
  }
}

// PUT /api/onboarding/tracks/[id]
// Update an existing onboarding track
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
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
        { error: "You don't have permission to update onboarding tracks" },
        { status: 403 }
      );
    }

    const { name, description, forPositions, isActive } = await request.json();

    // Validate required fields
    if (!name || !description) {
      return NextResponse.json({ error: 'Name and description are required' }, { status: 400 });
    }

    // Check if track exists
    const existingTrack = await prisma.onboardingTrack.findUnique({
      where: { id },
    });

    if (!existingTrack) {
      return NextResponse.json({ error: 'Onboarding track not found' }, { status: 404 });
    }

    // Update the track
    const updatedTrack = await prisma.onboardingTrack.update({
      where: { id },
      data: {
        name,
        description,
        forPositions: forPositions || [],
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(updatedTrack);
  } catch (error) {
    console.error('Error updating onboarding track:', error);
    return NextResponse.json({ error: 'Failed to update onboarding track' }, { status: 500 });
  }
}

// DELETE /api/onboarding/tracks/[id]
// Delete an onboarding track
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
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
        { error: "You don't have permission to delete onboarding tracks" },
        { status: 403 }
      );
    }

    // Check if track exists
    const existingTrack = await prisma.onboardingTrack.findUnique({
      where: { id },
      include: {
        steps: true,
      },
    });

    if (!existingTrack) {
      return NextResponse.json({ error: 'Onboarding track not found' }, { status: 404 });
    }

    // Delete the track and all associated steps
    await prisma.onboardingTrack.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Onboarding track deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting onboarding track:', error);
    return NextResponse.json({ error: 'Failed to delete onboarding track' }, { status: 500 });
  }
}
