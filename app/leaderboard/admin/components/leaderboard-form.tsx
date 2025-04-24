'use client';

import { LeaderboardType, TimePeriod, SalesPosition } from '@prisma/client';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';

interface LeaderboardFormProps {
  leaderboard?: {
    id: string;
    name: string;
    description: string | null;
    type: LeaderboardType;
    period: TimePeriod;
    forPositions: SalesPosition[];
    isActive: boolean;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function LeaderboardForm({
  leaderboard,
  onSuccess,
  onCancel,
}: LeaderboardFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'OVERALL' as LeaderboardType,
    period: 'MONTHLY' as TimePeriod,
    forPositions: [] as SalesPosition[],
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form data if editing an existing leaderboard
  useEffect(() => {
    if (leaderboard) {
      setFormData({
        name: leaderboard.name,
        description: leaderboard.description || '',
        type: leaderboard.type,
        period: leaderboard.period,
        forPositions: leaderboard.forPositions,
        isActive: leaderboard.isActive,
      });
    }
  }, [leaderboard]);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Handle position toggle
  const handlePositionToggle = (position: SalesPosition) => {
    setFormData((prev) => {
      const updatedPositions = [...prev.forPositions];

      if (updatedPositions.includes(position)) {
        return {
          ...prev,
          forPositions: updatedPositions.filter((p) => p !== position),
        };
      } else {
        return {
          ...prev,
          forPositions: [...updatedPositions, position],
        };
      }
    });
  };

  // Format enum values for display
  const formatEnumValue = (value: string) => {
    return value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = leaderboard ? `/api/leaderboard/${leaderboard.id}` : '/api/leaderboard';
      const method = leaderboard ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save leaderboard');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/leaderboard/admin');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error saving leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="bg-destructive/10 text-destructive rounded-md p-3">{error}</div>}

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium">
              Leaderboard Name *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Top Sales Representatives"
              className="border-input bg-background w-full rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what this leaderboard tracks"
              className="border-input bg-background w-full rounded-md px-3 py-2"
              rows={3}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="type" className="mb-1 block text-sm font-medium">
              Leaderboard Type *
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="border-input bg-background w-full rounded-md px-3 py-2"
            >
              {Object.values(LeaderboardType).map((type) => (
                <option key={type} value={type}>
                  {formatEnumValue(type)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="period" className="mb-1 block text-sm font-medium">
              Time Period *
            </label>
            <select
              id="period"
              name="period"
              value={formData.period}
              onChange={handleChange}
              required
              className="border-input bg-background w-full rounded-md px-3 py-2"
            >
              {Object.values(TimePeriod).map((period) => (
                <option key={period} value={period}>
                  {formatEnumValue(period)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Visible to Positions</label>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {Object.values(SalesPosition).map((position) => (
              <label key={position} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.forPositions.includes(position)}
                  onChange={() => handlePositionToggle(position)}
                  className="mr-2 h-4 w-4"
                />
                <span className="text-sm">{formatEnumValue(position)}</span>
              </label>
            ))}
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Leave all unchecked to make visible to all positions
          </p>
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="mr-2 h-4 w-4"
            />
            <span>Active</span>
          </label>
          <p className="text-muted-foreground mt-1 ml-6 text-xs">
            Only active leaderboards are visible to users
          </p>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-md px-4 py-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center">
              <span className="border-primary-foreground mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></span>
              Saving...
            </span>
          ) : (
            `${leaderboard ? 'Update' : 'Create'} Leaderboard`
          )}
        </button>
      </div>
    </form>
  );
}
