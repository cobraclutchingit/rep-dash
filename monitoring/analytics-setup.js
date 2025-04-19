// Analytics Setup for Rep Dashboard
// This file configures user behavior analytics using PostHog

import posthog from 'posthog-js';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

// PostHog API key from environment
const POSTHOG_API_KEY = process.env.NEXT_PUBLIC_POSTHOG_API_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

// Initialize PostHog for analytics
export const initAnalytics = () => {
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
    property_blacklist: [
      '$current_url',
      '$pathname',
      'password',
      'email',
      'username',
      'name',
    ],
  });

  console.log('PostHog initialized for analytics');
};

// Custom hook for page view tracking
export const usePageViewTracking = () => {
  const router = useRouter();

  useEffect(() => {
    // Only track page views if PostHog is available
    if (!POSTHOG_API_KEY || !posthog.__loaded) return;

    // Function to handle route changes
    const handleRouteChange = (url) => {
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
export const identifyUser = (user) => {
  if (!POSTHOG_API_KEY || !posthog.__loaded) return;

  if (user && user.id) {
    posthog.identify(user.id, {
      email: user.email,
      name: user.name,
      role: user.role,
      position: user.position,
      // Don't include sensitive information
    });
  } else {
    posthog.reset();
  }
};

// Track custom events with proper typing
export const trackEvent = (eventName, properties = {}) => {
  if (!POSTHOG_API_KEY || !posthog.__loaded) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] ${eventName}`, properties);
    }
    return;
  }

  // Define business-critical events for consistent tracking
  const validEvents = [
    // Auth events
    'user_login',
    'user_logout',
    'user_register',
    'password_reset_requested',
    
    // Training events
    'training_module_started',
    'training_module_completed',
    'quiz_completed',
    'certificate_earned',
    
    // Leaderboard events
    'leaderboard_viewed',
    'achievement_unlocked',
    
    // Calendar events
    'event_created',
    'event_registered',
    
    // Communication events
    'announcement_viewed',
    'notification_clicked',
    
    // Onboarding events
    'onboarding_step_completed',
    'onboarding_completed',
    
    // Feature usage
    'feature_used',
    'export_generated',
    'report_viewed',
    
    // Error events
    'error_encountered',
  ];

  // Validate event name
  if (!validEvents.includes(eventName) && !eventName.startsWith('custom_')) {
    console.warn(`Invalid event name: ${eventName}. Using custom_ prefix.`);
    eventName = `custom_${eventName}`;
  }

  // Capture the event with sanitized properties
  posthog.capture(eventName, {
    ...properties,
    timestamp: new Date().toISOString(),
  });
};

// Setup feature flags
export const useFeatureFlags = () => {
  const [flags, setFlags] = useState({});
  
  useEffect(() => {
    if (!POSTHOG_API_KEY || !posthog.__loaded) return;
    
    const handleFlagsLoaded = () => {
      const activeFlags = {};
      
      // Check common feature flags
      const flagsToCheck = [
        'new-dashboard-enabled',
        'advanced-reporting',
        'gamification-features',
        'enhanced-calendar',
        'ai-recommendations',
      ];
      
      flagsToCheck.forEach(flag => {
        activeFlags[flag] = posthog.isFeatureEnabled(flag);
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
export const trackFunnelStep = (funnel, step, properties = {}) => {
  if (!POSTHOG_API_KEY || !posthog.__loaded) return;
  
  trackEvent(`${funnel}_step`, {
    funnel,
    step,
    step_number: properties.step_number,
    ...properties
  });
};

export default {
  initAnalytics,
  usePageViewTracking,
  identifyUser,
  trackEvent,
  useFeatureFlags,
  trackFunnelStep,
};