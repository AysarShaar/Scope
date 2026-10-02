'use client';

import React, { useState } from 'react';
import { X, Play, Share2, Check } from 'lucide-react';
import { ScopeShow } from '../data/scopeData';
import { ScopeVisual } from './ScopeVisual';

interface ScopeShowModalProps {
  show: ScopeShow | null;
  onClose: () => void;
}

export const ScopeShowModal: React.FC<ScopeShowModalProps> = ({ show, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!show) return null;

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-[#121b2d] border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Top Header */}
        <div className="px-5 py-3 border-b border-slate-800 bg-[#0a0f1d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626]"></span>
            <span className="font-bold text-sm sm:text-base">برنامج: {show.title}</span>
            <span className="text-xs text-slate-400">({show.subtitle})</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Player */}
        <div className="relative aspect-video w-full bg-black">
          <ScopeVisual type={show.imageType} className="w-full h-full" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-16 h-16 rounded-full bg-[#dc2626] hover:bg-[#b91c1c] text-white flex items-center justify-center shadow-xl transform hover:scale-105 transition-all cursor-pointer"
              aria-label={isPlaying ? 'إيقاف الفيديو' : 'تشغيل الفيديو'}
            >
              <Play className="w-7 h-7 fill-white ml-1" />
            </button>
          </div>
        </div>

        {/* Episode Info & Description */}
        <div className="p-6 space-y-4 bg-[#121b2d]">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">{show.latestEpisode}</h3>
              <p className="text-xs text-slate-400 font-sans">
                تقديم وإعداد: {show.host} · {show.episodeCount} حلقة مسجلة
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs rounded-full flex items-center gap-1.5 cursor-pointer relative transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                <span>{copied ? 'تم نسخ الرابط!' : 'مشاركة الحلقة'}</span>
              </button>
            </div>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed font-normal">
            {show.description}
          </p>
        </div>
      </div>
    </div>
  );
};
