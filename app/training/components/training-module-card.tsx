"use client";

import Link from "next/link";
import { TrainingModule, TrainingProgress } from "@prisma/client";

interface TrainingModuleCardProps {
  module: TrainingModule;
  progress?: TrainingProgress;
}

export default function TrainingModuleCard({ module, progress }: TrainingModuleCardProps) {
  // Determine module status and styling
  const moduleStatus = progress?.status || "NOT_STARTED";
  
  const statusBadge = {
    NOT_STARTED: "bg-secondary text-secondary-foreground",
    IN_PROGRESS: "bg-amber-500/10 text-amber-500",
    COMPLETED: "bg-green-500/10 text-green-500",
  }[moduleStatus];
  
  const statusText = {
    NOT_STARTED: "Not Started",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
  }[moduleStatus];
  
  // Calculate the content icon based on category
  const categoryIcons = {
    ONBOARDING: "🚀",
    TECHNOLOGY: "💻",
    APPOINTMENT_SETTING: "📅",
    SALES_PROCESS: "🤝",
    PRODUCT_KNOWLEDGE: "📚",
    COMPLIANCE: "⚖️",
    SALES_SKILLS: "🎯",
    LEADERSHIP: "👑",
    CUSTOMER_SERVICE: "🛎️",
  };
  
  const icon = categoryIcons[module.category] || "📝";
  
  return (
    <div className="bg-card text-card-foreground rounded-lg shadow overflow-hidden transition-all duration-200 hover:shadow-md">
      <div className="h-40 bg-secondary flex items-center justify-center">
        <span className="text-4xl">{icon}</span>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg">{module.title}</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${statusBadge}`}>
            {statusText}
          </span>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {module.description}
        </p>
        
        {progress && moduleStatus === "IN_PROGRESS" && (
          <div className="mb-3">
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
        
        <div className="flex justify-between items-center mb-4">
          {module.isRequired && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              Required
            </span>
          )}
          {module.estimatedDuration && (
            <span className="text-xs text-muted-foreground">
              {module.estimatedDuration} min
            </span>
          )}
        </div>
        
        <Link 
          href={`/training/modules/${module.id}`}
          className="block w-full text-center py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium"
        >
          {moduleStatus === "NOT_STARTED" 
            ? "Start Module" 
            : moduleStatus === "IN_PROGRESS" 
              ? "Continue" 
              : "Review Module"}
        </Link>
      </div>
    </div>
  );
}