'use client';

import { TrainingModule, TrainingCategory } from '@prisma/client';
import Link from 'next/link';
import { useState } from 'react';

interface AdminModuleListProps {
  modules: (TrainingModule & {
    _count: {
      progress: number;
      sections: number;
    };
  })[];
}

export default function AdminModuleList({ modules }: AdminModuleListProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter modules
  const filteredModules = modules.filter((module) => {
    const matchesCategory = categoryFilter === 'ALL' || module.category === categoryFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PUBLISHED' && module.isPublished) ||
      (statusFilter === 'DRAFT' && !module.isPublished);
    const matchesSearch =
      !searchQuery ||
      module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesStatus && matchesSearch;
  });

  // Group modules by category
  const modulesByCategory = filteredModules.reduce(
    (acc, module) => {
      const category = module.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(module);
      return acc;
    },
    {} as Record<string, typeof modules>
  );

  return (
    <div className="bg-card text-card-foreground overflow-hidden rounded-lg shadow">
      <div className="border-b p-4">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search modules..."
              className="border-input bg-background w-full rounded-md border p-2"
            />
          </div>

          <div className="w-full md:w-48">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border-input bg-background w-full rounded-md border p-2"
            >
              <option value="ALL">All Categories</option>
              {Object.values(TrainingCategory).map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border-input bg-background w-full rounded-md border p-2"
            >
              <option value="ALL">All Status</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {Object.entries(modulesByCategory).length > 0 ? (
        <div className="divide-muted divide-y">
          {Object.entries(modulesByCategory).map(([category, modules]) => (
            <div key={category} className="p-4">
              <h3 className="mb-4 text-lg font-semibold capitalize">
                {category.replace(/_/g, ' ').toLowerCase()}
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-4 py-2 text-left text-sm font-semibold">Title</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Sections</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Status</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Required</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Completions</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-muted/50 divide-y">
                    {modules.map((module) => (
                      <tr key={module.id} className="hover:bg-muted/40">
                        <td className="px-4 py-2 text-sm">
                          <Link
                            href={`/training/admin/modules/${module.id}`}
                            className="hover:text-primary font-medium"
                          >
                            {module.title}
                          </Link>
                        </td>
                        <td className="px-4 py-2 text-sm">{module._count.sections}</td>
                        <td className="px-4 py-2 text-sm">
                          <span
                            className={`rounded-full px-2 py-1 text-xs ${
                              module.isPublished
                                ? 'bg-green-500/10 text-green-500'
                                : 'bg-amber-500/10 text-amber-500'
                            }`}
                          >
                            {module.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">{module.isRequired ? 'Yes' : 'No'}</td>
                        <td className="px-4 py-2 text-sm">{module._count.progress}</td>
                        <td className="space-x-2 px-4 py-2 text-sm">
                          <Link
                            href={`/training/admin/modules/${module.id}/edit`}
                            className="text-primary hover:underline"
                          >
                            Edit
                          </Link>
                          <span>•</span>
                          <Link
                            href={`/training/admin/modules/${module.id}/analytics`}
                            className="text-primary hover:underline"
                          >
                            Analytics
                          </Link>
                          <span>•</span>
                          <Link
                            href={`/training/modules/${module.id}`}
                            className="text-primary hover:underline"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center">
          <p className="text-muted-foreground mb-4">No modules found matching your filters.</p>
          <Link
            href="/training/admin/modules/new"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2"
          >
            Create New Module
          </Link>
        </div>
      )}
    </div>
  );
}
