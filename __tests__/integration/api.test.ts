import { NextRequest } from 'next/server';
import { createMocks } from 'node-mocks-http';

import { GET, POST } from '../../app/api/users/route';
import { prismaMock } from '../../lib/prisma-mock';

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: prismaMock,
}));

describe('Users API Integration', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /api/users', () => {
    it('should return a list of users', async () => {
      prismaMock.user.findMany.mockResolvedValue([
        {
          id: '1',
          email: 'user1@example.com',
          name: 'User One',
          role: 'USER',
          position: 'ENERGY_CONSULTANT',
          isActive: true,
          password: 'hashed-password',
          createdAt: new Date(),
          updatedAt: new Date(),
          resetToken: null,
          resetTokenExpiry: null,
          emailVerified: null,
          fullName: null,
          phoneNumber: null,
          profileImageUrl: null,
          bio: null,
          startDate: null,
          territory: null,
          lastLoginAt: null,
        },
        {
          id: '2',
          email: 'user2@example.com',
          name: 'User Two',
          role: 'ADMIN',
          position: 'MANAGER',
          isActive: true,
          password: 'hashed-password',
          createdAt: new Date(),
          updatedAt: new Date(),
          resetToken: null,
          resetTokenExpiry: null,
          emailVerified: null,
          fullName: null,
          phoneNumber: null,
          profileImageUrl: null,
          bio: null,
          startDate: null,
          territory: null,
          lastLoginAt: null,
        },
      ]);

      const { req } = createMocks({
        method: 'GET',
      });

      const response = await GET(req as unknown as NextRequest, { params: {} });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveLength(2);
      expect(responseData.data[0].email).toBe('user1@example.com');
      expect(responseData.data[1].email).toBe('user2@example.com');
      expect(responseData.data[0].password).toBeUndefined();
      expect(responseData.data[1].password).toBeUndefined();
    });

    it('should handle errors and return 500 status', async () => {
      prismaMock.user.findMany.mockRejectedValue(new Error('Database error'));

      const { req } = createMocks({
        method: 'GET',
      });

      const response = await GET(req as unknown as NextRequest, { params: {} });
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Failed to retrieve users');
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'newuser@example.com',
        name: 'New User',
        role: 'USER',
        position: 'ENERGY_CONSULTANT',
        password: 'securePassword123',
      };

      prismaMock.user.create.mockResolvedValue({
        id: '3',
        email: userData.email,
        name: userData.name,
        role: userData.role,
        position: userData.position,
        isActive: true,
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
        resetToken: null,
        resetTokenExpiry: null,
        emailVerified: null,
        fullName: null,
        phoneNumber: null,
        profileImageUrl: null,
        bio: null,
        startDate: null,
        territory: null,
        lastLoginAt: null,
      });

      const { req } = createMocks({
        method: 'POST',
        body: userData,
      });

      (req as any).json = jest.fn().mockResolvedValue(userData);

      const response = await POST(req as unknown as NextRequest, { params: {} });
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.data.email).toBe(userData.email);
      expect(responseData.data.name).toBe(userData.name);
      expect(responseData.data.id).toBe('3');
      expect(responseData.data.password).toBeUndefined();
    });

    it('should validate input and return 400 for invalid data', async () => {
      const userData = {
        email: 'invalid-email',
        role: 'INVALID_ROLE',
      };

      const { req } = createMocks({
        method: 'POST',
        body: userData,
      });

      (req as any).json = jest.fn().mockResolvedValue(userData);

      const response = await POST(req as unknown as NextRequest, { params: {} });
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Invalid request data');
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });
  });
});
