import { cache } from 'react';
import { desc } from 'drizzle-orm';
import { getCloudflareEnv } from '../cloudflare';
import { getDb } from '../../db/client';
import { breaking } from '../../db/schema';
import { BreakingItem } from '../../data/scopeData';

/** Latest breaking-news headlines, read straight from D1 (used by server pages and /api/home). */
export const getServerBreaking = cache(async (limit = 12): Promise<BreakingItem[]> => {
  const env = getCloudflareEnv();
  if (!env?.DB) return [];
  try {
    const db = getDb(env.DB);
    const rows = await db.select().from(breaking).orderBy(desc(breaking.createdAt)).limit(limit);
    return rows.map((r) => ({ id: r.id, title: r.title }));
  } catch (err) {
    console.error('[getServerBreaking] direct D1 error:', err);
    return [];
  }
});
