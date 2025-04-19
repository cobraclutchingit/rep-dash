import React from "react";
import { LeaderboardProvider } from "./providers/leaderboard-provider";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard | Sales Rep Dashboard",
  description: "View sales achievements and rankings",
};

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LeaderboardProvider>
      {children}
    </LeaderboardProvider>
  );
}