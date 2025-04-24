// Performance Monitoring for Rep Dashboard
// Tracks Web Vitals metrics and custom performance marks

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { getCLS, getFID, getLCP, getFCP, getTTFB, Metric } from 'web-vitals';

// Whether to enable performance tracking
const ENABLE_PERFORMANCE_MONITORING =
  process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING === 'true';

// Custom performance reporter function
const reportVitals = ({ name, delta, id, value }: Metric) => {
  // Skip if performance monitoring is disabled
  if (!ENABLE_PERFORMANCE_MONITORING) return;

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.warn(`Web Vitals: ${name}`, {
      value: Math.round(name === 'CLS' ? delta * 1000 : delta),
      metric: name,
      id,
    });
  }

  // Report to Sentry if available
  if (Sentry && Sentry.addBreadcrumb) {
    Sentry.addBreadcrumb({
      category: 'web-vitals',
      message: `${name}: ${value}`,
      data: {
        name,
        value: Math.round(value),
        delta,
        id,
      },
      level: value > getThresholdForMetric(name) ? 'warning' : 'info',
    });

    // If the value exceeds the "poor" threshold, capture as a performance issue
    if (value > getThresholdForMetric(name) * 1.5) {
      Sentry.captureMessage(`Poor ${name} performance detected: ${value}`, 'warning');
    }
  }

  // Send to analytics if configured
  if (typeof window !== 'undefined' && window.posthog && window.posthog.capture) {
    window.posthog.capture('web_vitals', {
      metric: name,
      value: Math.round(name === 'CLS' ? delta * 1000 : delta),
      page: window.location.pathname,
    });
  }

  // Send to server API for aggregation if needed
  fetch('/api/metrics/web-vitals', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      value,
      path: window.location.pathname,
    }),
    // Don't block page execution
    keepalive: true,
  }).catch((error: Error) => {
    console.error('Failed to report web vitals:', error);
  });
};

// Get threshold values for metrics based on Google's recommendations
const getThresholdForMetric = (name: string): number => {
  switch (name) {
    case 'CLS':
      return 0.1; // Good: 0-0.1, Poor: >0.25
    case 'FID':
      return 100; // Good: 0-100ms, Poor: >300ms
    case 'LCP':
      return 2500; // Good: 0-2.5s, Poor: >4s
    case 'FCP':
      return 1800; // Good: 0-1.8s, Poor: >3s
    case 'TTFB':
      return 800; // Good: 0-800ms, Poor: >1800ms
    default:
      return Number.POSITIVE_INFINITY;
  }
};

// Hook for measuring web vitals
export const useWebVitals = (): void => {
  useEffect(() => {
    if (!ENABLE_PERFORMANCE_MONITORING) return;

    // Measure Core Web Vitals
    getCLS(reportVitals);
    getFID(reportVitals);
    getLCP(reportVitals);
    getFCP(reportVitals);
    getTTFB(reportVitals);
  }, []);
};

// Measure custom performance marks
export const measurePerformance = <T>(name: string, fn: () => T): T => {
  if (!ENABLE_PERFORMANCE_MONITORING || typeof window === 'undefined' || !window.performance) {
    return fn();
  }

  const start = performance.now();
  const result = fn();

  // Handle promise results
  if (result instanceof Promise) {
    return result.finally(() => {
      const duration = performance.now() - start;
      reportCustomPerformance(name, duration);
    }) as T;
  }

  // Handle synchronous results
  const duration = performance.now() - start;
  reportCustomPerformance(name, duration);

  return result;
};

// Report custom performance measurement
const reportCustomPerformance = (name: string, duration: number): void => {
  // Skip if performance monitoring is disabled
  if (!ENABLE_PERFORMANCE_MONITORING) return;

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.warn(`Custom Performance: ${name}`, {
      duration: Math.round(duration),
      page: window.location.pathname,
    });
  }

  // Report to Sentry if available
  if (Sentry && Sentry.addBreadcrumb) {
    Sentry.addBreadcrumb({
      category: 'performance',
      message: `${name}: ${Math.round(duration)}ms`,
      data: {
        name,
        duration: Math.round(duration),
        page: window.location.pathname,
      },
      level: 'info',
    });
  }

  // Report to analytics if available
  if (typeof window !== 'undefined' && window.posthog && window.posthog.capture) {
    window.posthog.capture('custom_performance', {
      metric: name,
      duration: Math.round(duration),
      page: window.location.pathname,
    });
  }
};

// Track resource loading performance
export const trackResourceLoading = (): void => {
  if (!ENABLE_PERFORMANCE_MONITORING || typeof window === 'undefined' || !window.performance)
    return;

  window.addEventListener('load', () => {
    // Wait for page to fully load
    setTimeout(() => {
      // Use the Resource Timing API to get performance data
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

      // Group by resource type
      const resourceStats: Record<
        string,
        {
          count: number;
          totalSize: number;
          totalDuration: number;
          slowest: number;
          largest: number;
        }
      > = resources.reduce((acc, resource) => {
        const type = resource.initiatorType || 'other';

        if (!acc[type]) {
          acc[type] = {
            count: 0,
            totalSize: 0,
            totalDuration: 0,
            slowest: 0,
            largest: 0,
          };
        }

        const duration = resource.responseEnd - resource.startTime;
        const size = resource.transferSize || 0;

        acc[type].count++;
        acc[type].totalDuration += duration;
        acc[type].totalSize += size;
        acc[type].slowest = Math.max(acc[type].slowest, duration);
        acc[type].largest = Math.max(acc[type].largest, size);

        return acc;
      }, {});

      // Report resource loading stats
      if (Sentry && Sentry.setContext) {
        Sentry.setContext('resource_performance', resourceStats);
      }

      // Report slow resources (over 1 second)
      resources
        .filter((r) => r.responseEnd - r.startTime > 1000)
        .forEach((resource) => {
          reportCustomPerformance(
            `slow_resource_${resource.initiatorType}`,
            resource.responseEnd - resource.startTime
          );
        });
    }, 3000);
  });
};

// Track API call performance
export const measureApiCall = async <T>(
  endpoint: string,
  method: string,
  callback: () => Promise<T>
): Promise<T> => {
  return measurePerformance(`api_${method}_${endpoint}`, callback);
};

// Performance monitoring initialization
export const initPerformanceMonitoring = (): void => {
  if (!ENABLE_PERFORMANCE_MONITORING) {
    console.warn('Performance monitoring is disabled');
    return;
  }

  // Initialize performance tracking
  if (typeof window !== 'undefined') {
    // Track long tasks
    if (window.PerformanceObserver) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: PerformanceEntry & { duration: number }) => {
            // Report long tasks (over 50ms)
            if (entry.duration > 50) {
              reportCustomPerformance('long_task', entry.duration);
            }
          });
        });

        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        console.error('Long task monitoring not supported', e);
      }
    }

    // Track resource loading
    trackResourceLoading();
  }

  console.warn('Performance monitoring initialized');
};

// Named export object
const performanceMonitoring = {
  useWebVitals,
  measurePerformance,
  measureApiCall,
  initPerformanceMonitoring,
};

export default performanceMonitoring;
