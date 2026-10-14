'use client';

import React from 'react';
import { ScopeHeader } from '../components/ScopeHeader';
import {
  ScopeHeroGridSkeleton,
  ScopeProgramsRowSkeleton,
} from '../components/ScopeSkeleton';
import { ScopeFooter } from '../components/ScopeFooter';
import { useLanguage } from '../context/LanguageContext';

export default function Loading() {
  const { lang, dir, toggleLang } = useLanguage();

  return (
    <div
      dir={dir}
      className="min-h-screen bg-white dark:bg-[#0f0f0f] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200"
    >
      <ScopeHeader
        currentTab="home"
        onSelectTab={() => {}}
        onOpenLive={() => {}}
        onOpenSearch={() => {}}
        onOpenSettings={() => {}}
        currentLang={lang}
        onToggleLang={toggleLang}
      />

      <main className="flex-1 max-w-[1480px] mx-auto w-full px-3 sm:px-6 pt-5">
        <div className="space-y-7">
          <ScopeHeroGridSkeleton />

          <div className="pt-2">
            <ScopeProgramsRowSkeleton />
          </div>
        </div>
      </main>

      <ScopeFooter onSelectTab={() => {}} />
    </div>
  );
}
