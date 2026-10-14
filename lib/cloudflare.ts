import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface CloudflareEnv {
  DB: import("@cloudflare/workers-types").D1Database;
  ASSETS: import("@cloudflare/workers-types").Fetcher;
  /** R2 bucket for article images; when absent, uploads fall back to Cloudinary. */
  IMAGES?: import("@cloudflare/workers-types").R2Bucket;
}

export function getCloudflareEnv(): CloudflareEnv | null {
  try {
    const { env } = getCloudflareContext();
    const bindings = env as unknown as Partial<CloudflareEnv>;
    if (bindings?.DB && typeof bindings.DB.prepare === "function") {
      return bindings as CloudflareEnv;
    }
  } catch (err) {
    // Not running inside a Cloudflare request context
  }

  return null;
}

export function isCloudflareEdge(): boolean {
  return getCloudflareEnv() !== null;
}
