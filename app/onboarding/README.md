# Onboarding System

This module provides a comprehensive "Getting Started" onboarding system for new sales representatives.

## Features

### User-facing Features

- **Welcome Sequence**: Introduces new users to the platform with step-by-step guidance
- **Onboarding Dashboard**: Shows users their progress and next steps
- **Task-based Flow**: Guides users through required and optional steps
- **Progress Visualization**: Visual indicators of completion status
- **Achievement Tracking**: Records completed steps and overall progress
- **Resource Integration**: Links to training materials, videos, and documentation

### Admin Features

- **Track Management**: Create and manage different onboarding tracks for different positions
- **Step Management**: Create, edit, and order onboarding steps
- **Resource Management**: Attach training materials and resources to steps
- **Progress Monitoring**: View and manage user progress through onboarding
- **Statistics and Analytics**: Track completion rates and identify bottlenecks

## Components

### User Components

- `onboarding-welcome.tsx`: Initial welcome experience for new users
- `onboarding-dashboard.tsx`: Main dashboard showing progress and steps
- `onboarding-step-detail.tsx`: Detailed view for completing individual steps
- `onboarding-step-item.tsx`: List item for steps in dashboard
- `onboarding-progress-bar.tsx`: Visual indicator of overall progress
- `onboarding-resource-item.tsx`: Resource item component for displaying attached resources
- `onboarding-stats.tsx`: Statistics about user's onboarding progress

### Admin Components

- `admin-onboarding-tabs.tsx`: Tab interface for the admin area
- `admin-tracks-tab.tsx`: Track management interface
- `admin-steps-tab.tsx`: Step creation and management interface
- `admin-resources-tab.tsx`: Resource management interface
- `admin-progress-tab.tsx`: User progress monitoring interface

### Provider

- `onboarding-provider.tsx`: Context provider for onboarding state management

## API Endpoints

### Onboarding Data

- `GET /api/onboarding`: Get user-specific onboarding data
- `GET /api/onboarding/analytics`: Get analytics data for onboarding progress

### Tracks

- `GET /api/onboarding/tracks`: Get all onboarding tracks
- `POST /api/onboarding/tracks`: Create a new track
- `GET /api/onboarding/tracks/[id]`: Get a specific track
- `PUT /api/onboarding/tracks/[id]`: Update a track
- `DELETE /api/onboarding/tracks/[id]`: Delete a track

### Steps

- `GET /api/onboarding/steps`: Get all steps (can filter by trackId)
- `POST /api/onboarding/steps`: Create a new step
- `GET /api/onboarding/steps/[stepId]`: Get a specific step
- `PUT /api/onboarding/steps/[stepId]`: Update a step
- `DELETE /api/onboarding/steps/[stepId]`: Delete a step

### Progress

- `POST /api/onboarding/steps/[stepId]/progress`: Update user progress on a step
- `DELETE /api/onboarding/steps/[stepId]/progress`: Reset user progress on a step
- `POST /api/onboarding/users/[userId]/steps/[stepId]/reset`: Admin endpoint to reset a user's progress

### Resources

- `GET /api/onboarding/resources`: Get all resources
- `POST /api/onboarding/resources`: Create a new resource
- `GET /api/onboarding/resources/[id]`: Get a specific resource
- `PUT /api/onboarding/resources/[id]`: Update a resource
- `DELETE /api/onboarding/resources/[id]`: Delete a resource

## Database Schema

The onboarding system uses the following Prisma models:

- `OnboardingTrack`: Represents a complete onboarding path
- `OnboardingStep`: Individual steps within a track
- `Resource`: Learning materials attached to steps
- `OnboardingProgress`: Tracks user progress on steps

## Permissions

Onboarding management is controlled by the `canManageOnboarding` permission check. By default, users with the `ADMIN` role or `MANAGER` position can manage the onboarding system.

Users can view their own onboarding progress, but only admins and managers can view everyone's progress.