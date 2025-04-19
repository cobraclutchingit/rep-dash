"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send reset link");
      }

      // Always show success message even if email doesn't exist
      // This is for security - we don't want to reveal which emails exist in our system
      setSuccessMessage(
        "If an account exists with that email, we've sent a password reset link."
      );
      
      // Clear the email field
      setEmail("");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold tracking-tight text-primary">
            Sales Rep Dashboard
          </h1>
          <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-foreground">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {successMessage ? (
          <div className="bg-green-100 text-green-800 p-4 rounded-md">
            <p>{successMessage}</p>
            <div className="mt-4 text-center">
              <Link
                href="/auth/login"
                className="font-medium text-primary hover:text-primary/80"
              >
                Back to login
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
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
                className="relative block w-full rounded-md border-0 py-2 px-3 text-foreground bg-background ring-1 ring-inset ring-input focus:ring-2 focus:ring-primary focus:z-10 sm:text-sm sm:leading-6"
                placeholder="you@example.com"
              />
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
                {isSubmitting ? "Sending..." : "Send reset link"}
              </button>
            </div>

            <div className="text-sm text-center">
              <Link
                href="/auth/login"
                className="font-medium text-primary hover:text-primary/80"
              >
                Back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}