import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageOnboarding } from "@/lib/utils/permissions";
import prisma from "@/lib/prisma";

// GET /api/onboarding/analytics
// Get analytics data for onboarding progress
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
        { error: "You don't have permission to access onboarding analytics" },
        { status: 403 }
      );
    }

    // Get parameters from URL
    const searchParams = request.nextUrl.searchParams;
    const trackId = searchParams.get("trackId");
    const periodDays = parseInt(searchParams.get("periodDays") || "30", 10);
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Set up where clause for filtering
    const whereClause: any = {
      isActive: true,
    };
    
    if (trackId) {
      whereClause.id = trackId;
    }

    // Get all active tracks with steps and progress
    const tracks = await prisma.onboardingTrack.findMany({
      where: whereClause,
      include: {
        steps: {
          include: {
            progress: {
              where: {
                OR: [
                  { startedAt: { gte: startDate } },
                  { completedAt: { gte: startDate } }
                ]
              }
            },
            _count: {
              select: {
                progress: true
              }
            }
          },
          orderBy: {
            order: "asc"
          }
        },
      },
    });

    // Get active users
    const activeUsers = await prisma.user.count({
      where: {
        isActive: true,
      },
    });

    // Calculate analytics data
    const analyticsData = await Promise.all(tracks.map(async (track) => {
      // Calculate step completion rates
      const stepStats = track.steps.map(step => {
        const totalAttempts = step._count.progress;
        const completions = step.progress.filter(p => p.status === "COMPLETED").length;
        const inProgress = step.progress.filter(p => p.status === "IN_PROGRESS").length;
        const completionRate = totalAttempts > 0 ? (completions / totalAttempts) * 100 : 0;
        
        // Calculate average completion time
        const completedProgresses = step.progress.filter(p => p.status === "COMPLETED" && p.startedAt && p.completedAt);
        let avgCompletionTime = 0;
        
        if (completedProgresses.length > 0) {
          const totalTime = completedProgresses.reduce((total, p) => {
            const startTime = new Date(p.startedAt!).getTime();
            const endTime = new Date(p.completedAt!).getTime();
            return total + (endTime - startTime);
          }, 0);
          
          avgCompletionTime = Math.round(totalTime / completedProgresses.length / (1000 * 60)); // in minutes
        }
        
        return {
          stepId: step.id,
          title: step.title,
          order: step.order,
          totalAttempts,
          completions,
          inProgress,
          completionRate: Math.round(completionRate),
          avgCompletionTimeMinutes: avgCompletionTime,
        };
      });

      // Calculate track-level statistics
      const totalSteps = track.steps.length;
      const userProgressQuery = await prisma.onboardingProgress.groupBy({
        by: ['userId'],
        where: {
          step: {
            trackId: track.id
          }
        },
        _count: {
          stepId: true
        },
        having: {
          stepId: {
            _count: {
              equals: totalSteps
            }
          }
        }
      });

      // Users who completed all steps
      const usersCompletedAll = userProgressQuery.length;
      
      // Calculate track completion rate
      const trackCompletionRate = activeUsers > 0 
        ? Math.round((usersCompletedAll / activeUsers) * 100) 
        : 0;

      return {
        trackId: track.id,
        trackName: track.name,
        totalSteps,
        usersCompletedAll,
        trackCompletionRate,
        stepStats,
      };
    }));

    // Get recent completions for activity feed
    const recentCompletions = await prisma.onboardingProgress.findMany({
      where: {
        status: "COMPLETED",
        completedAt: {
          gte: startDate
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
          }
        },
        step: {
          select: {
            id: true,
            title: true,
            trackId: true,
            track: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        completedAt: "desc"
      },
      take: 20
    });

    return NextResponse.json({
      activeUsers,
      tracks: analyticsData,
      recentActivity: recentCompletions,
      period: {
        startDate,
        endDate,
        days: periodDays
      }
    });
  } catch (error) {
    console.error("Error fetching onboarding analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch onboarding analytics" },
      { status: 500 }
    );
  }
}