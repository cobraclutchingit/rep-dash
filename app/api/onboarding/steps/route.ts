import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageOnboarding } from "@/lib/utils/permissions";
import prisma from "@/lib/prisma";

// GET /api/onboarding/steps
// Get all onboarding steps or filtered by trackId
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be signed in to access this endpoint" },
        { status: 401 }
      );
    }

    // Check if user can manage onboarding
    if (!canManageOnboarding(session)) {
      return NextResponse.json(
        { error: "You don't have permission to access onboarding steps" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const trackId = searchParams.get("trackId");

    // Filter by trackId if provided
    const where = trackId ? { trackId } : {};

    const steps = await prisma.onboardingStep.findMany({
      where,
      include: {
        resources: true,
        track: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { trackId: "asc" },
        { order: "asc" },
      ],
    });

    return NextResponse.json(steps);
  } catch (error) {
    console.error("Error fetching onboarding steps:", error);
    return NextResponse.json(
      { error: "Failed to fetch onboarding steps" },
      { status: 500 }
    );
  }
}

// POST /api/onboarding/steps
// Create a new onboarding step
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be signed in to access this endpoint" },
        { status: 401 }
      );
    }

    // Check if user can manage onboarding
    if (!canManageOnboarding(session)) {
      return NextResponse.json(
        { error: "You don't have permission to create onboarding steps" },
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

    // Validate required fields
    if (!trackId || !title || !description) {
      return NextResponse.json(
        { error: "Track ID, title, and description are required" },
        { status: 400 }
      );
    }

    // Check if track exists
    const track = await prisma.onboardingTrack.findUnique({
      where: { id: trackId },
    });

    if (!track) {
      return NextResponse.json(
        { error: "Onboarding track not found" },
        { status: 404 }
      );
    }

    // Create step with resources connection
    const step = await prisma.onboardingStep.create({
      data: {
        trackId,
        title,
        description,
        instructions,
        order: order || 1,
        estimatedDuration: estimatedDuration || null,
        isRequired: isRequired !== undefined ? isRequired : true,
        resources: resourceIds && resourceIds.length > 0
          ? {
              connect: resourceIds.map((id: string) => ({ id })),
            }
          : undefined,
      },
      include: {
        resources: true,
      },
    });

    return NextResponse.json(step, { status: 201 });
  } catch (error) {
    console.error("Error creating onboarding step:", error);
    return NextResponse.json(
      { error: "Failed to create onboarding step" },
      { status: 500 }
    );
  }
}