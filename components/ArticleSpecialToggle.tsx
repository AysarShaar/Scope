'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';

// Set by the admin area (StaffCookieSync) for signed-in staff. It only decides whether the button is
// shown; the API checks the real session and database permissions on every request.
const STAFF_COOKIE = 'scope_staff';
const ALLOWED_VALUES = ['can_special', 'admin', 'editor_in_chief'];

function readStaffCookie(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${STAFF_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

interface Props {
  articleId: string;
  initialSpecial: boolean;
}

/** The "special coverage" badge, plus a toggle button for editors with articles.set_special permission. */
export function ArticleSpecialToggle({ articleId, initialSpecial }: Props) {
  const [isSpecial, setIsSpecial] = useState(initialSpecial);
  const [canToggle, setCanToggle] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const val = readStaffCookie();
    if (!val || !ALLOWED_VALUES.includes(val)) return;
    setCanToggle(true);

    // The page itself can come from the 2-minute cache, so ask for the live value.
    let cancelled = false;
    fetch(`/api/articles/${encodeURIComponent(articleId)}?fresh=${Date.now()}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled && typeof json?.data?.isSpecial === 'boolean') setIsSpecial(json.data.isSpecial);
        else if (!cancelled && json?.data) setIsSpecial(false);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [articleId]);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/articles/${encodeURIComponent(articleId)}/special`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSpecial: !isSpecial }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.error || 'تعذّر حفظ التغيير');
      } else {
        setIsSpecial(Boolean(json.isSpecial));
      }
    } catch {
      setError('تعذّر الاتصال بالخادم');
    } finally {
      setBusy(false);
    }
  };

  if (!isSpecial && !canToggle) return null;

  return (
    <>
      {isSpecial && (
        <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-md font-bold text-xs">
          <span>تغطية خاصة</span>
        </span>
      )}

      {canToggle && (
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          title="يظهر في المربع الطويل بالصفحة الرئيسية"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-bold transition-colors cursor-pointer disabled:opacity-60 ${
            isSpecial
              ? 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              : 'border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${isSpecial ? '' : 'fill-current'}`} />
          <span>{busy ? 'جارٍ الحفظ...' : isSpecial ? 'إزالة التمييز' : 'تمييز كتغطية خاصة'}</span>
        </button>
      )}

      {error && <span className="text-[11px] text-rose-500">{error}</span>}
    </>
  );
}
