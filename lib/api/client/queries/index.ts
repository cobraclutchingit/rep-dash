// Re-export all queries for simpler imports
export * from './user-queries';
export * from './communication-queries';
export * from './leaderboard-queries';

// Export index for easy module imports
export { apiClient } from '../api-client';
export { ReactQueryProvider } from '../query-client';
