const fs = require('node:fs');
const path = require('node:path');

function ensureManifestsInDir(dirName) {
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
        rewrites: {
          beforeFiles: [],
          afterFiles: [],
          fallback: [],
        },
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
  } catch (err) {
    // Non-blocking
  }
}

function ensureManifests() {
  ensureManifestsInDir('.next');
  ensureManifestsInDir('.next_dev');
}

ensureManifests();

module.exports = { ensureManifests };
