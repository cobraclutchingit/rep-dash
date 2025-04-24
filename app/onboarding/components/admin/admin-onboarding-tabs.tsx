'use client';

import { ResourceType } from '@prisma/client';
import { useState } from 'react';

import AdminProgressTab, { Track as ProgressTrack, UserStat } from './admin-progress-tab';
import AdminResourcesTab from './admin-resources-tab';
import AdminStepsTab from './admin-steps-tab';
import AdminTracksTab from './admin-tracks-tab';

// Define complete Track interface that works with the admin-tracks-tab
// This needs to match the AdminTrackTab component's expectations
interface Track {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  forPositions: any[]; // Use any[] to avoid SalesPosition enum issues
  steps: {
    id: string;
    title: string;
    description: string;
    order: number;
    resources: any[];
  }[];
  updatedAt: string;
  _count: {
    steps: number;
  };
}

// Our local Resource interface needs to match the expected type in child components

interface Resource {
  id: string;
  title: string;
  description: string | null;
  type: ResourceType;
  url: string;
  isExternal: boolean;
}

interface AdminOnboardingTabsProps {
  tracks: Track[];
  resources: Resource[];
  userStats: UserStat[];
}

export default function AdminOnboardingTabs({
  tracks,
  resources,
  userStats,
}: AdminOnboardingTabsProps) {
  const [activeTab, setActiveTab] = useState('tracks');

  return (
    <div>
      <div className="mb-6 border-b">
        <div className="flex space-x-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('tracks')}
            className={`px-4 py-2 ${
              activeTab === 'tracks'
                ? 'border-primary border-b-2 font-medium'
                : 'text-muted-foreground'
            }`}
          >
            Tracks
          </button>
          <button
            onClick={() => setActiveTab('steps')}
            className={`px-4 py-2 ${
              activeTab === 'steps'
                ? 'border-primary border-b-2 font-medium'
                : 'text-muted-foreground'
            }`}
          >
            Steps
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-4 py-2 ${
              activeTab === 'resources'
                ? 'border-primary border-b-2 font-medium'
                : 'text-muted-foreground'
            }`}
          >
            Resources
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-4 py-2 ${
              activeTab === 'progress'
                ? 'border-primary border-b-2 font-medium'
                : 'text-muted-foreground'
            }`}
          >
            User Progress
          </button>
        </div>
      </div>

      <div>
        {activeTab === 'tracks' && <AdminTracksTab tracks={tracks} />}
        {activeTab === 'steps' && (
          <AdminStepsTab
            // Convert to expected format by selecting specific properties and adding trackId
            // Use type assertion to avoid strict property checking
            // This is safer than trying to create objects with every required property
            tracks={
              tracks.map((track) => ({
                id: track.id,
                name: track.name,
                isActive: track.isActive || false,
                steps: track.steps.map((step) => ({
                  ...step,
                  trackId: track.id,
                })),
              })) as any
            }
            resources={resources.map((res) => ({
              ...res,
              type: res.type as unknown as ResourceType,
            }))}
          />
        )}
        {activeTab === 'resources' && (
          <AdminResourcesTab
            resources={resources.map((res) => ({
              ...res,
              type: res.type as unknown as ResourceType,
            }))}
          />
        )}
        {activeTab === 'progress' && (
          <AdminProgressTab
            userStats={userStats}
            // Cast to ProgressTrack[] after mapping to match expected interface
            tracks={tracks.map((track) => ({
              id: track.id,
              name: track.name,
              steps: track.steps.map((step) => ({
                ...step,
                trackId: track.id,
              })),
            }))}
          />
        )}
      </div>
    </div>
  );
}
