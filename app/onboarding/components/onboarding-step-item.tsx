'use client';

import { OnboardingStep } from '../providers/onboarding-provider';

interface OnboardingStepItemProps {
  step: OnboardingStep;
  onSelect: () => void;
}

export default function OnboardingStepItem({ step, onSelect }: OnboardingStepItemProps) {
  const status = step.progress?.status || 'NOT_STARTED';

  // Different styling based on step status
  const statusVariants = {
    COMPLETED: {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      bgColor: 'bg-primary/20',
      textColor: 'text-primary',
      borderColor: 'border-primary',
      badgeColor: 'bg-primary/10 text-primary',
      badgeText: 'Completed',
    },
    IN_PROGRESS: {
      icon: (
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
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      ),
      bgColor: 'bg-amber-500/20',
      textColor: 'text-amber-500',
      borderColor: 'border-amber-500',
      badgeColor: 'bg-amber-500/10 text-amber-500',
      badgeText: 'In Progress',
    },
    NOT_STARTED: {
      icon: (
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
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      bgColor: 'bg-muted',
      textColor: 'text-muted-foreground',
      borderColor: 'border-muted',
      badgeColor: 'bg-secondary text-secondary-foreground',
      badgeText: 'Not Started',
    },
  };

  const variant = statusVariants[status];
  const isDisabled = status === 'NOT_STARTED' && step.order > 1;

  return (
    <div
      className={`border-l-4 p-6 ${variant.borderColor} ${isDisabled ? 'opacity-60' : ''} hover:bg-muted/20 transition-colors`}
      onClick={isDisabled ? undefined : onSelect}
      role={isDisabled ? undefined : 'button'}
    >
      <div className="flex items-center">
        <div
          className={`${variant.bgColor} ${variant.textColor} mr-4 flex-shrink-0 rounded-full p-2`}
        >
          {variant.icon}
        </div>
        <div className="min-w-0 flex-grow">
          <h3 className="truncate font-semibold">{step.title}</h3>
          <p className="text-muted-foreground truncate text-sm">{step.description}</p>
        </div>
        <div className="ml-4 flex flex-shrink-0 items-center">
          <span className={`rounded-full px-2 py-1 text-xs ${variant.badgeColor} mr-2`}>
            {variant.badgeText}
          </span>

          {status !== 'COMPLETED' && (
            <button
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-1 text-sm disabled:opacity-50"
              disabled={isDisabled}
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
            >
              {status === 'IN_PROGRESS' ? 'Continue' : 'Start'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
