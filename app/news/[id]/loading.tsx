'use client';

import React from 'react';
import { ArticleHeader } from '../../../components/ArticleHeader';
import { ScopeArticleSkeleton } from '../../../components/ScopeSkeleton';
import { ScopeFooter } from '../../../components/ScopeFooter';
import { useLanguage } from '../../../context/LanguageContext';

export default function ArticleLoading() {
  const { dir } = useLanguage();

  return (
    <div
      dir={dir}
      className="min-h-screen bg-white dark:bg-[#0f0f0f] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200"
    >
      <ArticleHeader />
      <main className="flex-1 w-full pb-10">
        <ScopeArticleSkeleton />
      </main>
      <ScopeFooter onSelectTab={() => {}} />
    </div>
  );
}
