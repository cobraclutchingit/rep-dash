"use client";

import React from "react";
import { useLeaderboard } from "../providers/leaderboard-provider";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend 
} from "recharts";

export default function LeaderboardStats() {
  const { activeLeaderboard, stats, getFilteredEntries, loading } = useLeaderboard();
  
  if (!activeLeaderboard || loading) {
    return (
      <div className="bg-card rounded-lg border p-4 animate-pulse min-h-[200px]">
        <div className="h-6 bg-muted rounded w-1/3 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted rounded h-24"></div>
          <div className="bg-muted rounded h-24"></div>
          <div className="bg-muted rounded h-24"></div>
        </div>
      </div>
    );
  }
  
  // Prepare data for the score distribution chart
  const entries = getFilteredEntries();
  const distributionData = generateScoreDistribution(entries);
  
  // Prepare performance timeline data (based on the top 5 performers)
  const timelineData = generateTimelineData(entries.slice(0, 5));
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Stats Cards */}
      <div className="bg-card rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">
          {activeLeaderboard.name} Statistics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Total Entries</div>
            <div className="text-2xl font-bold">{stats.totalEntries}</div>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Top Score</div>
            <div className="text-2xl font-bold">{stats.topScore.toLocaleString()}</div>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Average Score</div>
            <div className="text-2xl font-bold">
              {stats.averageScore.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
        
        {/* User Stats */}
        {stats.userRank && (
          <div className="mt-6 bg-primary/10 rounded-lg p-4">
            <h4 className="font-medium mb-2">Your Performance</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Your Rank</div>
                <div className="text-xl font-bold">#{stats.userRank}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Your Score</div>
                <div className="text-xl font-bold">{stats.userScore?.toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Score Distribution Chart */}
      <div className="bg-card rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Score Distribution</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distributionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(30,30,30,0.9)', 
                  border: 'none',
                  borderRadius: '4px',
                  color: '#fff'
                }} 
              />
              <Bar dataKey="count" fill="rgba(147, 51, 234, 0.8)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Timeline Chart */}
      {timelineData.length > 0 && (
        <div className="bg-card rounded-lg border p-6 col-span-1 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Performance Timeline (Top 5)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(30,30,30,0.9)', 
                    border: 'none',
                    borderRadius: '4px',
                    color: '#fff'
                  }} 
                />
                <Legend />
                {timelineData[0] && Object.keys(timelineData[0])
                  .filter(key => key !== 'period')
                  .map((key, index) => (
                    <Line 
                      key={key}
                      type="monotone" 
                      dataKey={key} 
                      stroke={getColorByIndex(index)} 
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  ))
                }
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to generate score distribution data
function generateScoreDistribution(entries: any[]) {
  if (entries.length === 0) return [];
  
  // Find the min and max scores to create ranges
  const scores = entries.map(entry => entry.score);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  
  // Create 5-10 buckets depending on the score range
  const bucketCount = Math.min(10, Math.max(5, Math.ceil((maxScore - minScore) / 100)));
  const bucketSize = (maxScore - minScore) / bucketCount;
  
  const buckets = Array(bucketCount).fill(0).map((_, i) => {
    const start = Math.floor(minScore + i * bucketSize);
    const end = Math.floor(minScore + (i + 1) * bucketSize);
    return {
      range: `${start}-${end}`,
      count: 0,
      start,
      end
    };
  });
  
  // Count scores in each bucket
  entries.forEach(entry => {
    const score = entry.score;
    const bucketIndex = Math.min(
      bucketCount - 1,
      Math.floor((score - minScore) / bucketSize)
    );
    buckets[bucketIndex].count++;
  });
  
  return buckets;
}

// Helper function to generate timeline data for top performers
function generateTimelineData(entries: any[]) {
  if (entries.length === 0) return [];
  
  // Create periods (assuming we have periodStart and periodEnd in each entry)
  const periodDates = entries.flatMap(entry => [
    new Date(entry.periodStart),
    new Date(entry.periodEnd)
  ]);
  
  // Sort dates and get unique periods
  const sortedDates = [...new Set(periodDates.map(d => d.toISOString().split('T')[0]))].sort();
  
  // Generate timeline data with user scores across periods
  const timelineData = sortedDates.map(period => {
    const result: any = { period };
    
    entries.forEach(entry => {
      const userName = entry.user?.name || `User ${entry.userId.slice(0, 4)}`;
      
      // Check if this entry spans this period
      const entryStart = new Date(entry.periodStart);
      const entryEnd = new Date(entry.periodEnd);
      const periodDate = new Date(period);
      
      if (periodDate >= entryStart && periodDate <= entryEnd) {
        result[userName] = entry.score;
      }
    });
    
    return result;
  });
  
  return timelineData;
}

// Helper function to get a color by index
function getColorByIndex(index: number) {
  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe',
    '#00C49F', '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57'
  ];
  return colors[index % colors.length];
}