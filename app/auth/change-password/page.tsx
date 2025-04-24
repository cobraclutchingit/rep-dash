'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

export default function ChangePasswordPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    // Password validation
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      setIsSubmitting(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    if (!session?.user?.id) {
      setError('You must be logged in to change your password');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      setSuccessMessage('Password changed successfully!');

      // Clear the form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Redirect back to profile after a short delay
      setTimeout(() => {
        router.push('/profile');
      }, 2000);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to change password. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-primary text-center text-3xl font-bold tracking-tight">
            Change Password
          </h1>
          <p className="text-muted-foreground mt-2 text-center text-sm">
            Update your password to keep your account secure.
          </p>
        </div>

        {successMessage ? (
          <div className="rounded-md bg-green-100 p-4 text-green-800">
            <p>{successMessage}</p>
            <div className="mt-4 text-center">
              <Link href="/profile" className="text-primary hover:text-primary/80 font-medium">
                Back to profile
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="mb-1 block text-sm font-medium">
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="text-foreground bg-background ring-input focus:ring-primary relative block w-full rounded-md border-0 px-3 py-2 ring-1 ring-inset focus:z-10 focus:ring-2 sm:text-sm sm:leading-6"
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="mb-1 block text-sm font-medium">
                  New Password
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="text-foreground bg-background ring-input focus:ring-primary relative block w-full rounded-md border-0 px-3 py-2 ring-1 ring-inset focus:z-10 focus:ring-2 sm:text-sm sm:leading-6"
                  minLength={8}
                  placeholder="Min. 8 characters"
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
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="text-foreground bg-background ring-input focus:ring-primary relative block w-full rounded-md border-0 px-3 py-2 ring-1 ring-inset focus:z-10 focus:ring-2 sm:text-sm sm:leading-6"
                  minLength={8}
                  placeholder="Confirm your new password"
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
                {isSubmitting ? 'Updating...' : 'Change Password'}
              </button>
            </div>

            <div className="text-center text-sm">
              <Link href="/profile" className="text-primary hover:text-primary/80 font-medium">
                Cancel and return to profile
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
