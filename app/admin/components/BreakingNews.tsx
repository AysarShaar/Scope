'use client';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { BreakingItem } from '../../../data/scopeData';

interface Props {
  items: BreakingItem[];
  isLoading: boolean;
  onAdd: (data: { title: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function BreakingNews({ items, isLoading, onAdd, onDelete }: Props) {
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await onAdd({ title: title.trim() });
    setTitle('');
    setSaving(false);
  };

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          الأخبار العاجلة
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          شريط التنبيهات والأخبار الفورية ({items.length})
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
      >
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="نص الخبر العاجل..."
          required
          className="flex-1 px-3 py-2 bg-slate-50 dark:bg-[#121624] border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-colors"
        />

        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-lg transition-colors disabled:opacity-40 cursor-pointer shrink-0"
        >
          {saving ? <RefreshCw size={13} className="animate-spin" /> : <Plus size={13} />}
          <span>إضافة التنبيه</span>
        </button>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-12 text-slate-400">
          <RefreshCw size={18} className="animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-slate-400 dark:text-slate-500 bg-white dark:bg-[#0c101c] border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs">
          لا توجد أخبار عاجلة نشطة
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
          {items.map(item => (
            <div
              key={item.id}
              className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                <span className="text-xs text-slate-800 dark:text-slate-200 font-medium truncate">
                  {item.title}
                </span>
              </div>

              <button
                onClick={() => onDelete(item.id)}
                className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                title="حذف"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
