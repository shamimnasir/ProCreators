// Who may embed the app in a frame. Defaults to same-origin only; set FRAME_ANCESTORS to a
// space-separated list (e.g. "'self' https://partner.example") if embedding is intended.
const frameAncestors = process.env.FRAME_ANCESTORS || "'self'"

// Files the app writes under public/ at runtime are not served by Next's static handler.
const generatedDirs = [
  'activity-books', 'ai-video-studio', 'ai-video-uploads', 'checklists', 'coloring-books',
  'ebooks', 'flashcards', 'generated', 'guides', 'journals', 'library', 'music-cache',
  'notion-templates', 'planners', 'presentations', 'quizzes', 'recipe-books', 'story-reels',
  'story-reels-preview', 'storybooks', 'ugc-audio', 'uploads', 'video-editor',
  'voice-previews', 'worksheets',
] // keep in sync with lib/generated-dirs.js

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
  // Fallback rewrites only apply when no static file or page matched, so files that existed at
  // startup are still served natively and new ones go through /api/files.
  async rewrites() {
    return {
      fallback: generatedDirs.map((dir) => ({ source: `/${dir}/:path*`, destination: `/api/files/${dir}/:path*` })),
    }
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
          // Clickjacking protection (override with FRAME_ANCESTORS if embedding is intended)
          ...(frameAncestors === "'self'" ? [{ key: "X-Frame-Options", value: "SAMEORIGIN" }] : []),
          { key: "Content-Security-Policy", value: `frame-ancestors ${frameAncestors};` },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
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
