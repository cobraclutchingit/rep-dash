"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

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
        const response = await fetch("/api/achievements/user");
        
        if (!response.ok) {
          throw new Error("Failed to fetch achievements");
        }
        
        const data = await response.json();
        setAchievements(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load achievements");
        console.error("Error fetching achievements:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAchievements();
  }, [session]);

  if (loading) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Achievements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-lg shadow p-6 animate-pulse">
              <div className="flex items-center mb-4">
                <div className="bg-muted rounded-full h-12 w-12 mr-4"></div>
                <div>
                  <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-16"></div>
                </div>
              </div>
              <div className="h-3 bg-muted rounded w-full mb-2"></div>
              <div className="h-3 bg-muted rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Achievements</h2>
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          <p>Error loading achievements: {error}</p>
        </div>
      </div>
    );
  }

  if (achievements.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Achievements</h2>
        <div className="bg-card text-card-foreground rounded-lg p-8 text-center border">
          <div className="text-4xl mb-3">🏅</div>
          <h3 className="text-lg font-medium mb-2">No Achievements Yet</h3>
          <p className="text-muted-foreground">
            Keep up the good work and you'll earn achievements soon!
          </p>
        </div>
      </div>
    );
  }

  // Helper to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get badge emoji based on achievement name
  const getBadgeEmoji = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("top") || lowerName.includes("best")) return "🏆";
    if (lowerName.includes("star")) return "⭐";
    if (lowerName.includes("rocket") || lowerName.includes("fast")) return "🚀";
    if (lowerName.includes("perfect")) return "💯";
    if (lowerName.includes("gold")) return "🥇";
    if (lowerName.includes("silver")) return "🥈";
    if (lowerName.includes("bronze")) return "🥉";
    if (lowerName.includes("first")) return "1️⃣";
    if (lowerName.includes("level")) return "🎮";
    return "🌟";
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Your Achievements</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievements.map((achievement) => (
          <div key={achievement.id} className="bg-card text-card-foreground rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="bg-primary/20 text-primary rounded-full p-3 mr-4 text-xl">
                {achievement.badgeImageUrl ? (
                  <img
                    src={achievement.badgeImageUrl}
                    alt={achievement.name}
                    className="h-6 w-6"
                  />
                ) : (
                  getBadgeEmoji(achievement.name)
                )}
              </div>
              <div>
                <h3 className="font-semibold">{achievement.name}</h3>
                <p className="text-xs text-muted-foreground">
                  Awarded {formatDate(achievement.awardedAt)}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{achievement.description}</p>
            <div className="mt-4 text-right">
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                +{achievement.points} points
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}