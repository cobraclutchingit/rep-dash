'use client';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'text-foreground',
        success: 'border-transparent bg-success text-success-foreground',
        warning: 'border-transparent bg-warning text-warning-foreground',
        info: 'border-transparent bg-info text-info-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'new' | 'in-progress' | 'completed' | 'cancelled' | 'scheduled';
}

function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  const statusClasses = {
    new: 'bg-status-new text-white',
    'in-progress': 'bg-status-in-progress text-white',
    completed: 'bg-status-completed text-white',
    cancelled: 'bg-status-cancelled text-white',
    scheduled: 'bg-status-scheduled text-white',
  };

  const statusLabels = {
    new: 'New',
    'in-progress': 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    scheduled: 'Scheduled',
  };

  return (
    <Badge className={cn('border-transparent', statusClasses[status], className)} {...props}>
      {props.children || statusLabels[status]}
    </Badge>
  );
}

export { Badge, StatusBadge };
