'use client';

import { ResourceType } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface Track {
  id: string;
  name: string;
  isActive: boolean;
  steps: Step[];
}

interface Step {
  id: string;
  title: string;
  description: string;
  instructions: string | null;
  order: number;
  estimatedDuration: number | null;
  isRequired: boolean;
  resources: Resource[];
}

interface Resource {
  id: string;
  title: string;
  description: string | null;
  type: ResourceType;
}

interface AdminStepsTabProps {
  tracks: Track[];
  resources: Resource[];
}

export default function AdminStepsTab({ tracks, resources }: AdminStepsTabProps) {
  const router = useRouter();
  const [selectedTrackId, setSelectedTrackId] = useState<string>('');
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState<Step | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    order: 1,
    estimatedDuration: 30,
    isRequired: true,
    resourceIds: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle track selection change
  useEffect(() => {
    if (selectedTrackId) {
      const track = tracks.find((t) => t.id === selectedTrackId);
      setCurrentTrack(track || null);
    } else {
      setCurrentTrack(null);
    }
  }, [selectedTrackId, tracks]);

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
    } else if (type === 'number') {
      setFormData({
        ...formData,
        [name]: parseInt(value, 10) || 0,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Handle resource selection
  const handleResourceToggle = (resourceId: string) => {
    setFormData((prev) => {
      const updatedResourceIds = [...prev.resourceIds];

      if (updatedResourceIds.includes(resourceId)) {
        return {
          ...prev,
          resourceIds: updatedResourceIds.filter((id) => id !== resourceId),
        };
      } else {
        return {
          ...prev,
          resourceIds: [...updatedResourceIds, resourceId],
        };
      }
    });
  };

  // Open modal for new step
  const handleNewStep = () => {
    if (!selectedTrackId) {
      setError('Please select a track first');
      return;
    }

    // Calculate next order value with proper null checking
    const nextOrder = (() => {
      if (!currentTrack || !currentTrack.steps || currentTrack.steps.length === 0) {
        return 1; // Default to 1 for first step
      }
      // Only calculate max if we have steps
      return Math.max(...currentTrack.steps.map((s) => s.order)) + 1;
    })();

    setSelectedStep(null);
    setFormData({
      title: '',
      description: '',
      instructions: '',
      order: nextOrder,
      estimatedDuration: 30,
      isRequired: true,
      resourceIds: [],
    });
    setIsModalOpen(true);
    setError('');
  };

  // Open modal to edit step
  const handleEditStep = (step: Step) => {
    setSelectedStep(step);
    setFormData({
      title: step.title,
      description: step.description,
      instructions: step.instructions || '',
      order: step.order,
      estimatedDuration: step.estimatedDuration || 30,
      isRequired: step.isRequired,
      resourceIds: step.resources.map((r) => r.id),
    });
    setIsModalOpen(true);
    setError('');
  };

  // Submit form to create/update step
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = selectedStep
        ? `/api/onboarding/steps/${selectedStep.id}`
        : '/api/onboarding/steps';

      const method = selectedStep ? 'PUT' : 'POST';
      const payload = {
        ...formData,
        trackId: selectedTrackId,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save step');
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

  // Delete a step
  const handleDeleteStep = async (stepId: string) => {
    if (!confirm('Are you sure you want to delete this step? This cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/onboarding/steps/${stepId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete step');
      }

      // Refresh the page to show updated data
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Move step position (reorder)
  const handleMoveStep = async (stepId: string, direction: 'up' | 'down') => {
    if (!currentTrack || !currentTrack.steps) return;

    const stepIndex = currentTrack.steps.findIndex((s) => s.id === stepId);
    if (stepIndex === -1) return;

    // Cannot move up if already at top
    if (direction === 'up' && stepIndex === 0) return;

    // Cannot move down if already at bottom
    if (direction === 'down' && stepIndex === currentTrack.steps.length - 1) return;

    const targetIndex = direction === 'up' ? stepIndex - 1 : stepIndex + 1;
    const currentStep = currentTrack.steps[stepIndex];
    const targetStep = currentTrack.steps[targetIndex];

    // Swap order values
    const tempOrder = currentStep.order;

    setLoading(true);
    setError('');

    try {
      // Update current step order
      const response1 = await fetch(`/api/onboarding/steps/${currentStep.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order: targetStep.order }),
      });

      // Update target step order
      const response2 = await fetch(`/api/onboarding/steps/${targetStep.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order: tempOrder }),
      });

      if (!response1.ok || !response2.ok) {
        throw new Error('Failed to reorder steps');
      }

      // Refresh the page to show updated data
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Get resource type icon
  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case 'VIDEO':
        return '🎬';
      case 'PDF':
        return '📄';
      case 'DOCUMENT':
        return '📝';
      case 'PRESENTATION':
        return '📊';
      case 'SPREADSHEET':
        return '📈';
      case 'IMAGE':
        return '🖼️';
      case 'AUDIO':
        return '🔊';
      case 'LINK':
      default:
        return '🔗';
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Onboarding Steps</h2>
          <p className="text-muted-foreground text-sm">Manage steps within each onboarding track</p>
        </div>
        <button
          onClick={handleNewStep}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 disabled:opacity-50"
          disabled={!selectedTrackId}
        >
          Create New Step
        </button>
      </div>

      {/* Track selector */}
      <div className="mb-6">
        <label htmlFor="trackSelector" className="mb-1 block text-sm font-medium">
          Select Track
        </label>
        <select
          id="trackSelector"
          value={selectedTrackId}
          onChange={(e) => setSelectedTrackId(e.target.value)}
          className="border-input bg-background w-full rounded-md border p-2 md:w-1/2"
        >
          <option value="">-- Select a Track --</option>
          {tracks.map((track) => (
            <option key={track.id} value={track.id}>
              {track.name} {!track.isActive && '(Inactive)'}
            </option>
          ))}
        </select>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 text-destructive mb-6 rounded-md p-3">{error}</div>
      )}

      {/* No track selected message */}
      {!selectedTrackId && (
        <div className="bg-card rounded-lg border p-12 text-center">
          <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl">
            🔍
          </div>
          <h3 className="mb-2 text-lg font-medium">No Track Selected</h3>
          <p className="text-muted-foreground">
            Please select a track to view and manage its steps
          </p>
        </div>
      )}

      {/* Track selected but no steps */}
      {selectedTrackId && currentTrack && currentTrack.steps.length === 0 && (
        <div className="bg-card rounded-lg border p-12 text-center">
          <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl">
            📋
          </div>
          <h3 className="mb-2 text-lg font-medium">No Steps Created</h3>
          <p className="text-muted-foreground mb-6">
            This track doesn&apos;t have any steps yet. Get started by creating your first step.
          </p>
          <button
            onClick={handleNewStep}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2"
          >
            Create First Step
          </button>
        </div>
      )}

      {/* Steps list */}
      {selectedTrackId && currentTrack && currentTrack.steps.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-4 border-b p-2 text-sm font-medium">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Step</div>
            <div className="col-span-3">Resources</div>
            <div className="col-span-2">Duration</div>
            <div className="col-span-2">Actions</div>
          </div>

          {[...currentTrack.steps]
            .sort((a, b) => a.order - b.order)
            .map((step) => (
              <div
                key={step.id}
                className="bg-card grid grid-cols-12 items-center gap-4 rounded-lg border p-4"
              >
                <div className="col-span-1 text-lg font-medium">{step.order}</div>
                <div className="col-span-4">
                  <h3 className="font-medium">{step.title}</h3>
                  <p className="text-muted-foreground line-clamp-2 text-sm">{step.description}</p>
                  {!step.isRequired && (
                    <span className="bg-secondary mt-1 inline-block rounded-full px-2 py-1 text-xs">
                      Optional
                    </span>
                  )}
                </div>
                <div className="col-span-3">
                  {step.resources.length > 0 ? (
                    <div className="max-h-16 space-y-1 overflow-y-auto">
                      {step.resources.map((resource) => (
                        <div key={resource.id} className="flex items-center text-xs">
                          <span className="mr-1">{getResourceIcon(resource.type)}</span>
                          <span className="truncate">{resource.title}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">No resources</span>
                  )}
                </div>
                <div className="col-span-2">
                  {step.estimatedDuration ? (
                    <span>{step.estimatedDuration} min</span>
                  ) : (
                    <span className="text-muted-foreground">Not specified</span>
                  )}
                </div>
                <div className="col-span-2 flex space-x-1">
                  <button
                    onClick={() => handleMoveStep(step.id, 'up')}
                    className="bg-muted hover:bg-muted/80 rounded-md p-2 text-sm"
                    disabled={step.order === 1}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => handleMoveStep(step.id, 'down')}
                    className="bg-muted hover:bg-muted/80 rounded-md p-2 text-sm"
                    disabled={step.order === Math.max(...currentTrack.steps.map((s) => s.order))}
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => handleEditStep(step)}
                    className="bg-secondary hover:bg-secondary/80 rounded-md p-2 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteStep(step.id)}
                    className="bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-md p-2 text-sm"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Step form modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card text-card-foreground max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg shadow-lg">
            <div className="border-b p-6">
              <h2 className="text-xl font-semibold">
                {selectedStep ? 'Edit Step' : 'Create New Step'}
              </h2>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4 p-6">
                {error && (
                  <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="col-span-1 md:col-span-2">
                    <label htmlFor="title" className="mb-1 block text-sm font-medium">
                      Step Title
                    </label>
                    <input
                      id="title"
                      name="title"
                      type="text"
                      value={formData.title}
                      onChange={handleChange}
                      className="border-input bg-background w-full rounded-md border p-2"
                      placeholder="e.g., Complete Product Training"
                      required
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label htmlFor="description" className="mb-1 block text-sm font-medium">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className="border-input bg-background w-full rounded-md border p-2"
                      placeholder="Brief description of what this step involves..."
                      rows={2}
                      required
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label htmlFor="instructions" className="mb-1 block text-sm font-medium">
                      Instructions
                    </label>
                    <textarea
                      id="instructions"
                      name="instructions"
                      value={formData.instructions}
                      onChange={handleChange}
                      className="border-input bg-background w-full rounded-md border p-2"
                      placeholder="Detailed instructions for completing this step..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <label htmlFor="order" className="mb-1 block text-sm font-medium">
                      Order
                    </label>
                    <input
                      id="order"
                      name="order"
                      type="number"
                      min={1}
                      value={formData.order}
                      onChange={handleChange}
                      className="border-input bg-background w-full rounded-md border p-2"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="estimatedDuration" className="mb-1 block text-sm font-medium">
                      Estimated Duration (minutes)
                    </label>
                    <input
                      id="estimatedDuration"
                      name="estimatedDuration"
                      type="number"
                      min={0}
                      value={formData.estimatedDuration}
                      onChange={handleChange}
                      className="border-input bg-background w-full rounded-md border p-2"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="isRequired"
                        checked={formData.isRequired}
                        onChange={handleChange}
                        className="mr-2 h-4 w-4"
                      />
                      <span>Required Step</span>
                    </label>
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="mb-2 block text-sm font-medium">Resources</label>
                    {resources.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        No resources available. Create resources in the Resources tab.
                      </p>
                    ) : (
                      <div className="max-h-48 overflow-y-auto rounded-md border p-2">
                        {resources.map((resource) => (
                          <label
                            key={resource.id}
                            className="hover:bg-muted/30 flex items-center rounded p-2"
                          >
                            <input
                              type="checkbox"
                              checked={formData.resourceIds.includes(resource.id)}
                              onChange={() => handleResourceToggle(resource.id)}
                              className="mr-2 h-4 w-4"
                            />
                            <div>
                              <div className="flex items-center">
                                <span className="mr-2">{getResourceIcon(resource.type)}</span>
                                <span className="font-medium">{resource.title}</span>
                              </div>
                              {resource.description && (
                                <p className="text-muted-foreground ml-6 text-xs">
                                  {resource.description}
                                </p>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
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
                    'Save Step'
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
