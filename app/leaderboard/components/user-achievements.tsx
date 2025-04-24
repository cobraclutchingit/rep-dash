'use client';

import Image from 'next/image';
import { useSession } from 'next-auth/react';
import React, { useState, useEffect } from 'react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  badgeImageUrl: string | null;
  points: number;
  isSecret: boolean;
  awardedAt: string;
}

export default function UserAchievements() {
  const { data: session } = useSession();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserAchievements = async () => {
      if (!session?.user) return;

      try {
        const response = await fetch('/api/achievements/user');

        if (!response.ok) {
          throw new Error('Failed to fetch achievements');
        }

        const data = await response.json();
        setAchievements(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load achievements');
        console.error('Error fetching achievements:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAchievements();
  }, [session]);

  if (loading) {
    return (
      <div>
        <h2 className="mb-4 text-xl font-semibold">Your Achievements</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card animate-pulse rounded-lg p-6 shadow">
              <div className="mb-4 flex items-center">
                <div className="bg-muted mr-4 h-12 w-12 rounded-full"></div>
                <div>
                  <div className="bg-muted mb-2 h-4 w-24 rounded"></div>
                  <div className="bg-muted h-3 w-16 rounded"></div>
                </div>
              </div>
              <div className="bg-muted mb-2 h-3 w-full rounded"></div>
              <div className="bg-muted h-3 w-3/4 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2 className="mb-4 text-xl font-semibold">Your Achievements</h2>
        <div className="bg-destructive/10 text-destructive rounded-lg p-4">
          <p>Error loading achievements: {error}</p>
        </div>
      </div>
    );
  }

  if (achievements.length === 0) {
    return (
      <div>
        <h2 className="mb-4 text-xl font-semibold">Your Achievements</h2>
        <div className="bg-card text-card-foreground rounded-lg border p-8 text-center">
          <div className="mb-3 text-4xl">🏅</div>
          <h3 className="mb-2 text-lg font-medium">No Achievements Yet</h3>
          <p className="text-muted-foreground">
            Keep up the good work and you&apos;ll earn achievements soon!
          </p>
        </div>
      </div>
    );
  }

  // Helper to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get badge emoji based on achievement name
  const getBadgeEmoji = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('top') || lowerName.includes('best')) return '🏆';
    if (lowerName.includes('star')) return '⭐';
    if (lowerName.includes('rocket') || lowerName.includes('fast')) return '🚀';
    if (lowerName.includes('perfect')) return '💯';
    if (lowerName.includes('gold')) return '🥇';
    if (lowerName.includes('silver')) return '🥈';
    if (lowerName.includes('bronze')) return '🥉';
    if (lowerName.includes('first')) return '1️⃣';
    if (lowerName.includes('level')) return '🎮';
    return '🌟';
  };

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Your Achievements</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {achievements.map((achievement) => (
          <div key={achievement.id} className="bg-card text-card-foreground rounded-lg p-6 shadow">
            <div className="mb-4 flex items-center">
              <div className="bg-primary/20 text-primary mr-4 rounded-full p-3 text-xl">
                {achievement.badgeImageUrl ? (
                  <Image
                    src={achievement.badgeImageUrl}
                    alt={achievement.name}
                    width={24}
                    height={24}
                  />
                ) : (
                  getBadgeEmoji(achievement.name)
                )}
              </div>
              <div>
                <h3 className="font-semibold">{achievement.name}</h3>
                <p className="text-muted-foreground text-xs">
                  Awarded {formatDate(achievement.awardedAt)}
                </p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">{achievement.description}</p>
            <div className="mt-4 text-right">
              <span className="bg-primary/10 text-primary rounded-full px-2 py-1 text-xs">
                +{achievement.points} points
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
