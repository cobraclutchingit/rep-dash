// Sentry Integration for Rep Dashboard
// This file configures error tracking using Sentry

import * as Sentry from '@sentry/nextjs';

// This initializes Sentry for client-side monitoring
// Place this in your _app.js or equivalent
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
    
    // Sampling rates to balance performance with data collection
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Customizing the behavior
    integrations: [
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Ignore common errors that are not actionable
    ignoreErrors: [
      // Network errors that are usually not actionable
      'Network request failed',
      'Failed to fetch',
      'NetworkError',
      'AbortError',
      // Browser extensions can cause errors
      'ResizeObserver loop limit exceeded',
      'Extension context invalidated',
      // Third-party script errors
      'Script error',
      // User actions during navigation
      'User aborted a request',
    ],
    
    // Minimize identifying user information by default
    beforeSend(event) {
      // Scrub sensitive data
      if (event.request && event.request.headers) {
        delete event.request.headers.cookie;
        delete event.request.headers.authorization;
      }
      return event;
    },
  });
  
  // Track unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    Sentry.captureException(event.reason);
  });
  
  console.log('Sentry initialized for error tracking');
};

// Track user information when authenticated
export const identifyUser = (user) => {
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

// Custom error context for better tracking
export const setErrorContext = (context = {}) => {
  if (!SENTRY_DSN) return;
  
  Object.entries(context).forEach(([key, value]) => {
    Sentry.setContext(key, value);
  });
};

// Custom monitoring for business-critical paths
export const monitorTransaction = (name, operation, callback) => {
  if (!SENTRY_DSN) return callback();
  
  const transaction = Sentry.startTransaction({
    name,
    op: operation,
  });
  
  Sentry.configureScope(scope => {
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

// Logging with severity levels
export const logWithSentry = (message, level = 'info', context = {}) => {
  if (!SENTRY_DSN) {
    console.log(`[${level.toUpperCase()}] ${message}`);
    return;
  }
  
  // Convert level to Sentry severity
  const severityMap = {
    debug: 'debug',
    info: 'info',
    warning: 'warning',
    error: 'error',
    fatal: 'fatal',
  };
  
  const severity = severityMap[level] || 'info';
  
  Sentry.withScope(scope => {
    scope.setLevel(severity);
    Object.entries(context).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });
    Sentry.captureMessage(message);
  });
};

// Annotate specific routes for performance tracking
export const monitorRoutePerformance = (route, description) => {
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