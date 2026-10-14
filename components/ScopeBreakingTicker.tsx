'use client';

import React, { useMemo } from 'react';
import { BreakingItem } from '../data/scopeData';
import { useLanguage } from '../context/LanguageContext';

export interface ScopeBreakingTickerProps {
  items?: BreakingItem[];
  onItemClick?: (item: BreakingItem) => void;
  className?: string;
}

export const ScopeLensIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="984 216 520 520"
    className={className}
    role="img"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g transform="translate(0.000000,1336.000000) scale(0.100000,-0.100000)" fill="#0F4468" stroke="none">
      <path fill="#A42424" d="M12370 10831 c-58 -3 -111 -10 -117 -14 -27 -17 -10 -51 85 -170 205 -256 520 -692 586 -812 9 -16 37 -61 61 -100 180 -280 456 -822 500 -982 4 -13 12 -23 20 -23 18 0 35 29 97 170 48 108 81 191 178 440 21 55 90 276 120 385 12 44 28 103 35 130 8 28 17 68 21 90 4 22 10 47 15 56 5 9 18 70 29 135 25 139 27 132 -82 224 -182 154 -479 316 -693 378 -38 11 -95 27 -125 36 -113 32 -408 66 -555 64 -38 -1 -117 -4 -175 -7z" />
      <path d="M11945 10773 c-33 -8 -89 -23 -125 -33 -36 -11 -81 -24 -100 -29 -189 -51 -497 -207 -680 -345 -119 -89 -290 -252 -290 -277 0 -25 23 -35 105 -48 39 -6 95 -17 125 -26 30 -8 64 -15 77 -15 24 0 168 -32 248 -56 28 -8 74 -19 103 -24 30 -5 58 -13 64 -16 5 -4 41 -15 79 -25 38 -10 102 -28 142 -39 39 -11 97 -27 127 -34 30 -7 71 -18 90 -24 55 -18 201 -59 250 -72 25 -6 70 -17 100 -25 30 -7 100 -25 155 -40 55 -15 123 -32 150 -39 28 -8 84 -26 125 -40 41 -15 93 -34 116 -41 22 -7 73 -29 112 -49 114 -58 128 -49 76 49 -19 38 -44 81 -54 96 -11 15 -20 29 -20 32 0 14 -144 237 -244 377 -189 268 -545 731 -578 752 -19 11 -84 8 -153 -9z" />
      <path d="M14117 10129 c-10 -14 -22 -52 -28 -85 -5 -32 -19 -86 -29 -119 -10 -33 -28 -90 -39 -128 -12 -37 -21 -74 -21 -81 0 -27 -162 -528 -185 -572 -8 -16 -15 -33 -15 -39 0 -5 -14 -44 -31 -85 -17 -41 -39 -95 -49 -120 -17 -45 -184 -428 -220 -505 -78 -169 -111 -233 -168 -325 -35 -58 -81 -129 -103 -159 -53 -74 -52 -85 9 -76 26 4 72 15 102 25 30 10 72 21 94 25 21 3 52 12 70 20 17 7 72 25 121 40 50 15 106 33 125 40 19 7 103 35 185 63 240 81 607 227 754 300 62 31 66 44 66 256 0 193 -15 339 -51 486 -9 36 -20 83 -24 105 -28 136 -117 347 -217 515 -24 41 -50 84 -56 95 -25 42 -178 242 -225 295 l-49 54 -16 -25z" />
      <path d="M10624 9971 c-36 -22 -180 -220 -248 -340 -98 -176 -174 -386 -207 -571 -5 -30 -16 -91 -24 -135 -18 -101 -24 -320 -9 -335 8 -8 31 2 85 38 146 96 194 127 220 142 67 39 158 93 194 116 22 13 47 27 55 31 8 3 26 14 40 23 74 50 811 420 837 420 8 0 211 89 278 122 33 17 102 45 154 64 86 31 110 45 111 67 0 4 -6 9 -12 11 -57 16 -199 59 -223 68 -16 6 -64 18 -105 28 -41 10 -109 28 -150 40 -41 12 -100 27 -131 34 -30 7 -64 18 -75 24 -10 5 -39 13 -64 16 -43 6 -144 31 -255 61 -27 8 -80 19 -117 25 -37 6 -78 14 -90 19 -13 5 -48 12 -78 16 -51 6 -115 20 -143 31 -7 2 -26 -4 -43 -15z" />
      <path d="M11560 9252 c-110 -53 -364 -173 -415 -197 -33 -16 -102 -53 -154 -82 -51 -29 -95 -53 -98 -53 -23 0 -644 -376 -714 -432 -43 -34 -49 -57 -37 -130 4 -29 13 -87 18 -128 26 -197 98 -415 222 -665 40 -82 46 -92 87 -160 95 -155 288 -373 436 -492 89 -72 252 -182 308 -209 57 -27 62 -15 43 108 -26 167 -24 757 4 993 26 217 56 418 77 502 8 35 19 89 23 120 16 127 59 318 91 408 6 17 17 51 24 77 7 26 45 112 84 193 83 170 83 186 1 147z" />
      <path d="M11443 8257 c-18 -22 -33 -78 -38 -145 -4 -37 -13 -105 -21 -152 -18 -108 -44 -496 -44 -665 0 -122 23 -520 35 -611 3 -23 14 -49 23 -57 17 -16 234 -107 253 -107 6 0 25 -7 42 -15 18 -8 50 -19 72 -24 22 -6 65 -17 95 -25 201 -53 455 -82 640 -72 279 14 353 26 663 107 63 17 45 57 -58 127 -22 14 -73 54 -113 87 -41 33 -88 71 -105 85 -18 14 -120 101 -227 195 -207 180 -351 316 -593 560 -365 367 -470 489 -566 657 -37 65 -45 73 -58 55z" />
      <path d="M14600 8203 c-41 -19 -91 -41 -110 -48 -19 -7 -93 -36 -165 -64 -229 -92 -328 -129 -420 -159 -49 -17 -101 -34 -115 -40 -14 -5 -59 -19 -100 -32 -98 -29 -183 -55 -245 -75 -27 -8 -79 -24 -115 -34 -36 -10 -99 -29 -140 -41 -41 -12 -100 -28 -130 -35 -30 -8 -95 -25 -145 -39 -85 -24 -178 -47 -270 -67 -71 -15 -254 -9 -349 10 -87 19 -116 18 -116 0 0 -12 291 -295 400 -389 47 -40 90 -78 95 -84 20 -22 181 -162 230 -201 28 -22 52 -42 55 -45 7 -10 273 -220 327 -259 26 -19 58 -34 73 -34 29 0 225 94 340 163 216 130 410 290 559 462 127 145 257 355 327 525 58 140 124 382 127 467 2 44 -1 51 -18 53 -11 1 -54 -14 -95 -34z" />
    </g>
  </svg>
);

export const ScopeBreakingTicker: React.FC<ScopeBreakingTickerProps> = ({
  items = [],
  onItemClick,
  className = '',
}) => {
  const { lang, dir } = useLanguage();

  const activeItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    const source = items.slice(0, 12);
    const repeatCount = Math.max(2, Math.ceil(12 / source.length));
    const list: BreakingItem[] = [];
    for (let i = 0; i < repeatCount; i++) {
      list.push(...source);
    }
    return list;
  }, [items]);

  if (activeItems.length === 0) {
    return null;
  }

  const renderSingleSet = (isClone = false) => (
    <div
      key={isClone ? 'set-clone' : 'set-main'}
      className="flex items-center shrink-0"
      aria-hidden={isClone ? 'true' : undefined}
    >
      {activeItems.map((item, idx) => (
        <div key={`${item.id}-${idx}-${isClone ? 'clone' : 'main'}`} className="flex items-center shrink-0">
          <span
            dir={dir}
            className="text-slate-900 dark:text-white font-bold text-xs sm:text-[13px] tracking-tight whitespace-nowrap cursor-default select-none py-0.5 pointer-events-none"
          >
            {item.title}
          </span>

          <div
            className="inline-flex items-center justify-center shrink-0 px-3.5 sm:px-4 select-none pointer-events-none"
            aria-hidden="true"
          >
            <ScopeLensIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div
      className={`w-full bg-white dark:bg-[#0c1828] text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 shadow-sm h-8 sm:h-9 flex items-center overflow-hidden select-none pointer-events-none ${className}`}
      role="region"
      aria-label={lang === 'AR' ? 'شريط الأخبار العاجلة' : 'Breaking News Ticker'}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes scopeTickerLTR {
              0% {
                transform: translate3d(-50%, 0, 0);
              }
              100% {
                transform: translate3d(0%, 0, 0);
              }
            }
            .scope-ticker-track {
              display: flex !important;
              flex-shrink: 0 !important;
              align-items: center !important;
              width: max-content !important;
              animation: scopeTickerLTR 250s linear infinite !important;
              will-change: transform;
            }
          `,
        }}
      />

      <div
        dir="ltr"
        className="scope-ticker-container relative w-full overflow-hidden flex items-center select-none"
      >
        <div className="scope-ticker-track">
          {renderSingleSet(false)}
          {renderSingleSet(true)}
        </div>
      </div>
    </div>
  );
};
