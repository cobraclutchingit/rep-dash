import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canManageLeaderboards } from '@/lib/utils/permissions';

// GET /api/leaderboard
// Get all visible leaderboards for the current user
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be signed in to access this endpoint' },
        { status: 401 }
      );
    }

    const isAdmin = canManageLeaderboards(session);

    // Build query based on user role and position
    const query: Prisma.LeaderboardFindManyArgs = {
      where: {
        // Regular users only see active leaderboards
        ...(isAdmin ? {} : { isActive: true }),
        // Filter by positions
        ...(isAdmin || !session.user.position
          ? {}
          : {
              OR: [
                { forPositions: { has: session.user.position } },
                { forPositions: { isEmpty: true } },
              ],
            }),
      },
      orderBy: {
        updatedAt: 'desc',
      },
    };

    const leaderboards = await prisma.leaderboard.findMany(query);

    return NextResponse.json(leaderboards);
  } catch (error) {
    console.error('Error fetching leaderboards:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboards' }, { status: 500 });
  }
}

// POST /api/leaderboard
// Create a new leaderboard
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be signed in to access this endpoint' },
        { status: 401 }
      );
    }

    // Check permissions
    if (!canManageLeaderboards(session)) {
      return NextResponse.json(
        { error: "You don't have permission to create leaderboards" },
        { status: 403 }
      );
    }

    const { name, description, type, period, forPositions, isActive } = await request.json();

    // Validate required fields
    if (!name || !type || !period) {
      return NextResponse.json({ error: 'Name, type, and period are required' }, { status: 400 });
    }

    // Create the leaderboard
    const leaderboard = await prisma.leaderboard.create({
      data: {
        name,
        description,
        type,
        period,
        forPositions: forPositions || [],
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(leaderboard, { status: 201 });
  } catch (error) {
    console.error('Error creating leaderboard:', error);
    return NextResponse.json({ error: 'Failed to create leaderboard' }, { status: 500 });
  }
}
