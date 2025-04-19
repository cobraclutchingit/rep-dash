"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { SalesPosition } from "@prisma/client";

// Define types for our onboarding data
export interface OnboardingTrack {
  id: string;
  name: string;
  description: string;
  forPositions: SalesPosition[];
  isActive: boolean;
  steps: OnboardingStep[];
}

export interface OnboardingStep {
  id: string;
  trackId: string;
  title: string;
  description: string;
  instructions?: string | null;
  order: number;
  estimatedDuration?: number | null;
  isRequired: boolean;
  resources: Resource[];
  progress?: OnboardingProgress | null;
}

export interface Resource {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  url: string;
  isExternal: boolean;
}

export interface OnboardingProgress {
  id: string;
  userId: string;
  stepId: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  startedAt?: Date | null;
  completedAt?: Date | null;
  notes?: string | null;
}

export interface OnboardingStats {
  totalSteps: number;
  completedSteps: number;
  inProgressSteps: number;
  notStartedSteps: number;
  percentComplete: number;
  estimatedTimeRemaining: number;
}

// Define the provider context type
interface OnboardingContextType {
  activeTrack: OnboardingTrack | null;
  activeStep: OnboardingStep | null;
  steps: OnboardingStep[];
  stats: OnboardingStats;
  loading: boolean;
  error: string | null;
  setActiveTrack: (track: OnboardingTrack | null) => void;
  setActiveStep: (step: OnboardingStep | null) => void;
  fetchUserOnboarding: () => Promise<void>;
  startStep: (stepId: string) => Promise<void>;
  completeStep: (stepId: string, notes?: string) => Promise<void>;
  resetStep: (stepId: string) => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [activeTrack, setActiveTrack] = useState<OnboardingTrack | null>(null);
  const [activeStep, setActiveStep] = useState<OnboardingStep | null>(null);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<OnboardingStats>({
    totalSteps: 0,
    completedSteps: 0,
    inProgressSteps: 0,
    notStartedSteps: 0,
    percentComplete: 0,
    estimatedTimeRemaining: 0,
  });

  // Fetch user onboarding data
  const fetchUserOnboarding = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/onboarding");
      
      if (!response.ok) {
        throw new Error("Failed to fetch onboarding data");
      }
      
      const data = await response.json();
      setActiveTrack(data.track);
      setSteps(data.steps);
      
      // Calculate stats
      const totalSteps = data.steps.length;
      const completedSteps = data.steps.filter((step: OnboardingStep) => 
        step.progress?.status === "COMPLETED"
      ).length;
      const inProgressSteps = data.steps.filter((step: OnboardingStep) => 
        step.progress?.status === "IN_PROGRESS"
      ).length;
      const notStartedSteps = totalSteps - completedSteps - inProgressSteps;
      
      // Calculate percent complete
      const percentComplete = totalSteps > 0 
        ? Math.round((completedSteps / totalSteps) * 100) 
        : 0;
      
      // Calculate estimated time remaining
      const remainingSteps = data.steps.filter((step: OnboardingStep) => 
        step.progress?.status !== "COMPLETED"
      );
      const estimatedTimeRemaining = remainingSteps.reduce(
        (total: number, step: OnboardingStep) => total + (step.estimatedDuration || 0), 
        0
      );
      
      setStats({
        totalSteps,
        completedSteps,
        inProgressSteps,
        notStartedSteps,
        percentComplete,
        estimatedTimeRemaining,
      });
      
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setLoading(false);
    }
  };

  // Start an onboarding step
  const startStep = async (stepId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/onboarding/steps/${stepId}/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to start step");
      }
      
      // Refresh onboarding data
      await fetchUserOnboarding();
      
      // If we have an active step, update its progress status
      if (activeStep && activeStep.id === stepId) {
        setActiveStep({
          ...activeStep,
          progress: {
            ...(activeStep.progress || { 
              id: "", 
              userId: "", 
              stepId, 
              status: "NOT_STARTED" 
            }),
            status: "IN_PROGRESS",
            startedAt: new Date(),
          },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setLoading(false);
    }
  };

  // Complete an onboarding step
  const completeStep = async (stepId: string, notes?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/onboarding/steps/${stepId}/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          status: "COMPLETED",
          notes: notes || null,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to complete step");
      }
      
      // Refresh onboarding data
      await fetchUserOnboarding();
      
      // If we have an active step, update its progress status
      if (activeStep && activeStep.id === stepId) {
        setActiveStep({
          ...activeStep,
          progress: {
            ...(activeStep.progress || { 
              id: "", 
              userId: "", 
              stepId, 
              status: "NOT_STARTED" 
            }),
            status: "COMPLETED",
            completedAt: new Date(),
            notes: notes || null,
          },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setLoading(false);
    }
  };

  // Reset an onboarding step
  const resetStep = async (stepId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/onboarding/steps/${stepId}/progress`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to reset step");
      }
      
      // Refresh onboarding data
      await fetchUserOnboarding();
      
      // If we have an active step, update its progress status
      if (activeStep && activeStep.id === stepId) {
        setActiveStep({
          ...activeStep,
          progress: null,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchUserOnboarding();
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        activeTrack,
        activeStep,
        steps,
        stats,
        loading,
        error,
        setActiveTrack,
        setActiveStep,
        fetchUserOnboarding,
        startStep,
        completeStep,
        resetStep,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}