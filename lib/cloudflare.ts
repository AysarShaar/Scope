import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface CloudflareEnv {
  DB: import("@cloudflare/workers-types").D1Database;
  ASSETS: import("@cloudflare/workers-types").Fetcher;
  /** R2 bucket for article images. */
  IMAGES?: import("@cloudflare/workers-types").R2Bucket;
}

export function getCloudflareEnv(): CloudflareEnv | null {
  // 1. Try the real Cloudflare Workers / OpenNext context first
  try {
    const { env } = getCloudflareContext();
    const bindings = env as unknown as Partial<CloudflareEnv>;
    if (bindings?.DB && typeof bindings.DB.prepare === "function") {
      return bindings as CloudflareEnv;
    }
  } catch {
    // Not running inside a Cloudflare request context
  }

  // 2. In local development (NODE_ENV !== 'production'), fall back to a
  //    node:sqlite-backed D1 shim so pages show real data without workerd.
  if (process.env.NODE_ENV !== "production") {
    try {
      // Dynamic import keeps this module out of the production bundle entirely.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getLocalD1Adapter } = require("./localD1Adapter") as typeof import("./localD1Adapter");
      const adapter = getLocalD1Adapter();
      if (adapter) {
        return {
          DB: adapter as unknown as import("@cloudflare/workers-types").D1Database,
          // ASSETS is not needed for read-only page rendering
          ASSETS: null as unknown as import("@cloudflare/workers-types").Fetcher,
        };
      }
    } catch {
      // node:sqlite or localD1Adapter unavailable – fall through to null
    }
  }

  return null;
}

export function isCloudflareEdge(): boolean {
  return getCloudflareEnv() !== null;
}
