'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenChecked, setTokenChecked] = useState(false);

  useEffect(() => {
    const token = searchParams?.get('token');
    if (token) {
      setToken(token);
      // Verify the token is valid
      verifyToken(token);
    } else {
      setTokenValid(false);
      setTokenChecked(true);
    }
  }, [searchParams]);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch(`/api/auth/verify-reset-token?token=${token}`);

      if (response.ok) {
        setTokenValid(true);
      } else {
        setTokenValid(false);
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      setTokenValid(false);
    } finally {
      setTokenChecked(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setSuccessMessage('Password has been reset successfully!');

      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login?resetPassword=true');
      }, 2000);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking token
  if (!tokenChecked) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 text-center">
          <div>
            <h1 className="text-primary text-center text-3xl font-bold tracking-tight">
              Sales Rep Dashboard
            </h1>
            <h2 className="text-foreground mt-6 text-center text-2xl font-bold tracking-tight">
              Reset your password
            </h2>
          </div>
          <div>Verifying your reset link...</div>
        </div>
      </div>
    );
  }

  // Invalid or missing token
  if (!tokenValid) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h1 className="text-primary text-center text-3xl font-bold tracking-tight">
              Sales Rep Dashboard
            </h1>
            <h2 className="text-foreground mt-6 text-center text-2xl font-bold tracking-tight">
              Invalid or expired link
            </h2>
          </div>
          <div className="bg-destructive/10 text-destructive rounded-md p-4">
            <p>This password reset link is invalid or has expired.</p>
            <p className="mt-2">Please request a new password reset link.</p>
          </div>
          <div className="text-center">
            <Link
              href="/forgot-password"
              className="text-primary hover:text-primary/80 mt-4 inline-block font-medium"
            >
              Request a new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-primary text-center text-3xl font-bold tracking-tight">
            Sales Rep Dashboard
          </h1>
          <h2 className="text-foreground mt-6 text-center text-2xl font-bold tracking-tight">
            Create a new password
          </h2>
          <p className="text-muted-foreground mt-2 text-center text-sm">
            Please enter your new password below.
          </p>
        </div>

        {successMessage ? (
          <div className="rounded-md bg-green-100 p-4 text-green-800">
            <p>{successMessage}</p>
            <div className="mt-4 text-center">
              <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
                Go to login
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium">
                  New Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-foreground bg-background ring-input focus:ring-primary relative block w-full rounded-md border-0 px-3 py-2 ring-1 ring-inset focus:z-10 focus:ring-2 sm:text-sm sm:leading-6"
                  placeholder="Min. 8 characters"
                  minLength={8}
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="text-foreground bg-background ring-input focus:ring-primary relative block w-full rounded-md border-0 px-3 py-2 ring-1 ring-inset focus:z-10 focus:ring-2 sm:text-sm sm:leading-6"
                  placeholder="Confirm your password"
                  minLength={8}
                />
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-primary relative flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>

            <div className="text-center text-sm">
              <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
                Back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
