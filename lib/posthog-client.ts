import posthog from "posthog-js";

export function initPostHog(): void {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!apiKey || !host) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[posthog] PostHog is disabled because its public configuration is missing.");
    }
    return;
  }

  posthog.init(apiKey, {
    api_host: "/ingest",
    capture_exceptions: true,
    capture_pageview: false,
    ui_host: host,
  });
}

export { posthog };
