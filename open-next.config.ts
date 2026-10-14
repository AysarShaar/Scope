import { defineCloudflareConfig } from '@opennextjs/cloudflare';

export default defineCloudflareConfig({
  // No incremental cache on purpose: pages are cached by worker.ts (Cache API). Add an R2 incremental
  // cache here only if ISR/revalidation is needed later.
});
