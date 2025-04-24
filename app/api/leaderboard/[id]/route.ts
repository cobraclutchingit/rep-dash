import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createApiHandler } from '@/lib/api/utils/api-handler';
import { createUnauthorizedResponse, createNotFoundResponse } from '@/lib/api/utils/api-response';
import prisma from '@/lib/prisma';
import { canManageLeaderboards } from '@/lib/utils/permissions';

const leaderboardSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['APPOINTMENT_SETTERS', 'CLOSERS', 'REFERRALS', 'OVERALL']),
  period: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'ALL_TIME']),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  forPositions: z
    .array(z.enum(['JUNIOR_EC', 'ENERGY_CONSULTANT', 'ENERGY_SPECIALIST', 'MANAGER']))
    .optional(),
});

type LeaderboardData = z.infer<typeof leaderboardSchema>;

export const GET = createApiHandler({
  GET: {
    auth: true,
    handler: async (request: NextRequest, { params, session }) => {
      const id = (params as { id: string }).id;

      if (!session || !session.user) {
        return createUnauthorizedResponse();
      }

      const leaderboard = await prisma.leaderboard.findUnique({
        where: { id },
        include: {
          entries: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  profileImageUrl: true,
                },
              },
            },
            orderBy: [{ rank: 'asc' }, { score: 'desc' }],
          },
        },
      });

      if (!leaderboard) {
        return createNotFoundResponse('Leaderboard');
      }

      return NextResponse.json({
        success: true,
        data: leaderboard,
      });
    },
  },
});

export const PUT = createApiHandler({
  PUT: {
    auth: true,
    permission: canManageLeaderboards,
    handler: async (request: NextRequest, { params, session }) => {
      const id = (params as { id: string }).id;

      if (!session || !session.user) {
        return createUnauthorizedResponse();
      }

      // Auth check is handled by permission parameter

      const body = await request.json();
      let parsedBody: LeaderboardData;
      try {
        parsedBody = leaderboardSchema.parse(body);
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid leaderboard data',
            details: error instanceof z.ZodError ? error.format() : error,
          },
          { status: 400 }
        );
      }
      const { name, type, period, description, isActive, forPositions } = parsedBody;

      const leaderboard = await prisma.leaderboard.findUnique({
        where: { id },
      });

      if (!leaderboard) {
        return createNotFoundResponse('Leaderboard');
      }

      const updatedLeaderboard = await prisma.leaderboard.update({
        where: { id },
        data: {
          name,
          type,
          period,
          description,
          isActive,
          forPositions,
        },
      });

      return NextResponse.json({
        success: true,
        data: updatedLeaderboard,
      });
    },
  },
});

export const DELETE = createApiHandler({
  DELETE: {
    auth: true,
    permission: canManageLeaderboards,
    handler: async (request: NextRequest, { params, session }) => {
      const id = (params as { id: string }).id;

      if (!session || !session.user) {
        return createUnauthorizedResponse();
      }

      // Auth check is handled by permission parameter

      const leaderboard = await prisma.leaderboard.findUnique({
        where: { id },
      });

      if (!leaderboard) {
        return createNotFoundResponse('Leaderboard');
      }

      await prisma.leaderboard.delete({
        where: { id },
      });

      return NextResponse.json({
        success: true,
        data: { message: 'Leaderboard deleted successfully' },
      });
    },
  },
});
