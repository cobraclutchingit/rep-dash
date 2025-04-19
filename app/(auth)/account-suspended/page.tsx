"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";

export default function AccountSuspendedPage() {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/auth/login" });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold tracking-tight text-primary">
            Sales Rep Dashboard
          </h1>
          <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-foreground">
            Account Suspended
          </h2>
        </div>
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          <p className="text-center mb-4">
            Your account has been suspended. Please contact your administrator for assistance.
          </p>
          <div className="flex justify-center">
            <button
              onClick={handleSignOut}
              className="group relative flex justify-center rounded-md bg-primary py-2 px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Sign Out
            </button>
          </div>
        </div>
        <div className="text-sm text-center text-muted-foreground">
          <p>
            If you believe this is an error, please contact support at{" "}
            <a
              href="mailto:support@example.com"
              className="font-medium text-primary hover:text-primary/80"
            >
              support@example.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}