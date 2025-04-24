import { NextRequest } from 'next/server';

import { GET as getUserHandler } from '@/app/api/users/me/route';
import { GET as getUsersHandler } from '@/app/api/users/route';
import prisma from '@/lib/prisma';
import '@testing-library/jest-dom';

// Mock the Prisma client
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

// Mock NextAuth with a complete Session object
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() =>
    Promise.resolve({
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'ADMIN',
        position: 'MANAGER',
        isActive: true,
      },
      expires: '2025-01-01T00:00:00Z', // Required by NextAuth Session type
    })
  ),
}));

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Users API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users', () => {
    test('should return users with pagination', async () => {
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
          name: 'User 2',
          email: 'user2@example.com',
          role: 'USER',
          position: 'ENERGY_CONSULTANT',
          isActive: true,
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

      mockedPrisma.user.count.mockResolvedValue(2);

      const request = new NextRequest('http://localhost:3000/api/users?page=1&pageSize=10');
      const response = await getUsersHandler(request, { params: {} });
      const result = await response.json();

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

      expect(mockedPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        })
      );
    });

    test('should apply filters correctly', async () => {
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

      mockedPrisma.user.count.mockResolvedValue(1);

      const request = new NextRequest(
        'http://localhost:3000/api/users?role=ADMIN&position=MANAGER&isActive=true&search=User'
      );
      const response = await getUsersHandler(request, { params: {} });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);

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
      const mockUser = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'ADMIN',
        position: 'MANAGER',
        isActive: true,
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
      };

      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/users/me');
      const response = await getUserHandler(request, { params: {} });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUser);

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
