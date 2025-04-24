'use client';

import { ContestType, ContestStatus } from '@prisma/client';
import Link from 'next/link';
import React from 'react';

import ContestCard from './contest-card';
import { useCommunication } from '../providers/communication-provider';

interface ContestsSectionProps {
  showViewAll?: boolean;
  limit?: number;
}

export default function ContestsSection({ showViewAll = true, limit }: ContestsSectionProps) {
  const { getFilteredContests, filters, setFilters, loading } = useCommunication();

  // Get filtered contests
  const contests = getFilteredContests();

  // Limit the number of contests if specified
  const displayedContests = limit ? contests.slice(0, limit) : contests;

  // Update type filter
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value === 'all' ? null : (e.target.value as ContestType);

    setFilters({
      ...filters,
      contests: {
        ...filters.contests,
        type,
      },
    });
  };

  // Update status filter
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const status = e.target.value === 'all' ? null : (e.target.value as ContestStatus);

    setFilters({
      ...filters,
      contests: {
        ...filters.contests,
        status,
      },
    });
  };

  // Update search term
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      contests: {
        ...filters.contests,
        searchTerm: e.target.value,
      },
    });
  };

  // Format enum values for display
  const formatEnumValue = (value: string) => {
    return value
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="mb-8">
      <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <h2 className="text-xl font-semibold">Contests & Challenges</h2>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <input
            type="text"
            placeholder="Search..."
            value={filters.contests.searchTerm}
            onChange={handleSearchChange}
            className="border-input bg-background w-full rounded-md px-3 py-1 text-sm sm:w-auto"
          />

          <select
            value={filters.contests.type || 'all'}
            onChange={handleTypeChange}
            className="border-input bg-background rounded-md px-3 py-1 text-sm"
          >
            <option value="all">All Types</option>
            {Object.values(ContestType).map((type) => (
              <option key={type} value={type}>
                {formatEnumValue(type)}
              </option>
            ))}
          </select>

          <select
            value={filters.contests.status || 'all'}
            onChange={handleStatusChange}
            className="border-input bg-background rounded-md px-3 py-1 text-sm"
          >
            <option value="all">All Statuses</option>
            {Object.values(ContestStatus).map((status) => (
              <option key={status} value={status}>
                {formatEnumValue(status)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
        </div>
      ) : displayedContests.length === 0 ? (
        <div className="bg-card text-card-foreground rounded-lg border p-12 text-center">
          <div className="mb-3 text-4xl">🏆</div>
          <h3 className="mb-2 text-lg font-medium">No Contests</h3>
          <p className="text-muted-foreground mb-4">
            {filters.contests.searchTerm || filters.contests.type || filters.contests.status
              ? 'No contests match your current filters'
              : 'There are no contests at this time'}
          </p>
          {(filters.contests.searchTerm || filters.contests.type || filters.contests.status) && (
            <button
              onClick={() =>
                setFilters({
                  ...filters,
                  contests: {
                    type: null,
                    status: null,
                    searchTerm: '',
                  },
                })
              }
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayedContests.map((contest) => (
            <ContestCard key={contest.id} contest={contest} />
          ))}
        </div>
      )}

      {showViewAll && limit && contests.length > limit && (
        <div className="mt-6 text-center">
          <Link
            href="/communication/contests"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-block rounded-md px-4 py-2"
          >
            View All Contests
          </Link>
        </div>
      )}
    </div>
  );
}
