import type {NextConfig} from 'next';
import fs from 'node:fs';
import path from 'node:path';

function ensureManifestsInDir(dirName: string) {
  try {
    const nextDir = path.join(process.cwd(), dirName);
    if (!fs.existsSync(nextDir)) {
      fs.mkdirSync(nextDir, { recursive: true });
    }

    const routesManifest = path.join(nextDir, 'routes-manifest.json');
    if (!fs.existsSync(routesManifest)) {
      const defaultRoutesManifest = {
        version: 3,
        caseSensitive: false,
        basePath: '',
        rewrites: { beforeFiles: [], afterFiles: [], fallback: [] },
        redirects: [
          {
            source: '/:path+/',
            destination: '/:path+',
            permanent: true,
            internal: true,
            regex: '^(?:\\/((?:[^\\/]+?)(?:\\/(?:[^\\/]+?))*))\\/$',
          },
        ],
        headers: [],
      };
      fs.writeFileSync(routesManifest, JSON.stringify(defaultRoutesManifest, null, 2));
    }

    const serverDir = path.join(nextDir, 'server');
    if (!fs.existsSync(serverDir)) {
      fs.mkdirSync(serverDir, { recursive: true });
    }

    const appPathsManifest = path.join(serverDir, 'app-paths-manifest.json');
    if (!fs.existsSync(appPathsManifest)) {
      fs.writeFileSync(appPathsManifest, JSON.stringify({ '/page': 'app/page.js' }, null, 2));
    }
  } catch {
    // Non-blocking
  }
}

function ensureManifests() {
  ensureManifestsInDir('.next');
  ensureManifestsInDir('.next_dev');
}

ensureManifests();

const isProduction = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  distDir: isProduction ? '.next' : '.next_dev',
  output: 'standalone',
  reactStrictMode: true,
  devIndicators: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow access to remote image placeholder and Unsplash editorial photography.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  transpilePackages: ['motion'],
  webpack: (config, {dev}) => {
    if (dev) {
      ensureManifests();
    }
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify—file watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    } else if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ['**/.next/**', '**/.next_dev/**', '**/node_modules/**'],
      };
    }
    return config;
  },
};

export default nextConfig;
