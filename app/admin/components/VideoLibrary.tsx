'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Trash2, Edit2, Video, X, Film, Play, Search, ExternalLink } from 'lucide-react';
import { ScopeShow, ProgramEpisode } from '../../../data/scopeData';

export interface VideoItem {
  episode: ProgramEpisode;
  program: ScopeShow;
}

interface Props {
  programs: ScopeShow[];
  /** Every episode of every program, flattened (the parent also needs the total for its header). */
  allVideos: VideoItem[];
  canManage: boolean;
  onPreview: (video: { title: string; youtubeId: string }) => void;
  onEdit: (episode: ProgramEpisode, programId: string) => void;
  onDelete: (episodeId: string, programId?: string) => void;
}

/** Searchable, filterable grid of all episodes across programs. */
export function VideoLibrary({ programs, allVideos, canManage, onPreview, onEdit, onDelete }: Props) {
  const [searchVideoQuery, setSearchVideoQuery] = useState('');
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>('all');

  const filteredVideos = useMemo(() => {
    const q = searchVideoQuery.trim().toLowerCase();
    return allVideos.filter(({ episode, program }) => {
      const matchesProgram = selectedProgramFilter === 'all' || program.id === selectedProgramFilter;
      const matchesSearch =
        !q ||
        episode.title.toLowerCase().includes(q) ||
        (episode.description && episode.description.toLowerCase().includes(q)) ||
        program.title.toLowerCase().includes(q);
      return matchesProgram && matchesSearch;
    });
  }, [allVideos, selectedProgramFilter, searchVideoQuery]);

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchVideoQuery}
            onChange={e => setSearchVideoQuery(e.target.value)}
            placeholder="بحث في عناوين الفيديوهات..."
            className="w-full pr-8 pl-3 py-1.5 bg-slate-50 dark:bg-[#121624] border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-400"
          />
          {searchVideoQuery && (
            <button
              onClick={() => setSearchVideoQuery('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-[11px] text-slate-500 whitespace-nowrap">تصفية حسب البرنامج:</label>
          <select
            value={selectedProgramFilter}
            onChange={e => setSelectedProgramFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-[#121624] border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer"
          >
            <option value="all">كافة البرامج ({allVideos.length} فيديو)</option>
            {programs.map(p => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.episodes?.length || 0})
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredVideos.length === 0 ? (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500 bg-white dark:bg-[#0c101c] border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs space-y-2">
          <Video className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
          <p>لا توجد مقاطع فيديو مطابقة للبحث أو الفلتر المختار</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredVideos.map(({ episode, program }) => {
            const thumbUrl = episode.youtubeId
              ? `https://img.youtube.com/vi/${episode.youtubeId}/mqdefault.jpg`
              : null;

            return (
              <div
                key={`${program.id}-${episode.id}`}
                className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs group"
              >
                <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                  {thumbUrl ? (
                    <Image
                      src={thumbUrl}
                      alt={episode.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <Film size={24} />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() =>
                        onPreview({
                          title: episode.title,
                          youtubeId: episode.youtubeId,
                        })
                      }
                      className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full transition-transform active:scale-90 cursor-pointer shadow-lg"
                      title="تشغيل ومعاينة الفيديو"
                    >
                      <Play size={16} fill="white" />
                    </button>
                    <a
                      href={`https://www.youtube.com/watch?v=${episode.youtubeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-white/90 hover:bg-white text-slate-900 rounded-full transition-transform active:scale-90 shadow-lg"
                      title="فتح في YouTube"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>

                  <div className="absolute top-2 right-2 max-w-[80%] bg-black/75 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded truncate">
                    {program.title}
                  </div>

                  {episode.date && (
                    <div className="absolute bottom-2 left-2 bg-black/70 text-slate-300 text-[10px] px-1.5 py-0.5 rounded font-mono">
                      {episode.date}
                    </div>
                  )}
                </div>

                <div className="p-3 space-y-2.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-relaxed">
                      {episode.title}
                    </h4>
                    {episode.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                        {episode.description}
                      </p>
                    )}
                    <div className="text-[10px] font-mono text-slate-400 truncate">
                      ID: {episode.youtubeId}
                    </div>
                  </div>

                  {canManage && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1.5">
                      <button
                        onClick={() => onEdit(episode, program.id)}
                        className="flex-1 py-1 px-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 rounded text-[11px] font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Edit2 size={11} className="text-[#A42424]" />
                        <span>تعديل الفيديو</span>
                      </button>

                      <button
                        onClick={() => onDelete(episode.id, program.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="حذف هذا الفيديو"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
