'use client';

import { LeaderboardType, TimePeriod, SalesPosition } from '@prisma/client';
import { useSession } from 'next-auth/react';
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

// Define types for our leaderboard data
export interface Leaderboard {
  id: string;
  name: string;
  description: string | null;
  type: LeaderboardType;
  period: TimePeriod;
  forPositions: SalesPosition[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  periodStart: Date;
  periodEnd: Date;
  metrics: Record<string, number> | null;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string | null;
    position: SalesPosition | null;
    profileImageUrl: string | null;
  };
}

export interface LeaderboardFilters {
  type: LeaderboardType | 'ALL';
  period: TimePeriod | 'ALL';
  position: SalesPosition | 'ALL';
  startDate: Date | null;
  endDate: Date | null;
  searchTerm: string;
}

export interface LeaderboardStats {
  totalEntries: number;
  topScore: number;
  averageScore: number;
  userRank: number | null;
  userScore: number | null;
}

// Define provider context type
interface LeaderboardContextType {
  leaderboards: Leaderboard[];
  activeLeaderboard: Leaderboard | null;
  entries: LeaderboardEntry[];
  filters: LeaderboardFilters;
  stats: LeaderboardStats;
  loading: boolean;
  error: string | null;
  setActiveLeaderboard: (leaderboard: Leaderboard | null) => void;
  setFilters: (filters: Partial<LeaderboardFilters>) => void;
  fetchLeaderboards: () => Promise<void>;
  fetchLeaderboardEntries: (leaderboardId: string) => Promise<void>;
  getFilteredEntries: () => LeaderboardEntry[];
}

// Create the context
const LeaderboardContext = createContext<LeaderboardContextType | undefined>(undefined);

// Custom hook to use the leaderboard context
export function useLeaderboard() {
  const context = useContext(LeaderboardContext);
  if (context === undefined) {
    throw new Error('useLeaderboard must be used within a LeaderboardProvider');
  }
  return context;
}

// Provider component
export function LeaderboardProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [leaderboards, setLeaderboards] = useState<Leaderboard[]>([]);
  const [activeLeaderboard, setActiveLeaderboard] = useState<Leaderboard | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Default filters
  const [filters, setFilters] = useState<LeaderboardFilters>({
    type: 'ALL',
    period: 'ALL',
    position: 'ALL',
    startDate: null,
    endDate: null,
    searchTerm: '',
  });

  // Calculate stats
  const stats: LeaderboardStats = useMemo(() => {
    if (!entries.length) {
      return {
        totalEntries: 0,
        topScore: 0,
        averageScore: 0,
        userRank: null,
        userScore: null,
      };
    }

    const totalEntries = entries.length;
    const topScore = Math.max(...entries.map((entry) => entry.score));
    const averageScore = entries.reduce((sum, entry) => sum + entry.score, 0) / totalEntries;

    // Find current user's entry if they exist
    const userEntry = session?.user
      ? entries.find((entry) => entry.userId === session.user.id)
      : null;

    return {
      totalEntries,
      topScore,
      averageScore,
      userRank: userEntry?.rank ?? null,
      userScore: userEntry?.score ?? null,
    };
  }, [entries, session]);

  // Fetch entries for a specific leaderboard
  const fetchLeaderboardEntries = useCallback(
    async (leaderboardId: string) => {
      if (!session?.user) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/leaderboard/${leaderboardId}/entries`);

        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard entries');
        }

        const data = await response.json();
        setEntries(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setLoading(false);
      }
    },
    [session]
  );

  // Fetch all leaderboards
  const fetchLeaderboards = useCallback(async () => {
    if (!session?.user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/leaderboard');

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboards');
      }

      const data = await response.json();
      setLeaderboards(data);

      // Set the first active leaderboard if none is selected
      if (!activeLeaderboard && data.length > 0) {
        setActiveLeaderboard(data[0]);
        await fetchLeaderboardEntries(data[0].id);
      }

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setLoading(false);
    }
  }, [session, activeLeaderboard, fetchLeaderboardEntries]);

  // Apply filters to entries
  const getFilteredEntries = () => {
    return entries.filter((entry) => {
      // Filter by search term (user name)
      if (filters.searchTerm && entry.user?.name) {
        if (!entry.user.name.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
          return false;
        }
      }

      // Filter by position
      if (filters.position !== 'ALL' && entry.user?.position) {
        if (entry.user.position !== filters.position) {
          return false;
        }
      }

      // Filter by date range
      if (filters.startDate) {
        const entryStart = new Date(entry.periodStart);
        if (entryStart < filters.startDate) {
          return false;
        }
      }

      if (filters.endDate) {
        const entryEnd = new Date(entry.periodEnd);
        if (entryEnd > filters.endDate) {
          return false;
        }
      }

      return true;
    });
  };

  // Update filters
  const handleSetFilters = (newFilters: Partial<LeaderboardFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Initial data fetch
  useEffect(() => {
    if (session?.user) {
      fetchLeaderboards();
    }
  }, [session, fetchLeaderboards]);

  // When active leaderboard changes, fetch its entries
  useEffect(() => {
    if (activeLeaderboard) {
      fetchLeaderboardEntries(activeLeaderboard.id);
    }
  }, [activeLeaderboard, fetchLeaderboardEntries]);

  return (
    <LeaderboardContext.Provider
      value={{
        leaderboards,
        activeLeaderboard,
        entries,
        filters,
        stats,
        loading,
        error,
        setActiveLeaderboard,
        setFilters: handleSetFilters,
        fetchLeaderboards,
        fetchLeaderboardEntries,
        getFilteredEntries,
      }}
    >
      {children}
    </LeaderboardContext.Provider>
  );
}
