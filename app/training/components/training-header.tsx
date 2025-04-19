"use client";

import Link from "next/link";

interface TrainingHeaderProps {
  totalModules: number;
  completedModules: number;
  inProgressModules: number;
  progressPercentage: number;
}

export default function TrainingHeader({
  totalModules,
  completedModules,
  inProgressModules,
  progressPercentage,
}: TrainingHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Training Portal</h1>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <Link
            href="/training/my-progress"
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80"
          >
            My Progress
          </Link>
          <Link
            href="/training/certificates"
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80"
          >
            Certificates
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card text-card-foreground rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Overall Progress</h3>
          <div className="w-full bg-secondary rounded-full h-4 mb-2">
            <div 
              className="bg-primary h-4 rounded-full" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className="text-2xl font-bold">{progressPercentage}%</p>
        </div>
        
        <div className="bg-card text-card-foreground rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Modules</h3>
          <p className="text-2xl font-bold">{totalModules}</p>
        </div>
        
        <div className="bg-card text-card-foreground rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Completed</h3>
          <p className="text-2xl font-bold">{completedModules}</p>
        </div>
        
        <div className="bg-card text-card-foreground rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">In Progress</h3>
          <p className="text-2xl font-bold">{inProgressModules}</p>
        </div>
      </div>
    </div>
  );
}