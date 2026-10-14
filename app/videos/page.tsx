import type { Metadata } from 'next';
import VideosClient from '../../components/VideosClient';
import { getServerPrograms } from '../../lib/server/programs';
import { getServerBreaking } from '../../lib/server/breaking';

// D1 does not exist at build time, so render per request (worker.ts caches the result).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'الفيديوهات',
  description: 'أحدث الفيديوهات والحلقات الكاملة من برامج سكوب ميديا.',
  alternates: { canonical: '/videos' },
};

export default async function Page() {
  const [programs, breaking] = await Promise.all([getServerPrograms(), getServerBreaking(12)]);
  return <VideosClient initialPrograms={programs} initialBreaking={breaking} />;
}
