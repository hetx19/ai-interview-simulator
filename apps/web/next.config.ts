import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: isDev
      ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src * data:; connect-src *; font-src 'self' https://fonts.gstatic.com data:"
      : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://avatars.githubusercontent.com https://lh3.googleusercontent.com; connect-src 'self' https://api.github.com https://*.upstash.io; font-src 'self' https://fonts.gstatic.com data:",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=()",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
];

const nextConfig: NextConfig = {
  output: process.env.NEXT_OUTPUT_STANDALONE === "true" ? "standalone" : undefined,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  serverExternalPackages: ["pg", "@prisma/client", "prisma", "pino", "@upstash/qstash"],
};

export default nextConfig;
