import { getCloudflareContext } from '@opennextjs/cloudflare';

/**
 * Short-lived cache for PUBLIC read endpoints, using the Workers Cache API (per data centre, free).
 * The home page fetches /api/articles from every visitor's browser; without this every visit is a D1 query.
 *
 * Rules that keep it safe:
 * - GET only, and only 200 responses that don't ask for no-store/private.
 * - Requests carrying a NextAuth session cookie always bypass the cache, so editors and the admin panel
 *   never see (or create) stale copies and privileged responses are never stored.
 * - Entries live `ttlSeconds`. Edits are therefore visible to the public after at most that long.
 * - Outside Cloudflare (next dev) there is no Cache API and the handler simply runs.
 */

const SESSION_COOKIE = 'next-auth.session-token'; // also matches the "__Secure-" prefixed variant
const MAX_URL_LENGTH = 400; // don't let arbitrary long query strings fill the cache

function getEdgeCache(): Cache | null {
  const store = (globalThis as unknown as { caches?: { default?: Cache } }).caches;
  return store?.default ?? null;
}

/** Runs a fire-and-forget task after the response is sent. A failure here is ignored: caching is best-effort. */
function runInBackground(task: Promise<unknown>) {
  const safeTask = task.catch(() => {});
  try {
    getCloudflareContext().ctx.waitUntil(safeTask);
  } catch {
    // Not inside a Cloudflare request context; the task still runs, its errors already swallowed.
  }
}

export async function withEdgeCache(
  request: Request,
  ttlSeconds: number,
  produce: () => Promise<Response>,
): Promise<Response> {
  const cache = getEdgeCache();
  const cookie = request.headers.get('cookie') || '';
  if (
    !cache ||
    request.method !== 'GET' ||
    cookie.includes(SESSION_COOKIE) ||
    request.url.length > MAX_URL_LENGTH
  ) {
    return produce();
  }

  const key = new Request(request.url, { method: 'GET' });

  try {
    const hit = await cache.match(key);
    if (hit) {
      const response = new Response(hit.body, hit);
      response.headers.set('X-Edge-Cache', 'HIT');
      return response;
    }
  } catch {
    // A cache failure must never break the endpoint; fall through to the real handler.
  }

  const response = await produce();
  const cacheControl = response.headers.get('Cache-Control') || '';
  if (response.status === 200 && !/no-store|private/i.test(cacheControl)) {
    const toStore = new Response(response.clone().body, {
      status: 200,
      headers: new Headers(response.headers),
    });
    toStore.headers.set('Cache-Control', `public, s-maxage=${ttlSeconds}`);
    runInBackground(Promise.resolve().then(() => cache.put(key, toStore)));
    response.headers.set('X-Edge-Cache', 'MISS');
  }
  return response;
}
