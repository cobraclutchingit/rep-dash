'use client';

import { TrainingCategory } from '@prisma/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

export default function TrainingFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [category, setCategory] = useState<string | undefined>(
    searchParams.get('category') || undefined
  );
  const [status, setStatus] = useState<string | undefined>(searchParams.get('status') || undefined);
  const [search, setSearch] = useState(searchParams.get('search') || '');

  // Update URL with filters
  const updateFilters = useCallback(() => {
    const params = new URLSearchParams();

    if (category) params.set('category', category);
    if (status) params.set('status', status);
    if (search) params.set('search', search);

    router.push(`/training?${params.toString()}`);
  }, [category, status, search, router]);

  // Debounce search to prevent too many URL updates
  useEffect(() => {
    const timer = setTimeout(() => {
      updateFilters();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, updateFilters]);

  // Update URL when dropdowns change
  useEffect(() => {
    updateFilters();
  }, [category, status, updateFilters]);

  const clearFilters = () => {
    setCategory(undefined);
    setStatus(undefined);
    setSearch('');
    router.push('/training');
  };

  return (
    <div className="bg-card text-card-foreground mb-8 rounded-lg p-6 shadow">
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex-1">
          <label htmlFor="search" className="mb-1 block text-sm font-medium">
            Search
          </label>
          <input
            id="search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search modules..."
            className="border-input bg-background w-full rounded-md border p-2"
          />
        </div>

        <div className="w-full md:w-48">
          <label htmlFor="category" className="mb-1 block text-sm font-medium">
            Category
          </label>
          <select
            id="category"
            value={category || ''}
            onChange={(e) => setCategory(e.target.value || undefined)}
            className="border-input bg-background w-full rounded-md border p-2"
          >
            <option value="">All Categories</option>
            {Object.values(TrainingCategory).map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-48">
          <label htmlFor="status" className="mb-1 block text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            value={status || ''}
            onChange={(e) => setStatus(e.target.value || undefined)}
            className="border-input bg-background w-full rounded-md border p-2"
          >
            <option value="">All Status</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={clearFilters}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 h-[42px] rounded-md p-2"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
}
