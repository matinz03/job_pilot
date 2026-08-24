import { PostHog } from "posthog-node";

export function createPostHogServer(): PostHog | null {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!apiKey || !host) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[posthog] PostHog is disabled because its public configuration is missing.");
    }
    return null;
  }

  return new PostHog(apiKey, {
    flushAt: 1,
    flushInterval: 0,
    host,
  });
}
