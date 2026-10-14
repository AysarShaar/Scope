'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

const STAFF_COOKIE = 'scope_staff';

/**
 * Mirrors the signed-in staff role into a plain cookie so public pages (e.g. the article page) can tell
 * whether to show staff-only buttons WITHOUT calling the auth API for every visitor. It is only a UI hint:
 * every protected API still verifies the real session.
 */
export function StaffCookieSync() {
  const { data: session, status } = useSession();
  const role = session?.user?.role;

  useEffect(() => {
    if (status === 'loading') return;
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    if (status === 'authenticated' && role) {
      document.cookie = `${STAFF_COOKIE}=${encodeURIComponent(role)}; path=/; max-age=2592000; SameSite=Lax${secure}`;
    } else {
      document.cookie = `${STAFF_COOKIE}=; path=/; max-age=0; SameSite=Lax${secure}`;
    }
  }, [status, role]);

  return null;
}
