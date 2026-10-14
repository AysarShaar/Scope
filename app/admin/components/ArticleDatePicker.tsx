'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { ARABIC_MONTHS, formatArabicDate, parseDateParts } from '../../../lib/dates';

// The calendar starts on Saturday, matching the Arabic week.
const WEEK_DAYS = ['سبت', 'أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'];

interface Props {
  /** Stored article date, e.g. "10 أكتوبر 2026". */
  value: string;
  onChange: (value: string) => void;
  inputClass: string;
}

/** Calendar dropdown that only allows picking today or earlier. */
export function ArticleDatePicker({ value, onChange, inputClass }: Props) {
  const today = new Date();
  const defaultDate = formatArabicDate(today);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [viewYear, setViewYear] = useState<number>(today.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(today.getMonth());
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false);
      }
    };
    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker]);

  const handleOpenDatePicker = () => {
    const parsed = parseDateParts(value);
    const now = new Date();
    const y = Math.min(parsed.year, now.getFullYear());
    const m = y === now.getFullYear() ? Math.min(parsed.month, now.getMonth()) : parsed.month;
    setViewYear(y);
    setViewMonth(m);
    setShowDatePicker(prev => !prev);
  };

  const handleSelectDay = (dayNum: number, m: number, y: number) => {
    const now = new Date();
    const isFuture = (
      y > now.getFullYear() ||
      (y === now.getFullYear() && m > now.getMonth()) ||
      (y === now.getFullYear() && m === now.getMonth() && dayNum > now.getDate())
    );
    if (isFuture) return;
    onChange(`${dayNum} ${ARABIC_MONTHS[m]} ${y}`);
    setShowDatePicker(false);
  };

  const handleSelectToday = () => {
    onChange(formatArabicDate(new Date()));
    setShowDatePicker(false);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    const now = new Date();
    if (viewYear > now.getFullYear() || (viewYear === now.getFullYear() && viewMonth >= now.getMonth())) {
      return;
    }
    if (viewMonth === 11) {
      if (viewYear + 1 <= now.getFullYear()) {
        setViewMonth(0);
        setViewYear(y => y + 1);
      }
    } else {
      if (viewYear < now.getFullYear() || (viewYear === now.getFullYear() && viewMonth + 1 <= now.getMonth())) {
        setViewMonth(m => m + 1);
      }
    }
  };

  return (
    <div className="relative" ref={datePickerRef}>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-[11px] text-slate-500">التاريخ</label>
        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
          حتى تاريخ اليوم حصراً
        </span>
      </div>
      <button
        type="button"
        onClick={handleOpenDatePicker}
        className={`${inputClass} flex items-center justify-between text-right cursor-pointer select-none hover:border-slate-300 dark:hover:border-slate-700 transition-colors`}
        title="انقر لاختيار التاريخ من الروزنامة"
      >
        <span className="font-medium text-slate-900 dark:text-white truncate">
          {value || defaultDate}
        </span>
        <Calendar size={14} className="text-slate-400 shrink-0 mr-1" />
      </button>

      {showDatePicker && (
        <div className="absolute top-full mt-1.5 right-0 z-50 w-72 bg-white dark:bg-[#0c101c] border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xl animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-white select-none">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            {(() => {
              const canGoNextMonth = !(
                viewYear > today.getFullYear() ||
                (viewYear === today.getFullYear() && viewMonth >= today.getMonth())
              );
              return (
                <button
                  type="button"
                  onClick={handleNextMonth}
                  disabled={!canGoNextMonth}
                  className={`p-1 rounded-lg transition-colors ${
                    !canGoNextMonth
                      ? 'opacity-20 cursor-not-allowed text-slate-300 dark:text-slate-700'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer'
                  }`}
                  title={canGoNextMonth ? 'الشهر القادم' : 'لا يمكن اختيار تاريخ مستقبلي'}
                >
                  <ChevronLeft size={16} />
                </button>
              );
            })()}

            <div className="flex items-center gap-1.5">
              <select
                value={viewMonth}
                onChange={e => setViewMonth(Number(e.target.value))}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 font-bold text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer"
              >
                {ARABIC_MONTHS.map((m, idx) => {
                  const isFutureMonth = viewYear === today.getFullYear() && idx > today.getMonth();
                  if (isFutureMonth) return null;
                  return (
                    <option key={m} value={idx} className="bg-white dark:bg-[#0c101c] text-slate-900 dark:text-white">
                      {m}
                    </option>
                  );
                })}
              </select>

              <select
                value={viewYear}
                onChange={e => {
                  const newY = Number(e.target.value);
                  setViewYear(newY);
                  if (newY === today.getFullYear() && viewMonth > today.getMonth()) {
                    setViewMonth(today.getMonth());
                  }
                }}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 font-bold text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer font-mono"
              >
                {Array.from({ length: 10 }, (_, i) => today.getFullYear() - 9 + i).map(y => (
                  <option key={y} value={y} className="bg-white dark:bg-[#0c101c] text-slate-900 dark:text-white">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg transition-colors cursor-pointer"
              title="الشهر السابق"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center pt-2">
            {WEEK_DAYS.map(dayName => (
              <div key={dayName} className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 py-1">
                {dayName}
              </div>
            ))}

            {(() => {
              const startOffset = (new Date(viewYear, viewMonth, 1).getDay() + 1) % 7;
              const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
              const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();
              const selectedParsed = parseDateParts(value);
              const now = new Date();

              return (
                <>
                  {Array.from({ length: startOffset }).map((_, i) => {
                    const prevDay = daysInPrevMonth - startOffset + 1 + i;
                    const prevM = viewMonth === 0 ? 11 : viewMonth - 1;
                    const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
                    return (
                      <button
                        key={`prev-${i}`}
                        type="button"
                        onClick={() => handleSelectDay(prevDay, prevM, prevY)}
                        className="text-[11px] py-1 text-slate-300 dark:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded transition-colors cursor-pointer"
                      >
                        {prevDay}
                      </button>
                    );
                  })}

                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const isSelected =
                      selectedParsed.year === viewYear &&
                      selectedParsed.month === viewMonth &&
                      selectedParsed.day === dayNum;
                    const isToday =
                      now.getFullYear() === viewYear &&
                      now.getMonth() === viewMonth &&
                      now.getDate() === dayNum;
                    const isFuture =
                      viewYear > now.getFullYear() ||
                      (viewYear === now.getFullYear() && viewMonth > now.getMonth()) ||
                      (viewYear === now.getFullYear() && viewMonth === now.getMonth() && dayNum > now.getDate());

                    return (
                      <button
                        key={`curr-${dayNum}`}
                        type="button"
                        disabled={isFuture}
                        onClick={() => !isFuture && handleSelectDay(dayNum, viewMonth, viewYear)}
                        className={`text-xs py-1.5 rounded-lg font-medium transition-all ${
                          isFuture
                            ? 'opacity-20 cursor-not-allowed text-slate-400 dark:text-slate-600 line-through select-none'
                            : isSelected
                            ? 'bg-[#A42424] text-white font-bold shadow-xs cursor-pointer'
                            : isToday
                            ? 'bg-rose-50 dark:bg-[#A42424]/20 text-[#A42424] dark:text-rose-400 font-bold border border-[#A42424]/40 cursor-pointer'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'
                        }`}
                        title={isFuture ? 'تاريخ مستقبلي غير مسموح' : undefined}
                      >
                        {dayNum}
                      </button>
                    );
                  })}
                </>
              );
            })()}
          </div>

          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
            <button
              type="button"
              onClick={handleSelectToday}
              className="font-medium text-[#A42424] dark:text-rose-400 hover:underline cursor-pointer"
            >
              اليوم ({today.getDate()} {ARABIC_MONTHS[today.getMonth()]})
            </button>

            <button
              type="button"
              onClick={() => setShowDatePicker(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
