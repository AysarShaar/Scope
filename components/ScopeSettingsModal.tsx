'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Moon,
  Sun,
  Monitor,
  Type,
  Bell,
  Video,
  Wifi,
  Globe,
  RotateCcw,
  Check,
  Palette,
} from 'lucide-react';

interface ScopeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: 'AR' | 'EN';
  onToggleLang: () => void;
  showToast: (msg: string) => void;
}

export const ScopeSettingsModal: React.FC<ScopeSettingsModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  onToggleLang,
  showToast,
}) => {
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const [themeMode, setThemeMode] = useState<'dark' | 'light' | 'system'>('dark');
  const [breakingAlerts, setBreakingAlerts] = useState<boolean>(true);
  const [autoplayVideo, setAutoplayVideo] = useState<boolean>(false);
  const [dataSaver, setDataSaver] = useState<boolean>(false);
  const [streamQuality, setStreamQuality] = useState<'auto' | '1080p' | '720p' | 'saver'>('auto');

  useEffect(() => {
    try {
      const savedFont = localStorage.getItem('scope_setting_font');
      if (savedFont === 'sm' || savedFont === 'md' || savedFont === 'lg' || savedFont === 'xl') setFontSize(savedFont);

      const savedTheme = localStorage.getItem('scope_setting_theme');
      if (savedTheme === 'dark' || savedTheme === 'light' || savedTheme === 'system') setThemeMode(savedTheme);

      const savedAlerts = localStorage.getItem('scope_setting_alerts');
      if (savedAlerts !== null) setBreakingAlerts(savedAlerts === 'true');

      const savedAutoplay = localStorage.getItem('scope_setting_autoplay');
      if (savedAutoplay !== null) setAutoplayVideo(savedAutoplay === 'true');

      const savedQuality = localStorage.getItem('scope_setting_quality');
      if (savedQuality === 'auto' || savedQuality === '1080p' || savedQuality === '720p' || savedQuality === 'saver') setStreamQuality(savedQuality);
    } catch {}
  }, []);

  if (!isOpen) return null;

  const handleSave = () => {
    try {
      localStorage.setItem('scope_setting_font', fontSize);
      localStorage.setItem('scope_setting_theme', themeMode);
      localStorage.setItem('scope_setting_alerts', String(breakingAlerts));
      localStorage.setItem('scope_setting_autoplay', String(autoplayVideo));
      localStorage.setItem('scope_setting_quality', streamQuality);
    } catch {
    }
    showToast(currentLang === 'AR' ? 'تم حفظ وتطبيق الخيارات بنجاح' : 'Preferences saved successfully');
    onClose();
  };

  const handleReset = () => {
    setFontSize('md');
    setThemeMode('dark');
    setBreakingAlerts(true);
    setAutoplayVideo(false);
    setDataSaver(false);
    setStreamQuality('auto');
    showToast(currentLang === 'AR' ? 'تمت استعادة الإعدادات الافتراضية' : 'Reset to default settings');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-[#0c1424] border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[90vh]"
        dir={currentLang === 'AR' ? 'rtl' : 'ltr'}
      >
        <div className="px-5 py-4 bg-[#080e1a] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#A42424]/20 border border-[#A42424]/40 flex items-center justify-center text-[#A42424]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {currentLang === 'AR' ? 'الخيارات والإعدادات' : 'Options & Preferences'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {currentLang === 'AR' ? 'تخصيص تجربة القراءة والتصفح والوسائط' : 'Customize reading, display & media'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-6 text-sm divide-y divide-slate-800/80">
          <div className="space-y-3 pt-1 first:pt-0">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-2">
                <Type className="w-4 h-4 text-rose-400" />
                <span>{currentLang === 'AR' ? 'حجم خط قراءة الأخبار والمقالات' : 'Reading Text Size'}</span>
              </span>
              <span className="text-xs text-rose-400 font-mono">
                {fontSize === 'sm'
                  ? (currentLang === 'AR' ? 'صغير' : 'Small')
                  : fontSize === 'md'
                  ? (currentLang === 'AR' ? 'افتراضي' : 'Default')
                  : fontSize === 'lg'
                  ? (currentLang === 'AR' ? 'كبير' : 'Large')
                  : (currentLang === 'AR' ? 'كبير جداً' : 'Extra Large')}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'sm', label: currentLang === 'AR' ? 'صغير' : 'Small', icon: 'A-' },
                { id: 'md', label: currentLang === 'AR' ? 'عادي' : 'Default', icon: 'A' },
                { id: 'lg', label: currentLang === 'AR' ? 'كبير' : 'Large', icon: 'A+' },
                { id: 'xl', label: currentLang === 'AR' ? 'ضخم' : 'X-Large', icon: 'A++' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFontSize(item.id as typeof fontSize)}
                  className={`py-2 px-2 rounded-xl text-center border font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                    fontSize === item.id
                      ? 'bg-[#A42424] border-[#A42424] text-white shadow-xs'
                      : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="text-sm font-sans">{item.icon}</span>
                  <span className="text-[10px] font-normal opacity-85">{item.label}</span>
                </button>
              ))}
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
              <span className="text-[10px] text-slate-400 block mb-1 font-mono">
                {currentLang === 'AR' ? 'معاينة النص:' : 'Text Preview:'}
              </span>
              <p
                className={`leading-relaxed transition-all ${
                  fontSize === 'sm'
                    ? 'text-xs'
                    : fontSize === 'md'
                    ? 'text-sm'
                    : fontSize === 'lg'
                    ? 'text-base font-medium'
                    : 'text-lg font-semibold'
                }`}
              >
                {currentLang === 'AR'
                  ? 'تغطية استقصائية معمقة من منصة SCOPE MEDIA تكشف الحقائق وراء العناوين.'
                  : 'In-depth investigative coverage from SCOPE MEDIA platform uncovering the facts behind the headlines.'}
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-5">
            <span className="font-semibold text-slate-200 flex items-center gap-2">
              <Palette className="w-4 h-4 text-amber-400" />
              <span>{currentLang === 'AR' ? 'مظهر المنصة والسمة' : 'Theme & Appearance'}</span>
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'dark', label: currentLang === 'AR' ? 'داكن صحفي' : 'Editorial Dark', icon: Moon },
                { id: 'light', label: currentLang === 'AR' ? 'فاتح نهاري' : 'Clean Light', icon: Sun },
                { id: 'system', label: currentLang === 'AR' ? 'تلقائي النظام' : 'System Auto', icon: Monitor },
              ].map((t) => {
                const Icon = t.icon;
                const isSelected = themeMode === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setThemeMode(t.id as typeof themeMode)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#A42424]/20 border-[#A42424] text-white shadow-xs'
                        : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-[#A42424]' : ''}`} />
                    <span className="text-xs font-medium">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 pt-5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-200 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-400" />
                  <span>{currentLang === 'AR' ? 'إشعارات الأخبار العاجلة' : 'Breaking News Alerts'}</span>
                </span>
                <p className="text-[11px] text-slate-400">
                  {currentLang === 'AR' ? 'تنبيه فوري عند وقوع أحداث رئيسية واستثنائية' : 'Live push notifications on breaking stories'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBreakingAlerts(!breakingAlerts)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  breakingAlerts ? 'bg-[#A42424]' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    currentLang === 'AR'
                      ? (breakingAlerts ? 'right-6' : 'right-0.5')
                      : (breakingAlerts ? 'left-6' : 'left-0.5')
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="space-y-4 pt-5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-200 flex items-center gap-2">
                  <Video className="w-4 h-4 text-sky-400" />
                  <span>{currentLang === 'AR' ? 'التشغيل التلقائي للفيديوهات' : 'Autoplay Videos'}</span>
                </span>
                <p className="text-[11px] text-slate-400">
                  {currentLang === 'AR' ? 'بدء تشغيل مقاطع الفيديو والتقارير تلقائياً' : 'Autoplay video clips while scrolling'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAutoplayVideo(!autoplayVideo)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  autoplayVideo ? 'bg-[#A42424]' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    currentLang === 'AR'
                      ? (autoplayVideo ? 'right-6' : 'right-0.5')
                      : (autoplayVideo ? 'left-6' : 'left-0.5')
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-200 flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-indigo-400" />
                  <span>{currentLang === 'AR' ? 'وضع توفير البيانات' : 'Data Saver Mode'}</span>
                </span>
                <p className="text-[11px] text-slate-400">
                  {currentLang === 'AR' ? 'ضغط الصور وخفض استهلاك باقة الإنترنت' : 'Compress images and reduce network usage'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDataSaver(!dataSaver)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  dataSaver ? 'bg-[#A42424]' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    currentLang === 'AR'
                      ? (dataSaver ? 'right-6' : 'right-0.5')
                      : (dataSaver ? 'left-6' : 'left-0.5')
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-5">
            <span className="font-semibold text-slate-200 flex items-center gap-2">
              <Globe className="w-4 h-4 text-rose-400" />
              <span>{currentLang === 'AR' ? 'لغة المحتوى والواجهة' : 'Language & Display'}</span>
            </span>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-700/80">
              <div>
                <p className="font-bold text-xs text-white">
                  {currentLang === 'AR' ? 'اللغة الحالية: العربية (AR)' : 'Current: English (EN)'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {currentLang === 'AR' ? 'انقر للتبديل الفوري للإنجليزية' : 'Click to switch to Arabic'}
                </p>
              </div>
              <button
                type="button"
                onClick={onToggleLang}
                className="px-3 py-1.5 rounded-lg bg-[#A42424] hover:bg-[#8B1E1E] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {currentLang === 'AR' ? 'Switch to English' : 'التحويل للعربية'}
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#080e1a] border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{currentLang === 'AR' ? 'استعادة الافتراضي' : 'Reset Defaults'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {currentLang === 'AR' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-[#A42424] hover:bg-[#8B1E1E] text-white shadow-md transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{currentLang === 'AR' ? 'تطبيق وحفظ' : 'Apply & Save'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
