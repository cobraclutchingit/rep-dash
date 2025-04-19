"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ResourceType } from "@prisma/client";

interface AdminResourcesTabProps {
  resources: any[];
}

export default function AdminResourcesTab({ resources }: AdminResourcesTabProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "LINK" as ResourceType,
    url: "",
    isExternal: true,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
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
      title: "",
      description: "",
      type: "LINK",
      url: "",
      isExternal: true,
    });
    setIsModalOpen(true);
    setError("");
  };

  // Open modal to edit resource
  const handleEditResource = (resource: any) => {
    setSelectedResource(resource);
    setFormData({
      title: resource.title,
      description: resource.description || "",
      type: resource.type,
      url: resource.url,
      isExternal: resource.isExternal,
    });
    setIsModalOpen(true);
    setError("");
  };

  // Submit form to create/update resource
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate URL format
      try {
        new URL(formData.url);
      } catch (err) {
        throw new Error("Please enter a valid URL (including http:// or https://)");
      }

      const url = selectedResource
        ? `/api/onboarding/resources/${selectedResource.id}`
        : "/api/onboarding/resources";

      const method = selectedResource ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save resource");
      }

      // Refresh the page to show updated data
      router.refresh();
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Delete a resource
  const handleDeleteResource = async (resourceId: string) => {
    if (!confirm("Are you sure you want to delete this resource? This will remove it from all steps that use it.")) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/onboarding/resources/${resourceId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete resource");
      }

      // Refresh the page to show updated data
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Get resource type icon
  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case "VIDEO":
        return "🎬";
      case "PDF":
        return "📄";
      case "DOCUMENT":
        return "📝";
      case "PRESENTATION":
        return "📊";
      case "SPREADSHEET":
        return "📈";
      case "IMAGE":
        return "🖼️";
      case "AUDIO":
        return "🔊";
      case "LINK":
      default:
        return "🔗";
    }
  };

  // Get resource type display name
  const getResourceTypeName = (type: ResourceType) => {
    return type.charAt(0) + type.slice(1).toLowerCase().replace(/_/g, " ");
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Onboarding Resources</h2>
          <p className="text-sm text-muted-foreground">
            Manage resources used in onboarding steps
          </p>
        </div>
        <button
          onClick={handleNewResource}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
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
            className="w-full p-3 pl-10 rounded-md border border-input bg-background"
          />
          <span className="absolute left-3 top-3 text-muted-foreground">🔍</span>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* No resources message */}
      {resources.length === 0 && (
        <div className="text-center p-12 bg-card rounded-lg border">
          <div className="h-16 w-16 mx-auto bg-muted rounded-full flex items-center justify-center text-2xl mb-4">
            📚
          </div>
          <h3 className="text-lg font-medium mb-2">No Resources Added</h3>
          <p className="text-muted-foreground mb-6">
            Add resources like videos, PDFs, and links to use in your onboarding steps
          </p>
          <button
            onClick={handleNewResource}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Add First Resource
          </button>
        </div>
      )}

      {/* Resources exist but none match search */}
      {resources.length > 0 && filteredResources.length === 0 && (
        <div className="text-center p-8 bg-card rounded-lg border">
          <h3 className="text-lg font-medium mb-2">No Matching Resources</h3>
          <p className="text-muted-foreground">
            No resources match your search. Try different keywords or{" "}
            <button
              onClick={() => setSearchTerm("")}
              className="text-primary hover:underline"
            >
              clear the search
            </button>
            .
          </p>
        </div>
      )}

      {/* Resources list */}
      {filteredResources.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredResources.map((resource) => (
            <div
              key={resource.id}
              className="bg-card rounded-lg border overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start mb-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl mr-3">
                    {getResourceIcon(resource.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{resource.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-1 bg-secondary rounded-full">
                        {getResourceTypeName(resource.type)}
                      </span>
                      {resource.isExternal && (
                        <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-500 rounded-full">
                          External
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {resource.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {resource.description}
                  </p>
                )}

                <div className="flex items-center text-sm text-muted-foreground">
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate hover:text-primary hover:underline"
                  >
                    {resource.url}
                  </a>
                </div>
              </div>

              <div className="bg-muted/30 p-3 flex justify-end space-x-2">
                <button
                  onClick={() => handleEditResource(resource)}
                  className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-sm hover:bg-secondary/90"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteResource(resource.id)}
                  className="px-3 py-1.5 bg-destructive/10 text-destructive rounded-md text-sm hover:bg-destructive/20"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card text-card-foreground rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                {selectedResource ? "Edit Resource" : "Add New Resource"}
              </h2>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                {error && (
                  <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-1">
                    Resource Title
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full p-2 rounded-md border border-input bg-background"
                    placeholder="e.g., Product Introduction Video"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full p-2 rounded-md border border-input bg-background"
                    placeholder="A brief description of the resource..."
                    rows={2}
                  />
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium mb-1">
                    Resource Type
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full p-2 rounded-md border border-input bg-background"
                    required
                  >
                    {Object.values(ResourceType).map((type) => (
                      <option key={type} value={type}>
                        {getResourceIcon(type as ResourceType)} {getResourceTypeName(type as ResourceType)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="url" className="block text-sm font-medium mb-1">
                    Resource URL
                  </label>
                  <input
                    id="url"
                    name="url"
                    type="text"
                    value={formData.url}
                    onChange={handleChange}
                    className="w-full p-2 rounded-md border border-input bg-background"
                    placeholder="https://..."
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
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
                  <p className="text-xs text-muted-foreground mt-1 ml-6">
                    Check if this resource is hosted on an external website
                  </p>
                </div>
              </div>

              <div className="p-6 border-t bg-muted/30 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <span className="mr-1 h-4 w-4 border-2 border-primary-foreground border-r-transparent animate-spin rounded-full"></span>
                      Saving...
                    </span>
                  ) : (
                    "Save Resource"
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