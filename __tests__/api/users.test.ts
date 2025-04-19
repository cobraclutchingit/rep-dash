import { NextRequest } from 'next/server';
import { GET as getUsersHandler } from '@/app/api/users/route';
import { GET as getUserHandler } from '@/app/api/users/me/route';
import prisma from '@/lib/prisma';

// Mock the prisma client
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
  },
}));

// Mock auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => ({
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'ADMIN',
      position: 'MANAGER',
      isActive: true,
    },
  })),
}));

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Users API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users', () => {
    test('should return users with pagination', async () => {
      // Mock the required implementations
      mockedPrisma.user.findMany.mockResolvedValue([
        {
          id: 'user-1',
          name: 'User 1',
          email: 'user1@example.com',
          role: 'ADMIN',
          position: 'MANAGER',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'user-2',
          name: 'User 2',
          email: 'user2@example.com',
          role: 'USER',
          position: 'ENERGY_CONSULTANT',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      
      mockedPrisma.user.count.mockResolvedValue(2);
      
      // Create a mock request
      const request = new NextRequest('http://localhost:3000/api/users?page=1&pageSize=10');
      
      // Call the handler
      const response = await getUsersHandler(request);
      const result = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.users).toHaveLength(2);
      expect(result.data.totalCount).toBe(2);
      expect(result.pagination).toEqual({
        page: 1,
        pageSize: 10,
        totalCount: 2,
        totalPages: 1,
      });
      
      // Verify prisma was called correctly
      expect(mockedPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        })
      );
    });

    test('should apply filters correctly', async () => {
      // Mock the required implementations
      mockedPrisma.user.findMany.mockResolvedValue([
        {
          id: 'user-1',
          name: 'User 1',
          email: 'user1@example.com',
          role: 'ADMIN',
          position: 'MANAGER',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      
      mockedPrisma.user.count.mockResolvedValue(1);
      
      // Create a mock request with filters
      const request = new NextRequest(
        'http://localhost:3000/api/users?role=ADMIN&position=MANAGER&isActive=true&search=User'
      );
      
      // Call the handler
      const response = await getUsersHandler(request);
      
      // Assertions
      expect(response.status).toBe(200);
      
      // Verify prisma was called with correct filters
      expect(mockedPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: 'ADMIN',
            position: 'MANAGER',
            isActive: true,
            OR: expect.anything(),
          }),
        })
      );
    });
  });

  describe('GET /api/users/me', () => {
    test('should return the current user profile', async () => {
      // Mock user data
      const mockUser = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'ADMIN',
        position: 'MANAGER',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);
      
      // Create a mock request
      const request = new NextRequest('http://localhost:3000/api/users/me');
      
      // Call the handler
      const response = await getUserHandler(request);
      const result = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUser);
      
      // Verify prisma was called correctly
      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: expect.objectContaining({
          id: true,
          name: true,
          email: true,
        }),
      });
    });
  });
});