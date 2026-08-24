"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { completeOAuthSignIn } from "@/actions/auth";
import { OAUTH_CODE_VERIFIER_KEY } from "@/lib/auth-constants";
import { posthog } from "@/lib/posthog-client";

export function OAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("insforge_code");
  const hasStartedExchange = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function finishSignIn(): Promise<void> {
      if (hasStartedExchange.current) {
        return;
      }

      const codeVerifier = window.sessionStorage.getItem(OAUTH_CODE_VERIFIER_KEY);

      window.history.replaceState({}, document.title, window.location.pathname);

      if (!code || !codeVerifier) {
        setError("Authentication could not be completed. Please try again.");
        return;
      }

      hasStartedExchange.current = true;
      const result = await completeOAuthSignIn(code, codeVerifier);
      window.sessionStorage.removeItem(OAUTH_CODE_VERIFIER_KEY);

      if (!result.success || !result.userId) {
        setError(result.error ?? "Authentication could not be completed. Please try again.");
        return;
      }

      posthog.identify(result.userId);
      router.replace("/dashboard");
    }

    void finishSignIn();
  }, [code, router]);

  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 text-center shadow-card sm:p-8">
      <h1 className="text-xl font-semibold text-text-primary">Signing you in</h1>
      <p className="mt-2 text-sm text-text-secondary">
        {error ?? "Your secure session is being created."}
      </p>
    </div>
  );
}
