'use client';

import { cn } from '@/lib/utils';

import { Button } from '../button';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'bg-card/50 flex flex-col items-center justify-center rounded-lg border border-dashed px-4 py-12 text-center',
        className
      )}
    >
      {icon && <div className="text-muted-foreground mb-4">{icon}</div>}
      <h3 className="text-foreground mb-1 text-lg font-medium">{title}</h3>
      {description && <p className="text-muted-foreground mb-4 max-w-sm text-sm">{description}</p>}
      {action && (
        <Button size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function TableEmptyState({
  title = 'No results found',
  description = "Try adjusting your search or filter to find what you're looking for.",
  ...props
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      title={title}
      description={description}
      icon={
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-10 w-10"
        >
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" x2="12" y1="9" y2="13" />
          <line x1="12" x2="12.01" y1="17" y2="17" />
        </svg>
      }
      className="py-8"
      {...props}
    />
  );
}
