import { getCloudflareEnv } from '../cloudflare';
import { getDb } from '../../db/client';
import { settings } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { ScopeArticle, ScopeShow, BreakingItem } from '../../data/scopeData';
import { getServerArticles, getServerSpecialArticle, getServerSpecialArticles } from './articles';
import { getServerPrograms } from './programs';
import { getServerBreaking } from './breaking';

export interface HomeBootstrap {
  articles: ScopeArticle[];
  specialArticles: ScopeArticle[];
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
 * and the live stream id.
 */
export async function getHomeBootstrap(articleLimit = 36): Promise<HomeBootstrap> {
  const [articles, specialArticles, programs, breakingItems, liveStreamId] = await Promise.all([
    getServerArticles(undefined, articleLimit),
    getServerSpecialArticles(4),
    getServerPrograms(),
    getServerBreaking(12),
    getLiveStreamId(),
  ]);
  const special = specialArticles[0] || null;
  return { articles, specialArticles, special, programs, breaking: breakingItems, liveStreamId };
}
