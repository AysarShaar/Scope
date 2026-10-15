'use client';

import dynamic from 'next/dynamic';

const AnalyticsDashboard = dynamic(
  () => import('../components/AnalyticsDashboard'),
  { ssr: false }
);

export default function AdminDashboardPage() {
  return <AnalyticsDashboard />;
}
