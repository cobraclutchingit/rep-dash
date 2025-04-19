"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  TrainingCategory,
  UserRole,
  SalesPosition,
} from "@prisma/client";

interface NewModuleFormProps {
  allModules: {
    id: string;
    title: string;
    category: TrainingCategory;
  }[];
  nextOrder: number;
}

export default function NewModuleForm({ allModules, nextOrder }: NewModuleFormProps) {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "ONBOARDING" as TrainingCategory,
    isRequired: false,
    isPublished: false,
    visibleToRoles: [UserRole.USER, UserRole.ADMIN],
    visibleToPositions: Object.values(SalesPosition),
    estimatedDuration: 30,
    prerequisites: [] as string[],
    order: nextOrder,
  });
  
  const [activeTab, setActiveTab] = useState("details");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === "number" ? parseInt(value, 10) : value,
    }));
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: checked,
    }));
  };
  
  const handleMultiSelectChange = (name: string, value: string) => {
    setFormData(prev => {
      const currentValues = prev[name as keyof typeof prev] as string[];
      
      if (Array.isArray(currentValues)) {
        if (currentValues.includes(value)) {
          return {
            ...prev,
            [name]: currentValues.filter(item => item !== value),
          };
        } else {
          return {
            ...prev,
            [name]: [...currentValues, value],
          };
        }
      }
      
      return prev;
    });
  };
  
  const handlePrerequisiteChange = (id: string, isChecked: boolean) => {
    setFormData(prev => {
      if (isChecked) {
        return {
          ...prev,
          prerequisites: [...prev.prerequisites, id],
        };
      } else {
        return {
          ...prev,
          prerequisites: prev.prerequisites.filter(preId => preId !== id),
        };
      }
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    
    try {
      // Create new module
      const response = await fetch("/api/training/modules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create module");
      }
      
      const data = await response.json();
      
      // Redirect to edit page for the new module
      router.push(`/training/admin/modules/${data.id}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create module");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-card text-card-foreground rounded-lg shadow">
      <div className="border-b">
        <div className="flex overflow-x-auto">
          <button
            onClick={() => setActiveTab("details")}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === "details" 
                ? "border-b-2 border-primary" 
                : "text-muted-foreground"
            }`}
          >
            Module Details
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === "settings" 
                ? "border-b-2 border-primary" 
                : "text-muted-foreground"
            }`}
          >
            Module Settings
          </button>
          <button
            onClick={() => setActiveTab("prerequisites")}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === "prerequisites" 
                ? "border-b-2 border-primary" 
                : "text-muted-foreground"
            }`}
          >
            Prerequisites
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="p-6">
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-4 mb-6">
              {error}
            </div>
          )}
          
          {activeTab === "details" && (
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-2">
                  Module Title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full p-2 rounded-md border border-input bg-background"
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  required
                  className="w-full p-2 rounded-md border border-input bg-background"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium mb-2">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full p-2 rounded-md border border-input bg-background"
                  >
                    {Object.values(TrainingCategory).map((category) => (
                      <option key={category} value={category}>
                        {category.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="estimatedDuration" className="block text-sm font-medium mb-2">
                    Estimated Duration (minutes)
                  </label>
                  <input
                    id="estimatedDuration"
                    name="estimatedDuration"
                    type="number"
                    min="0"
                    value={formData.estimatedDuration}
                    onChange={handleChange}
                    className="w-full p-2 rounded-md border border-input bg-background"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="order" className="block text-sm font-medium mb-2">
                    Display Order
                  </label>
                  <input
                    id="order"
                    name="order"
                    type="number"
                    min="0"
                    value={formData.order}
                    onChange={handleChange}
                    className="w-full p-2 rounded-md border border-input bg-background"
                  />
                </div>
                
                <div className="flex items-end space-x-6">
                  <div className="flex items-center">
                    <input
                      id="isRequired"
                      name="isRequired"
                      type="checkbox"
                      checked={formData.isRequired}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 mr-2"
                    />
                    <label htmlFor="isRequired" className="text-sm font-medium">
                      Required Module
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="isPublished"
                      name="isPublished"
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 mr-2"
                    />
                    <label htmlFor="isPublished" className="text-sm font-medium">
                      Published
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/30 p-4 rounded-md text-sm">
                <p className="font-medium mb-2">Important Note</p>
                <p>
                  After creating this module, you'll be able to add content sections,
                  quizzes, and resources in the module editor.
                </p>
              </div>
            </div>
          )}
          
          {activeTab === "settings" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Visibility Settings</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Visible to User Roles
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {Object.values(UserRole).map((role) => (
                      <label key={role} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.visibleToRoles.includes(role)}
                          onChange={() => handleMultiSelectChange("visibleToRoles", role)}
                          className="h-4 w-4 mr-2"
                        />
                        <span>{role}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Visible to Sales Positions
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {Object.values(SalesPosition).map((position) => (
                      <label key={position} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.visibleToPositions.includes(position)}
                          onChange={() => handleMultiSelectChange("visibleToPositions", position)}
                          className="h-4 w-4 mr-2"
                        />
                        <span>{position.replace(/_/g, " ")}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === "prerequisites" && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Module Prerequisites</h3>
              
              {allModules.length === 0 ? (
                <p className="text-muted-foreground">
                  No other modules available to set as prerequisites.
                </p>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Select modules that must be completed before users can access this module:
                  </p>
                  
                  <div className="max-h-96 overflow-y-auto border rounded-md">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="px-4 py-2 text-left text-sm font-semibold">Select</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold">Module Title</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold">Category</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-muted/50">
                        {allModules.map((mod) => (
                          <tr key={mod.id} className="hover:bg-muted/40">
                            <td className="px-4 py-2 text-sm">
                              <input
                                type="checkbox"
                                checked={formData.prerequisites.includes(mod.id)}
                                onChange={(e) => handlePrerequisiteChange(mod.id, e.target.checked)}
                                className="h-4 w-4"
                              />
                            </td>
                            <td className="px-4 py-2 text-sm">{mod.title}</td>
                            <td className="px-4 py-2 text-sm">
                              {mod.category.replace(/_/g, " ")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="p-6 border-t bg-muted/50 flex justify-between">
          <button
            type="button"
            onClick={() => router.push("/training/admin")}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Module"}
          </button>
        </div>
      </form>
    </div>
  );
}