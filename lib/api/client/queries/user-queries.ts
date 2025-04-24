'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { successToast } from '@/components/ui/toast';

import { apiClient } from '../api-client';

export interface User {
  id: string;
  name: string | null;
  email: string;
  fullName: string | null;
  profileImageUrl: string | null;
  phoneNumber: string | null;
  bio: string | null;
  startDate: string | null;
  territory: string | null;
  role: string;
  position: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

// ===== Queries =====

/**
 * Get the current logged-in user's profile
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await apiClient.get<User>('/users/me');
      return response.data;
    },
  });
}

/**
 * Get a specific user's profile
 */
export function useUser(userId: string) {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: async () => {
      const response = await apiClient.get<User>(`/users/${userId}`);
      return response.data;
    },
    enabled: !!userId,
  });
}

/**
 * Get a list of users
 */
export function useUsers(params?: {
  page?: number;
  pageSize?: number;
  role?: string;
  position?: string;
  isActive?: boolean;
  search?: string;
}) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const response = await apiClient.get<{
        users: User[];
        totalCount: number;
        totalPages: number;
      }>('/users', { params });
      return response.data;
    },
  });
}

// ===== Mutations =====

/**
 * Update a user's profile
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Partial<User> }) => {
      const response = await apiClient.patch<User>(`/users/${userId}`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Update queries that contain this user
      queryClient.invalidateQueries({ queryKey: ['users', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });

      // If updating the current user, update that query too
      if (data?.id && data.id === variables.userId) {
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      }

      successToast({
        title: 'Success',
        description: 'User profile updated successfully',
      });
    },
  });
}

/**
 * Change password mutation
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    }) => {
      const response = await apiClient.post('/change-password', data);
      return response.data;
    },
    onSuccess: () => {
      successToast({
        title: 'Success',
        description: 'Password changed successfully',
      });
    },
  });
}

/**
 * Request password reset
 */
export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await apiClient.post('/forgot-password', { email });
      return response.data;
    },
    onSuccess: () => {
      successToast({
        title: 'Success',
        description: 'Password reset email sent. Please check your inbox.',
      });
    },
  });
}

/**
 * Reset password with token
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: async (data: { token: string; password: string; confirmPassword: string }) => {
      const response = await apiClient.post('/reset-password', data);
      return response.data;
    },
    onSuccess: () => {
      successToast({
        title: 'Success',
        description: 'Password reset successfully. You can now log in with your new password.',
      });
    },
  });
}

/**
 * Register a new user
 */
export function useRegisterUser() {
  return useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      password: string;
      position: string;
      phoneNumber?: string;
      fullName?: string;
      bio?: string;
      territory?: string;
    }) => {
      const response = await apiClient.post('/register', data);
      return response.data;
    },
    onSuccess: () => {
      successToast({
        title: 'Success',
        description: 'Registration successful. You can now log in.',
      });
    },
  });
}
