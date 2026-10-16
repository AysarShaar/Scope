import type { Metadata } from 'next';
import HomeClient from '../components/HomeClient';
import { getHomeBootstrap } from '../lib/server/home';

// ISR: Revalidate every 120 seconds
export const revalidate = 120;

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  const initialData = await getHomeBootstrap().catch(() => null);
  return <HomeClient initialData={initialData} />;
}
