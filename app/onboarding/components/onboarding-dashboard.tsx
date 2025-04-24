'use client';

import { useState } from 'react';

import OnboardingProgressBar from './onboarding-progress-bar';
import OnboardingStats from './onboarding-stats';
import OnboardingStepDetail from './onboarding-step-detail';
import OnboardingStepItem from './onboarding-step-item';
import { useOnboarding, OnboardingStep } from '../providers/onboarding-provider';

export default function OnboardingDashboard() {
  const { activeTrack, activeStep, steps, stats, loading, error, setActiveStep } = useOnboarding();

  const [isDetailView, setIsDetailView] = useState(false);

  const handleSelectStep = (step: OnboardingStep) => {
    setActiveStep(step);
    setIsDetailView(true);
  };

  const handleBackToList = () => {
    setIsDetailView(false);
  };

  // If there's an error loading onboarding data
  if (error) {
    return (
      <div className="py-12 text-center">
        <div className="text-destructive mb-4 text-lg">Error: {error}</div>
        <button
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2"
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
      <div className="py-12 text-center">
        <div className="border-primary inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="text-muted-foreground mt-4">Loading your onboarding journey...</p>
      </div>
    );
  }

  // If no onboarding track is found
  if (!activeTrack && !loading) {
    return (
      <div className="py-12 text-center">
        <div className="bg-muted mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full text-4xl">
          🤔
        </div>
        <h2 className="mb-2 text-2xl font-semibold">No Onboarding Found</h2>
        <p className="text-muted-foreground mx-auto mb-6 max-w-md">
          It looks like there is no onboarding track assigned to your position yet. Please contact
          your manager for assistance.
        </p>
      </div>
    );
  }

  // If step detail view is active
  if (isDetailView && activeStep) {
    return <OnboardingStepDetail step={activeStep} onBack={handleBackToList} />;
  }

  // Main dashboard view
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Onboarding</h1>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="bg-card text-card-foreground mb-6 rounded-lg p-6 shadow">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Your Progress</h2>
              <span className="text-primary font-medium">
                {stats.completedSteps}/{stats.totalSteps} Steps
              </span>
            </div>

            <OnboardingProgressBar percentage={stats.percentComplete} showLabels={true} />

            <p className="text-muted-foreground mt-2 text-sm">
              {stats.percentComplete < 100
                ? `You are making great progress! Keep going to complete your onboarding.`
                : `Congratulations! You have completed all onboarding steps.`}
            </p>
          </div>

          <div className="bg-card text-card-foreground rounded-lg shadow">
            <div className="border-b p-6">
              <h2 className="text-xl font-semibold">{activeTrack?.name || 'Onboarding Steps'}</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {activeTrack?.description || 'Complete these steps to finish your onboarding'}
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
                <div className="text-muted-foreground p-6 text-center">
                  No onboarding steps found
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <OnboardingStats stats={stats} />

          {stats.completedSteps === stats.totalSteps && stats.totalSteps > 0 && (
            <div className="bg-card text-card-foreground mt-6 rounded-lg p-6 shadow">
              <div className="text-center">
                <div className="bg-primary/10 text-primary mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl">
                  🏆
                </div>
                <h3 className="mb-2 text-xl font-semibold">Onboarding Complete!</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Congratulations on completing your onboarding journey! You are now ready to
                  succeed in your role.
                </p>
                <button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2">
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
