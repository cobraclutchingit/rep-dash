// app/communication/components/announcements-section.tsx
'use client';

import { AnnouncementPriority } from '@prisma/client';
import Link from 'next/link';
import React from 'react';

import AnnouncementCard from './announcement-card';
import { useCommunication } from '../providers/communication-provider';

interface AnnouncementsSectionProps {
  showViewAll?: boolean;
  limit?: number;
}

export default function AnnouncementsSection({
  showViewAll = true,
  limit,
}: AnnouncementsSectionProps) {
  const { getFilteredAnnouncements, announcementCategories, filters, setFilters, loading } =
    useCommunication();

  // Get filtered announcements
  const announcements = getFilteredAnnouncements();

  // Limit the number of announcements if specified
  const displayedAnnouncements = limit ? announcements.slice(0, limit) : announcements;

  // Update category filter
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value === 'all' ? null : e.target.value;
    setFilters({
      ...filters,
      announcements: {
        ...filters.announcements,
        category,
      },
    });
  };

  // Update priority filter
  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const priority = e.target.value === 'all' ? null : (e.target.value as AnnouncementPriority);

    setFilters({
      ...filters,
      announcements: {
        ...filters.announcements,
        priority,
      },
    });
  };

  // Update search term
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      announcements: {
        ...filters.announcements,
        searchTerm: e.target.value,
      },
    });
  };

  return (
    <div className="mb-8">
      <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <h2 className="text-xl font-semibold">Announcements</h2>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <input
            type="text"
            placeholder="Search..."
            value={filters.announcements.searchTerm}
            onChange={handleSearchChange}
            className="border-input bg-background w-full rounded-md px-3 py-1 text-sm sm:w-auto"
          />

          <select
            value={filters.announcements.category || 'all'}
            onChange={handleCategoryChange}
            className="border-input bg-background rounded-md px-3 py-1 text-sm"
          >
            <option value="all">All Categories</option>
            {announcementCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={filters.announcements.priority || 'all'}
            onChange={handlePriorityChange}
            className="border-input bg-background rounded-md px-3 py-1 text-sm"
          >
            <option value="all">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
        </div>
      ) : displayedAnnouncements.length === 0 ? (
        <div className="bg-card text-card-foreground rounded-lg border p-12 text-center">
          <div className="mb-3 text-4xl">📢</div>
          <h3 className="mb-2 text-lg font-medium">No Announcements</h3>
          <p className="text-muted-foreground mb-4">
            {filters.announcements.searchTerm ||
            filters.announcements.category ||
            filters.announcements.priority
              ? 'No announcements match your current filters'
              : 'There are no announcements at this time'}
          </p>
          {(filters.announcements.searchTerm ||
            filters.announcements.category ||
            filters.announcements.priority) && (
            <button
              onClick={() =>
                setFilters({
                  ...filters,
                  announcements: {
                    category: null,
                    priority: null,
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
        <div className="space-y-4">
          {displayedAnnouncements.map((announcement) => (
            <AnnouncementCard key={announcement.id} announcement={announcement} compact={true} />
          ))}

          {showViewAll && limit && announcements.length > limit && (
            <div className="mt-4 text-center">
              <Link
                href="/communication/announcements"
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-block rounded-md px-4 py-2"
              >
                View All Announcements
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
