'use client';

import { Toaster as SonnerToaster } from 'sonner';

import { useTheme } from '@/components/providers/theme-provider';

export function ToastProvider() {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      position="top-right"
      theme={theme as 'dark' | 'light' | 'system'}
      className="toaster"
      toastOptions={{
        classNames: {
          toast:
            'group border bg-background text-foreground flex items-center space-x-4 p-4 shadow-lg rounded-md',
          title: 'text-sm font-semibold',
          description: 'text-sm opacity-90',
          actionButton: 'bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md',
          cancelButton: 'bg-muted text-muted-foreground text-xs px-2 py-1 rounded-md',
          error: 'border-red-600 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-50',
          success:
            'border-green-600 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-50',
          warning:
            'border-yellow-600 bg-yellow-50 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-50',
          info: 'border-blue-600 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-50',
        },
      }}
    />
  );
}
