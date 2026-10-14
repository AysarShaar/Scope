'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '../components/AdminShell';
import { extractYouTubeId } from '../../../lib/youtube';

export default function AdminSettingsPage() {
  const { userRole, showToast } = useAdmin();
  const [liveStreamInput, setLiveStreamInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('scope_setting_live_stream_id');
      if (saved) setLiveStreamInput(saved);
    }
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        if (!d?.data) return;
        const id = d.data.live_stream_id || '';
        setLiveStreamInput(id);
        if (typeof window !== 'undefined') {
          if (id) localStorage.setItem('scope_setting_live_stream_id', id);
          else localStorage.removeItem('scope_setting_live_stream_id');
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveLiveStream = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const id = extractYouTubeId(liveStreamInput) || liveStreamInput.trim();
    if (typeof window !== 'undefined') {
      if (id) localStorage.setItem('scope_setting_live_stream_id', id);
      else localStorage.removeItem('scope_setting_live_stream_id');
    }
    setLiveStreamInput(id);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ live_stream_id: id }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success || res.ok) {
        showToast(
          id
            ? 'تم حفظ رابط البث المباشر في قاعدة البيانات بنجاح ✓'
            : 'تمت إزالة البث، وسيظهر الشعار بدلاً منه ✓',
          'success',
        );
      } else {
        showToast(data.error || 'تم الحفظ محلياً فقط', 'error');
      }
    } catch {
      showToast('تم الحفظ محلياً (حدث خطأ في الاتصال بالخادم)', 'info');
    } finally {
      setSaving(false);
    }
  };

  if (userRole !== 'admin') {
    return (
      <div className="p-8 text-center bg-white dark:bg-[#0c101c] rounded-2xl border border-slate-200 dark:border-slate-800">
        <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
          هذه الصفحة مخصصة لمدير النظام فقط.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          الإعدادات العامة
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          إعدادات البث المباشر ومعلومات المنصة
        </p>
      </div>

      <div className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/70">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              البث المباشر في القائمة الرئيسية
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              أدخل رابط أو معرف فيديو يوتيوب للبث. عند تركه فارغاً سيظهر شعار المنصة التفاعلي تلقائياً.
            </p>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0 self-start sm:self-auto">
            ID: {extractYouTubeId(liveStreamInput) || liveStreamInput || 'لا يوجد (شعار المنصة)'}
          </span>
        </div>

        <form onSubmit={handleSaveLiveStream} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={liveStreamInput}
            onChange={(e) => setLiveStreamInput(e.target.value)}
            placeholder="رابط أو معرف بث YouTube (اتركه فارغاً لإظهار الشعار)"
            className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-[#121624] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-colors"
            dir="ltr"
          />
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          معلومات النظام والتشغيل
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 text-[11px]">اسم المنصة</span>
            <p className="font-semibold text-slate-900 dark:text-white mt-0.5">SCOPE MEDIA</p>
          </div>
          <div>
            <span className="text-slate-400 text-[11px]">قاعدة البيانات</span>
            <p className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">Cloudflare D1</p>
          </div>
          <div>
            <span className="text-slate-400 text-[11px]">المنطقة الزمنية</span>
            <p className="font-mono text-slate-700 dark:text-slate-300 mt-0.5">UTC+3 (مكة)</p>
          </div>
          <div>
            <span className="text-slate-400 text-[11px]">اللغة والاتجاه</span>
            <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">العربية (RTL)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
