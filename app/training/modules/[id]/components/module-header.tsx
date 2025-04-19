"use client";

import Link from "next/link";
import { TrainingModule, TrainingProgress } from "@prisma/client";

interface ModuleHeaderProps {
  module: TrainingModule & {
    sections: any[];
    prerequisites: any[];
  };
  progress: TrainingProgress;
  prerequisitesMet: boolean;
}

export default function ModuleHeader({ 
  module, 
  progress,
  prerequisitesMet 
}: ModuleHeaderProps) {
  const categoryText = module.category.replace(/_/g, " ");
  
  return (
    <div className="mb-8">
      <div className="flex items-center mb-2 space-x-2">
        <Link 
          href="/training" 
          className="text-muted-foreground hover:text-foreground"
        >
          Training
        </Link>
        <span className="text-muted-foreground">/</span>
        <span>{module.title}</span>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{module.title}</h1>
        
        {prerequisitesMet && progress.status === "COMPLETED" && (
          <div className="mt-4 md:mt-0">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/10 text-green-500">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 mr-1" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                  clipRule="evenodd" 
                />
              </svg>
              Completed on {progress.completedAt ? new Date(progress.completedAt).toLocaleDateString() : ""}
            </span>
          </div>
        )}
      </div>
      
      <div className="bg-card text-card-foreground rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Category</h3>
            <p className="font-medium">{categoryText}</p>
          </div>
          
          {module.estimatedDuration && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Duration</h3>
              <p className="font-medium">{module.estimatedDuration} minutes</p>
            </div>
          )}
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
            <div className="flex items-center">
              <StatusIndicator status={progress.status} />
              <span className="ml-2 font-medium">
                {progress.status === "NOT_STARTED" 
                  ? "Not Started" 
                  : progress.status === "IN_PROGRESS" 
                    ? "In Progress" 
                    : "Completed"}
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
          <p className="text-sm">{module.description}</p>
        </div>
        
        {progress.status === "IN_PROGRESS" && prerequisitesMet && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Progress</h3>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full" 
                style={{ width: `${progress.percentComplete}%` }}
              ></div>
            </div>
            <p className="text-xs text-right mt-1 text-muted-foreground">
              {Math.round(progress.percentComplete)}% complete
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusIndicator({ status }: { status: string }) {
  let bgColor = "bg-secondary";
  
  if (status === "IN_PROGRESS") {
    bgColor = "bg-amber-500";
  } else if (status === "COMPLETED") {
    bgColor = "bg-green-500";
  }
  
  return <div className={`${bgColor} h-3 w-3 rounded-full`}></div>;
}