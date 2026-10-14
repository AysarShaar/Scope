import React from 'react';
import { AuthProvider } from '../../components/AuthProvider';
import { StaffCookieSync } from '../../components/StaffCookieSync';

import AdminShell from './components/AdminShell';

export const metadata = {
  title: 'لوحة التحكم | SCOPE MEDIA Admin',
  description: 'لوحة إدارة المحتوى والبرامج لمنصة سكوب ميديا',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <StaffCookieSync />
      <AdminShell>{children}</AdminShell>
    </AuthProvider>
  );
}
