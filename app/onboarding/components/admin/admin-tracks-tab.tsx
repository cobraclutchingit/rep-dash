"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SalesPosition } from "@prisma/client";

interface AdminTracksTabProps {
  tracks: any[];
}

export default function AdminTracksTab({ tracks }: AdminTracksTabProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    forPositions: [] as SalesPosition[],
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
  
  // Handle position toggle
  const handlePositionToggle = (position: SalesPosition) => {
    setFormData(prev => {
      const updatedPositions = [...prev.forPositions];
      
      if (updatedPositions.includes(position)) {
        return {
          ...prev,
          forPositions: updatedPositions.filter(p => p !== position),
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
      name: "",
      description: "",
      forPositions: [],
      isActive: true,
    });
    setIsModalOpen(true);
  };
  
  // Open modal to edit track
  const handleEditTrack = (track: any) => {
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
    setError("");
    
    try {
      const url = selectedTrack 
        ? `/api/onboarding/tracks/${selectedTrack.id}` 
        : "/api/onboarding/tracks";
      
      const method = selectedTrack ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to save track");
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
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Onboarding Tracks</h2>
          <p className="text-sm text-muted-foreground">
            Manage the different onboarding paths for different positions
          </p>
        </div>
        <button
          onClick={handleNewTrack}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Create New Track
        </button>
      </div>
      
      {tracks.length === 0 ? (
        <div className="text-center p-12 bg-card rounded-lg border">
          <div className="h-16 w-16 mx-auto bg-muted rounded-full flex items-center justify-center text-2xl mb-4">
            🔎
          </div>
          <h3 className="text-lg font-medium mb-2">No Onboarding Tracks</h3>
          <p className="text-muted-foreground mb-6">
            Get started by creating your first onboarding track
          </p>
          <button
            onClick={handleNewTrack}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Create Track
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tracks.map((track) => (
            <div 
              key={track.id} 
              className="bg-card rounded-lg border overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold">{track.name}</h3>
                  <div className={`px-2 py-1 rounded-full text-xs ${
                    track.isActive 
                      ? "bg-green-500/10 text-green-500" 
                      : "bg-amber-500/10 text-amber-500"
                  }`}>
                    {track.isActive ? "Active" : "Inactive"}
                  </div>
                </div>
                
                <p className="text-muted-foreground mt-1 mb-4">
                  {track.description}
                </p>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {track.forPositions.map((position: string) => (
                    <span 
                      key={position} 
                      className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs"
                    >
                      {position.replace(/_/g, " ")}
                    </span>
                  ))}
                  
                  {track.forPositions.length === 0 && (
                    <span className="text-xs text-muted-foreground">
                      No specific positions assigned
                    </span>
                  )}
                </div>
                
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>{track._count.steps} Steps</span>
                  <span>Updated {new Date(track.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="bg-muted/30 p-4 flex justify-end space-x-2">
                <button
                  onClick={() => handleEditTrack(track)}
                  className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-sm hover:bg-secondary/90"
                >
                  Edit
                </button>
                
                <button
                  onClick={() => {
                    // View steps for this track
                  }}
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card text-card-foreground rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                {selectedTrack ? "Edit Track" : "Create New Track"}
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
                  <label htmlFor="name" className="block text-sm font-medium mb-1">
                    Track Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-2 rounded-md border border-input bg-background"
                    placeholder="e.g., New Sales Rep Onboarding"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full p-2 rounded-md border border-input bg-background"
                    placeholder="What this onboarding track is for..."
                    rows={3}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    For Positions
                  </label>
                  <div className="space-y-2">
                    {Object.values(SalesPosition).map((position) => (
                      <label key={position} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.forPositions.includes(position)}
                          onChange={() => handlePositionToggle(position as SalesPosition)}
                          className="mr-2 h-4 w-4"
                        />
                        <span>{position.replace(/_/g, " ")}</span>
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
                    "Save Track"
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