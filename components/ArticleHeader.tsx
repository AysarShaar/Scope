'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../context/LanguageContext';
import { ScopeHeader, getNavHref } from './ScopeHeader';
import { ScopeLiveModal } from './ScopeLiveModal';
import { BreakingItem } from '../data/scopeData';

interface ArticleHeaderProps {
  currentCategorySlug?: string;
  /** Headlines fetched on the server; when present the header does not call /api/breaking itself. */
  breakingNews?: BreakingItem[];
}

export const ArticleHeader: React.FC<ArticleHeaderProps> = ({
  currentCategorySlug = 'news',
  breakingNews,
}) => {
  const router = useRouter();
  const { lang, toggleLang } = useLanguage();
  const [isLiveOpen, setIsLiveOpen] = useState(false);

  const handleSelectTab = (tab: string) => {
    router.push(getNavHref(tab));
  };

  return (
    <>
      <ScopeHeader
        currentTab={currentCategorySlug}
        onSelectTab={handleSelectTab}
        onOpenLive={() => setIsLiveOpen(true)}
        currentLang={lang}
        onToggleLang={toggleLang}
        breakingNews={breakingNews}
      />

      <ScopeLiveModal
        isOpen={isLiveOpen}
        onClose={() => setIsLiveOpen(false)}
      />
    </>
  );
};
