import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleHeader } from '../../../components/ArticleHeader';
import { ScopeFooter } from '../../../components/ScopeFooter';
import { ProgramDetailClient } from '../../../components/ProgramDetailClient';
import { getServerProgramById, getServerPrograms } from '../../../lib/server/programs';
import { getServerBreaking } from '../../../lib/server/breaking';
import { extractYouTubeId } from '../../../lib/youtube';
import { getSiteUrl } from '../../../lib/site';

export const revalidate = 60;

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ep?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { ep } = await searchParams;
  const program = await getServerProgramById(id);

  if (!program) {
    return {
      title: 'البرنامج غير موجود',
      robots: { index: false, follow: false },
      description: 'الصفحة المطلوبة غير متوفرة في دليل برامج SCOPE MEDIA.',
    };
  }

  const activeEp = ep
    ? program.episodes?.find((e) => e.id === ep)
    : program.episodes?.[0];

  const siteUrl = getSiteUrl();
  const showUrl = `${siteUrl}/programs/${program.id}${ep ? `?ep=${ep}` : ''}`;
  const title = activeEp
    ? `${activeEp.title} - ${program.title}`
    : `${program.title} | برامج`;
  const description =
    activeEp?.description ||
    program.description ||
    `شاهد حلقات برنامج ${program.title} تقديم ${program.host} عبر منصة SCOPE MEDIA.`;

  const ytId = activeEp?.youtubeId
    ? extractYouTubeId(activeEp.youtubeId) || activeEp.youtubeId
    : program.youtubeId
    ? extractYouTubeId(program.youtubeId) || program.youtubeId
    : undefined;

  let ogImageUrl = `${siteUrl}/og-default.png`;
  if (ytId) {
    ogImageUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  } else if (program.imageUrl) {
    ogImageUrl = program.imageUrl.startsWith('http')
      ? program.imageUrl
      : `${siteUrl}${program.imageUrl.startsWith('/') ? '' : '/'}${program.imageUrl}`;
  }

  return {
    title,
    description,
    keywords: [
      program.title,
      program.host,
      'برامج سكوب ميديا',
      'تحليلات استقصائية',
      'فيديوهات حصرية',
      'SCOPE MEDIA Shows',
    ],
    alternates: {
      canonical: showUrl,
    },
    openGraph: {
      title,
      description,
      url: showUrl,
      siteName: 'SCOPE MEDIA | سكوب ميديا',
      images: [
        {
          url: ogImageUrl,
          width: 1280,
          height: 720,
          alt: program.title,
        },
      ],
      type: 'video.other',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function ProgramPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { ep } = await searchParams;

  const [program, allPrograms, breakingNews] = await Promise.all([
    getServerProgramById(id),
    getServerPrograms(),
    getServerBreaking(12),
  ]);

  if (!program) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] dark:bg-[#080e1a] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      <ArticleHeader currentCategorySlug="programs" breakingNews={breakingNews} />
      <div className="flex-1">
        <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-slate-400">جاري تحميل البرنامج...</div>}>
          <ProgramDetailClient
            initialShow={program}
            otherShows={allPrograms}
            initialEpisodeId={ep}
          />
        </Suspense>
      </div>
      <ScopeFooter />
    </div>
  );
}
