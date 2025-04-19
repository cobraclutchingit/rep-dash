// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  
  // Set environment
  environment: process.env.NODE_ENV,
  
  // Set release
  release: process.env.APP_VERSION || '1.0.0',
  
  // Customize server-side context
  serverName: process.env.HOSTNAME || 'rep-dashboard-server',
  
  // Customize handling of sensitive data
  beforeSend(event) {
    // Remove sensitive data from request bodies
    if (event.request && event.request.data) {
      const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'apikey'];
      const scrubData = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        
        return Object.entries(obj).reduce((acc, [key, value]) => {
          if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
            acc[key] = '[REDACTED]';
          } else if (typeof value === 'object') {
            acc[key] = scrubData(value);
          } else {
            acc[key] = value;
          }
          return acc;
        }, {});
      };
      
      event.request.data = scrubData(event.request.data);
    }
    
    // Remove cookies and auth headers
    if (event.request && event.request.headers) {
      delete event.request.headers.cookie;
      delete event.request.headers.authorization;
    }
    
    return event;
  },
  
  // Add custom tags 
  initialScope: {
    tags: {
      app: 'rep-dashboard',
      server: process.env.HOSTNAME || 'unknown-server',
    },
  },
  
  // Include more context
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Prisma(),
    new Sentry.Integrations.Express(),
    new Sentry.Integrations.Postgres(),
  ],
  
  // Configure error sampling
  errorSampleRate: process.env.NODE_ENV === 'production' ? 0.5 : 1.0,
});

// Add custom context for API routes
export const withSentryAPI = (handler) => {
  return async (req, res) => {
    try {
      // Set custom context for this request
      Sentry.configureScope(scope => {
        scope.setTag('route', req.url);
        
        // Add authenticated user if available
        if (req.session?.user) {
          scope.setUser({
            id: req.session.user.id,
            email: req.session.user.email,
            role: req.session.user.role,
          });
        }
        
        // Add request-specific context
        scope.setContext('request', {
          url: req.url,
          method: req.method,
          headers: {
            // Only include non-sensitive headers
            accept: req.headers.accept,
            'content-type': req.headers['content-type'],
            'user-agent': req.headers['user-agent'],
          },
        });
      });
      
      return await handler(req, res);
    } catch (error) {
      // Capture error with Sentry
      Sentry.captureException(error);
      
      // Send appropriate error response
      const status = error.status || 500;
      const message = status === 500 ? 
        'An unexpected error occurred' : 
        error.message || 'Something went wrong';
      
      res.status(status).json({
        success: false,
        error: message,
        code: error.code || 'INTERNAL_ERROR',
      });
    }
  };
};