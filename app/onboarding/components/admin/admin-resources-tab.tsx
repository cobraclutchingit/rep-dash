'use client';

import { ResourceType } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Resource {
  id: string;
  title: string;
  description: string | null;
  type: ResourceType;
  url: string;
  isExternal: boolean;
}

interface AdminResourcesTabProps {
  resources: Resource[];
}

export default function AdminResourcesTab({ resources }: AdminResourcesTabProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'LINK' as ResourceType,
    url: '',
    isExternal: true,
  });
  const [searchTerm, setSearchTerm] = useState('');
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

  // Open modal for new resource
  const handleNewResource = () => {
    setSelectedResource(null);
    setFormData({
      title: '',
      description: '',
      type: 'LINK',
      url: '',
      isExternal: true,
    });
    setIsModalOpen(true);
    setError('');
  };

  // Open modal to edit resource
  const handleEditResource = (resource: Resource) => {
    setSelectedResource(resource);
    setFormData({
      title: resource.title,
      description: resource.description || '',
      type: resource.type,
      url: resource.url,
      isExternal: resource.isExternal,
    });
    setIsModalOpen(true);
    setError('');
  };

  // Submit form to create/update resource
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate URL format
      new URL(formData.url);

      const url = selectedResource
        ? `/api/onboarding/resources/${selectedResource.id}`
        : '/api/onboarding/resources';

      const method = selectedResource ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save resource');
      }

      // Refresh the page to show updated data
      router.refresh();
      setIsModalOpen(false);
    } catch {
      setError('Please enter a valid URL (including http:// or https://)');
    } finally {
      setLoading(false);
    }
  };

  // Delete a resource
  const handleDeleteResource = async (resourceId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this resource? This will remove it from all steps that use it.'
      )
    ) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/onboarding/resources/${resourceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete resource');
      }

      // Refresh the page to show updated data
      router.refresh();
    } catch {
      setError('An unknown error occurred');
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

  // Get resource type display name
  const getResourceTypeName = (type: ResourceType) => {
    return type.charAt(0) + type.slice(1).toLowerCase().replace(/_/g, ' ');
  };

  // Filter resources based on search term
  const filteredResources = resources.filter((resource) => {
    if (!searchTerm) return true;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return (
      resource.title.toLowerCase().includes(lowerSearchTerm) ||
      (resource.description && resource.description.toLowerCase().includes(lowerSearchTerm)) ||
      resource.type.toLowerCase().includes(lowerSearchTerm)
    );
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Onboarding Resources</h2>
          <p className="text-muted-foreground text-sm">Manage resources used in onboarding steps</p>
        </div>
        <button
          onClick={handleNewResource}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2"
        >
          Add New Resource
        </button>
      </div>

      {/* Search and filter */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-input bg-background w-full rounded-md border p-3 pl-10"
          />
          <span className="text-muted-foreground absolute top-3 left-3">🔍</span>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 text-destructive mb-6 rounded-md p-3">{error}</div>
      )}

      {/* No resources message */}
      {resources.length === 0 && (
        <div className="bg-card rounded-lg border p-12 text-center">
          <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl">
            📚
          </div>
          <h3 className="mb-2 text-lg font-medium">No Resources Added</h3>
          <p className="text-muted-foreground mb-6">
            Add resources like videos, PDFs, and links to use in your onboarding steps
          </p>
          <button
            onClick={handleNewResource}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2"
          >
            Add First Resource
          </button>
        </div>
      )}

      {/* Resources exist but none match search */}
      {resources.length > 0 && filteredResources.length === 0 && (
        <div className="bg-card rounded-lg border p-8 text-center">
          <h3 className="mb-2 text-lg font-medium">No Matching Resources</h3>
          <p className="text-muted-foreground">
            No resources match your search. Try different keywords or{' '}
            <button onClick={() => setSearchTerm('')} className="text-primary hover:underline">
              clear the search
            </button>
            .
          </p>
        </div>
      )}

      {/* Resources list */}
      {filteredResources.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredResources.map((resource) => (
            <div key={resource.id} className="bg-card overflow-hidden rounded-lg border">
              <div className="p-5">
                <div className="mb-3 flex items-start">
                  <div className="bg-primary/10 text-primary mr-3 flex h-10 w-10 items-center justify-center rounded-full text-xl">
                    {getResourceIcon(resource.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{resource.title}</h3>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="bg-secondary rounded-full px-2 py-1 text-xs">
                        {getResourceTypeName(resource.type)}
                      </span>
                      {resource.isExternal && (
                        <span className="rounded-full bg-blue-500/10 px-2 py-1 text-xs text-blue-500">
                          External
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {resource.description && (
                  <p className="text-muted-foreground mb-3 text-sm">{resource.description}</p>
                )}

                <div className="text-muted-foreground flex items-center text-sm">
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary truncate hover:underline"
                  >
                    {resource.url}
                  </a>
                </div>
              </div>

              <div className="bg-muted/30 flex justify-end space-x-2 p-3">
                <button
                  onClick={() => handleEditResource(resource)}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-md px-3 py-1.5 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteResource(resource.id)}
                  className="bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-md px-3 py-1.5 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resource form modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card text-card-foreground w-full max-w-md rounded-lg shadow-lg">
            <div className="border-b p-6">
              <h2 className="text-xl font-semibold">
                {selectedResource ? 'Edit Resource' : 'Add New Resource'}
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
                  <label htmlFor="title" className="mb-1 block text-sm font-medium">
                    Resource Title
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleChange}
                    className="border-input bg-background w-full rounded-md border p-2"
                    placeholder="e.g., Product Introduction Video"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="mb-1 block text-sm font-medium">
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="border-input bg-background w-full rounded-md border p-2"
                    placeholder="A brief description of the resource..."
                    rows={2}
                  />
                </div>

                <div>
                  <label htmlFor="type" className="mb-1 block text-sm font-medium">
                    Resource Type
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="border-input bg-background w-full rounded-md border p-2"
                    required
                  >
                    {Object.values(ResourceType).map((type) => (
                      <option key={type} value={type}>
                        {getResourceIcon(type as ResourceType)}{' '}
                        {getResourceTypeName(type as ResourceType)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="url" className="mb-1 block text-sm font-medium">
                    Resource URL
                  </label>
                  <input
                    id="url"
                    name="url"
                    type="text"
                    value={formData.url}
                    onChange={handleChange}
                    className="border-input bg-background w-full rounded-md border p-2"
                    placeholder="https://..."
                    required
                  />
                  <p className="text-muted-foreground mt-1 text-xs">
                    Enter the full URL including http:// or https://
                  </p>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isExternal"
                      checked={formData.isExternal}
                      onChange={handleChange}
                      className="mr-2 h-4 w-4"
                    />
                    <span>External Resource</span>
                  </label>
                  <p className="text-muted-foreground mt-1 ml-6 text-xs">
                    Check if this resource is hosted on an external website
                  </p>
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
                    'Save Resource'
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
