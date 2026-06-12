/**
 * Plik: next.config.mjs
 * Cel: Konfiguracja Next.js 14 (App Router) — tryb standalone dla Dockera,
 *      nagłówki bezpieczeństwa oraz konfiguracja obrazów.
 * Zależności: brak (czysta konfiguracja Next.js).
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Wymagane dla obrazu Docker (kopiujemy .next/standalone).
  output: 'standalone',
  images: {
    // Domeny dozwolone dla next/image (avatary, uploady) — rozszerzane w kolejnych etapach.
    remotePatterns: [
      { protocol: 'https', hostname: '**.public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  async headers() {
    // Podstawowe nagłówki bezpieczeństwa. Pełne CSP/HSTS dochodzą w Etapie 8.
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

export default nextConfig;
