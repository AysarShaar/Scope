'use client';

import React, { useState, useEffect } from 'react';
import { Radio, Globe, Wifi } from 'lucide-react';
import { ScopeLogo } from './ScopeLogo';

interface ScopeNewsLoaderProps {
  fullscreen?: boolean;
  message?: string;
}

const NEWSROOM_PHRASES = [
  'جاري تحميل التغطيات الإخبارية...',
  'تحديث التقارير...',
  'جاري تجهيز المحتوى...',
];

export function ScopeNewsLoader({
  fullscreen = true,
  message,
}: ScopeNewsLoaderProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % NEWSROOM_PHRASES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const containerClasses = fullscreen
    ? 'fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-[#0f0f0f] text-slate-100 select-none overflow-hidden p-6 sm:p-12'
    : 'w-full py-16 flex flex-col items-center justify-center bg-[#181818] border border-neutral-800 rounded-xl text-slate-100 select-none overflow-hidden p-8';

  return (
    <div className={containerClasses} dir="rtl">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-radial from-red-600/15 via-red-950/5 to-transparent rounded-full blur-3xl opacity-70 animate-pulse" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.45)_51%)] bg-[length:100%_4px] opacity-30" />
      </div>

      {fullscreen ? (
        <div className="relative z-10 w-full max-w-4xl flex items-center justify-between border-b border-slate-800/70 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#A42424]" />
            </span>
            <span className="text-[11px] font-bold tracking-wider text-red-500 uppercase font-mono flex items-center gap-1.5">
              <span>بث مباشر</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">غرفة الأخبار والتحرير</span>
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-[11px] font-mono text-slate-500">
            <span className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="text-slate-400">اتصال مشفر ومؤمّن</span>
            </span>
            <span>|</span>
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>تغطية حية</span>
            </span>
          </div>
        </div>
      ) : <div />}

      <div className="relative z-10 flex flex-col items-center justify-center text-center my-auto py-8">
        <div className="relative mb-6 flex items-center justify-center">
          <div className="absolute w-28 h-28 rounded-full border border-red-500/20 animate-ping [animation-duration:3s]" />
          <div className="absolute w-24 h-24 rounded-full border border-red-500/30 animate-pulse [animation-duration:2s]" />

          <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-slate-900 via-[#101728] to-slate-950 border border-slate-700/80 shadow-[0_0_35px_rgba(220,38,38,0.3)] flex items-center justify-center">
            <Radio className="w-8 h-8 text-[#A42424] animate-pulse" />
          </div>
        </div>

        <div className="flex justify-center mb-3">
          <ScopeLogo variant="white" className="h-11 sm:h-12 w-auto" />
        </div>
        <p className="text-xs sm:text-sm font-semibold text-slate-400 tracking-wide mb-6">
          سكوب ميديا • ما وراء العناوين
        </p>

        <div className="flex items-end justify-center gap-1 h-7 mb-6" aria-hidden="true">
          <span className="w-1 bg-[#A42424] rounded-full animate-[bounce_1.1s_infinite_100ms] h-3" />
          <span className="w-1 bg-red-500 rounded-full animate-[bounce_0.9s_infinite_200ms] h-5" />
          <span className="w-1 bg-[#A42424] rounded-full animate-[bounce_1.3s_infinite_300ms] h-7" />
          <span className="w-1 bg-red-400 rounded-full animate-[bounce_0.8s_infinite_150ms] h-4" />
          <span className="w-1 bg-[#A42424] rounded-full animate-[bounce_1.2s_infinite_250ms] h-6" />
          <span className="w-1 bg-red-500 rounded-full animate-[bounce_1.0s_infinite_180ms] h-5" />
          <span className="w-1 bg-[#A42424] rounded-full animate-[bounce_0.9s_infinite_80ms] h-3" />
        </div>

        <div className="w-56 sm:w-72 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative mb-4">
          <div
            className="absolute top-0 bottom-0 w-28 bg-gradient-to-r from-transparent via-[#A42424] to-transparent rounded-full"
            style={{
              animation: 'scopeScan 1.6s ease-in-out infinite',
            }}
          />
        </div>

        <div className="h-6 flex items-center justify-center">
          <p className="text-xs sm:text-[13px] font-medium text-slate-300 transition-all duration-300">
            {message || NEWSROOM_PHRASES[phraseIndex]}
          </p>
        </div>
      </div>

      {fullscreen ? (
        <div className="relative z-10 w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between border-t border-slate-800/70 pt-4 gap-2 text-[10px] sm:text-[11px] font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-slate-400">شبكة الأخبار المستقلة • تحديث لحظي على مدار الساعة</span>
          </div>

          <div className="text-slate-500 tracking-wider">
            [ SCOPE MEDIA // 2026 ]
          </div>
        </div>
      ) : null}

      <style jsx>{`
        @keyframes scopeScan {
          0% {
            transform: translateX(120%);
          }
          50% {
            transform: translateX(-40%);
          }
          100% {
            transform: translateX(-120%);
          }
        }
      `}</style>
    </div>
  );
}
