import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ─── Security Headers ────────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // Block MIME sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Enable XSS filter in older browsers
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // Referrer policy
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Permissions policy — disable unnecessary browser features
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          // Strict Transport Security (HTTPS only — enable in production)
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains; preload",
                },
              ]
            : []),
          // Content Security Policy
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Next.js requires 'unsafe-inline' and 'unsafe-eval' in development
              process.env.NODE_ENV === "development"
                ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://api.qrserver.com"
                : "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://api.qrserver.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com",
              "frame-src https://api.razorpay.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
      // ─── Cache static assets aggressively ────────────────────────────────────
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // ─── Webhook endpoint — no caching ───────────────────────────────────────
      {
        source: "/api/webhooks/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache" },
        ],
      },
    ];
  },

  // ─── Redirects ───────────────────────────────────────────────────────────────
  async redirects() {
    return [
      // Redirect www to apex domain in production
      ...(process.env.NEXT_PUBLIC_SITE_URL?.includes("skillrise.in")
        ? [
            {
              source: "/(.*)",
              has: [{ type: "host" as const, value: "www.skillrise.in" }],
              destination: "https://skillrise.in/:path*",
              permanent: true,
            },
          ]
        : []),
    ];
  },

  // ─── Image optimization ──────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.qrserver.com" },
    ],
  },

  // ─── Experimental ────────────────────────────────────────────────────────────
  experimental: {
    // Server Actions are stable in Next.js 16
  },
};

export default nextConfig;
