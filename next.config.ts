import type { NextConfig } from 'next';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

// 'unsafe-eval' is only needed by React's dev tooling (stack reconstruction), never in production.
// 'unsafe-inline' stays for now: app/layout.tsx has inline bootstrap scripts and the article pages
// emit JSON-LD. Removing it properly means switching to per-request nonces.
const SCRIPT_SRC = [
  "'self'",
  "'unsafe-inline'",
  ...(process.env.NODE_ENV === 'production' ? [] : ["'unsafe-eval'"]),
  'https://apis.google.com',
  'https://accounts.google.com',
].join(' ');

const CSP_HEADER = [
  "default-src 'self'",
  `script-src ${SCRIPT_SRC}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' https://fonts.gstatic.com data:",
  "connect-src 'self' https:",
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://accounts.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com",
].join('; ');

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '192.168.*.*',
    '10.*.*.*',
    '172.*.*.*',
    '*.*.*.*',
    '*.local',
  ],
  reactStrictMode: true,
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  turbopack: {},
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: CSP_HEADER,
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/(favicon.ico|favicon.svg|icon.svg|apple-touch-icon.png|logo.svg|lens-icon.svg|scope-media-logo-.*\\.svg)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, immutable',
          },
        ],
      },
    ];
  },
  transpilePackages: ['motion', 'react-simple-maps'],
};

export default nextConfig;

if (process.platform !== 'android') {
  initOpenNextCloudflareForDev().catch((err) => {
    console.warn('[cloudflare-dev] Failed to initialize Cloudflare proxy context:', err?.message || err);
  });
}
