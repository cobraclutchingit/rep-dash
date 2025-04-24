import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { ApiError } from '@/lib/api/utils/api-error';
import { createSuccessResponse, createNotFoundResponse } from '@/lib/api/utils/api-response';
import { leaderboardEntrySchema } from '@/lib/api/validators/leaderboard-validators';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canManageLeaderboards } from '@/lib/utils/permissions';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { params } = context;
    const resolvedParams = await params;
    const leaderboardId = resolvedParams.id;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be signed in to access this endpoint' },
        { status: 401 }
      );
    }

    // Check if leaderboard exists
    const leaderboard = await prisma.leaderboard.findUnique({
      where: { id: leaderboardId },
    });

    if (!leaderboard) {
      return createNotFoundResponse('Leaderboard');
    }

    // Parse query params
    const url = new URL(request.url);
    const search = url.searchParams.get('search');
    const position = url.searchParams.get('position');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const limit = url.searchParams.get('limit')
      ? parseInt(url.searchParams.get('limit') as string)
      : undefined;

    // Check access restrictions for non-admins
    const isAdmin = session && canManageLeaderboards(session);
    if (!isAdmin) {
      // Regular users can only see active leaderboards
      if (!leaderboard.isActive) {
        return NextResponse.json(
          { error: 'This leaderboard is not active' },
          { status: 403 }
        );
      }

      // Check position restrictions
      if (
        leaderboard.forPositions.length > 0 &&
        session?.user.position &&
        !leaderboard.forPositions.includes(session.user.position)
      ) {
        return NextResponse.json(
          { error: "You don't have permission to access this leaderboard" },
          { status: 403 }
        );
      }
    }

    // Build where clause
    const where: Prisma.LeaderboardEntryWhereInput = {
      leaderboardId,
    };

    // Add date filters
    if (startDate) {
      where.periodStart = {
        gte: new Date(startDate),
      };
    }

    if (endDate) {
      where.periodEnd = {
        lte: new Date(endDate),
      };
    }

    // Get all entries
    const entries = await prisma.leaderboardEntry.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            position: true,
            profileImageUrl: true,
          },
        },
      },
      orderBy: [
        { rank: 'asc' }, // Sort by rank (nulls will come first)
        { score: 'desc' }, // Sort by score for users with the same rank
      ],
      ...(limit ? { take: limit } : {}),
    });

    // If entries have no rank, calculate them based on score
    let rankedEntries = entries;
    const hasRanks = entries.some((entry) => entry.rank !== null);

    if (!hasRanks) {
      // Sort by score and assign ranks
      rankedEntries = entries
        .sort((a, b) => b.score - a.score)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));
    }

    // Apply user filters (these are applied after querying because they're related to the included user model)
    let filteredEntries = rankedEntries;

    // Filter by position
    if (position && position !== 'ALL') {
      filteredEntries = filteredEntries.filter(
        (entry) => (entry.user as { position?: string })?.position === position
      );
    }

    // Filter by search term (name)
    if (search) {
      const searchLower = search.toLowerCase();
      filteredEntries = filteredEntries.filter((entry) =>
        (entry.user as { name?: string })?.name?.toLowerCase().includes(searchLower)
      );
    }

    return createSuccessResponse(filteredEntries);
  } catch (error) {
    console.error('Error fetching leaderboard entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard entries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { params } = context;
    const resolvedParams = await params;
    const leaderboardId = resolvedParams.id;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be signed in to access this endpoint' },
        { status: 401 }
      );
    }

    // Check permission
    if (!canManageLeaderboards(session)) {
      return NextResponse.json(
        { error: "You don't have permission to manage leaderboards" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const data = await request.json();
    try {
      leaderboardEntrySchema.parse(data);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid leaderboard entry data', details: error },
        { status: 400 }
      );
    }

    // Check if leaderboard exists
    const leaderboard = await prisma.leaderboard.findUnique({
      where: { id: leaderboardId },
    });

    if (!leaderboard) {
      return NextResponse.json({ error: 'Leaderboard not found' }, { status: 404 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if entry already exists for this period
    const existingEntry = await prisma.leaderboardEntry.findFirst({
      where: {
        leaderboardId,
        userId: data.userId,
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
      },
    });

    if (existingEntry) {
      return NextResponse.json(
        { error: 'An entry already exists for this user and time period' },
        { status: 409 }
      );
    }

    // Create entry
    const entry = await prisma.leaderboardEntry.create({
      data: {
        leaderboardId,
        userId: data.userId,
        score: data.score,
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
        metrics: data.metrics || {},
      },
    });

    // Recalculate ranks for all entries in this period
    await updateRanksForPeriod(
      leaderboardId,
      new Date(data.periodStart),
      new Date(data.periodEnd)
    );

    // Get the updated entry with user and rank
    const updatedEntry = await prisma.leaderboardEntry.findUnique({
      where: { id: entry.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            position: true,
            profileImageUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: updatedEntry }, { status: 201 });
  } catch (error) {
    console.error('Error creating leaderboard entry:', error);
    return NextResponse.json(
      { error: 'Failed to create leaderboard entry' },
      { status: 500 }
    );
  }
}

/**
 * Update ranks for all entries in a specific period
 */
async function updateRanksForPeriod(leaderboardId: string, startDate: Date, endDate: Date) {
  try {
    // Get all entries for this leaderboard and period
    const entries = await prisma.leaderboardEntry.findMany({
      where: {
        leaderboardId,
        periodStart: startDate,
        periodEnd: endDate,
      },
      orderBy: {
        score: 'desc',
      },
    });

    // Update ranks
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const rank = i + 1;

      await prisma.leaderboardEntry.update({
        where: { id: entry.id },
        data: { rank },
      });
    }
  } catch (error) {
    console.error('Error updating ranks:', error);
  }
}