import type { Metadata } from 'next';
import ProgramsClient from '../../components/ProgramsClient';
import { getServerPrograms } from '../../lib/server/programs';
import { getServerBreaking } from '../../lib/server/breaking';

// D1 does not exist at build time, so render per request (worker.ts caches the result).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'البرامج',
  description: 'دليل برامج سكوب ميديا: حوارات وتحليلات وتحقيقات مرئية حصرية مع حلقاتها الكاملة.',
  alternates: { canonical: '/programs' },
};

export default async function Page() {
  const [programs, breaking] = await Promise.all([getServerPrograms(), getServerBreaking(12)]);
  return <ProgramsClient initialPrograms={programs} initialBreaking={breaking} />;
}
