'use client';

import Link from 'next/link';

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
      <div className="mb-6 flex flex-col justify-between md:flex-row md:items-center">
        <h1 className="text-3xl font-bold">Training Portal</h1>
        <div className="mt-4 flex space-x-2 md:mt-0">
          <Link
            href="/training/my-progress"
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md px-4 py-2 text-sm font-medium"
          >
            My Progress
          </Link>
          <Link
            href="/training/certificates"
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md px-4 py-2 text-sm font-medium"
          >
            Certificates
          </Link>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="bg-card text-card-foreground rounded-lg p-6 shadow">
          <h3 className="text-muted-foreground mb-2 text-sm font-medium">Overall Progress</h3>
          <div className="bg-secondary mb-2 h-4 w-full rounded-full">
            <div
              className="bg-primary h-4 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className="text-2xl font-bold">{progressPercentage}%</p>
        </div>

        <div className="bg-card text-card-foreground rounded-lg p-6 shadow">
          <h3 className="text-muted-foreground mb-2 text-sm font-medium">Total Modules</h3>
          <p className="text-2xl font-bold">{totalModules}</p>
        </div>

        <div className="bg-card text-card-foreground rounded-lg p-6 shadow">
          <h3 className="text-muted-foreground mb-2 text-sm font-medium">Completed</h3>
          <p className="text-2xl font-bold">{completedModules}</p>
        </div>

        <div className="bg-card text-card-foreground rounded-lg p-6 shadow">
          <h3 className="text-muted-foreground mb-2 text-sm font-medium">In Progress</h3>
          <p className="text-2xl font-bold">{inProgressModules}</p>
        </div>
      </div>
    </div>
  );
}
