import { NextRequest, NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

// Record the app start time for uptime tracking
const startTime = new Date();

// Health check endpoint
export async function GET(_req: NextRequest) {
  try {
    // Check database connection
    const dbStatus = await checkDatabase();

    // Check system info
    const memory = process.memoryUsage();
    const uptime = Math.floor((Date.now() - startTime.getTime()) / 1000);

    // Gather health data
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime,
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV,
      database: dbStatus,
      memory: {
        rss: formatBytes(memory.rss),
        heapTotal: formatBytes(memory.heapTotal),
        heapUsed: formatBytes(memory.heapUsed),
        external: formatBytes(memory.external),
        arrayBuffers: formatBytes(memory.arrayBuffers || 0),
      },
    };

    return NextResponse.json(healthData);
  } catch (error) {
    console.error('Health check failed:', error);

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

// Check database connection
async function checkDatabase() {
  try {
    // Run a simple query to check connection
    await prisma.$queryRaw`SELECT 1 as alive`;

    // NOTE: $metrics is not standard in Prisma. Commenting out for now.
    // If you have a custom metrics setup, adjust accordingly.
    // const poolStats = await prisma.$metrics.prometheus();
    // const poolInfo = poolStats
    //   .split('\n')
    //   .filter((line: string) => line.startsWith('prisma_client_queries_'))
    //   .reduce((acc: Record<string, number>, line: string) => {
    //     const parts = line.split(' ');
    //     if (parts.length >= 2) {
    //       const metricName = parts[0].split('{')[0];
    //       const value = parseFloat(parts[parts.length - 1]);
    //       acc[metricName] = value;
    //     }
    //     return acc;
    //   }, {});

    return {
      status: 'connected',
      // poolStats: poolInfo,
    };
  } catch (error) {
    console.error('Database health check failed:', error);
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

// Format bytes to human-readable format
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
