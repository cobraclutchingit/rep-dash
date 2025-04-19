"use client";

interface OnboardingProgressBarProps {
  percentage: number;
  showLabels?: boolean;
  size?: "small" | "medium" | "large";
}

export default function OnboardingProgressBar({ 
  percentage, 
  showLabels = false,
  size = "medium",
}: OnboardingProgressBarProps) {
  // Get height based on size
  const getHeight = () => {
    switch (size) {
      case "small": return "h-2";
      case "medium": return "h-4";
      case "large": return "h-6";
      default: return "h-4";
    }
  };
  
  const height = getHeight();
  
  return (
    <div>
      {showLabels && (
        <div className="flex justify-between mb-1">
          <span className="text-xs text-muted-foreground">Progress</span>
          <span className="text-xs text-primary font-medium">{percentage}%</span>
        </div>
      )}
      
      <div className={`w-full bg-secondary rounded-full ${height}`}>
        <div 
          className={`bg-primary ${height} rounded-full transition-all duration-500 ease-out`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}