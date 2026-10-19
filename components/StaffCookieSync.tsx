'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { can } from '../lib/permissions';

const STAFF_COOKIE = 'scope_staff';

/**
 * Mirrors whether the signed-in staff has can_special into a plain cookie so public pages (e.g. the article page) can tell
 * whether to show the special coverage button WITHOUT calling the auth API for every visitor. It is only a UI hint:
 * the protected API (/api/articles/[id]/special) strictly verifies the session and database permissions.
 */
export function StaffCookieSync() {
  const { data: session, status } = useSession();
  const permissions = session?.user?.permissions;
  const role = session?.user?.role;

  const canSpecial = permissions
    ? can({ permissions }, 'articles.set_special')
    : role === 'admin' || role === 'editor_in_chief';

  useEffect(() => {
    if (status === 'loading') return;
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    // Short-lived cookie (24 hours) storing only the can_special UI hint
    if (status === 'authenticated' && canSpecial) {
      document.cookie = `${STAFF_COOKIE}=can_special; path=/; max-age=86400; SameSite=Lax${secure}`;
    } else {
      document.cookie = `${STAFF_COOKIE}=; path=/; max-age=0; SameSite=Lax${secure}`;
    }
  }, [status, canSpecial]);

  return null;
}
