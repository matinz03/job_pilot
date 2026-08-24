import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse loads pdfjs-dist through dynamic requires that the server bundler cannot trace,
  // and @react-pdf/renderer ships its own font and layout binaries that must stay unbundled
  serverExternalPackages: ["pdf-parse", "@react-pdf/renderer"],
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://eu-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
    ];
  },
  // Required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
