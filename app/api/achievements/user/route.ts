import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/achievements/user
// Get achievements for the current logged-in user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to access this endpoint" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get user achievements with achievement details
    const userAchievements = await prisma.userAchievement.findMany({
      where: {
        userId,
      },
      include: {
        achievement: true,
      },
      orderBy: {
        awardedAt: "desc",
      },
    });

    // Transform the data for the response
    const achievements = userAchievements.map((ua) => ({
      id: ua.achievement.id,
      name: ua.achievement.name,
      description: ua.achievement.description,
      badgeImageUrl: ua.achievement.badgeImageUrl,
      points: ua.achievement.points,
      isSecret: ua.achievement.isSecret,
      awardedAt: ua.awardedAt,
    }));

    return NextResponse.json(achievements);
  } catch (error) {
    console.error("Error fetching user achievements:", error);
    return NextResponse.json(
      { error: "Failed to fetch achievements" },
      { status: 500 }
    );
  }
}