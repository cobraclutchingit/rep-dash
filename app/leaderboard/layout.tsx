import { Metadata } from 'next';
import React from 'react';

import { LeaderboardProvider } from './providers/leaderboard-provider';

export const metadata: Metadata = {
  title: 'Leaderboard | Sales Rep Dashboard',
  description: 'View sales achievements and rankings',
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return <LeaderboardProvider>{children}</LeaderboardProvider>;
}
