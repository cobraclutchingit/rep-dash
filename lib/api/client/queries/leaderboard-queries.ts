'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { successToast } from '@/components/ui/toast';

import { apiClient } from '../api-client';

// Type definitions for leaderboard data
export interface Leaderboard {
  id: string;
  name: string;
  description: string | null;
  type: string;
  period: string;
  forPositions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  entries?: LeaderboardEntry[];
  _count?: {
    entries: number;
  };
}

export interface LeaderboardEntry {
  id: string;
  leaderboardId: string;
  userId: string;
  score: number;
  rank: number | null;
  periodStart: string;
  periodEnd: string;
  metrics: unknown | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string | null;
    position: string | null;
    profileImageUrl: string | null;
  };
}

export interface LeaderboardFilter {
  type?: string;
  period?: string;
  position?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  [key: string]: string | number | boolean | undefined;
}

// ===== Leaderboard Queries =====

/**
 * Get all leaderboards
 */
export function useLeaderboards(params?: LeaderboardFilter) {
  return useQuery({
    queryKey: ['leaderboards', params],
    queryFn: async () => {
      const response = await apiClient.get<Leaderboard[]>('/leaderboard', {
        params,
      });
      return response.data;
    },
  });
}

/**
 * Get a specific leaderboard with entries
 */
export function useLeaderboard(id: string, params?: LeaderboardFilter) {
  return useQuery({
    queryKey: ['leaderboards', id, params],
    queryFn: async () => {
      const response = await apiClient.get<Leaderboard>(`/leaderboard/${id}`, {
        params,
      });
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Get leaderboard entries
 */
export function useLeaderboardEntries(leaderboardId: string, params?: LeaderboardFilter) {
  return useQuery({
    queryKey: ['leaderboardEntries', leaderboardId, params],
    queryFn: async () => {
      const response = await apiClient.get<LeaderboardEntry[]>(
        `/leaderboard/${leaderboardId}/entries`,
        {
          params,
        }
      );
      return response.data;
    },
    enabled: !!leaderboardId,
  });
}

/**
 * Get the current user's achievements on a leaderboard
 */
export function useUserLeaderboardStats(leaderboardId?: string) {
  return useQuery({
    queryKey: ['userLeaderboardStats', leaderboardId],
    queryFn: async () => {
      const endpoint = leaderboardId
        ? `/leaderboard/user/stats/${leaderboardId}`
        : '/leaderboard/user/stats';

      const response = await apiClient.get<{
        rank: number | null;
        score: number | null;
        previousRank: number | null;
        rankChange: number | null;
        topPosition: boolean;
      }>(endpoint);

      return response.data;
    },
    enabled: !!leaderboardId,
  });
}

// ===== Leaderboard Mutations =====

/**
 * Create a new leaderboard
 */
export function useCreateLeaderboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Leaderboard, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await apiClient.post<Leaderboard>('/leaderboard', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaderboards'] });

      successToast({
        title: 'Success',
        description: 'Leaderboard created successfully',
      });
    },
  });
}

/**
 * Update a leaderboard
 */
export function useUpdateLeaderboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<Leaderboard, 'id' | 'createdAt' | 'updatedAt'>>;
    }) => {
      const response = await apiClient.patch<Leaderboard>(`/leaderboard/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: ['leaderboards', data.id] });
      }
      queryClient.invalidateQueries({ queryKey: ['leaderboards'] });

      successToast({
        title: 'Success',
        description: 'Leaderboard updated successfully',
      });
    },
  });
}

/**
 * Create a leaderboard entry
 */
export function useCreateLeaderboardEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      leaderboardId,
      data,
    }: {
      leaderboardId: string;
      data: Omit<LeaderboardEntry, 'id' | 'createdAt' | 'updatedAt' | 'leaderboardId'>;
    }) => {
      const response = await apiClient.post<LeaderboardEntry>(
        `/leaderboard/${leaderboardId}/entries`,
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.leaderboardId) {
        queryClient.invalidateQueries({ queryKey: ['leaderboardEntries', data.leaderboardId] });
        queryClient.invalidateQueries({ queryKey: ['leaderboards', data.leaderboardId] });
      }
      queryClient.invalidateQueries({ queryKey: ['userLeaderboardStats'] });

      successToast({
        title: 'Success',
        description: 'Entry added successfully',
      });
    },
  });
}

/**
 * Bulk create leaderboard entries
 */
export function useBulkCreateLeaderboardEntries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      leaderboardId,
      data,
    }: {
      leaderboardId: string;
      data: {
        entries: Array<
          Omit<
            LeaderboardEntry,
            'id' | 'createdAt' | 'updatedAt' | 'leaderboardId' | 'periodStart' | 'periodEnd'
          >
        >;
        periodStart: string;
        periodEnd: string;
      };
    }) => {
      const response = await apiClient.post<{ count: number }>(
        `/leaderboard/${leaderboardId}/entries/bulk`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leaderboardEntries', variables.leaderboardId] });
      queryClient.invalidateQueries({ queryKey: ['leaderboards', variables.leaderboardId] });
      queryClient.invalidateQueries({ queryKey: ['userLeaderboardStats'] });

      successToast({
        title: 'Success',
        description: `${variables.data.entries.length} entries added successfully`,
      });
    },
  });
}

/**
 * Delete a leaderboard entry
 */
export function useDeleteLeaderboardEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: string) => {
      const response = await apiClient.delete<{ leaderboardId: string }>(
        `/leaderboard/entries/${entryId}`
      );
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.leaderboardId) {
        queryClient.invalidateQueries({ queryKey: ['leaderboardEntries', data.leaderboardId] });
        queryClient.invalidateQueries({ queryKey: ['leaderboards', data.leaderboardId] });
      }
      queryClient.invalidateQueries({ queryKey: ['userLeaderboardStats'] });

      successToast({
        title: 'Success',
        description: 'Entry deleted successfully',
      });
    },
  });
}
