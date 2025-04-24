import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canManageOnboarding } from '@/lib/utils/permissions';

// GET /api/onboarding/tracks
// Get all onboarding tracks
export async function GET() {
  try {
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

    return NextResponse.json(tracks);
  } catch (error) {
    console.error('Error fetching onboarding tracks:', error);
    return NextResponse.json({ error: 'Failed to fetch onboarding tracks' }, { status: 500 });
  }
}

// POST /api/onboarding/tracks
// Create a new onboarding track
export async function POST(request: NextRequest) {
  try {
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
        { error: "You don't have permission to create onboarding tracks" },
        { status: 403 }
      );
    }

    const { name, description, forPositions, isActive } = await request.json();

    // Validate required fields
    if (!name || !description) {
      return NextResponse.json({ error: 'Name and description are required' }, { status: 400 });
    }

    const track = await prisma.onboardingTrack.create({
      data: {
        name,
        description,
        forPositions: forPositions || [],
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(track, { status: 201 });
  } catch (error) {
    console.error('Error creating onboarding track:', error);
    return NextResponse.json({ error: 'Failed to create onboarding track' }, { status: 500 });
  }
}
