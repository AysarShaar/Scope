import type { Metadata } from 'next';
import HomeClient from '../components/HomeClient';
import { getHomeBootstrap } from '../lib/server/home';

// D1 does not exist at build time, so the page must be rendered per request (worker.ts caches it).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  const initialData = await getHomeBootstrap().catch(() => null);
  return <HomeClient initialData={initialData} />;
}
