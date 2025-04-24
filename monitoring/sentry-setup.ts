import * as Sentry from '@sentry/nextjs';
import { Session } from 'next-auth';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

const initSentry = () => {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not found. Error tracking is disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    ignoreErrors: [
      'Network request failed',
      'Failed to fetch',
      'NetworkError',
      'AbortError',
      'ResizeObserver loop limit exceeded',
      'Extension context invalidated',
      'Script error',
      'User aborted a request',
    ],
    beforeSend(event) {
      if (event.request && event.request.headers) {
        delete event.request.headers.cookie;
        delete event.request.headers.authorization;
      }
      return event;
    },
  });

  window.addEventListener('unhandledrejection', (event) => {
    Sentry.captureException(event.reason);
  });

  console.warn('Sentry initialized for error tracking');
};

export const identifyUser = (user: Session['user'] | null) => {
  if (!SENTRY_DSN) return;

  if (user && user.id) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  } else {
    Sentry.setUser(null);
  }
};

export const setErrorContext = (context: Record<string, unknown> = {}) => {
  if (!SENTRY_DSN) return;

  Object.entries(context).forEach(([key, value]) => {
    Sentry.setContext(key, value);
  });
};

export const monitorTransaction = <T>(name: string, operation: string, callback: () => T): T => {
  if (!SENTRY_DSN) return callback();

  const transaction = Sentry.startTransaction({
    name,
    op: operation,
  });

  Sentry.configureScope((scope) => {
    scope.setSpan(transaction);
  });

  try {
    const result = callback();
    transaction.finish();
    return result;
  } catch (error) {
    transaction.setStatus('error');
    transaction.finish();
    throw error;
  }
};

export const logWithSentry = (
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info',
  context: Record<string, unknown> = {}
) => {
  if (!SENTRY_DSN) {
    console.warn(`[${level.toUpperCase()}] ${message}`);
    return;
  }

  const severityMap: Record<string, Sentry.SeverityLevel> = {
    debug: 'debug',
    info: 'info',
    warning: 'warning',
    error: 'error',
    fatal: 'fatal',
  };

  const severity = severityMap[level] || 'info';

  Sentry.withScope((scope) => {
    scope.setLevel(severity);
    Object.entries(context).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });
    Sentry.captureMessage(message);
  });
};

export const monitorRoutePerformance = (route: string, description: string) => {
  if (!SENTRY_DSN) return;

  Sentry.addBreadcrumb({
    category: 'navigation',
    message: `Navigated to ${route}`,
    data: {
      route,
      description,
      timestamp: Date.now(),
    },
    level: 'info',
  });
};

export default initSentry;
