import { programs, episodes } from '../../db/schema';
import { ScopeShow, ProgramEpisode } from '../../data/scopeData';
import { extractYouTubeId } from '../youtube';

type ProgramRow = typeof programs.$inferSelect;
type EpisodeRow = typeof episodes.$inferSelect;

export function episodeRowToEpisode(e: EpisodeRow): ProgramEpisode {
  return {
    id: e.id,
    programId: e.programId,
    title: e.title,
    youtubeId: extractYouTubeId(e.youtubeId) || e.youtubeId,
    date: e.date,
    description: e.description || undefined,
    episodeNumber: e.episodeNumber || undefined,
    duration: e.duration || undefined,
  };
}

/** Legacy rows kept their episodes as a JSON string on the program itself. */
function parseLegacyEpisodes(raw: string | null): ProgramEpisode[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Builds a show from its row plus the rows of the `episodes` table (newest first).
 * `episodeRows` may contain episodes of other programs; only this program's are used.
 * When the table has no episodes for the program we fall back to the legacy JSON column.
 * `maxEpisodes` trims the returned list (list pages only show a few) but the count stays real.
 */
export function rowToShow(
  row: ProgramRow,
  episodeRows: EpisodeRow[] = [],
  options: { maxEpisodes?: number } = {},
): ScopeShow {
  const own = episodeRows.filter((e) => e.programId === row.id);
  const all = own.length > 0 ? own.map(episodeRowToEpisode) : parseLegacyEpisodes(row.episodes);
  const shown = options.maxEpisodes ? all.slice(0, options.maxEpisodes) : all;

  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle || '',
    description: row.description || '',
    host: row.host || '',
    imageType: row.imageType || 'anchor_studio',
    imageUrl: row.imageUrl || undefined,
    episodeCount: own.length > 0 ? own.length : (row.episodeCount ?? all.length),
    latestEpisode: all[0]?.title || row.latestEpisode || '',
    youtubeId: all[0]?.youtubeId || row.youtubeId || undefined,
    episodes: shown,
  };
}
