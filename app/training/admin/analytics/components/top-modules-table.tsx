'use client';

import Link from 'next/link';

interface TopModulesTableProps {
  modules: Array<{
    id: string;
    title: string;
    category: string;
    completed: number;
    inProgress: number;
  }>;
}

export default function TopModulesTable({ modules }: TopModulesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-muted/50">
            <th className="px-4 py-2 text-left text-sm font-semibold">Module</th>
            <th className="px-4 py-2 text-left text-sm font-semibold">Category</th>
            <th className="px-4 py-2 text-left text-sm font-semibold">Completions</th>
            <th className="px-4 py-2 text-left text-sm font-semibold">In Progress</th>
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
              <td className="px-4 py-2 text-sm">{module.category.replace(/_/g, ' ')}</td>
              <td className="px-4 py-2 text-sm">
                <span className="font-medium">{module.completed}</span>
              </td>
              <td className="px-4 py-2 text-sm">{module.inProgress}</td>
            </tr>
          ))}

          {modules.length === 0 && (
            <tr>
              <td colSpan={4} className="text-muted-foreground px-4 py-8 text-center">
                No module data available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
