import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';

import { POST } from '@/app/api/leaderboard/[id]/entries/bulk/route';
import { GET } from '@/app/api/leaderboard/[id]/entries/route';
import prisma from '@/lib/prisma';

// Ensure Jest types are available
import '@testing-library/jest-dom';

// Mock the Prisma client
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    leaderboard: {
      findUnique: jest.fn(),
    },
    leaderboardEntry: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(async (callback: (prisma: PrismaClient) => Promise<unknown>) => {
      if (typeof callback === 'function') {
        return callback(prisma);
      }
      return Promise.all(await callback); // Await callback to ensure it's iterable
    }),
  },
}));

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() =>
    Promise.resolve({
      user: {
        id: 'admin-id',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'ADMIN',
        position: 'MANAGER',
        isActive: true,
      },
      expires: '2025-01-01T00:00:00Z', // Required by Session type
    })
  ),
}));

// Mock permissions
jest.mock('@/lib/utils/permissions', () => ({
  canManageLeaderboards: jest.fn().mockReturnValue(true),
  isActive: jest.fn().mockReturnValue(true),
}));

const mockedPrisma = prisma as jest.Mocked<PrismaClient>;

describe('Leaderboard API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/leaderboard/[id]/entries', () => {
    test('should return leaderboard entries', async () => {
      mockedPrisma.leaderboard.findUnique.mockResolvedValue({
        id: 'leaderboard-1',
        name: 'Test Leaderboard',
        type: 'CLOSERS',
        period: 'MONTHLY',
        isActive: true,
        forPositions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        description: null, // Added required field
      });

      mockedPrisma.leaderboardEntry.findMany.mockResolvedValue([
        {
          id: 'entry-1',
          leaderboardId: 'leaderboard-1',
          userId: 'user-1',
          score: 100,
          rank: 1,
          periodStart: new Date('2025-04-01'),
          periodEnd: new Date('2025-04-30'),
          metrics: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'entry-2',
          leaderboardId: 'leaderboard-1',
          userId: 'user-2',
          score: 50,
          rank: 2,
          periodStart: new Date('2025-04-01'),
          periodEnd: new Date('2025-04-30'),
          metrics: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const params = { id: 'leaderboard-1' };
      const request = new NextRequest(
        'http://localhost:3000/api/leaderboard/leaderboard-1/entries'
      );
      const response = await GET(request, { params });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].rank).toBe(1);
      expect(result.data[1].rank).toBe(2);
      expect(mockedPrisma.leaderboard.findUnique).toHaveBeenCalledWith({
        where: { id: 'leaderboard-1' },
      });
      expect(mockedPrisma.leaderboardEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { leaderboardId: 'leaderboard-1' },
          include: expect.anything(),
        })
      );
    });

    test('should return 404 if leaderboard not found', async () => {
      mockedPrisma.leaderboard.findUnique.mockResolvedValue(null);

      const params = { id: 'nonexistent' };
      const request = new NextRequest('http://localhost:3000/api/leaderboard/nonexistent/entries');
      const response = await GET(request, { params });
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Leaderboard not found');
    });
  });

  describe('POST /api/leaderboard/[id]/entries/bulk', () => {
    test('should create bulk entries', async () => {
      mockedPrisma.leaderboard.findUnique.mockResolvedValue({
        id: 'leaderboard-1',
        name: 'Test Leaderboard',
        type: 'CLOSERS',
        period: 'MONTHLY',
        isActive: true,
        forPositions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        description: null, // Added required field
      });

      mockedPrisma.user.findMany.mockResolvedValue([
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: 'User 1',
          role: 'USER',
          position: 'ENERGY_CONSULTANT',
          isActive: true,
          password: 'hashedpassword',
          createdAt: new Date(),
          updatedAt: new Date(),
          emailVerified: null,
          fullName: null,
          phoneNumber: null,
          profileImageUrl: null,
          bio: null,
          startDate: null,
          territory: null,
          lastLoginAt: null,
          resetToken: null,
          resetTokenExpiry: null,
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          name: 'User 2',
          role: 'USER',
          position: 'ENERGY_CONSULTANT',
          isActive: true,
          password: 'hashedpassword',
          createdAt: new Date(),
          updatedAt: new Date(),
          emailVerified: null,
          fullName: null,
          phoneNumber: null,
          profileImageUrl: null,
          bio: null,
          startDate: null,
          territory: null,
          lastLoginAt: null,
          resetToken: null,
          resetTokenExpiry: null,
        },
      ]);

      mockedPrisma.leaderboardEntry.create.mockResolvedValue({
        id: 'new-entry',
        leaderboardId: 'leaderboard-1',
        userId: 'user-1',
        score: 100,
        periodStart: new Date('2025-04-01'),
        periodEnd: new Date('2025-04-30'),
        metrics: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        rank: null, // Added required field
      });

      const params = { id: 'leaderboard-1' };
      const request = new NextRequest(
        'http://localhost:3000/api/leaderboard/leaderboard-1/entries/bulk',
        {
          method: 'POST',
          body: JSON.stringify({
            periodStart: '2025-04-01',
            periodEnd: '2025-04-30',
            entries: [
              { userId: 'user-1', score: 100 },
              { userId: 'user-2', score: 50 },
            ],
          }),
        }
      );
      const response = await POST(request, { params });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.message).toBe('Bulk import completed');
      expect(mockedPrisma.leaderboard.findUnique).toHaveBeenCalledWith({
        where: { id: 'leaderboard-1' },
      });
    });

    test('should return 400 if required fields are missing', async () => {
      const params = { id: 'leaderboard-1' };
      const request = new NextRequest(
        'http://localhost:3000/api/leaderboard/leaderboard-1/entries/bulk',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );
      const response = await POST(request, { params });
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Period start, period end, and entries array are required');
    });
  });
});
