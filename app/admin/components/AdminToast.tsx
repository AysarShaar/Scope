'use client';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ToastProps {
  text: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export default function AdminToast({ text, type, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 10);
    const t2 = setTimeout(() => { setVisible(false); setTimeout(onClose, 300); }, 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onClose]);

  const colors = {
    success: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle2 },
    error:   { bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/20', text: 'text-rose-600 dark:text-rose-400', icon: AlertCircle },
    info:    { bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20', text: 'text-blue-600 dark:text-blue-400', icon: Info },
  };
  
  const c = colors[type];
  const Icon = c.icon;

  return (
    <div
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-xl backdrop-blur-md z-[9999] max-w-md w-[calc(100vw-2rem)] transition-all duration-300 ease-out ${
        visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'
      } ${c.bg} ${c.border}`}
    >
      <Icon size={18} className={`${c.text} shrink-0`} />
      <span className={`flex-1 text-sm font-bold ${c.text}`}>{text}</span>
      <button
        onClick={onClose}
        className={`p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${c.text} opacity-70 hover:opacity-100`}
      >
        <X size={16} />
      </button>
    </div>
  );
}
