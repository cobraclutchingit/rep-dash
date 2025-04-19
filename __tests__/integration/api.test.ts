import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';
import { prismaMock } from '../../lib/prisma-mock';
import { GET, POST } from '../../app/api/users/route';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

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
      // Mock the database response
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
        },
      ]);

      // Mock the request
      const { req } = createMocks({
        method: 'GET',
      });

      // Execute the request
      const response = await GET(req as unknown as NextRequest);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.length).toBe(2);
      expect(responseData.data[0].email).toBe('user1@example.com');
      expect(responseData.data[1].email).toBe('user2@example.com');
      expect(responseData.data[0].password).toBeUndefined(); // Ensure password is not included
      expect(responseData.data[1].password).toBeUndefined();
    });

    it('should handle errors and return 500 status', async () => {
      // Mock a database error
      prismaMock.user.findMany.mockRejectedValue(new Error('Database error'));

      // Mock the request
      const { req } = createMocks({
        method: 'GET',
      });

      // Execute the request
      const response = await GET(req as unknown as NextRequest);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Failed to retrieve users');
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      // Mock user data
      const userData = {
        email: 'newuser@example.com',
        name: 'New User',
        role: 'USER',
        position: 'ENERGY_CONSULTANT',
        password: 'securePassword123',
      };

      // Mock the database response
      prismaMock.user.create.mockResolvedValue({
        id: '3',
        email: userData.email,
        name: userData.name,
        role: userData.role as any,
        position: userData.position as any,
        isActive: true,
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
        resetToken: null,
        resetTokenExpiry: null,
      });

      // Mock the request
      const { req } = createMocks({
        method: 'POST',
        body: userData,
      });

      // Mock the request body as JSON
      (req as any).json = jest.fn().mockResolvedValue(userData);

      // Execute the request
      const response = await POST(req as unknown as NextRequest);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.data.email).toBe(userData.email);
      expect(responseData.data.name).toBe(userData.name);
      expect(responseData.data.id).toBe('3');
      expect(responseData.data.password).toBeUndefined(); // Ensure password is not included
    });

    it('should validate input and return 400 for invalid data', async () => {
      // Mock invalid user data (missing required fields)
      const userData = {
        email: 'invalid-email',
        // Missing name
        role: 'INVALID_ROLE',
        // Missing position
        // Missing password
      };

      // Mock the request
      const { req } = createMocks({
        method: 'POST',
        body: userData,
      });

      // Mock the request body as JSON
      (req as any).json = jest.fn().mockResolvedValue(userData);

      // Execute the request
      const response = await POST(req as unknown as NextRequest);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Invalid request data');
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });
  });
});