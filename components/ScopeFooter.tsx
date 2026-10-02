'use client';

import React from 'react';
import Link from 'next/link';
import { Youtube, Facebook, Instagram, ShieldCheck, Globe, Rss } from 'lucide-react';

interface ScopeFooterProps {
  onSelectTab: (tab: string) => void;
}

export const ScopeFooter: React.FC<ScopeFooterProps> = ({ onSelectTab }) => {
  return (
    <footer className="w-full bg-[#0a1324] text-slate-300 border-t border-slate-800 pt-12 pb-8 mt-16 text-xs">
      <div className="max-w-[1480px] mx-auto px-4 sm:px-6 space-y-10">
        {/* Top Grid: Brand & Editorial Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-slate-800">
          {/* Brand & Editorial Mission (2 cols) */}
          <div className="lg:col-span-2 space-y-3.5">
            <div className="flex flex-col items-start">
              <span className="font-black text-2xl tracking-tighter text-white font-sans uppercase">
                SCOPE
              </span>
              <div className="flex items-center gap-1 -mt-0.5">
                <span className="w-2.5 h-[1.5px] bg-[#dc2626]"></span>
                <span className="text-[10px] font-black tracking-widest text-[#dc2626] uppercase">
                  MEDIA
                </span>
                <span className="w-2.5 h-[1.5px] bg-[#dc2626]"></span>
              </div>
            </div>

            <p className="text-slate-400 text-xs sm:text-[13px] leading-relaxed max-w-md font-normal">
              منصة إعلامية رقمية مستقلة متخصصة في الصحافة الاستقصائية والتحليلات السياسية والاقتصادية المعمقة، تنطلق برؤية تسعى لكشف الحقائق وتجاوز السطحية الإخبارية إلى ما وراء العناوين.
            </p>

            <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-rose-500" />
                <span>ميثاق شرف مهني معتمد</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-rose-500" />
                <span>شبكة مراسلين في 24 عاصمة</span>
              </span>
            </div>
          </div>

          {/* Editorial Sections */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white text-sm pb-1 border-b border-slate-800">
              الأقسام الإخبارية
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <button
                  onClick={() => onSelectTab('politics')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  السياسة والدبلوماسية
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('economy')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  المال وأسواق الطاقة
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('region')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  الشرق الأوسط والخليج
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('world')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  الشؤون الدولية
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('investigations')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  التحقيقات الاستقصائية
                </button>
              </li>
            </ul>
          </div>

          {/* Programs & Multi-Media */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white text-sm pb-1 border-b border-stone-800">
              البرامج والوسائط
            </h4>
            <ul className="space-y-2 text-stone-400">
              <li>
                <button
                  onClick={() => onSelectTab('programs')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  سلسلة برامج SCOPE
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('videos')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  التقارير المصورة (فيديو)
                </button>
              </li>
              <li className="hover:text-white transition-colors cursor-pointer">
                البث الفضائي الحي
              </li>
              <li className="hover:text-white transition-colors cursor-pointer">
                البودكاست الصوتي
              </li>
              <li className="hover:text-white transition-colors cursor-pointer">
                خلاصات الأخبار RSS
              </li>
            </ul>
          </div>

          {/* Reader Services & Policies */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white text-sm pb-1 border-b border-stone-800">
              المؤسسة والسياسات
            </h4>
            <ul className="space-y-2 text-stone-400">
              <li>
                <button
                  onClick={() => onSelectTab('about')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  عن SCOPE MEDIA
                </button>
              </li>
              <li className="hover:text-white transition-colors cursor-pointer">
                هيئة التحرير والمجلس الاستشاري
              </li>
              <li className="hover:text-white transition-colors cursor-pointer">
                سياسة الخصوصية وحماية البيانات
              </li>
              <li className="hover:text-white transition-colors cursor-pointer">
                شروط الاستخدام والنشر
              </li>
              <li className="hover:text-white transition-colors cursor-pointer">
                تواصل مع غرفة الأخبار
              </li>
              <li>
                <Link
                  href="/admin"
                  className="hover:text-[#dc2626] text-stone-400 hover:text-white transition-colors flex items-center gap-1.5 pt-1 border-t border-stone-800/80 mt-1"
                >
                  <ShieldCheck className="w-3 h-3 text-[#dc2626]" />
                  <span>بوابة الإدارة (Cloudflare D1)</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Strip: Social, Copyright & Legal */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-stone-500 text-[11px]">
          <div>
            جميع الحقوق محفوظة لشبكة SCOPE MEDIA © 2026 · ما وراء العناوين
          </div>

          <div className="flex items-center gap-4 text-stone-400">
            <a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-red-500 transition-colors" title="YouTube">
              <Youtube className="w-4 h-4" />
            </a>
            <a href="https://x.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors" title="X">
              <span className="font-bold text-xs">𝕏</span>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors" title="Facebook">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-pink-400 transition-colors" title="Instagram">
              <Instagram className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
