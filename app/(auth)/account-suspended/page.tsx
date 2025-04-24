'use client';

import { signOut } from 'next-auth/react';

export default function AccountSuspendedPage() {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-primary text-center text-3xl font-bold tracking-tight">
            Sales Rep Dashboard
          </h1>
          <h2 className="text-foreground mt-6 text-center text-2xl font-bold tracking-tight">
            Account Suspended
          </h2>
        </div>
        <div className="bg-destructive/10 text-destructive rounded-md p-4">
          <p className="mb-4 text-center">
            Your account has been suspended. Please contact your administrator for assistance.
          </p>
          <div className="flex justify-center">
            <button
              onClick={handleSignOut}
              className="group bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-primary relative flex justify-center rounded-md px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Sign Out
            </button>
          </div>
        </div>
        <div className="text-muted-foreground text-center text-sm">
          <p>
            If you believe this is an error, please contact support at{' '}
            <a
              href="mailto:support@example.com"
              className="text-primary hover:text-primary/80 font-medium"
            >
              support@example.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
