import { NextRequest } from 'next/server';
import { z } from 'zod';

import { ApiError } from '@/lib/api/utils/api-error';
import { createApiHandler } from '@/lib/api/utils/api-handler';
import { createSuccessResponse } from '@/lib/api/utils/api-response';
import prisma from '@/lib/prisma';
import { canManageLeaderboards } from '@/lib/utils/permissions';

const bulkEntriesSchema = z.object({
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  entries: z.array(
    z.object({
      userId: z.string().optional(),
      email: z.string().optional(),
      score: z.number(),
    })
  ),
});

interface LeaderboardMetrics {
  [key: string]: number | string | boolean;
}

interface BulkImportEntry {
  userId?: string;
  email?: string;
  score: number;
  [key: string]: unknown;
}

export const POST = createApiHandler({
  POST: {
    auth: true,
    permission: canManageLeaderboards,
    handler: async (request: NextRequest, { params }) => {
      try {
        const leaderboardId = (params as { id: string }).id;

        const leaderboard = await prisma.leaderboard.findUnique({
          where: { id: leaderboardId },
        });

        if (!leaderboard) {
          throw ApiError.notFound('Leaderboard');
        }

        const body = await request.json();
        const validationResult = bulkEntriesSchema.safeParse(body);

        if (!validationResult.success) {
          throw ApiError.badRequest('Invalid request data', validationResult.error.message);
        }

        const { periodStart, periodEnd, entries } = validationResult.data;

        if (entries.length === 0) {
          throw ApiError.badRequest('Entries array cannot be empty');
        }

        const startDate = new Date(periodStart);
        const endDate = new Date(periodEnd);

        const results = {
          success: 0,
          failed: 0,
          skipped: 0,
          errors: [] as string[],
        };

        const userIdsByEmail = new Map<string, string>();

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

          users.forEach((user) => {
            if (user.email) {
              userIdsByEmail.set(user.email.toLowerCase(), user.id);
            }
          });
        }

        for (const entry of entries) {
          try {
            let userId = entry.userId;

            if (!userId && entry.email) {
              userId = userIdsByEmail.get(entry.email.toLowerCase());

              if (!userId) {
                results.skipped++;
                results.errors.push(`User with email "${entry.email}" not found`);
                continue;
              }
            }

            if (!userId) {
              results.skipped++;
              results.errors.push('Entry missing both userId and email');
              continue;
            }

            const existingEntry = await prisma.leaderboardEntry.findFirst({
              where: {
                leaderboardId,
                userId,
                periodStart: startDate,
                periodEnd: endDate,
              },
            });

            if (existingEntry) {
              await prisma.leaderboardEntry.update({
                where: { id: existingEntry.id },
                data: {
                  score: entry.score,
                  metrics: extractMetrics(entry) as LeaderboardMetrics,
                },
              });
            } else {
              await prisma.leaderboardEntry.create({
                data: {
                  leaderboardId,
                  userId,
                  score: entry.score,
                  periodStart: startDate,
                  periodEnd: endDate,
                  metrics: extractMetrics(entry) as LeaderboardMetrics,
                },
              });
            }

            results.success++;
          } catch (err) {
            results.failed++;
            results.errors.push(
              `Error processing entry: ${err instanceof Error ? err.message : String(err)}`
            );
          }
        }

        await updateRanksForPeriod(leaderboardId, startDate, endDate);

        return createSuccessResponse({
          message: 'Bulk import completed',
          results,
        });
      } catch (error) {
        throw error;
      }
    },
  },
});

function extractMetrics(entry: BulkImportEntry) {
  const metrics: Record<string, unknown> = {};
  const excludeKeys = ['userId', 'email', 'score'];

  for (const key in entry) {
    if (!excludeKeys.includes(key)) {
      metrics[key] = entry[key];
    }
  }

  return metrics;
}

async function updateRanksForPeriod(leaderboardId: string, startDate: Date, endDate: Date) {
  try {
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
