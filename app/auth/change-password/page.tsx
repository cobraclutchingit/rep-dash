"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ChangePasswordPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    // Password validation
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long");
      setIsSubmitting(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setIsSubmitting(false);
      return;
    }

    if (!session?.user?.id) {
      setError("You must be logged in to change your password");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session.user.id,
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to change password");
      }

      setSuccessMessage("Password changed successfully!");
      
      // Clear the form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Redirect back to profile after a short delay
      setTimeout(() => {
        router.push("/profile");
      }, 2000);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to change password. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect to login if not authenticated
  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold tracking-tight text-primary">
            Change Password
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Update your password to keep your account secure.
          </p>
        </div>

        {successMessage ? (
          <div className="bg-green-100 text-green-800 p-4 rounded-md">
            <p>{successMessage}</p>
            <div className="mt-4 text-center">
              <Link
                href="/profile"
                className="font-medium text-primary hover:text-primary/80"
              >
                Back to profile
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium mb-1">
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="relative block w-full rounded-md border-0 py-2 px-3 text-foreground bg-background ring-1 ring-inset ring-input focus:ring-2 focus:ring-primary focus:z-10 sm:text-sm sm:leading-6"
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium mb-1">
                  New Password
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="relative block w-full rounded-md border-0 py-2 px-3 text-foreground bg-background ring-1 ring-inset ring-input focus:ring-2 focus:ring-primary focus:z-10 sm:text-sm sm:leading-6"
                  minLength={8}
                  placeholder="Min. 8 characters"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="relative block w-full rounded-md border-0 py-2 px-3 text-foreground bg-background ring-1 ring-inset ring-input focus:ring-2 focus:ring-primary focus:z-10 sm:text-sm sm:leading-6"
                  minLength={8}
                  placeholder="Confirm your new password"
                />
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative flex w-full justify-center rounded-md bg-primary py-2 px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Updating..." : "Change Password"}
              </button>
            </div>

            <div className="text-sm text-center">
              <Link
                href="/profile"
                className="font-medium text-primary hover:text-primary/80"
              >
                Cancel and return to profile
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}