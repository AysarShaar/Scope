'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Cpu,
  Database,
  RefreshCw,
  AlertTriangle,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  HardDrive,
  Layers,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import {
  formatBytes,
  type CloudflareAnalyticsResponse,
} from '@/lib/cloudflareAnalyticsMetrics';

interface CloudflareAnalyticsDashboardProps {
  timeRange: string;
}

const CARD = 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs';

export default function CloudflareAnalyticsDashboard({
  timeRange,
}: CloudflareAnalyticsDashboardProps) {
  const [data, setData] = useState<CloudflareAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Settings form state for Account ID
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
      setSaveMessage('تم حفظ معرّف الحساب بنجاح. جارٍ تحديث المقاييس…');
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
      {/* Alert when error occurs */}
      {error && (
        <div role="alert" className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-xs text-rose-800 dark:text-rose-300">
          تعذر تحديث البيانات: {error}
        </div>
      )}

      {/* Account ID Setup Card (if not configured or missing account ID) */}
      {notConfigured && (
        <div className={`${CARD} p-5 border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20`}>
          <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
            <KeyRound className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <h2 className="text-sm font-bold">إعداد معرّف حساب Cloudflare (Account ID)</h2>
          </div>
          <p className="mt-1.5 text-xs text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
            تتطلب إحصائيات Workers و R2 نطاق الحساب (Account Tag) بدلاً من Zone ID.
            يمكنك نسخ Account ID من الشريط الجانبي في لوحة تحكم Cloudflare.
          </p>

          <form onSubmit={handleSaveAccountId} className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="text"
              value={accountIdInput}
              onChange={(e) => setAccountIdInput(e.target.value)}
              placeholder="مثال: 023e105f4ecef8ad9ca31a8372d0c353"
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

      {/* 4️⃣ WORKERS SECTION */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-[#0F4468] dark:text-sky-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                4️⃣ Workers — استدعاءات الخدمات الطرفية
              </h2>
              <span className="text-[11px] font-mono text-slate-400" dir="ltr">
                workersInvocationsAdaptive (Account Scope)
              </span>
            </div>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            aria-label="تحديث"
            title="تحديث البيانات"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#0F4468]' : ''}`} />
          </button>
        </div>

        {workers?.status === 'unavailable' ? (
          <div className={`${CARD} p-4 text-xs text-slate-500 dark:text-slate-400`}>
            {workers.reason || 'بيانات Workers غير متوفرة لهذا الحساب.'}
          </div>
        ) : (
          <>
            {/* Workers KPIs Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Total Invocations */}
              <div className={`${CARD} p-4`}>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                  <span>إجمالي الاستدعاءات</span>
                  <Layers className="w-4 h-4 text-[#0F4468] dark:text-sky-400" />
                </div>
                <div className="mt-2 font-mono tabular-nums text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {workers?.data?.totalRequests.toLocaleString() ?? '—'}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  sum {'{ requests }'}
                </p>
              </div>

              {/* Total Errors */}
              <div className={`${CARD} p-4`}>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                  <span>الأخطاء</span>
                  <AlertTriangle className={`w-4 h-4 ${(workers?.data?.totalErrors ?? 0) > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
                </div>
                <div className="mt-2 font-mono tabular-nums text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {workers?.data?.totalErrors.toLocaleString() ?? '—'}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  معدل الخطأ:{' '}
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300" dir="ltr">
                    {workers?.data?.errorRate ?? 0}%
                  </span>
                </p>
              </div>

              {/* CPU Time */}
              <div className={`${CARD} p-4`}>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                  <span>زمن المعالجة (CPU)</span>
                  <Clock className="w-4 h-4 text-[#0F4468] dark:text-sky-400" />
                </div>
                <div className="mt-2 font-mono tabular-nums text-xl sm:text-2xl font-black text-slate-900 dark:text-white" dir="ltr">
                  {workers?.data?.cpuTimeP50Ms ?? 0} ms
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  P99:{' '}
                  <span className="font-mono" dir="ltr">
                    {workers?.data?.cpuTimeP99Ms ?? 0} ms
                  </span>
                </p>
              </div>

              {/* Subrequests */}
              <div className={`${CARD} p-4`}>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                  <span>الاستدعاءات الفرعية</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="mt-2 font-mono tabular-nums text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {workers?.data?.totalSubrequests.toLocaleString() ?? '—'}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  D1, R2, AI Subrequests
                </p>
              </div>
            </div>

            {/* Workers Detailed Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Status Breakdown */}
              <div className={`${CARD} p-4 sm:p-5`}>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-3">
                  حالة الاستدعاء (dimensions {'{ status }'})
                </h3>
                {workers?.data?.statusBreakdown && workers.data.statusBreakdown.length > 0 ? (
                  <ul className="space-y-3">
                    {workers.data.statusBreakdown.map((item, idx) => (
                      <li key={item.status + idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold" dir="ltr">
                            {item.status}
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

              {/* Scripts Breakdown */}
              <div className={`${CARD} p-4 sm:p-5`}>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-3">
                  الخدمات الطرفية (dimensions {'{ scriptName }'})
                </h3>
                {workers?.data?.scriptsBreakdown && workers.data.scriptsBreakdown.length > 0 ? (
                  <ul className="space-y-3">
                    {workers.data.scriptsBreakdown.map((script, idx) => (
                      <li key={script.scriptName + idx} className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-mono font-bold text-slate-900 dark:text-white" dir="ltr">
                            {script.scriptName}
                          </span>
                          <span className="font-mono font-bold text-xs text-[#0F4468] dark:text-sky-400">
                            {script.requests.toLocaleString()} طلب
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>الأخطاء: {script.errors.toLocaleString()}</span>
                          <span dir="ltr">معدل الخطأ: {script.errorRate}%</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400">لا توجد خدمات محددة في هذه الفترة.</p>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      {/* 5️⃣ R2 STORAGE SECTION */}
      <section className="space-y-4 pt-4 border-t border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-[#0F4468] dark:text-sky-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                5️⃣ R2 Storage — عمليات التخزين السحابي
              </h2>
              <span className="text-[11px] font-mono text-slate-400" dir="ltr">
                r2OperationsAdaptiveGroups (Account Scope)
              </span>
            </div>
          </div>
        </div>

        {r2?.status === 'unavailable' ? (
          <div className={`${CARD} p-4 text-xs text-slate-500 dark:text-slate-400`}>
            {r2.reason || 'بيانات R2 Storage غير متوفرة لهذا الحساب.'}
          </div>
        ) : (
          <>
            {/* R2 KPIs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {/* Total Operations */}
              <div className={`${CARD} p-4`}>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                  <span>عدد العمليات</span>
                  <HardDrive className="w-4 h-4 text-[#0F4468] dark:text-sky-400" />
                </div>
                <div className="mt-2 font-mono tabular-nums text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {r2?.data?.totalOperations.toLocaleString() ?? '—'}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  sum {'{ operations }'}
                </p>
              </div>

              {/* Ingress (bytesIn) */}
              <div className={`${CARD} p-4`}>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                  <span>البيانات الواردة (رفع)</span>
                  <ArrowDownLeft className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="mt-2 font-mono tabular-nums text-xl sm:text-2xl font-black text-slate-900 dark:text-white" dir="ltr">
                  {formatBytes(r2?.data?.bytesIn ?? 0)}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  sum {'{ bytesIn }'}
                </p>
              </div>

              {/* Egress (bytesOut) */}
              <div className={`${CARD} p-4`}>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                  <span>البيانات الصادرة (تحميل)</span>
                  <ArrowUpRight className="w-4 h-4 text-[#0F4468] dark:text-sky-400" />
                </div>
                <div className="mt-2 font-mono tabular-nums text-xl sm:text-2xl font-black text-slate-900 dark:text-white" dir="ltr">
                  {formatBytes(r2?.data?.bytesOut ?? 0)}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  sum {'{ bytesOut }'}
                </p>
              </div>
            </div>

            {/* R2 Detailed Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Operations by Type */}
              <div className={`${CARD} p-4 sm:p-5`}>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-3">
                  العمليات حسب النوع (dimensions {'{ operationType }'})
                </h3>
                {r2?.data?.operationsByType && r2.data.operationsByType.length > 0 ? (
                  <ul className="space-y-3">
                    {r2.data.operationsByType.map((op, idx) => (
                      <li key={op.operationType + idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200" dir="ltr">
                            {op.operationType}
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
                  <p className="text-xs text-slate-400">لا توجد عمليات R2 مسجلة في هذه الفترة.</p>
                )}
              </div>

              {/* Buckets Breakdown */}
              <div className={`${CARD} p-4 sm:p-5`}>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-3">
                  حاويات التخزين النشطة (Buckets)
                </h3>
                {r2?.data?.bucketsBreakdown && r2.data.bucketsBreakdown.length > 0 ? (
                  <ul className="space-y-3">
                    {r2.data.bucketsBreakdown.map((bucket, idx) => (
                      <li key={bucket.bucketName + idx} className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-mono font-bold text-slate-900 dark:text-white" dir="ltr">
                            {bucket.bucketName}
                          </span>
                          <span className="font-mono font-bold text-xs text-[#0F4468] dark:text-sky-400">
                            {bucket.operations.toLocaleString()} عملية
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400" dir="ltr">
                          <span>وارد: {formatBytes(bucket.bytesIn)}</span>
                          <span>صادر: {formatBytes(bucket.bytesOut)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400">لا توجد حاويات محددة في هذه الفترة.</p>
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
