import { NextRequest } from 'next/server';
import { GET } from '@/app/api/leaderboard/[id]/entries/route';
import { POST } from '@/app/api/leaderboard/[id]/entries/bulk/route';
import prisma from '@/lib/prisma';

// Mock the prisma client
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
    $transaction: jest.fn((callback) => {
      if (typeof callback === 'function') {
        return callback(prisma);
      }
      return Promise.all(callback);
    }),
  },
}));

// Mock auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => ({
    user: {
      id: 'admin-id',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'ADMIN',
      position: 'MANAGER',
      isActive: true,
    },
  })),
}));

// Mock utils/permissions
jest.mock('@/lib/utils/permissions', () => ({
  canManageLeaderboards: jest.fn().mockReturnValue(true),
  isActive: jest.fn().mockReturnValue(true),
}));

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Leaderboard API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/leaderboard/[id]/entries', () => {
    test('should return leaderboard entries', async () => {
      // Mock the required implementations
      mockedPrisma.leaderboard.findUnique.mockResolvedValue({
        id: 'leaderboard-1',
        name: 'Test Leaderboard',
        type: 'CLOSERS',
        period: 'MONTHLY',
        isActive: true,
        forPositions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
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
          user: {
            id: 'user-1',
            name: 'User 1',
            position: 'ENERGY_CONSULTANT',
            profileImageUrl: null,
          },
        },
        {
          id: 'entry-2',
          leaderboardId: 'leaderboard-1',
          userId: 'user-2',
          score: 80,
          rank: 2,
          periodStart: new Date('2025-04-01'),
          periodEnd: new Date('2025-04-30'),
          metrics: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: 'user-2',
            name: 'User 2',
            position: 'ENERGY_CONSULTANT',
            profileImageUrl: null,
          },
        },
      ]);
      
      // Create mock context with params
      const params = { id: 'leaderboard-1' };
      
      // Create a mock request
      const request = new NextRequest('http://localhost:3000/api/leaderboard/leaderboard-1/entries');
      
      // Call the handler
      const response = await GET({
        params,
        session: { /* Filled in by mock */ }
      })(request);
      
      const result = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].rank).toBe(1);
      expect(result.data[1].rank).toBe(2);
      
      // Verify prisma was called correctly
      expect(mockedPrisma.leaderboard.findUnique).toHaveBeenCalledWith({
        where: { id: 'leaderboard-1' },
      });
      
      expect(mockedPrisma.leaderboardEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { leaderboardId: 'leaderboard-1' },
          include: expect.objectContaining({
            user: expect.anything(),
          }),
        })
      );
    });

    test('should return 404 if leaderboard not found', async () => {
      // Mock leaderboard not found
      mockedPrisma.leaderboard.findUnique.mockResolvedValue(null);
      
      // Create mock context with params
      const params = { id: 'non-existent-id' };
      
      // Create a mock request
      const request = new NextRequest('http://localhost:3000/api/leaderboard/non-existent-id/entries');
      
      // Call the handler
      const response = await GET({ 
        params,
        session: { /* Filled in by mock */ }
      })(request);
      
      const result = await response.json();
      
      // Assertions
      expect(response.status).toBe(404);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Leaderboard not found');
    });
  });

  describe('POST /api/leaderboard/[id]/entries/bulk', () => {
    test('should bulk import entries successfully', async () => {
      // Mock the required implementations
      mockedPrisma.leaderboard.findUnique.mockResolvedValue({
        id: 'leaderboard-1',
        name: 'Test Leaderboard',
        type: 'CLOSERS',
        period: 'MONTHLY',
        isActive: true,
        forPositions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Mock user lookups
      mockedPrisma.user.findMany.mockResolvedValue([
        { id: 'user-1', email: 'user1@example.com' },
        { id: 'user-2', email: 'user2@example.com' },
      ]);
      
      // Mock successful entry creations
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
      });
      
      // Create mock context with params
      const params = { id: 'leaderboard-1' };
      
      // Create a mock request with bulk entry data
      const requestBody = {
        periodStart: '2025-04-01T00:00:00Z',
        periodEnd: '2025-04-30T23:59:59Z',
        entries: [
          { userId: 'user-1', score: 100 },
          { userId: 'user-2', score: 80 },
          { email: 'user1@example.com', score: 120 },
        ],
      };
      
      const request = new NextRequest(
        'http://localhost:3000/api/leaderboard/leaderboard-1/entries/bulk',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );
      
      // Call the handler
      const response = await POST({
        params,
        session: { /* Filled in by mock */ }
      })(request);
      
      const result = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.message).toBe('Bulk import completed');
      
      // Verify prisma was called correctly
      expect(mockedPrisma.leaderboard.findUnique).toHaveBeenCalledWith({
        where: { id: 'leaderboard-1' },
      });
    });

    test('should handle validation errors', async () => {
      // Mock the required implementations
      mockedPrisma.leaderboard.findUnique.mockResolvedValue({
        id: 'leaderboard-1',
        name: 'Test Leaderboard',
        type: 'CLOSERS',
        period: 'MONTHLY',
        isActive: true,
        forPositions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Create mock context with params
      const params = { id: 'leaderboard-1' };
      
      // Create a mock request with invalid data (missing entries)
      const request = new NextRequest(
        'http://localhost:3000/api/leaderboard/leaderboard-1/entries/bulk',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            periodStart: '2025-04-01T00:00:00Z',
            periodEnd: '2025-04-30T23:59:59Z',
            // Missing entries array
          }),
        }
      );
      
      // Call the handler
      const response = await POST({
        params,
        session: { /* Filled in by mock */ }
      })(request);
      
      const result = await response.json();
      
      // Assertions
      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Period start, period end, and entries array are required');
    });
  });
});