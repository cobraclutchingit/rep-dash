'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset link');
      }

      // Always show success message even if email doesn't exist
      setSuccessMessage('If an account exists with that email, we’ll send a password reset link.');

      // Clear the email field
      setEmail('');
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

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-primary text-center text-3xl font-bold tracking-tight">
            Sales Rep Dashboard
          </h1>
          <h2 className="text-foreground mt-6 text-center text-2xl font-bold tracking-tight">
            Reset your password
          </h2>
          <p className="text-muted-foreground mt-2 text-center text-sm">
            Enter your email address and we’ll send you a link to reset your password.
          </p>
        </div>

        {successMessage ? (
          <div className="rounded-md bg-green-100 p-4 text-green-800">
            <p>{successMessage}</p>
            <div className="mt-4 text-center">
              <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
                Back to login
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-foreground bg-background ring-input focus:ring-primary relative block w-full rounded-md border-0 px-3 py-2 ring-1 ring-inset focus:z-10 focus:ring-2 sm:text-sm sm:leading-6"
                placeholder="you@example.com"
              />
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
                {isSubmitting ? 'Sending...' : 'Send reset link'}
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
