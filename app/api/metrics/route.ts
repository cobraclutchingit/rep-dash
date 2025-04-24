import { NextRequest, NextResponse } from 'next/server';

import { register } from '@/lib/utils/metrics';

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