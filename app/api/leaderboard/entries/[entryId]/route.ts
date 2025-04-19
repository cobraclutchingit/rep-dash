import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageLeaderboards } from "@/lib/utils/permissions";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: {
    entryId: string;
  };
}

// GET /api/leaderboard/entries/[entryId]
// Get a specific leaderboard entry by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { entryId } = params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to access this endpoint" },
        { status: 401 }
      );
    }

    // Find the entry
    const entry = await prisma.leaderboardEntry.findUnique({
      where: { id: entryId },
      include: {
        leaderboard: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
          },
        },
      },
    });

    if (!entry) {
      return NextResponse.json(
        { error: "Leaderboard entry not found" },
        { status: 404 }
      );
    }

    // Check if user has access to this entry
    const isAdmin = canManageLeaderboards(session);
    const isOwner = session.user.id === entry.userId;

    if (!isAdmin && !isOwner) {
      // Regular users can only see entries from active leaderboards
      if (!entry.leaderboard.isActive) {
        return NextResponse.json(
          { error: "This leaderboard is not active" },
          { status: 403 }
        );
      }

      // Check position restrictions
      if (entry.leaderboard.forPositions.length > 0) {
        if (!session.user.position || !entry.leaderboard.forPositions.includes(session.user.position)) {
          return NextResponse.json(
            { error: "You don't have permission to access this entry" },
            { status: 403 }
          );
        }
      }
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Error fetching leaderboard entry:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard entry" },
      { status: 500 }
    );
  }
}

// PUT /api/leaderboard/entries/[entryId]
// Update an existing leaderboard entry
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { entryId } = params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to access this endpoint" },
        { status: 401 }
      );
    }

    // Check permissions
    if (!canManageLeaderboards(session)) {
      return NextResponse.json(
        { error: "You don't have permission to update leaderboard entries" },
        { status: 403 }
      );
    }

    // Check if entry exists
    const existingEntry = await prisma.leaderboardEntry.findUnique({
      where: { id: entryId },
    });

    if (!existingEntry) {
      return NextResponse.json(
        { error: "Leaderboard entry not found" },
        { status: 404 }
      );
    }

    const {
      score,
      periodStart,
      periodEnd,
      metrics,
    } = await request.json();

    // Update the entry
    const updatedEntry = await prisma.leaderboardEntry.update({
      where: { id: entryId },
      data: {
        ...(score !== undefined && { score }),
        ...(periodStart !== undefined && { periodStart: new Date(periodStart) }),
        ...(periodEnd !== undefined && { periodEnd: new Date(periodEnd) }),
        ...(metrics !== undefined && { metrics }),
      },
    });

    // Update ranks for all entries in this period
    await updateRanksForPeriod(
      existingEntry.leaderboardId, 
      updatedEntry.periodStart, 
      updatedEntry.periodEnd
    );

    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error("Error updating leaderboard entry:", error);
    return NextResponse.json(
      { error: "Failed to update leaderboard entry" },
      { status: 500 }
    );
  }
}

// DELETE /api/leaderboard/entries/[entryId]
// Delete a leaderboard entry
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { entryId } = params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to access this endpoint" },
        { status: 401 }
      );
    }

    // Check permissions
    if (!canManageLeaderboards(session)) {
      return NextResponse.json(
        { error: "You don't have permission to delete leaderboard entries" },
        { status: 403 }
      );
    }

    // Check if entry exists and get period info for rank updates
    const existingEntry = await prisma.leaderboardEntry.findUnique({
      where: { id: entryId },
    });

    if (!existingEntry) {
      return NextResponse.json(
        { error: "Leaderboard entry not found" },
        { status: 404 }
      );
    }

    const { leaderboardId, periodStart, periodEnd } = existingEntry;

    // Delete the entry
    await prisma.leaderboardEntry.delete({
      where: { id: entryId },
    });

    // Update ranks for remaining entries in this period
    await updateRanksForPeriod(leaderboardId, periodStart, periodEnd);

    return NextResponse.json(
      { message: "Leaderboard entry deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting leaderboard entry:", error);
    return NextResponse.json(
      { error: "Failed to delete leaderboard entry" },
      { status: 500 }
    );
  }
}

// Function to update ranks for all entries in a period
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
        score: "desc",
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
    console.error("Error updating ranks:", error);
  }
}