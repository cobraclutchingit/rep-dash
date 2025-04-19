"use client";

import { useState } from "react";
import { useOnboarding } from "../providers/onboarding-provider";
import OnboardingStepItem from "./onboarding-step-item";
import OnboardingStepDetail from "./onboarding-step-detail";
import OnboardingProgressBar from "./onboarding-progress-bar";
import OnboardingStats from "./onboarding-stats";

export default function OnboardingDashboard() {
  const { 
    activeTrack, 
    activeStep, 
    steps, 
    stats, 
    loading, 
    error,
    setActiveStep,
  } = useOnboarding();
  
  const [isDetailView, setIsDetailView] = useState(false);
  
  const handleSelectStep = (step: any) => {
    setActiveStep(step);
    setIsDetailView(true);
  };
  
  const handleBackToList = () => {
    setIsDetailView(false);
  };
  
  // If there's an error loading onboarding data
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-destructive text-lg mb-4">Error: {error}</div>
        <button 
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }
  
  // Display loading state
  if (loading && steps.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-4 text-muted-foreground">Loading your onboarding journey...</p>
      </div>
    );
  }
  
  // If no onboarding track is found
  if (!activeTrack && !loading) {
    return (
      <div className="text-center py-12">
        <div className="h-24 w-24 mx-auto bg-muted rounded-full flex items-center justify-center text-4xl mb-6">
          🤔
        </div>
        <h2 className="text-2xl font-semibold mb-2">No Onboarding Found</h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          It looks like there's no onboarding track assigned to your position yet.
          Please contact your manager for assistance.
        </p>
      </div>
    );
  }
  
  // If step detail view is active
  if (isDetailView && activeStep) {
    return (
      <OnboardingStepDetail 
        step={activeStep} 
        onBack={handleBackToList} 
      />
    );
  }
  
  // Main dashboard view
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Onboarding</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="bg-card text-card-foreground rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Your Progress</h2>
              <span className="text-primary font-medium">
                {stats.completedSteps}/{stats.totalSteps} Steps
              </span>
            </div>
            
            <OnboardingProgressBar 
              percentage={stats.percentComplete} 
              showLabels={true}
            />
            
            <p className="text-sm text-muted-foreground mt-2">
              {stats.percentComplete < 100 ? (
                `You're making great progress! Keep going to complete your onboarding.`
              ) : (
                `Congratulations! You've completed all onboarding steps.`
              )}
            </p>
          </div>
          
          <div className="bg-card text-card-foreground rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                {activeTrack?.name || "Onboarding Steps"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {activeTrack?.description || "Complete these steps to finish your onboarding"}
              </p>
            </div>
            
            <div className="divide-y">
              {steps.length > 0 ? (
                steps.map((step) => (
                  <OnboardingStepItem 
                    key={step.id} 
                    step={step} 
                    onSelect={() => handleSelectStep(step)}
                  />
                ))
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  No onboarding steps found
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div>
          <OnboardingStats stats={stats} />
          
          {stats.completedSteps === stats.totalSteps && stats.totalSteps > 0 && (
            <div className="bg-card text-card-foreground rounded-lg shadow p-6 mt-6">
              <div className="text-center">
                <div className="h-16 w-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center text-2xl text-primary mb-4">
                  🏆
                </div>
                <h3 className="text-xl font-semibold mb-2">Onboarding Complete!</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Congratulations on completing your onboarding journey! You're now ready to succeed in your role.
                </p>
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                  View Certificate
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}