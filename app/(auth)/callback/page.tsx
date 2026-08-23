import { Suspense } from "react";
import { OAuthCallback } from "@/components/auth/OAuthCallback";

export default function CallbackPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6">
      <Suspense fallback={null}>
        <OAuthCallback />
      </Suspense>
    </main>
  );
}
