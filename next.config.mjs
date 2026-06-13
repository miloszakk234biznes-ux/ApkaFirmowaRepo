/**
 * Plik: next.config.mjs
 * Cel: Konfiguracja Next.js 14 (App Router) — tryb standalone dla Dockera,
 *      nagłówki bezpieczeństwa, obrazy oraz PWA (Service Worker przez
 *      @ducanh2912/next-pwa z regułami runtime caching i custom workerem push).
 * Zależności: @ducanh2912/next-pwa.
 */
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  // Custom worker (worker/index.ts) zawiera obsługę Web Push i Background Sync.
  workboxOptions: {
    // Nie cache'ujemy odpowiedzi API metodami innymi niż GET.
    runtimeCaching: [
      {
        // Fonty Google — cache-first.
        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts',
          expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
        },
      },
      {
        // Ikony / obrazy / statyki — cache-first.
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-assets',
          expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
        },
      },
      {
        // Dane API — network-first (świeże dane, fallback z cache offline).
        urlPattern:
          /\/api\/(orders|clients|finance|expenses|incomes|notifications)/i,
        handler: 'NetworkFirst',
        method: 'GET',
        options: {
          cacheName: 'api-cache',
          networkTimeoutSeconds: 5,
          expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 },
        },
      },
      {
        // Pulpit i strony aplikacji — stale-while-revalidate.
        urlPattern: /\/(dashboard|calendar|orders|clients|finances)/i,
        handler: 'StaleWhileRevalidate',
        options: { cacheName: 'pages-cache' },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
