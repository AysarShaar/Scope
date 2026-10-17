'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Cpu,
  Database,
  RefreshCw,
  AlertTriangle,
  Clock,
  Layers,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import type { CloudflareAnalyticsResponse } from '@/lib/cloudflareAnalyticsMetrics';

interface CloudflareAnalyticsDashboardProps {
  timeRange: string;
}

const CARD = 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs';

function formatStatusLabel(status: string): string {
  const s = status.toLowerCase();
  if (s === 'success') return 'استجابة ناجحة (Success)';
  if (s === 'scriptthrewexception') return 'خطأ برمجي (Exception)';
  if (s === 'exceededcpu') return 'تجاوز حد المعالجة (CPU Limit)';
  if (s === 'clientdisconnect') return 'انقطاع الاتصال (Disconnect)';
  if (s === 'canceled' || s === 'cancelled') return 'طلب ملغى (Canceled)';
  return status;
}

function formatOperationLabel(op: string): string {
  const o = op.toUpperCase();
  if (o === 'GET') return 'قراءة وتحميل (GET)';
  if (o === 'PUT') return 'رفع وتخزين (PUT)';
  if (o === 'DELETE') return 'حذف ملفات (DELETE)';
  if (o === 'LIST') return 'استعراض المحتويات (LIST)';
  if (o === 'HEAD') return 'فحص البيانات (HEAD)';
  return op;
}

export default function CloudflareAnalyticsDashboard({
  timeRange,
}: CloudflareAnalyticsDashboardProps) {
  const [data, setData] = useState<CloudflareAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [accountIdInput, setAccountIdInput] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics/cloudflare?timeRange=${timeRange}`, {
        cache: 'no-store',
      });
      const json: CloudflareAnalyticsResponse = await res.json();
      if (!res.ok) {
        throw new Error((json as any)?.error || `HTTP ${res.status}`);
      }
      setData(json);
      if (json.diagnostics?.accountId && !accountIdInput) {
        setAccountIdInput(json.diagnostics.accountId);
      }
    } catch (e: any) {
      setError(e?.message || 'تعذر تحميل تحليلات Cloudflare');
    } finally {
      setLoading(false);
    }
  }, [timeRange, accountIdInput]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveAccountId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountIdInput.trim()) return;
    setSavingSettings(true);
    setSaveMessage(null);
    try {
      const res = await fetch('/api/admin/analytics/cloudflare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: accountIdInput.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'فشل حفظ معرّف الحساب');
      }
      setSaveMessage('تم حفظ معرّف الحساب بنجاح. جارٍ تحديث البيانات…');
      setTimeout(() => {
        fetchData();
      }, 1000);
    } catch (e: any) {
      setSaveMessage(`خطأ: ${e.message}`);
    } finally {
      setSavingSettings(false);
    }
  };

  const workers = data?.workers;
  const r2 = data?.r2;
  const notConfigured = data && !data.configured;

  return (
    <div className="space-y-6 select-none" dir="rtl">
      {error && (
        <div role="alert" className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-xs text-rose-800 dark:text-rose-300">
          تعذر تحديث البيانات: {error}
        </div>
      )}

      {notConfigured && (
        <div className={`${CARD} p-5 border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20`}>
          <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
            <KeyRound className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <h2 className="text-sm font-bold">ربط معرّف حساب Cloudflare</h2>
          </div>
          <p className="mt-1.5 text-xs text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
            تتطلب إحصائيات المعالجة والتخزين السحابي تحديد معرّف الحساب (Account ID). يمكنك العثور عليه في لوحة تحكم Cloudflare.
          </p>

          <form onSubmit={handleSaveAccountId} className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="text"
              value={accountIdInput}
              onChange={(e) => setAccountIdInput(e.target.value)}
              placeholder="معرّف الحساب (Account ID)"
              className="flex-1 px-3.5 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F4468]"
              dir="ltr"
            />
            <button
              type="submit"
              disabled={savingSettings || !accountIdInput.trim()}
              className="px-4 py-2 rounded-xl bg-[#0F4468] hover:bg-[#1A5A85] text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {savingSettings ? 'جارٍ الحفظ…' : 'حفظ ومزامنة'}
            </button>
          </form>

          {saveMessage && (
            <p className="mt-2 text-xs font-medium text-slate-700 dark:text-slate-300">
              {saveMessage}
            </p>
          )}
        </div>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-[#0F4468] dark:text-sky-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                معالجة الطلبات السحابية (Workers)
              </h2>
              <span className="text-[11px] text-slate-400">
                إحصائيات استدعاء البرمجيات وتنفيذ المهام
              </span>
            </div>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            aria-label="تحديث البيانات"
            title="تحديث البيانات"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#0F4468]' : ''}`} />
          </button>
        </div>

        {workers?.status === 'unavailable' ? (
          <div className={`${CARD} p-4 text-xs text-slate-500 dark:text-slate-400`}>
            {workers.reason || 'البيانات غير متوفرة حالياً لهذا الحساب.'}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className={`${CARD} p-4`}>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                  <span>إجمالي الطلبات</span>
                  <Layers className="w-4 h-4 text-[#0F4468] dark:text-sky-400" />
                </div>
                <div className="mt-2 font-mono tabular-nums text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {workers?.data?.totalRequests.toLocaleString() ?? '—'}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  استدعاءات منفذة عبر خوادم الحافة
                </p>
              </div>

              <div className={`${CARD} p-4`}>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                  <span>الأخطاء البرمجية</span>
                  <AlertTriangle className={`w-4 h-4 ${(workers?.data?.totalErrors ?? 0) > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
                </div>
                <div className="mt-2 font-mono tabular-nums text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {workers?.data?.totalErrors.toLocaleString() ?? '—'}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  نسبة الأخطاء:{' '}
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300" dir="ltr">
                    {workers?.data?.errorRate ?? 0}%
                  </span>
                </p>
              </div>

              <div className={`${CARD} p-4`}>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                  <span>متوسط سرعة المعالجة</span>
                  <Clock className="w-4 h-4 text-[#0F4468] dark:text-sky-400" />
                </div>
                <div className="mt-2 font-mono tabular-nums text-xl sm:text-2xl font-black text-slate-900 dark:text-white" dir="ltr">
                  {workers?.data?.cpuTimeP50Ms ?? 0} ms
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  زمن معالجة المعالج (CPU Time)
                </p>
              </div>
            </div>

            <div className={`${CARD} p-4 sm:p-5`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  حالات الاستجابة والتشغيل
                </h3>
                <span className="text-[11px] text-slate-400">
                  توزيع نتائج تنفيذ الطلبات
                </span>
              </div>

              {workers?.data?.statusBreakdown && workers.data.statusBreakdown.length > 0 ? (
                <ul className="space-y-3">
                  {workers.data.statusBreakdown.map((item, idx) => (
                    <li key={item.status + idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatStatusLabel(item.status)}
                        </span>
                        <div className="flex items-center gap-2 font-mono tabular-nums">
                          <span className="text-slate-900 dark:text-white font-bold">
                            {item.count.toLocaleString()}
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            ({item.percentage}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0F4468] dark:bg-sky-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(1, item.percentage))}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400">لا توجد سجلات حالات مسجلة في هذه الفترة.</p>
              )}
            </div>
          </>
        )}
      </section>

      <section className="space-y-4 pt-4 border-t border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-[#0F4468] dark:text-sky-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                التخزين السحابي (R2 Storage)
              </h2>
              <span className="text-[11px] text-slate-400">
                متابعة عمليات قراءة وحفظ الوسائط والملفات
              </span>
            </div>
          </div>
        </div>

        {r2?.status === 'unavailable' ? (
          <div className={`${CARD} p-4 text-xs text-slate-500 dark:text-slate-400`}>
            {r2.reason || 'البيانات غير متوفرة حالياً لهذا الحساب.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className={`${CARD} p-4 sm:p-5 flex flex-col justify-between`}>
              <div>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                  <span>إجمالي العمليات</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="mt-3 font-mono tabular-nums text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {r2?.data?.totalOperations.toLocaleString() ?? '—'}
                </div>
              </div>
              <p className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                مجموع عمليات القراءة والرفع والحذف التي تمت على مستودع التخزين
              </p>
            </div>

            <div className={`${CARD} p-4 sm:p-5 lg:col-span-2`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  توزيع العمليات حسب النوع
                </h3>
                <span className="text-[11px] text-slate-400">
                  نوع الإجراء التخزيني
                </span>
              </div>

              {r2?.data?.operationsByType && r2.data.operationsByType.length > 0 ? (
                <ul className="space-y-3">
                  {r2.data.operationsByType.map((op, idx) => (
                    <li key={op.operationType + idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatOperationLabel(op.operationType)}
                        </span>
                        <div className="flex items-center gap-2 font-mono tabular-nums">
                          <span className="text-slate-900 dark:text-white font-bold">
                            {op.count.toLocaleString()}
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            ({op.percentage}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0F4468] dark:bg-sky-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(1, op.percentage))}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400">لا توجد عمليات مسجلة في هذه الفترة.</p>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
