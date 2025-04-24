'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { useTheme } from '@/components/providers/theme-provider';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, formClasses } from '@/components/ui/form';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { loginSchema, type LoginFormData } from '@/lib/schemas/auth-schemas';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDarkMode } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Get callbackUrl from URL if it exists
  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';
  const registered = searchParams?.get('registered');

  // Set up form with zod validation
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  useEffect(() => {
    // If the user was redirected after registration, show success message
    if (registered === 'true') {
      setSuccessMessage('Registration successful! Please sign in to continue.');
    }
  }, [registered]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        
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
            <div className="rounded-md bg-green-100 p-3 text-sm text-green-800 dark:bg-green-900 dark:text-green-100">
              {successMessage}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
              <div className="space-y-4 rounded-md shadow-sm">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="email" className={formClasses.label}>
                        Email address
                      </FormLabel>
                      <FormControl>
                        <input
                          {...field}
                          id="email"
                          type="email"
                          autoComplete="email"
                          placeholder="you@example.com"
                          className={formClasses.input}
                          disabled={isLoading}
                          aria-describedby="email-error"
                        />
                      </FormControl>
                      <FormMessage name="email" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="password" className={formClasses.label}>
                        Password
                      </FormLabel>
                      <FormControl>
                        <input
                          {...field}
                          id="password"
                          type="password"
                          autoComplete="current-password"
                          placeholder="Your password"
                          className={formClasses.input}
                          disabled={isLoading}
                          aria-describedby="password-error"
                        />
                      </FormControl>
                      <FormMessage name="password" />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between">
                  <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <div className="flex items-center">
                        <input
                          {...field}
                          type="checkbox"
                          id="remember-me"
                          checked={field.value}
                          className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300 dark:border-gray-600"
                        />
                        <label
                          htmlFor="remember-me"
                          className="ml-2 block text-sm text-gray-900 dark:text-gray-100"
                        >
                          Remember me
                        </label>
                      </div>
                    )}
                  />

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
                <div 
                  className="bg-destructive/10 text-destructive rounded-md p-3 text-sm"
                  role="alert"
                  aria-live="assertive"
                >
                  {error}
                </div>
              )}

              <div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                  data-testid="login-button"
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </div>

              <div className="text-center text-sm">
                <Link 
                  href="/register" 
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Need an account? Sign up
                </Link>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </ErrorBoundary>
  );
}
