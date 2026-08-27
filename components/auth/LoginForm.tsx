"use client";

import { useState } from "react";
import { startOAuthSignIn } from "@/actions/auth";

type OAuthProvider = "google" | "github";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signInWithProvider(provider: OAuthProvider): Promise<void> {
    setError(null);
    setIsLoading(provider);

    try {
      const result = await startOAuthSignIn(provider);
      if (!result.success || !result.url) {
        setError(result.error ?? "Could not start sign-in. Please try again.");
        setIsLoading(null);
        return;
      }

      window.location.assign(result.url);
    } catch (authError) {
      console.error("[LoginForm]", authError);
      setError("Could not start sign-in. Please try again.");
      setIsLoading(null);
    }
  }

  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-card sm:p-8">
      <div className="space-y-2 text-center">
        <p className="text-sm font-medium text-accent">WELCOME TO JOBPILOT</p>
        <h1 className="text-2xl font-semibold text-text-primary">Find work that fits.</h1>
        <p className="text-sm text-text-secondary">
          Sign in to save matches and move your job search forward.
        </p>
      </div>

      <div className="mt-8 space-y-3">
        <button
          className="flex w-full items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading !== null}
          onClick={() => void signInWithProvider("google")}
          type="button"
        >
          {isLoading === "google" ? "Connecting to Google…" : "Continue with Google"}
        </button>
        <button
          className="flex w-full items-center justify-center rounded-md bg-overlay px-4 py-2 text-sm font-medium text-accent-foreground shadow-button transition-all hover:-translate-y-0.5 hover:bg-overlay-dark hover:shadow-button-hover disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading !== null}
          onClick={() => void signInWithProvider("github")}
          type="button"
        >
          {isLoading === "github" ? "Connecting to GitHub…" : "Continue with GitHub"}
        </button>
      </div>

      {error ? (
        <p className="mt-4 text-center text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
