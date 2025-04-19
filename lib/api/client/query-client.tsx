"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";

function getQueryErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === "string") {
    return error;
  }
  
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }
  
  return "An unknown error occurred";
}

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
            retry: (failureCount, error: any) => {
              // Don't retry on 4xx errors
              if (
                error?.response?.status >= 400 && 
                error?.response?.status < 500
              ) {
                return false;
              }
              
              // Otherwise retry 3 times
              return failureCount < 3;
            },
            onError: (error) => {
              console.error("Query error:", error);
              // Show toast notification for query errors
              toast({
                title: "Error",
                description: getQueryErrorMessage(error),
                variant: "error",
              });
            },
          },
          mutations: {
            onError: (error) => {
              console.error("Mutation error:", error);
              // Show toast notification for mutation errors
              toast({
                title: "Error",
                description: getQueryErrorMessage(error),
                variant: "error",
              });
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}