"use client";

import { useState } from "react";
import AdminTracksTab from "./admin-tracks-tab";
import AdminStepsTab from "./admin-steps-tab";
import AdminProgressTab from "./admin-progress-tab";
import AdminResourcesTab from "./admin-resources-tab";

interface AdminOnboardingTabsProps {
  tracks: any[];
  resources: any[];
  userStats: any[];
}

export default function AdminOnboardingTabs({ 
  tracks, 
  resources,
  userStats,
}: AdminOnboardingTabsProps) {
  const [activeTab, setActiveTab] = useState("tracks");
  
  return (
    <div>
      <div className="border-b mb-6">
        <div className="flex space-x-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab("tracks")}
            className={`px-4 py-2 ${
              activeTab === "tracks"
                ? "border-b-2 border-primary font-medium"
                : "text-muted-foreground"
            }`}
          >
            Tracks
          </button>
          <button
            onClick={() => setActiveTab("steps")}
            className={`px-4 py-2 ${
              activeTab === "steps"
                ? "border-b-2 border-primary font-medium"
                : "text-muted-foreground"
            }`}
          >
            Steps
          </button>
          <button
            onClick={() => setActiveTab("resources")}
            className={`px-4 py-2 ${
              activeTab === "resources"
                ? "border-b-2 border-primary font-medium"
                : "text-muted-foreground"
            }`}
          >
            Resources
          </button>
          <button
            onClick={() => setActiveTab("progress")}
            className={`px-4 py-2 ${
              activeTab === "progress"
                ? "border-b-2 border-primary font-medium"
                : "text-muted-foreground"
            }`}
          >
            User Progress
          </button>
        </div>
      </div>
      
      <div>
        {activeTab === "tracks" && <AdminTracksTab tracks={tracks} />}
        {activeTab === "steps" && <AdminStepsTab tracks={tracks} resources={resources} />}
        {activeTab === "resources" && <AdminResourcesTab resources={resources} />}
        {activeTab === "progress" && <AdminProgressTab userStats={userStats} tracks={tracks} />}
      </div>
    </div>
  );
}