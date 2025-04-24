'use client';

import Link from 'next/link';
import React from 'react';

import LinkCard from './link-card';
import { useCommunication } from '../providers/communication-provider';

interface LinksSectionProps {
  showViewAll?: boolean;
  limit?: number;
}

export default function LinksSection({ showViewAll = true, limit }: LinksSectionProps) {
  const { getFilteredLinks, linkCategories, filters, setFilters, loading } = useCommunication();

  // Get filtered links
  const links = getFilteredLinks();

  // Limit the number of links if specified
  const displayedLinks = limit ? links.slice(0, limit) : links;

  // Update category filter
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value === 'all' ? null : e.target.value;
    setFilters({
      ...filters,
      links: {
        ...filters.links,
        category,
      },
    });
  };

  // Update search term
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      links: {
        ...filters.links,
        searchTerm: e.target.value,
      },
    });
  };

  return (
    <div className="mb-8">
      <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <h2 className="text-xl font-semibold">Important Links</h2>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <input
            type="text"
            placeholder="Search..."
            value={filters.links.searchTerm}
            onChange={handleSearchChange}
            className="border-input bg-background w-full rounded-md px-3 py-1 text-sm sm:w-auto"
          />

          <select
            value={filters.links.category || 'all'}
            onChange={handleCategoryChange}
            className="border-input bg-background rounded-md px-3 py-1 text-sm"
          >
            <option value="all">All Categories</option>
            {linkCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
        </div>
      ) : displayedLinks.length === 0 ? (
        <div className="bg-card text-card-foreground rounded-lg border p-12 text-center">
          <div className="mb-3 text-4xl">🔗</div>
          <h3 className="mb-2 text-lg font-medium">No Links</h3>
          <p className="text-muted-foreground mb-4">
            {filters.links.searchTerm || filters.links.category
              ? 'No links match your current filters'
              : 'There are no important links at this time'}
          </p>
          {(filters.links.searchTerm || filters.links.category) && (
            <button
              onClick={() =>
                setFilters({
                  ...filters,
                  links: {
                    category: null,
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayedLinks.map((link) => (
            <LinkCard key={link.id} link={link} />
          ))}
        </div>
      )}

      {showViewAll && limit && links.length > limit && (
        <div className="mt-6 text-center">
          <Link
            href="/communication/links"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-block rounded-md px-4 py-2"
          >
            View All Links
          </Link>
        </div>
      )}
    </div>
  );
}
