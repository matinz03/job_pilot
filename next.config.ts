import type { NextConfig } from "next";

function postHogIngestHost(): string {
  const configuredHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!configuredHost) return "https://eu.i.posthog.com";
  try {
    const host = new URL(configuredHost);
    host.hostname = host.hostname.replace(/\.posthog\.com$/, ".i.posthog.com").replace(".i.i.", ".i.");
    return host.origin;
  } catch {
    return "https://eu.i.posthog.com";
  }
}

const postHogIngestOrigin = postHogIngestHost();

const nextConfig: NextConfig = {
  // pdf-parse loads pdfjs-dist through dynamic requires that the server bundler cannot trace,
  // and @react-pdf/renderer ships its own font and layout binaries that must stay unbundled
  serverExternalPackages: ["pdf-parse", "@react-pdf/renderer", "@browserbasehq/stagehand"],
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: `${postHogIngestOrigin.replace(".i.posthog.com", "-assets.i.posthog.com")}/static/:path*`,
      },
      {
        source: "/ingest/array/:path*",
        destination: `${postHogIngestOrigin.replace(".i.posthog.com", "-assets.i.posthog.com")}/array/:path*`,
      },
      {
        source: "/ingest/:path*",
        destination: `${postHogIngestOrigin}/:path*`,
      },
    ];
  },
  // Required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
