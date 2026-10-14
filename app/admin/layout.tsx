import React from 'react';
import { AuthProvider } from '../../components/AuthProvider';
import { StaffCookieSync } from '../../components/StaffCookieSync';

export const metadata = {
  title: 'لوحة التحكم | SCOPE MEDIA Admin',
  description: 'لوحة إدارة المحتوى والبرامج لمنصة سكوب ميديا',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <StaffCookieSync />
      {children}
    </AuthProvider>
  );
}
