"use client";

import { ReactNode } from "react";
import { AuthProvider } from "./auth-provider";
import { ThemeProvider } from "./theme-provider";
import { ReactQueryProvider } from "@/lib/api/client/queries";
import { ToastProvider } from "@/components/ui/toast";

/**
 * Global application provider component that wraps the app with all necessary providers.
 */
export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ReactQueryProvider>
        <ThemeProvider defaultTheme="system" storageKey="rep-dash-theme">
          <ToastProvider />
          {children}
        </ThemeProvider>
      </ReactQueryProvider>
    </AuthProvider>
  );
}