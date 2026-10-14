import { describe, it, expect } from 'vitest';
import { rowToShow, episodeRowToEpisode } from './programMapper';

type ProgramRow = Parameters<typeof rowToShow>[0];
type EpisodeRow = Parameters<typeof episodeRowToEpisode>[0];

const program = (extra: Record<string, unknown> = {}) =>
  ({ id: 'p1', title: 'برنامج', ...extra }) as unknown as ProgramRow;

const ep = (id: string, programId = 'p1', youtubeId = 'dQw4w9WgXcQ') =>
  ({ id, programId, title: `حلقة ${id}`, youtubeId, date: '2026-03-05' }) as unknown as EpisodeRow;

describe('episodeRowToEpisode', () => {
  it('extracts the video id from a full YouTube url', () => {
    const e = episodeRowToEpisode(ep('e1', 'p1', 'https://youtu.be/dQw4w9WgXcQ'));
    expect(e.youtubeId).toBe('dQw4w9WgXcQ');
  });

  it('keeps the stored value when no id can be extracted', () => {
    expect(episodeRowToEpisode(ep('e1', 'p1', 'weird')).youtubeId).toBe('weird');
  });
});

describe('rowToShow', () => {
  it('uses the real episodes of this program only', () => {
    const show = rowToShow(program(), [ep('e1'), ep('e2'), ep('x', 'other')]);
    expect(show.episodeCount).toBe(2);
    expect(show.episodes?.map((e) => e.id)).toEqual(['e1', 'e2']);
    expect(show.latestEpisode).toBe('حلقة e1');
  });

  it('trims the list with maxEpisodes but keeps the real count', () => {
    const show = rowToShow(program(), [ep('e1'), ep('e2'), ep('e3')], { maxEpisodes: 2 });
    expect(show.episodes).toHaveLength(2);
    expect(show.episodeCount).toBe(3);
  });

  it('falls back to the legacy JSON column when the table has none', () => {
    const legacy = JSON.stringify([{ id: 'old', title: 'قديمة', youtubeId: 'dQw4w9WgXcQ' }]);
    const show = rowToShow(program({ episodes: legacy }), []);
    expect(show.episodes).toHaveLength(1);
    expect(show.latestEpisode).toBe('قديمة');
  });

  it('survives corrupt legacy JSON', () => {
    const show = rowToShow(program({ episodes: '{broken' }), []);
    expect(show.episodes).toEqual([]);
    expect(show.episodeCount).toBe(0);
  });

  it('applies defaults for empty fields', () => {
    const show = rowToShow(program(), []);
    expect(show.subtitle).toBe('');
    expect(show.imageType).toBe('anchor_studio');
  });
});
