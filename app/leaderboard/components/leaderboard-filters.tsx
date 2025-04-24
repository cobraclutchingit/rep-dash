'use client';

import { LeaderboardType, TimePeriod, SalesPosition } from '@prisma/client';
import React from 'react';

import { useLeaderboard } from '../providers/leaderboard-provider';

export default function LeaderboardFilters() {
  const { leaderboards, activeLeaderboard, setActiveLeaderboard, filters, setFilters, loading } =
    useLeaderboard();

  // Format enum values for display
  const formatEnumValue = (value: string) => {
    return value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Handler for leaderboard change
  const handleLeaderboardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const leaderboardId = e.target.value;
    const selected = leaderboards.find((board) => board.id === leaderboardId);
    if (selected) {
      setActiveLeaderboard(selected);
    }
  };

  // Handler for type filter change
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ type: e.target.value as LeaderboardType | 'ALL' });
  };

  // Handler for period filter change
  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ period: e.target.value as TimePeriod | 'ALL' });
  };

  // Handler for position filter change
  const handlePositionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ position: e.target.value as SalesPosition | 'ALL' });
  };

  // Handler for search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ searchTerm: e.target.value });
  };

  // Handler for date filters
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'startDate') {
      setFilters({ startDate: value ? new Date(value) : null });
    } else if (name === 'endDate') {
      setFilters({ endDate: value ? new Date(value) : null });
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setFilters({
      type: 'ALL',
      period: 'ALL',
      position: 'ALL',
      startDate: null,
      endDate: null,
      searchTerm: '',
    });
  };

  return (
    <div className="bg-card mb-6 rounded-lg border p-4">
      <div className="mb-4">
        <label htmlFor="leaderboard" className="mb-1 block text-sm font-medium">
          Select Leaderboard
        </label>
        <select
          id="leaderboard"
          value={activeLeaderboard?.id || ''}
          onChange={handleLeaderboardChange}
          className="border-input bg-background w-full rounded-md px-3 py-2"
          disabled={loading || leaderboards.length === 0}
        >
          {leaderboards.length === 0 ? (
            <option value="">No leaderboards available</option>
          ) : (
            leaderboards.map((board) => (
              <option key={board.id} value={board.id}>
                {board.name}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="type" className="mb-1 block text-sm font-medium">
            Type
          </label>
          <select
            id="type"
            value={filters.type}
            onChange={handleTypeChange}
            className="border-input bg-background w-full rounded-md px-3 py-2"
            disabled={loading}
          >
            <option value="ALL">All Types</option>
            {Object.values(LeaderboardType).map((type) => (
              <option key={type} value={type}>
                {formatEnumValue(type)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="period" className="mb-1 block text-sm font-medium">
            Period
          </label>
          <select
            id="period"
            value={filters.period}
            onChange={handlePeriodChange}
            className="border-input bg-background w-full rounded-md px-3 py-2"
            disabled={loading}
          >
            <option value="ALL">All Periods</option>
            {Object.values(TimePeriod).map((period) => (
              <option key={period} value={period}>
                {formatEnumValue(period)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="position" className="mb-1 block text-sm font-medium">
            Position
          </label>
          <select
            id="position"
            value={filters.position}
            onChange={handlePositionChange}
            className="border-input bg-background w-full rounded-md px-3 py-2"
            disabled={loading}
          >
            <option value="ALL">All Positions</option>
            {Object.values(SalesPosition).map((position) => (
              <option key={position} value={position}>
                {formatEnumValue(position)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="search" className="mb-1 block text-sm font-medium">
            Search
          </label>
          <input
            id="search"
            type="text"
            placeholder="Search by name..."
            value={filters.searchTerm}
            onChange={handleSearchChange}
            className="border-input bg-background w-full rounded-md px-3 py-2"
            disabled={loading}
          />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="startDate" className="mb-1 block text-sm font-medium">
            Start Date
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
            onChange={handleDateChange}
            className="border-input bg-background w-full rounded-md px-3 py-2"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="endDate" className="mb-1 block text-sm font-medium">
            End Date
          </label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
            onChange={handleDateChange}
            className="border-input bg-background w-full rounded-md px-3 py-2"
            disabled={loading}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleResetFilters}
          className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-md px-4 py-2 disabled:opacity-50"
          disabled={loading}
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
}
