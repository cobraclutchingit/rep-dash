"use client";

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  className,
}: LoadingSpinnerProps) {
  const sizeClass = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-solid border-primary border-r-transparent",
        sizeClass[size],
        className
      )}
    />
  );
}

interface LoadingProps {
  spinnerSize?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export function Loading({
  spinnerSize = "md",
  text = "Loading...",
  fullScreen = false,
  className,
}: LoadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center space-y-3",
        fullScreen ? "fixed inset-0 bg-background/80 backdrop-blur-sm z-50" : "",
        className
      )}
    >
      <LoadingSpinner size={spinnerSize} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}