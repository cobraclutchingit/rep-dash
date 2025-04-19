import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageLeaderboards } from "@/lib/utils/permissions";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/leaderboard/[id]
// Get a specific leaderboard by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to access this endpoint" },
        { status: 401 }
      );
    }

    // Find the leaderboard
    const leaderboard = await prisma.leaderboard.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            entries: true,
          },
        },
      },
    });

    if (!leaderboard) {
      return NextResponse.json(
        { error: "Leaderboard not found" },
        { status: 404 }
      );
    }

    // Check if user has access to this leaderboard
    const isAdmin = canManageLeaderboards(session);

    // If it's inactive, only admins can see it
    if (!leaderboard.isActive && !isAdmin) {
      return NextResponse.json(
        { error: "This leaderboard is not active" },
        { status: 403 }
      );
    }

    // Check position visibility for regular users
    if (!isAdmin && leaderboard.forPositions.length > 0) {
      if (!session.user.position || !leaderboard.forPositions.includes(session.user.position)) {
        return NextResponse.json(
          { error: "You don't have permission to access this leaderboard" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}

// PUT /api/leaderboard/[id]
// Update an existing leaderboard
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
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
        { error: "You don't have permission to update leaderboards" },
        { status: 403 }
      );
    }

    // Check if leaderboard exists
    const existingLeaderboard = await prisma.leaderboard.findUnique({
      where: { id },
    });

    if (!existingLeaderboard) {
      return NextResponse.json(
        { error: "Leaderboard not found" },
        { status: 404 }
      );
    }

    const {
      name,
      description,
      type,
      period,
      forPositions,
      isActive,
    } = await request.json();

    // Validate required fields
    if ((name === undefined || name === "") || 
        (type === undefined) || 
        (period === undefined)) {
      return NextResponse.json(
        { error: "Name, type, and period cannot be empty" },
        { status: 400 }
      );
    }

    // Update the leaderboard
    const updatedLeaderboard = await prisma.leaderboard.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
        ...(period !== undefined && { period }),
        ...(forPositions !== undefined && { forPositions }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(updatedLeaderboard);
  } catch (error) {
    console.error("Error updating leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to update leaderboard" },
      { status: 500 }
    );
  }
}

// DELETE /api/leaderboard/[id]
// Delete a leaderboard
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
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
        { error: "You don't have permission to delete leaderboards" },
        { status: 403 }
      );
    }

    // Check if leaderboard exists
    const existingLeaderboard = await prisma.leaderboard.findUnique({
      where: { id },
      include: {
        entries: true,
      },
    });

    if (!existingLeaderboard) {
      return NextResponse.json(
        { error: "Leaderboard not found" },
        { status: 404 }
      );
    }

    // Delete the leaderboard (this will cascade delete entries too)
    await prisma.leaderboard.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Leaderboard deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to delete leaderboard" },
      { status: 500 }
    );
  }
}