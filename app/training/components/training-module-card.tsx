'use client';

import { TrainingModule, TrainingProgress } from '@prisma/client';
import Link from 'next/link';

interface TrainingModuleCardProps {
  module: TrainingModule;
  progress?: TrainingProgress;
}

export default function TrainingModuleCard({ module, progress }: TrainingModuleCardProps) {
  // Determine module status and styling
  const moduleStatus = progress?.status || 'NOT_STARTED';

  const statusBadge = {
    NOT_STARTED: 'bg-secondary text-secondary-foreground',
    IN_PROGRESS: 'bg-amber-500/10 text-amber-500',
    COMPLETED: 'bg-green-500/10 text-green-500',
  }[moduleStatus];

  const statusText = {
    NOT_STARTED: 'Not Started',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
  }[moduleStatus];

  // Calculate the content icon based on category
  const categoryIcons = {
    ONBOARDING: '🚀',
    TECHNOLOGY: '💻',
    APPOINTMENT_SETTING: '📅',
    SALES_PROCESS: '🤝',
    PRODUCT_KNOWLEDGE: '📚',
    COMPLIANCE: '⚖️',
    SALES_SKILLS: '🎯',
    LEADERSHIP: '👑',
    CUSTOMER_SERVICE: '🛎️',
  };

  const icon = categoryIcons[module.category] || '📝';

  return (
    <div className="bg-card text-card-foreground overflow-hidden rounded-lg shadow transition-all duration-200 hover:shadow-md">
      <div className="bg-secondary flex h-40 items-center justify-center">
        <span className="text-4xl">{icon}</span>
      </div>

      <div className="p-4">
        <div className="mb-2 flex items-start justify-between">
          <h3 className="text-lg font-semibold">{module.title}</h3>
          <span className={`rounded-full px-2 py-1 text-xs ${statusBadge}`}>{statusText}</span>
        </div>

        <p className="text-muted-foreground mb-4 line-clamp-2 text-sm">{module.description}</p>

        {progress && moduleStatus === 'IN_PROGRESS' && (
          <div className="mb-3">
            <div className="bg-secondary h-2 w-full rounded-full">
              <div
                className="bg-primary h-2 rounded-full"
                style={{ width: `${progress.percentComplete}%` }}
              ></div>
            </div>
            <p className="text-muted-foreground mt-1 text-right text-xs">
              {Math.round(progress.percentComplete)}% complete
            </p>
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          {module.isRequired && (
            <span className="bg-primary/10 text-primary rounded-full px-2 py-1 text-xs">
              Required
            </span>
          )}
          {module.estimatedDuration && (
            <span className="text-muted-foreground text-xs">{module.estimatedDuration} min</span>
          )}
        </div>

        <Link
          href={`/training/modules/${module.id}`}
          className="bg-primary text-primary-foreground hover:bg-primary/90 block w-full rounded-md py-2 text-center text-sm font-medium"
        >
          {moduleStatus === 'NOT_STARTED'
            ? 'Start Module'
            : moduleStatus === 'IN_PROGRESS'
              ? 'Continue'
              : 'Review Module'}
        </Link>
      </div>
    </div>
  );
}
