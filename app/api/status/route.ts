import { NextRequest, NextResponse } from 'next/server';
import os from 'os';

import prisma from '@/lib/prisma';

interface DatabaseStats {
  version: string;
  db_size: string;
  active_connections: string;
  max_connections: string;
}

// Extended status endpoint with more detailed information
export async function GET(req: NextRequest) {
  try {
    // Check authorization
    // For security, we require an auth token for detailed system information
    const authToken = req.headers.get('x-status-auth');
    const isAuthorized = authToken === process.env.STATUS_AUTH_TOKEN;
    const isLocalhost =
      req.headers.get('host')?.includes('localhost') ||
      req.headers.get('x-forwarded-for') === '127.0.0.1';

    // Basic status is available without auth
    if (!isAuthorized && !isLocalhost) {
      return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV,
      });
    }

    // Begin timestamp for measuring response time
    const startTime = Date.now();

    // Get database status
    const dbStatus = await getDatabaseStatus();

    // Get system information
    const systemInfo = getSystemInfo();

    // Get application stats
    const appStats = await getApplicationStats();

    // Full status response
    const statusData = {
      status: dbStatus.status === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTime: `${Date.now() - startTime}ms`,
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV,
      database: dbStatus,
      system: systemInfo,
      application: appStats,
    };

    return NextResponse.json(statusData);
  } catch (error) {
    console.error('Status check failed:', error);

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Service unavailable',
        details:
          process.env.NODE_ENV === 'development' && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 503 }
    );
  }
}

// Get detailed database status
async function getDatabaseStatus() {
  try {
    // Run a simple query to check connection
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1 as alive`;
    const queryTime = Date.now() - start;

    // Get database stats
    const dbStats = await prisma.$queryRaw`
      SELECT
        pg_database_size(current_database()) as db_size,
        (SELECT count(*) FROM pg_stat_activity) as active_connections,
        (SELECT setting::integer FROM pg_settings WHERE name='max_connections') as max_connections,
        version() as version
    `;

    // Get table stats
    const tableStats = await prisma.$queryRaw`
      SELECT
        schemaname,
        relname as table_name,
        n_live_tup as row_count,
        pg_size_pretty(pg_total_relation_size('"' || schemaname || '"."' || relname || '"')) as total_size
      FROM pg_stat_user_tables
      ORDER BY n_live_tup DESC
      LIMIT 10
    `;

    return {
      status: 'connected',
      responseTime: `${queryTime}ms`,
      version: (dbStats as DatabaseStats[])[0].version,
      size: formatBytes(parseInt((dbStats as DatabaseStats[])[0].db_size)),
      connections: {
        active: parseInt((dbStats as DatabaseStats[])[0].active_connections),
        max: parseInt((dbStats as DatabaseStats[])[0].max_connections),
        usagePercent: (
          (parseInt((dbStats as DatabaseStats[])[0].active_connections) /
            parseInt((dbStats as DatabaseStats[])[0].max_connections)) *
          100
        ).toFixed(2),
      },
      tables: tableStats,
    };
  } catch (error) {
    console.error('Database status check failed:', error);
    return {
      status: 'error',
      error: 'Database connection failed',
      details:
        process.env.NODE_ENV === 'development' && error instanceof Error
          ? error.message
          : undefined,
    };
  }
}

// Get system information
function getSystemInfo() {
  const freeMem = os.freemem();
  const totalMem = os.totalmem();
  const uptime = os.uptime();

  const loadAvg = os.loadavg();
  const cpus = os.cpus();

  return {
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    release: os.release(),
    uptime: formatUptime(uptime),
    memory: {
      total: formatBytes(totalMem),
      free: formatBytes(freeMem),
      used: formatBytes(totalMem - freeMem),
      usagePercent: (((totalMem - freeMem) / totalMem) * 100).toFixed(2),
    },
    cpu: {
      model: cpus[0].model,
      cores: cpus.length,
      speed: `${cpus[0].speed} MHz`,
      loadAvg: loadAvg,
      loadPercent: ((loadAvg[0] / cpus.length) * 100).toFixed(2),
    },
    process: {
      pid: process.pid,
      nodeVersion: process.version,
      memory: {
        rss: formatBytes(process.memoryUsage().rss),
        heapTotal: formatBytes(process.memoryUsage().heapTotal),
        heapUsed: formatBytes(process.memoryUsage().heapUsed),
        external: formatBytes(process.memoryUsage().external),
        usagePercent: (
          (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) *
          100
        ).toFixed(2),
      },
      uptime: formatUptime(process.uptime()),
    },
  };
}

// Get application statistics
async function getApplicationStats() {
  try {
    // Count users
    const userCount = await prisma.user.count();
    const activeUserCount = await prisma.user.count({
      where: {
        lastLoginAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    // Count training modules
    const moduleCount = await prisma.trainingModule.count();
    const completedModuleCount = await prisma.trainingProgress.count({
      where: {
        status: 'COMPLETED',
      },
    });

    // Count events
    const eventCount = await prisma.calendarEvent.count();
    const upcomingEventCount = await prisma.calendarEvent.count({
      where: {
        startDate: {
          gte: new Date(),
        },
      },
    });

    // Count notifications
    const notificationCount = await prisma.notification.count();
    const unreadNotificationCount = await prisma.notification.count({
      where: {
        isRead: false,
      },
    });

    return {
      users: {
        total: userCount,
        active24h: activeUserCount,
        activePercent: ((activeUserCount / userCount) * 100).toFixed(2),
      },
      training: {
        modules: moduleCount,
        completed: completedModuleCount,
      },
      events: {
        total: eventCount,
        upcoming: upcomingEventCount,
      },
      notifications: {
        total: notificationCount,
        unread: unreadNotificationCount,
        unreadPercent: ((unreadNotificationCount / notificationCount) * 100).toFixed(2),
      },
    };
  } catch (error) {
    console.error('Application stats gathering failed:', error);
    return {
      error: 'Failed to gather application statistics',
    };
  }
}

// Format bytes to human-readable format
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Format uptime to human-readable format
function formatUptime(seconds: number) {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  let result = '';
  if (days > 0) result += `${days}d `;
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0) result += `${minutes}m `;
  result += `${secs}s`;

  return result;
}
