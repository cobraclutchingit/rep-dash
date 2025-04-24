'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component to catch and display errors gracefully
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // You could also log to an error reporting service here
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="bg-background flex min-h-[400px] flex-col items-center justify-center rounded-lg border p-8 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-10 w-10 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium">Something went wrong</h3>
          <p className="text-muted-foreground mt-2 text-sm">
            We apologize for the inconvenience. Please try again or contact support.
          </p>
          {this.state.error && (
            <div className="mt-4 max-w-full overflow-auto rounded-md bg-gray-100 p-4 text-left text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-200">
              <p className="font-mono">{this.state.error.toString()}</p>
            </div>
          )}
          <div className="mt-6 flex gap-4">
            <Button onClick={this.handleReset} variant="outline">
              Try Again
            </Button>
            <Button onClick={this.handleReload}>Reload Page</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Client component error UI
 */
export function ErrorUI({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="bg-background flex min-h-[400px] flex-col items-center justify-center rounded-lg border p-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
        <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-medium">Something went wrong</h3>
      <p className="text-muted-foreground mt-2 text-sm">
        We apologize for the inconvenience. Please try again or contact support.
      </p>
      <div className="mt-4 max-w-full overflow-auto rounded-md bg-gray-100 p-4 text-left text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-200">
        <p className="font-mono">{error.toString()}</p>
      </div>
      <div className="mt-6 flex gap-4">
        <Button onClick={reset} variant="outline">
          Try Again
        </Button>
        <Button onClick={() => window.location.reload()}>Reload Page</Button>
      </div>
    </div>
  );
}