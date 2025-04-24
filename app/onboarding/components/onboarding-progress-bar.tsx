'use client';

interface OnboardingProgressBarProps {
  percentage: number;
  showLabels?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function OnboardingProgressBar({
  percentage,
  showLabels = false,
  size = 'medium',
}: OnboardingProgressBarProps) {
  // Get height based on size
  const getHeight = () => {
    switch (size) {
      case 'small':
        return 'h-2';
      case 'medium':
        return 'h-4';
      case 'large':
        return 'h-6';
      default:
        return 'h-4';
    }
  };

  const height = getHeight();

  return (
    <div>
      {showLabels && (
        <div className="mb-1 flex justify-between">
          <span className="text-muted-foreground text-xs">Progress</span>
          <span className="text-primary text-xs font-medium">{percentage}%</span>
        </div>
      )}

      <div className={`bg-secondary w-full rounded-full ${height}`}>
        <div
          className={`bg-primary ${height} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
