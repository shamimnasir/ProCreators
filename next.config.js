const nextConfig = {
  output: 'standalone',
  // Generate unique deployment ID to prevent Server Action mismatches
  generateBuildId: async () => {
    // Use timestamp-based build ID to ensure consistency across pods
    return `build-${Date.now()}`
  },
  images: {
    unoptimized: true,
  },
  // Moved from experimental in Next.js 15
  serverExternalPackages: ['mongodb', 'fluent-ffmpeg'],
  // Empty turbopack config to silence warning
  turbopack: {},
  // Disable Server Actions if not explicitly used (prevents ID mismatch errors)
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  webpack(config, { dev }) {
    if (dev) {
      // Reduce CPU/memory from file watching
      config.watchOptions = {
        poll: 2000, // check every 2 seconds
        aggregateTimeout: 300, // wait before rebuilding
        ignored: ['**/node_modules'],
      };
    }
    return config;
  },
  onDemandEntries: {
    maxInactiveAge: 10000,
    pagesBufferLength: 2,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // SECURITY: Core security headers
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Frame options for embedding
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *;" },
          // NOTE: CORS headers intentionally handled in /app/proxy.js middleware,
          // which echoes the specific Origin and sets Allow-Credentials=true
          // so that session cookies work across custom domains.
          // Cache control to prevent stale JS
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      // SECURITY: Extra protection for API routes
      {
        source: "/api/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
