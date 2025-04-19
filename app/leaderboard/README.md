# Leaderboard System

This module provides a comprehensive leaderboard system for the sales web application.

## Features

### User-facing Features

- **Multiple Board Types**: Different leaderboards for various performance metrics (Appointment Setters, Closers, etc.)
- **Time Period Filtering**: View leaderboards by daily, weekly, monthly, quarterly, or yearly periods
- **Dynamic Filtering**: Filters for positions, date ranges, and search functionality
- **Visual Indicators**: Distinct styling for top performers and the current user
- **Performance Charts**: Visualizations for score distribution and performance timeline
- **Achievements**: Display of user achievements with badges and points

### Admin Features

- **Leaderboard Management**: Interface for creating and configuring different types of leaderboards
- **Score Entry System**: Individual entry form and bulk import functionality
- **Custom Metrics**: Ability to track multiple performance metrics beyond the main score
- **Period Management**: Date range selection for performance periods
- **User Progress Monitoring**: Track and visualize user performance over time

## Components

### User Components

- `leaderboard-table.tsx`: Modern data grid presentation of rankings using TanStack Table
- `leaderboard-filters.tsx`: Comprehensive filtering options for leaderboard data
- `leaderboard-stats.tsx`: Performance statistics and visualizations using Recharts
- `user-achievements.tsx`: Display of user achievements and badges

### Admin Components

- `leaderboard-form.tsx`: Form for creating and editing leaderboards
- `entry-form.tsx`: Form for adding or editing individual leaderboard entries
- `bulk-import-form.tsx`: Interface for importing multiple entries via CSV

### Provider

- `leaderboard-provider.tsx`: Context provider for leaderboard state management

## API Endpoints

### Leaderboards

- `GET /api/leaderboard`: Get all visible leaderboards for the user
- `POST /api/leaderboard`: Create a new leaderboard
- `GET /api/leaderboard/[id]`: Get a specific leaderboard
- `PUT /api/leaderboard/[id]`: Update a leaderboard
- `DELETE /api/leaderboard/[id]`: Delete a leaderboard

### Entries

- `GET /api/leaderboard/[id]/entries`: Get entries for a specific leaderboard
- `POST /api/leaderboard/[id]/entries`: Add an entry to a leaderboard
- `POST /api/leaderboard/[id]/entries/bulk`: Bulk import entries via CSV
- `GET /api/leaderboard/entries/[entryId]`: Get a specific entry
- `PUT /api/leaderboard/entries/[entryId]`: Update an entry
- `DELETE /api/leaderboard/entries/[entryId]`: Delete an entry

### Achievements

- `GET /api/achievements/user`: Get achievements for the current user

## Database Schema

The leaderboard system uses the following models:

- `Leaderboard`: Defines leaderboard types, periods, and visibility settings
- `LeaderboardEntry`: Records scores and metrics for users on specific leaderboards
- `Achievement`: Defines badges and rewards for accomplishments
- `UserAchievement`: Tracks achievements awarded to users

## Permissions

Leaderboard management is controlled by the `canManageLeaderboards` permission check. By default, users with the `ADMIN` role or `MANAGER` position can manage leaderboards.

Regular users can view leaderboards that are:
1. Active
2. Either have no position restrictions or match the user's position