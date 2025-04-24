'use client';

import { useState } from 'react';

import OnboardingResourceItem from './onboarding-resource-item';
import { OnboardingStep, useOnboarding } from '../providers/onboarding-provider';

interface OnboardingStepDetailProps {
  step: OnboardingStep;
  onBack: () => void;
}

export default function OnboardingStepDetail({ step, onBack }: OnboardingStepDetailProps) {
  const { startStep, completeStep, resetStep } = useOnboarding();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState(step.progress?.notes || '');
  const [showConfirm, setShowConfirm] = useState(false);

  const status = step.progress?.status || 'NOT_STARTED';

  const handleStart = async () => {
    setLoading(true);
    try {
      await startStep(step.id);
    } catch (error) {
      console.error('Error starting step:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await completeStep(step.id, notes);
      onBack();
    } catch (error) {
      console.error('Error completing step:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      await resetStep(step.id);
      setShowConfirm(false);
    } catch (error) {
      console.error('Error resetting step:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center">
        <button onClick={onBack} className="hover:bg-muted mr-4 rounded-full p-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h1 className="text-2xl font-bold">
          Step {step.order}: {step.title}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="bg-card text-card-foreground rounded-lg p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Step Details</h2>
            <p className="mb-6">{step.description}</p>

            {step.instructions && (
              <div className="mb-6">
                <h3 className="mb-2 text-lg font-medium">Instructions</h3>
                <div className="bg-muted rounded-md p-4 whitespace-pre-wrap">
                  {step.instructions}
                </div>
              </div>
            )}

            {step.resources && step.resources.length > 0 && (
              <div>
                <h3 className="mb-2 text-lg font-medium">Resources</h3>
                <div className="space-y-2">
                  {step.resources.map((resource) => (
                    <OnboardingResourceItem key={resource.id} resource={resource} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {status !== 'NOT_STARTED' && (
            <div className="bg-card text-card-foreground rounded-lg p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold">Notes</h2>
              <p className="text-muted-foreground mb-2 text-sm">
                Add any notes or reflections about this step. Your notes will be saved when you mark
                the step as complete.
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="border-input bg-background min-h-32 w-full rounded-md border p-3"
                placeholder="Add your notes here..."
                disabled={status === 'COMPLETED'}
              ></textarea>
            </div>
          )}
        </div>

        <div>
          <div className="bg-card text-card-foreground sticky top-6 rounded-lg p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold">Step Status</h2>

            <div className="mb-6">
              <div className="mb-1 flex justify-between text-sm">
                <span>Status</span>
                <span className="font-medium">
                  {status === 'COMPLETED'
                    ? 'Completed'
                    : status === 'IN_PROGRESS'
                      ? 'In Progress'
                      : 'Not Started'}
                </span>
              </div>

              {step.estimatedDuration && (
                <div className="mb-1 flex justify-between text-sm">
                  <span>Est. Duration</span>
                  <span>{step.estimatedDuration} minutes</span>
                </div>
              )}

              {step.progress?.startedAt && (
                <div className="mb-1 flex justify-between text-sm">
                  <span>Started</span>
                  <span>{new Date(step.progress.startedAt).toLocaleDateString()}</span>
                </div>
              )}

              {step.progress?.completedAt && (
                <div className="mb-1 flex justify-between text-sm">
                  <span>Completed</span>
                  <span>{new Date(step.progress.completedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {status === 'NOT_STARTED' && (
                <button
                  onClick={handleStart}
                  disabled={loading}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center justify-center rounded-md py-2 disabled:opacity-50"
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
                      Starting...
                    </>
                  ) : (
                    'Begin Step'
                  )}
                </button>
              )}

              {status === 'IN_PROGRESS' && (
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center justify-center rounded-md py-2 disabled:opacity-50"
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
                      Completing...
                    </>
                  ) : (
                    'Mark as Complete'
                  )}
                </button>
              )}

              {status === 'COMPLETED' && (
                <div className="rounded-md bg-green-500/10 p-2 text-center text-green-500">
                  Step Completed
                </div>
              )}

              {status !== 'NOT_STARTED' && (
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={loading}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90 w-full rounded-md py-2 disabled:opacity-50"
                >
                  Reset Progress
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card text-card-foreground w-full max-w-md rounded-lg p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold">Reset Progress</h2>
            <p className="mb-6">
              Are you sure you want to reset your progress for this step? This action cannot be
              undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-md px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md px-4 py-2"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
