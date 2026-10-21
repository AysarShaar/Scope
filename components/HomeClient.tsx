'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ScopeArticle,
  ScopeShow,
} from '../data/scopeData';
import { newsService, HomeBootstrapData } from '../services/newsService';
import { ScopeHeader } from '../components/ScopeHeader';
import { ScopeHeroGrid, ScopeProgramsRow } from '../components/ScopeHeroGrid';
import { ScopeLiveModal } from '../components/ScopeLiveModal';
import { ScopeSettingsModal } from '../components/ScopeSettingsModal';
import { ScopeFooter } from '../components/ScopeFooter';
import { useLanguage } from '../context/LanguageContext';

export default function HomeClient({ initialData }: { initialData: HomeBootstrapData | null }) {
  const router = useRouter();
  const { lang, dir, toggleLang } = useLanguage();

  const [articles, setArticles] = useState<ScopeArticle[]>(initialData?.articles ?? []);
  const [special, setSpecial] = useState<ScopeArticle | null>(initialData?.special ?? null);
  const [specialArticles, setSpecialArticles] = useState<ScopeArticle[]>(
    initialData?.specialArticles ?? (initialData?.special ? [initialData.special] : [])
  );
  const [programs, setPrograms] = useState<ScopeShow[]>(initialData?.programs ?? []);
  const [isLoading, setIsLoading] = useState<boolean>(!initialData);

  const [isLiveOpen, setIsLiveOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Started during the first client render (before child effects run) so the header and hero can
  // wait on this one shared request instead of each calling its own endpoint.
  const [bootstrap] = useState(() => {
    if (typeof window === 'undefined') return null;
    if (initialData) {
      newsService.seedHomeBootstrap(initialData);
      return null;
    }
    return newsService.getHomeBootstrap();
  });

  useEffect(() => {
    if (initialData) return;
    let isMounted = true;
    async function loadHomeData() {
      try {
        setIsLoading(true);
        let data = await (bootstrap ?? newsService.getHomeBootstrap());

        if (!data) {
          // Fallback: the combined endpoint failed, use the individual ones.
          const [articlesData, programsRes] = await Promise.all([
            newsService.getArticles(undefined, undefined, 36, 1, false),
            fetch('/api/programs').then((r) => r.json()).catch(() => null),
          ]);
          data = {
            articles: articlesData || [],
            programs: programsRes?.success && Array.isArray(programsRes.data) ? programsRes.data : [],
            breaking: [],
            liveStreamId: '',
          };
        }

        if (isMounted) {
          setArticles(data.articles || []);
          setSpecial(data.special ?? null);
          setSpecialArticles(data.specialArticles || (data.special ? [data.special] : []));
          setPrograms(data.programs || []);
        }
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadHomeData();
    return () => {
      isMounted = false;
    };
  }, [bootstrap, initialData]);

  const handleSelectTag = (tag: string) => {
    router.push(`/search?q=${encodeURIComponent(tag)}`);
  };

  return (
    <div
      className="min-h-screen bg-[#f8fafc] dark:bg-[#0a0f1d] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200"
      dir={dir}
    >
      <ScopeHeader
        currentTab="home"
        transparentOverlay={true}
        onOpenLive={() => setIsLiveOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        currentLang={lang}
        onToggleLang={toggleLang}
        breakingNews={initialData?.breaking}
      />

      <h1 className="sr-only">
        {lang === 'AR'
          ? 'سكوب ميديا | تغطيات إخبارية حية وتحقيقات استقصائية - ما وراء العناوين'
          : 'SCOPE MEDIA | Live Breaking News & In-Depth Investigations - Beyond The Headlines'}
      </h1>

      <ScopeHeroGrid
        special={special}
        specialArticles={specialArticles}
        articles={articles}
        shows={programs}
        isLoading={isLoading}
        onOpenShow={(show) => router.push(`/programs/${show.id}`)}
        onViewMoreNews={() => router.push('/category/news')}
        onViewMoreReports={() => router.push('/category/investigations')}
        onViewAllShows={() => router.push('/programs')}
        onOpenLive={() => setIsLiveOpen(true)}
        showProgramsInside={false}
        onSelectTag={handleSelectTag}
      />

      <main className="flex-1 max-w-[1480px] mx-auto w-full px-4 sm:px-6 pb-12">
        <div className="pt-2">
          <ScopeProgramsRow
            isLoading={isLoading}
            shows={programs}
            onOpenShow={(show) => router.push(`/programs/${show.id}`)}
            onViewAllShows={() => router.push('/programs')}
          />
        </div>
      </main>

      <ScopeFooter />

      <ScopeLiveModal
        isOpen={isLiveOpen}
        onClose={() => setIsLiveOpen(false)}
      />

      <ScopeSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentLang={lang}
        onToggleLang={toggleLang}
        showToast={() => {}}
      />
    </div>
  );
}
