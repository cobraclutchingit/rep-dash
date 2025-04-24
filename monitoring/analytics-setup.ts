import { useRouter } from 'next/router';
import { Session } from 'next-auth';
import posthog from 'posthog-js';
import { useEffect, useState } from 'react';

// PostHog API key from environment
const POSTHOG_API_KEY = process.env.NEXT_PUBLIC_POSTHOG_API_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

// Initialize PostHog for analytics
export const initAnalytics = (): void => {
  if (!POSTHOG_API_KEY) {
    console.warn('PostHog API key not found. Analytics tracking is disabled.');
    return;
  }

  posthog.init(POSTHOG_API_KEY, {
    api_host: POSTHOG_HOST,
    // Disable in development by default
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') {
        posthog.opt_out_capturing();
      }
    },
    capture_pageview: false, // We'll handle this manually
    persistence: 'localStorage',
    autocapture: false, // We'll be explicit about what we track
    disable_session_recording: process.env.NODE_ENV !== 'production',
    property_blacklist: ['$current_url', '$pathname', 'password', 'email', 'username', 'name'],
  });

  console.warn('PostHog initialized for analytics');
};

// Custom hook for page view tracking
export const usePageViewTracking = (): void => {
  const router = useRouter();

  useEffect(() => {
    // Only track page views if PostHog is available
    if (!POSTHOG_API_KEY || !posthog.__loaded) return;

    // Function to handle route changes
    const handleRouteChange = (url: string) => {
      // Don't track page views in development
      if (process.env.NODE_ENV === 'development') return;

      posthog.capture('$pageview', {
        $current_url: url,
        path: url.split('?')[0],
      });
    };

    // Track initial page load
    handleRouteChange(router.asPath);

    // Listen for route changes
    router.events.on('routeChangeComplete', handleRouteChange);

    // Clean up event listener
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);
};

// Track authenticated user
export const identifyUser = (user: Session['user'] | null): void => {
  if (!POSTHOG_API_KEY || !posthog.__loaded) return;

  if (user && user.id) {
    posthog.identify(user.id, {
      email: user.email,
      name: user.name,
      role: user.role,
      position: user.position,
    });
  } else {
    posthog.reset();
  }
};

// Track custom events with proper typing
export const trackEvent = (eventName: string, properties: Record<string, unknown> = {}): void => {
  if (!POSTHOG_API_KEY || !posthog.__loaded) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Analytics] ${eventName}`, properties);
    }
    return;
  }

  // Define business-critical events for consistent tracking
  const validEvents = [
    'user_login',
    'user_logout',
    'user_register',
    'password_reset_requested',
    'training_module_started',
    'training_module_completed',
    'quiz_completed',
    'certificate_earned',
    'leaderboard_viewed',
    'achievement_unlocked',
    'event_created',
    'event_registered',
    'announcement_viewed',
    'notification_clicked',
    'onboarding_step_completed',
    'onboarding_completed',
    'feature_used',
    'export_generated',
    'report_viewed',
    'error_encountered',
  ];

  // Validate event name
  let validatedEventName = eventName;
  if (!validEvents.includes(eventName) && !eventName.startsWith('custom_')) {
    console.warn(`Invalid event name: ${eventName}. Using custom_ prefix.`);
    validatedEventName = `custom_${eventName}`;
  }

  // Capture the event with sanitized properties
  posthog.capture(validatedEventName, {
    ...properties,
    timestamp: new Date().toISOString(),
  });
};

// Setup feature flags
export const useFeatureFlags = (): Record<string, boolean> => {
  const [flags, setFlags] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!POSTHOG_API_KEY || !posthog.__loaded) return;

    const handleFlagsLoaded = () => {
      const activeFlags: Record<string, boolean> = {};

      // Check common feature flags
      const flagsToCheck = [
        'new-dashboard-enabled',
        'advanced-reporting',
        'gamification-features',
        'enhanced-calendar',
        'ai-recommendations',
      ];

      flagsToCheck.forEach((flag) => {
        activeFlags[flag] = !!posthog.isFeatureEnabled(flag);
      });

      setFlags(activeFlags);
    };

    posthog.onFeatureFlags(handleFlagsLoaded);

    // Load flags
    if (posthog.isFeatureEnabled) {
      handleFlagsLoaded();
    } else {
      posthog.loadFeatureFlags();
    }

    return () => {
      // Clean up
      posthog.off('feature_flags_loaded');
    };
  }, []);

  return flags;
};

// Funnel tracking helper
export const trackFunnelStep = (
  funnel: string,
  step: string,
  properties: Record<string, unknown> = {}
): void => {
  if (!POSTHOG_API_KEY || !posthog.__loaded) return;

  trackEvent(`${funnel}_step`, {
    funnel,
    step,
    step_number: properties.step_number,
    ...properties,
  });
};

// Named export object
const analytics = {
  initAnalytics,
  usePageViewTracking,
  identifyUser,
  trackEvent,
  useFeatureFlags,
  trackFunnelStep,
};

export default analytics;
