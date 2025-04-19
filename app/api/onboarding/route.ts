import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/onboarding
// Returns onboarding tracks and steps relevant to the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be signed in to access this endpoint" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        position: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find active tracks that are relevant to the user's position
    const tracks = await prisma.onboardingTrack.findMany({
      where: {
        isActive: true,
        // If the track has no specific positions, it's for everyone
        // Or if it includes the user's position
        OR: [
          { forPositions: { isEmpty: true } },
          { forPositions: { has: user.position } },
        ],
      },
      include: {
        steps: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!tracks || tracks.length === 0) {
      return NextResponse.json({ 
        track: null, 
        steps: [], 
        message: "No onboarding tracks available for your position" 
      });
    }

    // Select the first relevant track (in a more advanced implementation,
    // you might want to prioritize tracks or let users choose)
    const activeTrack = tracks[0];
    
    // Get all steps with user's progress
    const steps = await prisma.onboardingStep.findMany({
      where: {
        trackId: activeTrack.id,
      },
      include: {
        resources: true,
        progress: {
          where: {
            userId,
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    });

    // Restructure steps to normalize the progress data
    const normalizedSteps = steps.map(step => ({
      ...step,
      progress: step.progress.length > 0 ? step.progress[0] : null,
    }));

    return NextResponse.json({
      track: activeTrack,
      steps: normalizedSteps,
    });
  } catch (error) {
    console.error("Error in onboarding API:", error);
    return NextResponse.json(
      { error: "Failed to fetch onboarding data" },
      { status: 500 }
    );
  }
}