'use client';

import {
  TrainingModule,
  TrainingSection,
  TrainingCategory,
  UserRole,
  SalesPosition,
  ContentFormat,
} from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Resource {
  id: string;
  title: string;
  url: string;
  type: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
}

interface Prerequisite {
  prerequisiteId: string;
}

interface ModuleEditFormProps {
  module: TrainingModule & {
    sections: (TrainingSection & {
      resources: Resource[];
      quizQuestions: QuizQuestion[];
    })[];
    prerequisites: Prerequisite[];
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
    prerequisites: module.prerequisites.map((p) => p.prerequisiteId),
    order: module.order,
  });

  const [sections, setSections] = useState(module.sections);
  const [activeTab, setActiveTab] = useState('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) : value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleMultiSelectChange = (name: string, value: string) => {
    setFormData((prev) => {
      const currentValues = prev[name as keyof typeof prev] as string[];

      if (Array.isArray(currentValues)) {
        if (currentValues.includes(value)) {
          return {
            ...prev,
            [name]: currentValues.filter((item) => item !== value),
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
    setFormData((prev) => {
      if (isChecked) {
        return {
          ...prev,
          prerequisites: [...prev.prerequisites, id],
        };
      } else {
        return {
          ...prev,
          prerequisites: prev.prerequisites.filter((preId) => preId !== id),
        };
      }
    });
  };

  const handleSectionChange = (
    index: number,
    field: keyof TrainingSection,
    value: string | boolean
  ) => {
    setSections((prev) => {
      const newSections = [...prev];
      newSections[index] = {
        ...newSections[index],
        [field]: value,
      };
      return newSections;
    });
  };

  const addSection = () => {
    const newOrder = sections.length > 0 ? Math.max(...sections.map((s) => s.order)) + 1 : 1;

    setSections((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`, // Will be replaced with real ID on save
        moduleId: module.id,
        title: 'New Section',
        content: '',
        contentFormat: 'HTML' as ContentFormat,
        order: newOrder,
        isOptional: false,
        resources: [],
        quizQuestions: [],
      },
    ]);
  };

  const removeSection = (index: number) => {
    if (confirm('Are you sure you want to remove this section? This action cannot be undone.')) {
      setSections((prev) => {
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

  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === sections.length - 1)
    ) {
      return;
    }

    setSections((prev) => {
      const newSections = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;

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
    setError('');

    try {
      // Update module
      const moduleResponse = await fetch(`/api/training/modules/${module.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          sections,
        }),
      });

      if (!moduleResponse.ok) {
        throw new Error('Failed to update module');
      }

      router.push('/training/admin');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update module');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card text-card-foreground rounded-lg shadow">
      <div className="border-b">
        <div className="flex overflow-x-auto">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'details' ? 'border-primary border-b-2' : 'text-muted-foreground'
            }`}
          >
            Module Details
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'content' ? 'border-primary border-b-2' : 'text-muted-foreground'
            }`}
          >
            Content Sections
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'settings' ? 'border-primary border-b-2' : 'text-muted-foreground'
            }`}
          >
            Module Settings
          </button>
          <button
            onClick={() => setActiveTab('prerequisites')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'prerequisites' ? 'border-primary border-b-2' : 'text-muted-foreground'
            }`}
          >
            Prerequisites
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="p-6">
          {error && (
            <div className="bg-destructive/10 text-destructive mb-6 rounded-md p-4">{error}</div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="mb-2 block text-sm font-medium">
                  Module Title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="border-input bg-background w-full rounded-md border p-2"
                />
              </div>

              <div>
                <label htmlFor="description" className="mb-2 block text-sm font-medium">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  required
                  className="border-input bg-background w-full rounded-md border p-2"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="category" className="mb-2 block text-sm font-medium">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="border-input bg-background w-full rounded-md border p-2"
                  >
                    {Object.values(TrainingCategory).map((category) => (
                      <option key={category} value={category}>
                        {category.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="estimatedDuration" className="mb-2 block text-sm font-medium">
                    Estimated Duration (minutes)
                  </label>
                  <input
                    id="estimatedDuration"
                    name="estimatedDuration"
                    type="number"
                    min="0"
                    value={formData.estimatedDuration}
                    onChange={handleChange}
                    className="border-input bg-background w-full rounded-md border p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="order" className="mb-2 block text-sm font-medium">
                    Display Order
                  </label>
                  <input
                    id="order"
                    name="order"
                    type="number"
                    min="0"
                    value={formData.order}
                    onChange={handleChange}
                    className="border-input bg-background w-full rounded-md border p-2"
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
                      className="mr-2 h-4 w-4"
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
                      className="mr-2 h-4 w-4"
                    />
                    <label htmlFor="isPublished" className="text-sm font-medium">
                      Published
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Content Sections</h3>
                <button
                  type="button"
                  onClick={addSection}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-1.5 text-sm"
                >
                  Add Section
                </button>
              </div>

              {sections.length === 0 ? (
                <div className="rounded-md border py-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    No content sections yet. Add a section to get started.
                  </p>
                  <button
                    type="button"
                    onClick={addSection}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2"
                  >
                    Add First Section
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {sections.map((section, index) => (
                    <div key={section.id} className="rounded-md border">
                      <div className="flex items-center justify-between border-b p-4">
                        <div className="flex items-center">
                          <span className="mr-2 font-medium">Section {index + 1}:</span>
                          <input
                            type="text"
                            value={section.title}
                            onChange={(e) => handleSectionChange(index, 'title', e.target.value)}
                            className="rounded border p-1"
                          />
                        </div>

                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => moveSection(index, 'up')}
                            disabled={index === 0}
                            className="bg-secondary text-secondary-foreground rounded px-2 py-1 text-sm disabled:opacity-50"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSection(index, 'down')}
                            disabled={index === sections.length - 1}
                            className="bg-secondary text-secondary-foreground rounded px-2 py-1 text-sm disabled:opacity-50"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSection(index)}
                            className="bg-destructive text-destructive-foreground rounded px-2 py-1 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4 p-4">
                        <div>
                          <div className="mb-2 flex justify-between">
                            <label className="block text-sm font-medium">Content Format</label>
                            <div className="flex items-center">
                              <input
                                id={`isOptional-${index}`}
                                type="checkbox"
                                checked={section.isOptional}
                                onChange={(e) =>
                                  handleSectionChange(index, 'isOptional', e.target.checked)
                                }
                                className="mr-2 h-4 w-4"
                              />
                              <label htmlFor={`isOptional-${index}`} className="text-sm">
                                Optional Section
                              </label>
                            </div>
                          </div>
                          <select
                            value={section.contentFormat}
                            onChange={(e) =>
                              handleSectionChange(index, 'contentFormat', e.target.value)
                            }
                            className="border-input bg-background w-full rounded-md border p-2"
                          >
                            {Object.values(ContentFormat).map((format) => (
                              <option key={format} value={format}>
                                {format}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium">Content</label>
                          {section.contentFormat === 'QUIZ' ? (
                            <div className="bg-secondary/20 rounded-md border p-4">
                              <p className="mb-2">Quiz questions are managed in the quiz editor.</p>
                              <button
                                type="button"
                                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-md px-3 py-1.5 text-sm"
                              >
                                Edit Quiz Questions
                              </button>
                            </div>
                          ) : (
                            <textarea
                              value={section.content}
                              onChange={(e) =>
                                handleSectionChange(index, 'content', e.target.value)
                              }
                              rows={6}
                              className="border-input bg-background w-full rounded-md border p-2"
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

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h3 className="mb-4 text-lg font-semibold">Visibility Settings</h3>

                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium">Visible to User Roles</label>
                  <div className="flex flex-wrap gap-3">
                    {Object.values(UserRole).map((role) => (
                      <label key={role} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.visibleToRoles.includes(role)}
                          onChange={() => handleMultiSelectChange('visibleToRoles', role)}
                          className="mr-2 h-4 w-4"
                        />
                        <span>{role}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Visible to Sales Positions
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {Object.values(SalesPosition).map((position) => (
                      <label key={position} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.visibleToPositions.includes(position)}
                          onChange={() => handleMultiSelectChange('visibleToPositions', position)}
                          className="mr-2 h-4 w-4"
                        />
                        <span>{position.replace(/_/g, ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'prerequisites' && (
            <div>
              <h3 className="mb-4 text-lg font-semibold">Module Prerequisites</h3>

              {allModules.length === 0 ? (
                <p className="text-muted-foreground">
                  No other modules available to set as prerequisites.
                </p>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground mb-2 text-sm">
                    Select modules that must be completed before users can access this module:
                  </p>

                  <div className="max-h-96 overflow-y-auto rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="px-4 py-2 text-left text-sm font-semibold">Select</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold">
                            Module Title
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-semibold">Category</th>
                        </tr>
                      </thead>
                      <tbody className="divide-muted/50 divide-y">
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
                            <td className="px-4 py-2 text-sm">{mod.category.replace(/_/g, ' ')}</td>
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

        <div className="bg-muted/50 flex justify-between border-t p-6">
          <button
            type="button"
            onClick={() => router.push('/training/admin')}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-md px-4 py-2"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Module'}
          </button>
        </div>
      </form>
    </div>
  );
}
