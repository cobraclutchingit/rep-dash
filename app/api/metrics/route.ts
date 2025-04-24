import { NextRequest, NextResponse } from 'next/server';
import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';

import prisma from '@/lib/prisma';

// Initialize metrics collection (should be done only once)
collectDefaultMetrics({ prefix: 'rep_dashboard_' });

// Define custom metrics
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status', 'authenticated'],
});

const httpRequestDurationSeconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.05, 0.1, 0.5, 1, 2.5, 5, 10],
});

const dbQueryDurationSeconds = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'model'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2.5, 5],
});

const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Number of active users in the last 15 minutes',
});

const totalUsers = new Gauge({
  name: 'total_users',
  help: 'Total number of registered users',
});

const totalTrainingModules = new Gauge({
  name: 'total_training_modules',
  help: 'Total number of training modules',
});

const trainingCompletionRate = new Gauge({
  name: 'training_completion_rate',
  help: 'Training module completion rate',
  labelNames: ['module_id'],
});

const apiErrorRate = new Gauge({
  name: 'api_error_rate',
  help: 'API error rate per endpoint',
  labelNames: ['endpoint'],
});

// Update some metrics periodically (these are expensive to compute)
async function updateMetrics() {
  try {
    // Count active users (users who logged in in the last 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const activeUserCount = await prisma.user.count({
      where: {
        lastLoginAt: {
          gte: fifteenMinutesAgo,
        },
      },
    });
    activeUsers.set(activeUserCount);

    // Count total users
    const userCount = await prisma.user.count();
    totalUsers.set(userCount);

    // Count total training modules
    const moduleCount = await prisma.trainingModule.count({
      where: {
        isPublished: true,
      },
    });
    totalTrainingModules.set(moduleCount);

    // Calculate training completion rates
    const modules = await prisma.trainingModule.findMany({
      where: {
        isPublished: true,
      },
      select: {
        id: true,
        _count: {
          select: {
            progress: true,
          },
        },
      },
    });

    for (const trainingModule of modules) {
      const completionCount = await prisma.trainingProgress.count({
        where: {
          moduleId: trainingModule.id,
          status: 'COMPLETED',
        },
      });

      const completionRate =
        trainingModule._count.progress > 0 ? completionCount / trainingModule._count.progress : 0;

      trainingCompletionRate.set({ module_id: trainingModule.id }, completionRate);
    }

    // Calculate API error rates (for the last hour)
    // Placeholder implementation
    const endpoints = ['/api/users', '/api/training', '/api/leaderboard', '/api/calendar'];
    endpoints.forEach((endpoint) => {
      const errorRate = Math.random() * 0.05; // Random value under 5%
      apiErrorRate.set({ endpoint }, errorRate);
    });
  } catch (error) {
    console.error('Error updating metrics:', error);
  }
}

// Update metrics every 5 minutes
const metricsUpdateInterval = 5 * 60 * 1000;
let metricsTimer: NodeJS.Timeout | null = null;

// Start the metrics update timer
if (typeof global !== 'undefined' && !metricsTimer) {
  metricsTimer = setInterval(updateMetrics, metricsUpdateInterval);
  updateMetrics().catch(console.error);
}

// Middleware to track request metrics
export function trackRequestMetrics(req: NextRequest, res: NextResponse, startTime: number) {
  const method = req.method;
  const route = req.nextUrl.pathname;
  const status = res.status;
  const authenticated = req.headers.get('authorization') ? 'true' : 'false';
  const duration = (Date.now() - startTime) / 1000;

  httpRequestsTotal.inc({
    method,
    route,
    status,
    authenticated,
  });

  httpRequestDurationSeconds.observe(
    {
      method,
      route,
      status,
    },
    duration
  );
}

// Expose a function for tracking DB query performance
export function trackDbQuery(operation: string, model: string, duration: number) {
  dbQueryDurationSeconds.observe({ operation, model }, duration);
}

// This handler will expose Prometheus metrics
export async function GET(_req: NextRequest) {
  // Check if request is authorized
  const isAuthorized = _req.headers.get('x-metrics-auth') === process.env.METRICS_AUTH_TOKEN;
  const isLocalhost =
    _req.headers.get('host')?.includes('localhost') ||
    _req.headers.get('x-forwarded-for') === '127.0.0.1';

  if (!isAuthorized && !isLocalhost) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Collect and return all metrics
    const metrics = await register.metrics();
    return new NextResponse(metrics, {
      headers: {
        'Content-Type': register.contentType,
      },
    });
  } catch (error) {
    console.error('Error generating metrics:', error);
    return new NextResponse('Error generating metrics', { status: 500 });
  }
}
