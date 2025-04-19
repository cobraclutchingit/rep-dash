"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  TrainingModule, 
  TrainingSection,
  TrainingCategory,
  UserRole,
  SalesPosition,
  ContentFormat
} from "@prisma/client";

interface ModuleEditFormProps {
  module: TrainingModule & {
    sections: (TrainingSection & {
      resources: any[];
      quizQuestions: any[];
    })[];
    prerequisites: any[];
  };
  allModules: {
    id: string;
    title: string;
    category: TrainingCategory;
  }[];
}

export default function ModuleEditForm({ module, allModules }: ModuleEditFormProps) {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    title: module.title,
    description: module.description,
    category: module.category,
    isRequired: module.isRequired,
    isPublished: module.isPublished,
    visibleToRoles: module.visibleToRoles,
    visibleToPositions: module.visibleToPositions,
    estimatedDuration: module.estimatedDuration || 0,
    prerequisites: module.prerequisites.map(p => p.prerequisiteId),
    order: module.order,
  });
  
  const [sections, setSections] = useState(module.sections);
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
  
  const handleSectionChange = (index: number, field: keyof TrainingSection, value: any) => {
    setSections(prev => {
      const newSections = [...prev];
      newSections[index] = {
        ...newSections[index],
        [field]: value,
      };
      return newSections;
    });
  };
  
  const addSection = () => {
    const newOrder = sections.length > 0 
      ? Math.max(...sections.map(s => s.order)) + 1 
      : 1;
    
    setSections(prev => [
      ...prev,
      {
        id: `temp-${Date.now()}`, // Will be replaced with real ID on save
        moduleId: module.id,
        title: "New Section",
        content: "",
        contentFormat: "HTML" as ContentFormat,
        order: newOrder,
        isOptional: false,
        resources: [],
        quizQuestions: [],
      },
    ]);
  };
  
  const removeSection = (index: number) => {
    if (confirm("Are you sure you want to remove this section? This action cannot be undone.")) {
      setSections(prev => {
        const newSections = [...prev];
        newSections.splice(index, 1);
        
        // Reorder remaining sections
        return newSections.map((section, idx) => ({
          ...section,
          order: idx + 1,
        }));
      });
    }
  };
  
  const moveSection = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === sections.length - 1)
    ) {
      return;
    }
    
    setSections(prev => {
      const newSections = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      
      // Swap sections
      [newSections[index], newSections[targetIndex]] = [
        newSections[targetIndex],
        newSections[index],
      ];
      
      // Update order values
      return newSections.map((section, idx) => ({
        ...section,
        order: idx + 1,
      }));
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    
    try {
      // Update module
      const moduleResponse = await fetch(`/api/training/modules/${module.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          sections,
        }),
      });
      
      if (!moduleResponse.ok) {
        throw new Error("Failed to update module");
      }
      
      router.push("/training/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update module");
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
            onClick={() => setActiveTab("content")}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === "content" 
                ? "border-b-2 border-primary" 
                : "text-muted-foreground"
            }`}
          >
            Content Sections
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
            </div>
          )}
          
          {activeTab === "content" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Content Sections</h3>
                <button
                  type="button"
                  onClick={addSection}
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
                >
                  Add Section
                </button>
              </div>
              
              {sections.length === 0 ? (
                <div className="text-center py-8 border rounded-md">
                  <p className="text-muted-foreground mb-4">
                    No content sections yet. Add a section to get started.
                  </p>
                  <button
                    type="button"
                    onClick={addSection}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    Add First Section
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {sections.map((section, index) => (
                    <div key={section.id} className="border rounded-md">
                      <div className="flex justify-between items-center p-4 border-b">
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Section {index + 1}:</span>
                          <input
                            type="text"
                            value={section.title}
                            onChange={(e) => handleSectionChange(index, "title", e.target.value)}
                            className="p-1 border rounded"
                          />
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => moveSection(index, "up")}
                            disabled={index === 0}
                            className="text-sm px-2 py-1 rounded bg-secondary text-secondary-foreground disabled:opacity-50"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSection(index, "down")}
                            disabled={index === sections.length - 1}
                            className="text-sm px-2 py-1 rounded bg-secondary text-secondary-foreground disabled:opacity-50"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSection(index)}
                            className="text-sm px-2 py-1 rounded bg-destructive text-destructive-foreground"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      
                      <div className="p-4 space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="block text-sm font-medium">
                              Content Format
                            </label>
                            <div className="flex items-center">
                              <input
                                id={`isOptional-${index}`}
                                type="checkbox"
                                checked={section.isOptional}
                                onChange={(e) => handleSectionChange(index, "isOptional", e.target.checked)}
                                className="h-4 w-4 mr-2"
                              />
                              <label htmlFor={`isOptional-${index}`} className="text-sm">
                                Optional Section
                              </label>
                            </div>
                          </div>
                          <select
                            value={section.contentFormat}
                            onChange={(e) => handleSectionChange(index, "contentFormat", e.target.value)}
                            className="w-full p-2 rounded-md border border-input bg-background"
                          >
                            {Object.values(ContentFormat).map((format) => (
                              <option key={format} value={format}>
                                {format}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Content
                          </label>
                          {section.contentFormat === "QUIZ" ? (
                            <div className="border rounded-md p-4 bg-secondary/20">
                              <p className="mb-2">Quiz questions are managed in the quiz editor.</p>
                              <button
                                type="button"
                                className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-sm hover:bg-secondary/90"
                              >
                                Edit Quiz Questions
                              </button>
                            </div>
                          ) : (
                            <textarea
                              value={section.content}
                              onChange={(e) => handleSectionChange(index, "content", e.target.value)}
                              rows={6}
                              className="w-full p-2 rounded-md border border-input bg-background"
                              placeholder={`Enter ${section.contentFormat.toLowerCase()} content...`}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
            {isSubmitting ? "Saving..." : "Save Module"}
          </button>
        </div>
      </form>
    </div>
  );
}