import { NextRequest } from "next/server";
import { createApiHandler } from "@/lib/api/utils/api-handler";
import { createSuccessResponse, createNotFoundResponse } from "@/lib/api/utils/api-response";
import { ApiError } from "@/lib/api/utils/api-error";
import { leaderboardEntrySchema } from "@/lib/api/validators/leaderboard-validators";
import { canManageLeaderboards } from "@/lib/utils/permissions";
import prisma from "@/lib/prisma";

export const { GET, POST } = createApiHandler({
  GET: {
    auth: true,
    handler: async (req: NextRequest, { params, session }) => {
      const { id: leaderboardId } = params;
      
      // Check if leaderboard exists
      const leaderboard = await prisma.leaderboard.findUnique({
        where: { id: leaderboardId },
      });
      
      if (!leaderboard) {
        return createNotFoundResponse("Leaderboard");
      }
      
      // Parse query params
      const url = new URL(req.url);
      const search = url.searchParams.get("search");
      const position = url.searchParams.get("position");
      const startDate = url.searchParams.get("startDate");
      const endDate = url.searchParams.get("endDate");
      const limit = url.searchParams.get("limit") ? parseInt(url.searchParams.get("limit") as string) : undefined;
      
      // Check access restrictions for non-admins
      const isAdmin = canManageLeaderboards(session);
      if (!isAdmin) {
        // Regular users can only see active leaderboards
        if (!leaderboard.isActive) {
          throw ApiError.forbidden("This leaderboard is not active");
        }
        
        // Check position restrictions
        if (
          leaderboard.forPositions.length > 0 && 
          session.user.position && 
          !leaderboard.forPositions.includes(session.user.position)
        ) {
          throw ApiError.forbidden("You don't have permission to access this leaderboard");
        }
      }
      
      // Build where clause
      const where: any = {
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
          { rank: { nullsLast: true } }, // Rank users with null rank at the end
          { score: "desc" }, // Sort by score for users with the same rank
        ],
        ...(limit ? { take: limit } : {}),
      });
      
      // If entries have no rank, calculate them based on score
      let rankedEntries = entries;
      const hasRanks = entries.some(entry => entry.rank !== null);
      
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
      if (position && position !== "ALL") {
        filteredEntries = filteredEntries.filter(
          (entry) => entry.user?.position === position
        );
      }
      
      // Filter by search term (name)
      if (search) {
        const searchLower = search.toLowerCase();
        filteredEntries = filteredEntries.filter(
          (entry) => entry.user?.name?.toLowerCase().includes(searchLower)
        );
      }
      
      return createSuccessResponse(filteredEntries);
    },
  },
  
  POST: {
    auth: true,
    permission: canManageLeaderboards,
    validator: leaderboardEntrySchema,
    handler: async (req: NextRequest, { params, session }) => {
      const { id: leaderboardId } = params;
      const data = await req.json();
      
      // Check if leaderboard exists
      const leaderboard = await prisma.leaderboard.findUnique({
        where: { id: leaderboardId },
      });
      
      if (!leaderboard) {
        throw ApiError.notFound("Leaderboard");
      }
      
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
      });
      
      if (!user) {
        throw ApiError.notFound("User");
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
        throw ApiError.conflict("An entry already exists for this user and time period");
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
      await updateRanksForPeriod(leaderboardId, new Date(data.periodStart), new Date(data.periodEnd));
      
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
      
      return createSuccessResponse(updatedEntry, 201);
    },
  },
});

/**
 * Update ranks for all entries in a specific period
 */
async function updateRanksForPeriod(
  leaderboardId: string,
  startDate: Date,
  endDate: Date
) {
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