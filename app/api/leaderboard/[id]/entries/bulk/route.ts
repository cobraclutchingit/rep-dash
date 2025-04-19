import { NextRequest } from "next/server";
import { createApiHandler } from "@/lib/api/utils/api-handler";
import { createSuccessResponse } from "@/lib/api/utils/api-response";
import { ApiError } from "@/lib/api/utils/api-error";
import { canManageLeaderboards } from "@/lib/utils/permissions";
import prisma from "@/lib/prisma";

interface BulkImportEntry {
  userId?: string;
  email?: string;
  score: number;
  [key: string]: any; // Additional metrics
}

export const POST = createApiHandler({
  POST: {
    auth: true,
    permission: canManageLeaderboards,
    handler: async (request: NextRequest, { params, session }) => {
      try {
        const { id: leaderboardId } = params;

        // Check if leaderboard exists
        const leaderboard = await prisma.leaderboard.findUnique({
          where: { id: leaderboardId },
        });

        if (!leaderboard) {
          throw ApiError.notFound("Leaderboard");
        }

        const {
          periodStart,
          periodEnd,
          entries
        } = await request.json();

        // Validate required fields
        if (!periodStart || !periodEnd || !entries || !Array.isArray(entries)) {
          throw ApiError.badRequest("Period start, period end, and entries array are required");
        }

        if (entries.length === 0) {
          throw ApiError.badRequest("Entries array cannot be empty");
        }

        // Prepare dates
        const startDate = new Date(periodStart);
        const endDate = new Date(periodEnd);

        // Process entries
        const results = {
          success: 0,
          failed: 0,
          skipped: 0,
          errors: [] as string[],
        };

        // Create a map of email to userId for quick lookup
        const userIdsByEmail = new Map<string, string>();
        
        // Get all users with emails from the entries
        const emails = entries
          .filter((entry: BulkImportEntry) => entry.email)
          .map((entry: BulkImportEntry) => entry.email);
        
        if (emails.length > 0) {
          const users = await prisma.user.findMany({
            where: {
              email: {
                in: emails as string[],
              },
            },
            select: {
              id: true,
              email: true,
            },
          });
          
          // Create email to userId mapping
          users.forEach(user => {
            if (user.email) {
              userIdsByEmail.set(user.email.toLowerCase(), user.id);
            }
          });
        }

        // Process each entry
        for (const entry of entries) {
          try {
            // Ensure we have either userId or email
            let userId = entry.userId;
            
            if (!userId && entry.email) {
              // Look up userId by email
              userId = userIdsByEmail.get(entry.email.toLowerCase());
              
              if (!userId) {
                results.skipped++;
                results.errors.push(`User with email "${entry.email}" not found`);
                continue;
              }
            }
            
            if (!userId) {
              results.skipped++;
              results.errors.push("Entry missing both userId and email");
              continue;
            }
            
            // Check if entry already exists
            const existingEntry = await prisma.leaderboardEntry.findFirst({
              where: {
                leaderboardId,
                userId,
                periodStart: startDate,
                periodEnd: endDate,
              },
            });
            
            if (existingEntry) {
              // Update existing entry
              await prisma.leaderboardEntry.update({
                where: { id: existingEntry.id },
                data: {
                  score: entry.score,
                  metrics: extractMetrics(entry),
                },
              });
            } else {
              // Create new entry
              await prisma.leaderboardEntry.create({
                data: {
                  leaderboardId,
                  userId,
                  score: entry.score,
                  periodStart: startDate,
                  periodEnd: endDate,
                  metrics: extractMetrics(entry),
                },
              });
            }
            
            results.success++;
          } catch (err) {
            results.failed++;
            results.errors.push(`Error processing entry: ${err instanceof Error ? err.message : String(err)}`);
          }
        }

        // Update ranks for all entries in this period
        await updateRanksForPeriod(leaderboardId, startDate, endDate);

        return createSuccessResponse({
          message: "Bulk import completed",
          results,
        });
      } catch (error) {
        // Let the API handler handle the error
        throw error;
      }
    },
  },
});

// Helper function to extract metrics from an entry
function extractMetrics(entry: BulkImportEntry) {
  const metrics: Record<string, any> = {};
  const excludeKeys = ["userId", "email", "score"];
  
  for (const key in entry) {
    if (!excludeKeys.includes(key)) {
      metrics[key] = entry[key];
    }
  }
  
  return metrics;
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