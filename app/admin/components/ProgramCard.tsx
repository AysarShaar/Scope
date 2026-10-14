'use client';

import { Trash2, Edit2, Video, Film } from 'lucide-react';
import { ScopeShow } from '../../../data/scopeData';
import { ScopeVisual } from '../../../components/ScopeVisual';

interface Props {
  prog: ScopeShow;
  canManage: boolean;
  onBrowseEpisodes: (prog: ScopeShow) => void;
  onEdit: (prog: ScopeShow) => void;
  onDelete: (id: string, title: string) => void;
}

export function ProgramCard({ prog, canManage, onBrowseEpisodes, onEdit, onDelete }: Props) {
  const epCount = prog.episodeCount || (prog.episodes?.length ?? 0);
  return (
    <div
                className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-2xs"
    >
      <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
        <ScopeVisual imageUrl={prog.imageUrl} type={prog.imageType} className="w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 bg-black/70 backdrop-blur-xs rounded text-[10px] font-mono text-white">
          <Film className="w-3 h-3 text-red-400" />
          <span>{epCount} حلقات</span>
        </div>

        <div className="absolute bottom-2.5 right-2.5 left-2.5">
          <h3 className="font-bold text-sm text-white line-clamp-1">{prog.title}</h3>
          <p className="text-[11px] text-slate-300 line-clamp-1">{prog.subtitle}</p>
        </div>
      </div>

      <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5 text-xs">
          <div className="text-slate-500 dark:text-slate-400 text-[11px]">
            تقديم: {prog.host}
          </div>
          {prog.latestEpisode && (
            <div className="text-[11px] text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-2 rounded border border-slate-100 dark:border-slate-800/60 line-clamp-1">
              <span className="font-medium text-slate-500 dark:text-slate-400">الأحدث: </span>
              <span>{prog.latestEpisode}</span>
            </div>
          )}
        </div>

        {canManage && (
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1.5">
            <button
              onClick={() => onBrowseEpisodes(prog)}
              className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 rounded text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Video size={13} className="text-[#A42424]" />
              <span>تصفح وتعديل الحلقات ({epCount})</span>
            </button>

            <button
              onClick={() => onEdit(prog)}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer rounded hover:bg-slate-50 dark:hover:bg-slate-800"
              title="تعديل البرنامج"
            >
              <Edit2 size={13} />
            </button>

            <button
              onClick={() => onDelete(prog.id, prog.title)}
              className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer rounded hover:bg-slate-50 dark:hover:bg-slate-800"
              title="حذف البرنامج"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
