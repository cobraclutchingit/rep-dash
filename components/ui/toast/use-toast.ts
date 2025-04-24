'use client';

import { toast as sonnerToast, type ToastT } from 'sonner';

// Extend ToastT to include variant
type ToastProps = Omit<ToastT, 'id'> & {
  id?: string | number;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'success' | 'error' | 'warning' | 'info';
};

export function toast(props: ToastProps) {
  const { title, description, action, variant, ...rest } = props;

  // Map variant to Sonner styles or className
  const variantStyles: Record<NonNullable<ToastProps['variant']>, string> = {
    success: 'bg-success text-success-foreground',
    error: 'bg-destructive text-destructive-foreground',
    warning: 'bg-warning text-warning-foreground',
    info: 'bg-info text-info-foreground',
  };

  sonnerToast(title, {
    description,
    action: action
      ? {
          label: action.label,
          onClick: action.onClick,
        }
      : undefined,
    className: variant ? variantStyles[variant] : undefined,
    ...rest,
  });
}

export function successToast(props: Omit<ToastProps, 'variant'>) {
  toast({ ...props, variant: 'success' });
}

export function errorToast(props: Omit<ToastProps, 'variant'>) {
  toast({ ...props, variant: 'error' });
}

export function warningToast(props: Omit<ToastProps, 'variant'>) {
  toast({ ...props, variant: 'warning' });
}

export function infoToast(props: Omit<ToastProps, 'variant'>) {
  toast({ ...props, variant: 'info' });
}
