'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useOnboarding } from '../providers/onboarding-provider';

export default function OnboardingWelcome() {
  const router = useRouter();
  const { fetchUserOnboarding } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const welcomeSteps = [
    {
      title: 'Welcome to the Team!',
      description:
        "We're excited to have you join our sales team. This onboarding process will help you get started quickly and ensure you have all the tools and knowledge you need to succeed.",
      image: '🎉',
    },
    {
      title: 'Your Onboarding Journey',
      description:
        'Your onboarding process consists of several steps designed to help you understand our products, processes, and company culture. Each step builds on the previous one, creating a comprehensive learning experience.',
      image: '🚀',
    },
    {
      title: 'Track Your Progress',
      description:
        "As you complete each step, we'll track your progress so you can see how far you've come and what's still ahead. Your managers can also see your progress, so they know when you're ready for the next challenge.",
      image: '📈',
    },
    {
      title: 'Ready to Begin?',
      description:
        "Let's get started on your onboarding journey! Click the button below to begin your first step.",
      image: '✅',
    },
  ];

  const currentSlide = welcomeSteps[currentStep];

  const handleNext = () => {
    if (currentStep < welcomeSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleStart();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      // Initialize onboarding for the user
      const response = await fetch('/api/onboarding/initialize', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to initialize onboarding');
      }

      // Refresh onboarding data
      await fetchUserOnboarding();

      // Refresh the page to show the dashboard
      router.refresh();
    } catch (error) {
      console.error('Error initializing onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Getting Started</h1>
        <div className="text-muted-foreground text-sm">
          Step {currentStep + 1} of {welcomeSteps.length}
        </div>
      </div>

      <div className="bg-card text-card-foreground rounded-lg shadow">
        <div className="p-8">
          <div className="mb-8 flex justify-center">
            <div className="bg-primary/10 flex h-24 w-24 items-center justify-center rounded-full text-4xl">
              {currentSlide.image}
            </div>
          </div>

          <h2 className="mb-4 text-center text-2xl font-semibold">{currentSlide.title}</h2>
          <p className="text-muted-foreground mb-8 text-center">{currentSlide.description}</p>

          <div className="bg-secondary mb-8 h-2 w-full rounded-full">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / welcomeSteps.length) * 100}%` }}
            ></div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-md px-4 py-2 disabled:opacity-50"
            >
              Previous
            </button>

            <button
              onClick={handleNext}
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center rounded-md px-4 py-2"
            >
              {loading ? (
                <>
                  <svg
                    className="text-primary-foreground mr-2 -ml-1 h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : currentStep < welcomeSteps.length - 1 ? (
                'Next'
              ) : (
                'Get Started'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
