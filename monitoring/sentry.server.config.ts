import * as Sentry from '@sentry/nextjs';
import { NextApiRequest, NextApiResponse } from 'next';
import { Session } from 'next-auth';

const SENTRY_DSN = process.env.SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  environment: process.env.NODE_ENV,
  release: process.env.APP_VERSION || '1.0.0',
  serverName: process.env.HOSTNAME || 'rep-dashboard-server',
  beforeSend(event) {
    if (event.request && event.request.data) {
      const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'apikey'];
      const scrubData = (obj: unknown): unknown => {
        if (!obj || typeof obj !== 'object') return obj;
        return Object.entries(obj).reduce(
          (acc, [key, value]) => {
            if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
              acc[key] = '[REDACTED]';
            } else if (typeof value === 'object') {
              acc[key] = scrubData(value);
            } else {
              acc[key] = value;
            }
            return acc;
          },
          {} as Record<string, unknown>
        );
      };
      event.request.data = scrubData(event.request.data);
    }
    if (event.request && event.request.headers) {
      delete event.request.headers.cookie;
      delete event.request.headers.authorization;
    }
    return event;
  },
  initialScope: {
    tags: {
      app: 'rep-dashboard',
      server: process.env.HOSTNAME || 'unknown-server',
    },
  },
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Prisma(),
    new Sentry.Integrations.Postgres(),
  ],
  errorSampleRate: process.env.NODE_ENV === 'production' ? 0.5 : 1.0,
});

export const withSentryAPI = (
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) => {
  return async (req: NextApiRequest & { session?: Session }, res: NextApiResponse) => {
    try {
      Sentry.configureScope((scope) => {
        scope.setTag('route', req.url || 'unknown');
        if (req.session?.user) {
          scope.setUser({
            id: req.session.user.id,
            email: req.session.user.email,
            role: req.session.user.role,
          });
        }
        scope.setContext('request', {
          url: req.url,
          method: req.method,
          headers: {
            accept: req.headers.accept,
            'content-type': req.headers['content-type'],
            'user-agent': req.headers['user-agent'],
          },
        });
      });
      return await handler(req, res);
    } catch (error: unknown) {
      Sentry.captureException(error);
      const status = error instanceof Error && 'status' in error ? error.status : 500;
      const message =
        status === 500
          ? 'An unexpected error occurred'
          : error instanceof Error
            ? error.message || 'Something went wrong'
            : 'Something went wrong';
      res.status(status).json({
        success: false,
        error: message,
        code: error instanceof Error && 'code' in error ? error.code : 'INTERNAL_ERROR',
      });
    }
  };
};
