'use client';

import { SalesPosition } from '@prisma/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    position: 'JUNIOR_EC' as SalesPosition,
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          position: formData.position,
          phoneNumber: formData.phoneNumber || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setSuccessMessage('Account created successfully! Redirecting to login...');

      // Redirect after a short delay
      setTimeout(() => {
        router.push('/login?registered=true');
      }, 1500);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Registration failed. Please try again.');
      }
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
            Create your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="text-foreground bg-background ring-input focus:ring-primary relative block w-full rounded-md border-0 px-3 py-2 ring-1 ring-inset focus:z-10 focus:ring-2 sm:text-sm sm:leading-6"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
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
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="phoneNumber" className="mb-1 block text-sm font-medium">
                Phone Number (optional)
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                autoComplete="tel"
                className="text-foreground bg-background ring-input focus:ring-primary relative block w-full rounded-md border-0 px-3 py-2 ring-1 ring-inset focus:z-10 focus:ring-2 sm:text-sm sm:leading-6"
                placeholder="(123) 456-7890"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="position" className="mb-1 block text-sm font-medium">
                Sales Position
              </label>
              <select
                id="position"
                name="position"
                required
                className="text-foreground bg-background ring-input focus:ring-primary relative block w-full rounded-md border-0 px-3 py-2 ring-1 ring-inset focus:z-10 focus:ring-2 sm:text-sm sm:leading-6"
                value={formData.position}
                onChange={handleChange}
              >
                <option value="JUNIOR_EC">Junior Energy Consultant</option>
                <option value="ENERGY_CONSULTANT">Energy Consultant</option>
                <option value="ENERGY_SPECIALIST">Energy Specialist</option>
                <option value="MANAGER">Manager</option>
              </select>
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="text-foreground bg-background ring-input focus:ring-primary relative block w-full rounded-md border-0 px-3 py-2 ring-1 ring-inset focus:z-10 focus:ring-2 sm:text-sm sm:leading-6"
                placeholder="Min. 8 characters"
                value={formData.password}
                onChange={handleChange}
                minLength={8}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="text-foreground bg-background ring-input focus:ring-primary relative block w-full rounded-md border-0 px-3 py-2 ring-1 ring-inset focus:z-10 focus:ring-2 sm:text-sm sm:leading-6"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                minLength={8}
              />
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">{error}</div>
          )}

          {successMessage && (
            <div className="rounded-md bg-green-100 p-3 text-sm text-green-800">
              {successMessage}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-primary relative flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>

          <div className="text-center text-sm">
            <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
              Already have an account? Sign in
            </Link>
          </div>

          <div className="text-center text-sm">
            <Link
              href="/forgot-password"
              className="text-primary hover:text-primary/80 font-medium"
            >
              Forgot your password?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
