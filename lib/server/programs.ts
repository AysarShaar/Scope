import { cache } from 'react';
import { getCloudflareEnv } from '../cloudflare';
import { getDb } from '../../db/client';
import { programs, episodes } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { ScopeShow } from '../../data/scopeData';
import { rowToShow } from './programMapper';

const LIST_EPISODES_PREVIEW = 4;

export const getServerProgramById = cache(async (id: string): Promise<ScopeShow | null> => {
  const env = getCloudflareEnv();
  if (env?.DB) {
    try {
      const db = getDb(env.DB);
      const rows = await db
        .select()
        .from(programs)
        .where(eq(programs.id, id))
        .limit(1);

      if (rows[0]) {
        let epRows: (typeof episodes.$inferSelect)[] = [];
        try {
          epRows = await db
            .select()
            .from(episodes)
            .where(eq(episodes.programId, id))
            .orderBy(desc(episodes.date), desc(episodes.createdAt));
        } catch {}

        return rowToShow(rows[0], epRows);
      }
    } catch (err) {
      console.error('[getServerProgramById] direct D1 error:', err);
    }
  }

  return null;
});

export const getServerPrograms = cache(async (): Promise<ScopeShow[]> => {
  const env = getCloudflareEnv();
  if (env?.DB) {
    try {
      const db = getDb(env.DB);
      const rows = await db
        .select()
        .from(programs)
        .orderBy(desc(programs.createdAt));

      let allEpRows: (typeof episodes.$inferSelect)[] = [];
      try {
        allEpRows = await db
          .select()
          .from(episodes)
          .orderBy(desc(episodes.date), desc(episodes.createdAt));
      } catch {}

      return rows.map((r) => {
        return rowToShow(r, allEpRows, { maxEpisodes: LIST_EPISODES_PREVIEW });
      });
    } catch (err) {
      console.error('[getServerPrograms] direct D1 error:', err);
    }
  }

  return [];
});

