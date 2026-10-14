'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { ARABIC_MONTHS } from '../../../lib/dates';

// The calendar starts on Saturday, matching the Arabic week.
const WEEK_DAYS = ['سبت', 'أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'];

interface Props {
  /** ISO date "YYYY-MM-DD", or '' when nothing is selected. */
  value: string;
  onChange: (iso: string) => void;
  placeholder?: string;
  className?: string;
}

function toIso(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function parseIso(value: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]) - 1, d: Number(match[3]) };
}

/** Arabic calendar dropdown (month names in Arabic, Latin digits) that works with ISO date strings. */
export function IsoDatePicker({ value, onChange, placeholder = 'اختر التاريخ', className = '' }: Props) {
  const today = new Date();
  const selected = parseIso(value);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(selected?.y ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected?.m ?? today.getMonth());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const toggle = () => {
    if (!open) {
      const base = parseIso(value);
      setViewYear(base?.y ?? today.getFullYear());
      setViewMonth(base?.m ?? today.getMonth());
    }
    setOpen((o) => !o);
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const pick = (d: number) => {
    onChange(toIso(viewYear, viewMonth, d));
    setOpen(false);
  };

  const startOffset = (new Date(viewYear, viewMonth, 1).getDay() + 1) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const years = Array.from({ length: 12 }, (_, i) => today.getFullYear() - 10 + i);
  if (!years.includes(viewYear)) years.unshift(viewYear);

  const label = selected ? `${selected.d} ${ARABIC_MONTHS[selected.m]} ${selected.y}` : placeholder;

  return (
    <div className="relative inline-block max-sm:block max-sm:w-full" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        className={`flex items-center justify-between gap-2 min-w-[150px] max-sm:w-full px-3 py-1.5 max-sm:py-3 max-sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer select-none ${className}`}
      >
        <span className={selected ? 'font-medium' : 'text-slate-400'}>{label}</span>
        <Calendar size={13} className="text-slate-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 right-0 z-50 w-72 max-sm:w-full bg-white dark:bg-[#0c101c] border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xl text-slate-900 dark:text-white select-none">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
              title="الشهر القادم"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-1.5">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 font-bold text-xs focus:outline-none cursor-pointer"
              >
                {ARABIC_MONTHS.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 font-bold text-xs focus:outline-none cursor-pointer font-mono"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
              title="الشهر السابق"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center pt-2">
            {WEEK_DAYS.map((d) => (
              <div key={d} className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 py-1">
                {d}
              </div>
            ))}

            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected = selected?.y === viewYear && selected?.m === viewMonth && selected?.d === day;
              const isToday =
                today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => pick(day)}
                  className={`text-xs py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#A42424] text-white font-bold shadow-xs'
                      : isToday
                      ? 'bg-rose-50 dark:bg-[#A42424]/20 text-[#A42424] dark:text-rose-400 font-bold border border-[#A42424]/40'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
            <button
              type="button"
              onClick={() => {
                onChange(toIso(today.getFullYear(), today.getMonth(), today.getDate()));
                setOpen(false);
              }}
              className="font-medium text-[#A42424] dark:text-rose-400 hover:underline cursor-pointer"
            >
              اليوم
            </button>
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setOpen(false);
                }}
                className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={11} />
                مسح
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
