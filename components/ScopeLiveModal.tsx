'use client';

import React from 'react';
import { X, Radio } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useLiveStreamId } from '../hooks/use-live-stream-id';
import { LivePlaceholder } from './LivePlaceholder';

interface ScopeLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScopeLiveModal: React.FC<ScopeLiveModalProps> = ({ isOpen, onClose }) => {
  const { lang, t } = useLanguage();
  const liveStreamId = useLiveStreamId(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[80vh] max-h-[750px] bg-black border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl text-white">
        <div className="px-4 py-2.5 bg-[#070e1b] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-red-500 animate-pulse shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-slate-200">
              {t.liveModal.studioTitle || (lang === 'AR' ? 'البث المباشر' : 'Live Stream')}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title={lang === 'AR' ? 'إغلاق' : 'Close'}
            aria-label={lang === 'AR' ? 'إغلاق' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 w-full bg-black relative">
          {liveStreamId ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${liveStreamId}?autoplay=1&mute=1&playsinline=1&rel=0&enablejsapi=1`}
              title={t.liveModal.studioTitle || 'Live Stream'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0 absolute inset-0"
            />
          ) : (
            <LivePlaceholder title="SCOPE MEDIA" label={t.liveModal.comingSoon} />
          )}
        </div>
      </div>
    </div>
  );
};
