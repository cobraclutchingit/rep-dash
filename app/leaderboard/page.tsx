import { Metadata } from 'next';

import LeaderboardFilters from './components/leaderboard-filters';
import LeaderboardStats from './components/leaderboard-stats';
import LeaderboardTable from './components/leaderboard-table';
import UserAchievements from './components/user-achievements';

export const metadata: Metadata = {
  title: 'Leaderboard | Sales Rep Dashboard',
  description: 'View sales achievements and rankings',
};

export default function LeaderboardPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">Leaderboard</h1>

      {/* Leaderboard Filters */}
      <LeaderboardFilters />

      {/* Leaderboard Statistics */}
      <LeaderboardStats />

      {/* Leaderboard Table */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Performance Rankings</h2>
        </div>
        <LeaderboardTable />
      </div>

      {/* User Achievements */}
      <UserAchievements />
    </div>
  );
}
