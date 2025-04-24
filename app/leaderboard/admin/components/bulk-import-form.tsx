'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Get callbackUrl from URL if it exists
  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';
  const registered = searchParams?.get('registered');

  useEffect(() => {
    // If the user was redirected after registration, show success message
    if (registered === 'true') {
      setSuccessMessage('Registration successful! Please sign in to continue.');
    }
  }, [registered]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
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
            Sign in to your account
          </h2>
        </div>

        {successMessage && (
          <div className="rounded-md bg-green-100 p-3 text-sm text-green-800">{successMessage}</div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
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
                className="text-foreground bg-background ring-input focus:ring-primary relative block w-full rounded-md border-0 px-3 py-2 ring-1 ring-inset focus:z-10 focus:ring-2 sm:text-sm sm:leading-6"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="text-foreground bg-background ring-input focus:ring-primary relative block w-full rounded-md border-0 px-3 py-2 ring-1 ring-inset focus:z-10 focus:ring-2 sm:text-sm sm:leading-6"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-primary relative flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center text-sm">
            <Link href="/register" className="text-primary hover:text-primary/80 font-medium">
              Need an account? Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
