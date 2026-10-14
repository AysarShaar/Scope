'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Play, Share2, Check } from 'lucide-react';
import { ScopeShow, ProgramEpisode } from '../data/scopeData';
import { ScopeVisual } from './ScopeVisual';
import { useLanguage } from '../context/LanguageContext';
import { translatedShows } from '../lib/translations';

import { extractYouTubeId } from '../lib/youtube';

interface ScopeShowModalProps {
  show: ScopeShow | null;
  onClose: () => void;
  initialEpisodeId?: string;
}

export const ScopeShowModal: React.FC<ScopeShowModalProps> = ({
  show,
  onClose,
  initialEpisodeId,
}) => {
  const { lang, dir } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | undefined>(undefined);
  const [activeEpisodeTitle, setActiveEpisodeTitle] = useState<string | undefined>(undefined);
  const [episodesList, setEpisodesList] = useState<ProgramEpisode[]>([]);

  React.useEffect(() => {
    if (show) {
      const initialEpisodes = show.episodes || [];
      setEpisodesList(initialEpisodes);

      let targetEp = initialEpisodes.find((e) => e.id === initialEpisodeId);
      if (!targetEp && initialEpisodes.length > 0) {
        targetEp = initialEpisodes[0];
      }

      const rawYt = targetEp?.youtubeId || show.youtubeId || initialEpisodes[0]?.youtubeId;
      const cleanYt = extractYouTubeId(rawYt) || rawYt;
      setActiveVideoId(cleanYt);
      setActiveEpisodeTitle(targetEp?.title || show.latestEpisode || show.title);
      setIsPlaying(true);

      fetch(`/api/episodes?programId=${show.id}`)
        .then((r) => r.json())
        .then((data) => {
          if (data?.success && Array.isArray(data.data) && data.data.length > 0) {
            setEpisodesList(data.data);
            if (initialEpisodeId) {
              const matched = data.data.find((e: ProgramEpisode) => e.id === initialEpisodeId);
              if (matched) {
                const epYt = extractYouTubeId(matched.youtubeId) || matched.youtubeId;
                setActiveVideoId(epYt);
                setActiveEpisodeTitle(matched.title);
              }
            }
          }
        })
        .catch(() => {});
    }
  }, [show, initialEpisodeId]);

  if (!show) return null;

  const tr = translatedShows[show.id];
  const title = (lang === 'EN' && tr?.title.EN) || show.title;
  const subtitle = (lang === 'EN' && tr?.subtitle.EN) || show.subtitle;
  const host = (lang === 'EN' && tr?.host.EN) || show.host;
  const description = (lang === 'EN' && tr?.description.EN) || show.description;

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const episodes = episodesList;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] bg-[#121b2d] border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white"
        dir={dir}
      >
        <div className="px-5 py-3 border-b border-slate-800 bg-[#0a0f1d] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#A42424]"></span>
            <span className="font-bold text-sm sm:text-base">
              {lang === 'EN' ? `Show: ${title}` : `برنامج: ${title}`}
            </span>
            <span className="text-xs text-slate-400">({subtitle})</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label={lang === 'EN' ? 'Close' : 'إغلاق'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative aspect-video w-full bg-black shrink-0">
          {isPlaying && activeVideoId ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${activeVideoId}?autoplay=1&mute=1&playsinline=1&enablejsapi=1&rel=0`}
              title={activeEpisodeTitle || title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : (
            <>
              <ScopeVisual imageUrl={show.imageUrl} type={show.imageType} className="w-full h-full" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <button
                  onClick={() => setIsPlaying(true)}
                  className="w-16 h-16 rounded-full bg-[#A42424] hover:bg-[#8B1E1E] text-white flex items-center justify-center shadow-xl transform hover:scale-105 transition-all cursor-pointer"
                  aria-label={lang === 'EN' ? 'Play' : 'تشغيل الفيديو'}
                >
                  <Play className="w-7 h-7 fill-white ml-1" />
                </button>
              </div>
            </>
          )}
        </div>

        <div className="p-5 sm:p-6 space-y-4 bg-[#121b2d] overflow-y-auto flex-1">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
                {activeEpisodeTitle || show.latestEpisode}
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                {lang === 'EN'
                  ? `Host & Producer: ${host} · ${episodes.length || show.episodeCount} recorded episodes`
                  : `تقديم وإعداد: ${host} · ${episodes.length || show.episodeCount} حلقة مسجلة`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs rounded-full flex items-center gap-1.5 cursor-pointer relative transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                <span>
                  {copied
                    ? lang === 'EN' ? 'Link Copied!' : 'تم نسخ الرابط!'
                    : lang === 'EN' ? 'Share Episode' : 'مشاركة الحلقة'}
                </span>
              </button>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed font-normal">
            {description}
          </p>

          {episodes.length > 0 && (
            <div className="pt-3 border-t border-slate-800 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#A42424]"></span>
                <span>{lang === 'EN' ? 'Show Episodes & Videos' : 'حلقات وفيديوهات البرنامج'}:</span>
                <span className="text-[11px] font-mono text-slate-500 font-normal">({episodes.length})</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {episodes.map((ep, idx) => {
                  const cleanEpYt = extractYouTubeId(ep.youtubeId) || ep.youtubeId;
                  const isCurrent = cleanEpYt === activeVideoId;
                  const thumb = cleanEpYt ? `https://img.youtube.com/vi/${cleanEpYt}/mqdefault.jpg` : undefined;

                  return (
                    <div
                      key={ep.id || idx}
                      onClick={() => {
                        setActiveVideoId(cleanEpYt);
                        setActiveEpisodeTitle(ep.title);
                        setIsPlaying(true);
                      }}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                        isCurrent
                          ? 'bg-[#A42424]/15 border-[#A42424] text-white shadow-sm'
                          : 'bg-[#0a0f1d] border-slate-800 hover:border-slate-700 text-slate-200'
                      }`}
                    >
                      <div className="relative w-20 h-13 rounded-lg overflow-hidden bg-black shrink-0">
                        {thumb ? (
                          <Image
                            src={thumb}
                            alt={ep.title}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-900" />
                        )}
                        <div className={`absolute inset-0 flex items-center justify-center ${isCurrent ? 'bg-[#A42424]/50' : 'bg-black/30'}`}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${
                            isCurrent ? 'bg-white text-[#A42424]' : 'bg-[#A42424] text-white'
                          }`}>
                            <Play size={10} className="fill-current ml-0.5" />
                          </div>
                        </div>
                        <span className="absolute bottom-0.5 left-0.5 bg-black/80 text-white text-[8px] font-bold px-1 rounded">
                          #{ep.episodeNumber || idx + 1}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <h5 className="text-xs font-bold truncate">{ep.title}</h5>
                          {isCurrent && (
                            <span className="text-[9px] bg-[#A42424] text-white px-1.5 py-0.5 rounded font-bold shrink-0">
                              {lang === 'EN' ? 'Playing' : 'يعرض الآن'}
                            </span>
                          )}
                        </div>
                        {ep.date && (
                          <span className="text-[10px] text-slate-400 block font-mono">{ep.date}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
