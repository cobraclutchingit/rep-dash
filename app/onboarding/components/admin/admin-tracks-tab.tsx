'use client';

import { SalesPosition } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Track {
  id: string;
  name: string;
  description: string;
  forPositions: SalesPosition[];
  isActive: boolean;
  updatedAt: string;
  _count: {
    steps: number;
  };
}

interface AdminTracksTabProps {
  tracks: Track[];
}

export default function AdminTracksTab({ tracks }: AdminTracksTabProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    forPositions: [] as SalesPosition[],
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle form input changes
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

  // Open modal for new track
  const handleNewTrack = () => {
    setSelectedTrack(null);
    setFormData({
      name: '',
      description: '',
      forPositions: [],
      isActive: true,
    });
    setIsModalOpen(true);
  };

  // Open modal to edit track
  const handleEditTrack = (track: Track) => {
    setSelectedTrack(track);
    setFormData({
      name: track.name,
      description: track.description,
      forPositions: track.forPositions,
      isActive: track.isActive,
    });
    setIsModalOpen(true);
  };

  // Submit form to create/update track
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = selectedTrack
        ? `/api/onboarding/tracks/${selectedTrack.id}`
        : '/api/onboarding/tracks';

      const method = selectedTrack ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save track');
      }

      // Refresh the page to show updated data
      router.refresh();
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Onboarding Tracks</h2>
          <p className="text-muted-foreground text-sm">
            Manage the different onboarding paths for different positions
          </p>
        </div>
        <button
          onClick={handleNewTrack}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2"
        >
          Create New Track
        </button>
      </div>

      {tracks.length === 0 ? (
        <div className="bg-card rounded-lg border p-12 text-center">
          <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl">
            🔎
          </div>
          <h3 className="mb-2 text-lg font-medium">No Onboarding Tracks</h3>
          <p className="text-muted-foreground mb-6">
            Get started by creating your first onboarding track
          </p>
          <button
            onClick={handleNewTrack}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2"
          >
            Create Track
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {tracks.map((track) => (
            <div key={track.id} className="bg-card overflow-hidden rounded-lg border">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold">{track.name}</h3>
                  <div
                    className={`rounded-full px-2 py-1 text-xs ${
                      track.isActive
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-amber-500/10 text-amber-500'
                    }`}
                  >
                    {track.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>

                <p className="text-muted-foreground mt-1 mb-4">{track.description}</p>

                <div className="mb-4 flex flex-wrap gap-1">
                  {track.forPositions.map((position) => (
                    <span
                      key={position}
                      className="bg-secondary text-secondary-foreground rounded-full px-2 py-1 text-xs"
                    >
                      {position.replace(/_/g, ' ')}
                    </span>
                  ))}

                  {track.forPositions.length === 0 && (
                    <span className="text-muted-foreground text-xs">
                      No specific positions assigned
                    </span>
                  )}
                </div>

                <div className="text-muted-foreground flex items-center justify-between text-sm">
                  <span>{track._count.steps} Steps</span>
                  <span>Updated {new Date(track.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="bg-muted/30 flex justify-end space-x-2 p-4">
                <button
                  onClick={() => handleEditTrack(track)}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-md px-3 py-1.5 text-sm"
                >
                  Edit
                </button>

                <button
                  onClick={() => {
                    // View steps for this track
                  }}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-1.5 text-sm"
                >
                  Manage Steps
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Track form modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card text-card-foreground w-full max-w-md rounded-lg shadow-lg">
            <div className="border-b p-6">
              <h2 className="text-xl font-semibold">
                {selectedTrack ? 'Edit Track' : 'Create New Track'}
              </h2>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4 p-6">
                {error && (
                  <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="name" className="mb-1 block text-sm font-medium">
                    Track Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className="border-input bg-background w-full rounded-md border p-2"
                    placeholder="e.g., New Sales Rep Onboarding"
                    required
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
                    className="border-input bg-background w-full rounded-md border p-2"
                    placeholder="What this onboarding track is for..."
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">For Positions</label>
                  <div className="space-y-2">
                    {Object.values(SalesPosition).map((position) => (
                      <label key={position} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.forPositions.includes(position)}
                          onChange={() => handlePositionToggle(position as SalesPosition)}
                          className="mr-2 h-4 w-4"
                        />
                        <span>{position.replace(/_/g, ' ')}</span>
                      </label>
                    ))}
                  </div>
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
                </div>
              </div>

              <div className="bg-muted/30 flex justify-end space-x-2 border-t p-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                      <span className="border-primary-foreground mr-1 h-4 w-4 animate-spin rounded-full border-2 border-r-transparent"></span>
                      Saving...
                    </span>
                  ) : (
                    'Save Track'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
