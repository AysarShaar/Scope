import { getCloudflareEnv } from '../cloudflare';
import { getDb } from '../../db/client';
import { settings } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { ScopeArticle, ScopeShow, BreakingItem } from '../../data/scopeData';
import { getServerArticles, getServerSpecialArticle } from './articles';
import { getServerPrograms } from './programs';
import { getServerBreaking } from './breaking';

export interface HomeBootstrap {
  articles: ScopeArticle[];
  special: ScopeArticle | null;
  programs: ScopeShow[];
  breaking: BreakingItem[];
  liveStreamId: string;
}

async function getLiveStreamId(): Promise<string> {
  const env = getCloudflareEnv();
  if (!env?.DB) return '';
  try {
    const db = getDb(env.DB);
    const rows = await db.select().from(settings).where(eq(settings.key, 'live_stream_id')).limit(1);
    return rows[0]?.value?.trim() || '';
  } catch (err) {
    console.error('[getLiveStreamId] direct D1 error:', err);
    return '';
  }
}

/**
 * Everything the home page needs in one go: the latest articles, the programs, the breaking ticker
 * and the live stream id. The browser used to fire four separate API requests (= four Worker
 * invocations) for this on every visit.
 */
export async function getHomeBootstrap(articleLimit = 14): Promise<HomeBootstrap> {
  const [articles, special, programs, breakingItems, liveStreamId] = await Promise.all([
    getServerArticles(undefined, articleLimit),
    getServerSpecialArticle(),
    getServerPrograms(),
    getServerBreaking(12),
    getLiveStreamId(),
  ]);
  return { articles, special, programs, breaking: breakingItems, liveStreamId };
}
