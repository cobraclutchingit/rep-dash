'use client';

import { TrainingCategory } from '@prisma/client';
import { useState } from 'react';

interface ReportGeneratorProps {
  modules: Array<{
    id: string;
    title: string;
    category: string;
  }>;
  users: Array<{
    id: string;
    name: string | null;
    email: string;
    position: any; // Allow any type for position
  }>;
}

export default function ReportGenerator({ modules, users }: ReportGeneratorProps) {
  const [reportType, setReportType] = useState('user_progress');
  const [dateRange, setDateRange] = useState('last_30_days');
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleModuleSelection = (moduleId: string) => {
    setSelectedModules((prev) => {
      if (prev.includes(moduleId)) {
        return prev.filter((id) => id !== moduleId);
      } else {
        return [...prev, moduleId];
      }
    });
  };

  const handleUserSelection = (userId: string) => {
    setSelectedUsers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleCategorySelection = (category: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const handleGenerateReport = () => {
    setIsGenerating(true);

    // In a real application, this would make an API call to generate the report
    setTimeout(() => {
      setIsGenerating(false);

      // Show success message or download the report
      alert(
        'Report generated successfully! Download would start automatically in a real application.'
      );
    }, 1500);
  };

  const selectAllModules = () => {
    setSelectedModules(modules.map((module) => module.id));
  };

  const clearModuleSelection = () => {
    setSelectedModules([]);
  };

  const selectAllUsers = () => {
    setSelectedUsers(users.map((user) => user.id));
  };

  const clearUserSelection = () => {
    setSelectedUsers([]);
  };

  return (
    <div>
      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium">Report Type</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="border-input bg-background w-full rounded-md border p-2"
          >
            <option value="user_progress">User Progress Report</option>
            <option value="module_completions">Module Completions</option>
            <option value="training_gap">Training Gap Analysis</option>
            <option value="time_to_complete">Time to Complete Analysis</option>
            <option value="quiz_performance">Quiz Performance</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Date Range</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border-input bg-background w-full rounded-md border p-2"
          >
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="last_90_days">Last 90 Days</option>
            <option value="year_to_date">Year to Date</option>
            <option value="all_time">All Time</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {dateRange === 'custom' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Start Date</label>
              <input
                type="date"
                className="border-input bg-background w-full rounded-md border p-2"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">End Date</label>
              <input
                type="date"
                className="border-input bg-background w-full rounded-md border p-2"
              />
            </div>
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium">Training Categories</label>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.values(TrainingCategory).map((category) => (
              <label
                key={category}
                className={`cursor-pointer rounded-full px-3 py-1.5 text-xs ${
                  selectedCategories.includes(category)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category)}
                  onChange={() => handleCategorySelection(category)}
                  className="sr-only"
                />
                {category.replace(/_/g, ' ')}
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium">Modules</label>
            <div className="flex space-x-2 text-xs">
              <button
                type="button"
                onClick={selectAllModules}
                className="text-primary hover:underline"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={clearModuleSelection}
                className="text-primary hover:underline"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto rounded-md border p-2">
            {modules.map((module) => (
              <label
                key={module.id}
                className="hover:bg-muted flex cursor-pointer items-center rounded p-1"
              >
                <input
                  type="checkbox"
                  checked={selectedModules.includes(module.id)}
                  onChange={() => handleModuleSelection(module.id)}
                  className="mr-2 h-4 w-4"
                />
                <span className="text-sm">{module.title}</span>
                <span className="text-muted-foreground ml-2 text-xs">
                  ({module.category.replace(/_/g, ' ')})
                </span>
              </label>
            ))}
          </div>
        </div>

        {(reportType === 'user_progress' || reportType === 'training_gap') && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium">Users</label>
              <div className="flex space-x-2 text-xs">
                <button
                  type="button"
                  onClick={selectAllUsers}
                  className="text-primary hover:underline"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={clearUserSelection}
                  className="text-primary hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto rounded-md border p-2">
              {users.map((user) => (
                <label
                  key={user.id}
                  className="hover:bg-muted flex cursor-pointer items-center rounded p-1"
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleUserSelection(user.id)}
                    className="mr-2 h-4 w-4"
                  />
                  <span className="text-sm">{user.name}</span>
                  {user.position && (
                    <span className="text-muted-foreground ml-2 text-xs">
                      ({user.position.replace(/_/g, ' ')})
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium">Report Format</label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="format"
                value="csv"
                defaultChecked
                className="mr-2 h-4 w-4"
              />
              <span>CSV</span>
            </label>
            <label className="flex items-center">
              <input type="radio" name="format" value="excel" className="mr-2 h-4 w-4" />
              <span>Excel</span>
            </label>
            <label className="flex items-center">
              <input type="radio" name="format" value="pdf" className="mr-2 h-4 w-4" />
              <span>PDF</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 disabled:opacity-50"
          >
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
