'use client';

import React from 'react';
import Link from './NavLink';
import { Youtube, Facebook, Instagram } from 'lucide-react';
import { FACEBOOK_URL, INSTAGRAM_URL } from '../lib/socialLinks';
import { useLanguage } from '../context/LanguageContext';
import { ScopeLogo } from './ScopeLogo';

interface ScopeFooterProps {
  onSelectTab?: (tab: string) => void;
}

export const ScopeFooter: React.FC<ScopeFooterProps> = ({ onSelectTab }) => {
  const { t } = useLanguage();

  return (
    <footer className="w-full bg-[#0a1526] text-white/90 border-t border-white/10 pt-12 pb-8 mt-16 text-xs overflow-hidden">
      <div className="max-w-[1480px] mx-auto px-4 sm:px-6 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-white/10">
          <div className="lg:col-span-2 space-y-3.5">
            <Link href="/" prefetch={false} className="inline-block" aria-label="SCOPE MEDIA">
              <ScopeLogo variant="white" className="h-11 sm:h-12 w-auto" />
            </Link>

            <p className="text-slate-300 text-xs sm:text-[13px] leading-relaxed max-w-md font-normal">
              {t.footer.mission}
            </p>
          </div>

          <div className="space-y-2.5">
            <h4 className="font-bold text-white text-sm pb-1 border-b border-white/10">
              {t.footer.newsSections}
            </h4>
            <ul className="space-y-2 text-slate-300">
              <li>
                <Link
                  href="/"
                  prefetch={false}
                  onClick={() => onSelectTab?.('home')}
                  className="hover:text-white transition-colors cursor-pointer block"
                >
                  {t.nav.home}
                </Link>
              </li>
              <li>
                <Link
                  href="/category/news"
                  prefetch={false}
                  onClick={() => onSelectTab?.('news')}
                  className="hover:text-white transition-colors cursor-pointer block"
                >
                  {t.nav.news}
                </Link>
              </li>
              <li>
                <Link
                  href="/category/economy"
                  prefetch={false}
                  onClick={() => onSelectTab?.('economy')}
                  className="hover:text-white transition-colors cursor-pointer block"
                >
                  {t.nav.economy}
                </Link>
              </li>
              <li>
                <Link
                  href="/category/culture"
                  prefetch={false}
                  onClick={() => onSelectTab?.('culture')}
                  className="hover:text-white transition-colors cursor-pointer block"
                >
                  {t.nav.culture}
                </Link>
              </li>
              <li>
                <Link
                  href="/category/society"
                  prefetch={false}
                  onClick={() => onSelectTab?.('society')}
                  className="hover:text-white transition-colors cursor-pointer block"
                >
                  {t.nav.society}
                </Link>
              </li>
              <li>
                <Link
                  href="/category/science"
                  prefetch={false}
                  onClick={() => onSelectTab?.('science')}
                  className="hover:text-white transition-colors cursor-pointer block"
                >
                  {t.nav.science}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h4 className="font-bold text-white text-sm pb-1 border-b border-white/10">
              {t.footer.showsAndMedia}
            </h4>
            <ul className="space-y-2 text-slate-300">
              <li>
                <Link
                  href="/programs"
                  prefetch={false}
                  onClick={() => onSelectTab?.('programs')}
                  className="hover:text-white transition-colors cursor-pointer block"
                >
                  {t.nav.programs}
                </Link>
              </li>
              <li>
                <Link
                  href="/videos"
                  prefetch={false}
                  onClick={() => onSelectTab?.('videos')}
                  className="hover:text-white transition-colors cursor-pointer block"
                >
                  {t.nav.videos}
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  prefetch={false}
                  className="hover:text-white transition-colors cursor-pointer block"
                >
                  {t.header.liveStream}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h4 className="font-bold text-white text-sm pb-1 border-b border-white/10">
              {t.footer.institution}
            </h4>
            <ul className="space-y-2 text-slate-300">
              <li>
                <Link
                  href="/privacy"
                  prefetch={false}
                  className="hover:text-white transition-colors cursor-pointer block"
                >
                  {t.footer.privacy}
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  prefetch={false}
                  className="hover:text-white transition-colors cursor-pointer block"
                >
                  {t.footer.terms}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-[11px]">
          <div>
            {t.footer.copyright}
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 text-white">
            <span className="text-xs font-semibold text-slate-300 ml-1 hidden sm:inline-block">
              {t.footer.followUs}
            </span>

            <a
              href="https://youtube.com"
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center transition-all duration-300 hover:bg-[#A42424] hover:border-red-500 hover:text-white hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(220,38,38,0.4)] active:scale-95 cursor-pointer group shadow-sm"
              title="يوتيوب - SCOPE MEDIA"
              aria-label="YouTube"
            >
              <Youtube className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:scale-110" />
            </a>

            <a
              href="https://x.com"
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center transition-all duration-300 hover:bg-black hover:border-slate-500 hover:text-white hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(255,255,255,0.25)] active:scale-95 cursor-pointer group shadow-sm"
              title="منصة إكس - SCOPE MEDIA"
              aria-label="X"
            >
              <span className="font-bold text-sm sm:text-base leading-none transition-transform duration-300 group-hover:scale-110 font-sans">
                𝕏
              </span>
            </a>

            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center transition-all duration-300 hover:bg-[#1877f2] hover:border-[#1877f2] hover:text-white hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(24,119,242,0.4)] active:scale-95 cursor-pointer group shadow-sm"
              title="فيسبوك - SCOPE MEDIA"
              aria-label="Facebook"
            >
              <Facebook className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:scale-110" />
            </a>

            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center transition-all duration-300 hover:bg-gradient-to-tr hover:from-[#f58529] hover:via-[#dd2a7b] hover:to-[#8134af] hover:border-transparent hover:text-white hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(221,42,123,0.4)] active:scale-95 cursor-pointer group shadow-sm"
              title="إنستغرام - SCOPE MEDIA"
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:scale-110" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
