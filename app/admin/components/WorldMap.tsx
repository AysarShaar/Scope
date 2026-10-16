'use client';

import React, { useState, useMemo } from 'react';
import mapData from '@/lib/worldMapPaths.json';

export interface WorldMapCountry {
  code: string;
  nameAr: string;
  flag: string;
  count: number;
  percentage: number;
}

interface WorldMapProps {
  countries: WorldMapCountry[];
  activeCode?: string | null;
  onSelectCountry?: (code: string | null) => void;
}

export default function WorldMap({ countries, activeCode, onSelectCountry }: WorldMapProps) {
  const [hoveredCountry, setHoveredCountry] = useState<WorldMapCountry | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Map country lookup by lowercase ISO code
  const countryMap = useMemo(() => {
    const map = new Map<string, WorldMapCountry>();
    for (const c of countries) {
      if (c.code) {
        map.set(c.code.toLowerCase(), c);
      }
    }
    return map;
  }, [countries]);

  const maxCount = useMemo(() => {
    return countries.reduce((max, c) => Math.max(max, c.count), 0) || 1;
  }, [countries]);

  const handleMouseMove = (e: React.MouseEvent<SVGElement>, country: WorldMapCountry) => {
    const rect = e.currentTarget.closest('svg')?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setHoveredCountry(country);
    }
  };

  const handleMouseLeave = () => {
    setHoveredCountry(null);
    setTooltipPos(null);
  };

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-slate-50/70 dark:bg-[#070b14] border border-slate-100 dark:border-slate-800/80 p-2 sm:p-4 select-none">
      {/* Floating Tooltip */}
      {hoveredCountry && tooltipPos && (
        <div
          className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 px-3 py-2 rounded-lg bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-xs text-white text-xs shadow-xl border border-slate-700/60 whitespace-nowrap"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y - 10}px`,
          }}
        >
          <div className="flex items-center gap-1.5 font-bold">
            <span className="text-base leading-none">{hoveredCountry.flag}</span>
            <span>{hoveredCountry.nameAr}</span>
            <span className="text-[10px] text-slate-400 font-mono" dir="ltr">
              ({hoveredCountry.code})
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between gap-3 text-[11px] text-slate-300">
            <span>المشاهدات:</span>
            <span className="font-mono tabular-nums font-bold text-white">
              {hoveredCountry.count.toLocaleString()}
            </span>
            <span className="text-emerald-400 font-mono font-bold">
              ({hoveredCountry.percentage}%)
            </span>
          </div>
        </div>
      )}

      {/* SVG Map */}
      <div className="w-full h-auto aspect-[16/9] max-h-[360px] flex items-center justify-center">
        <svg
          viewBox={mapData.viewBox}
          className="w-full h-full object-contain filter drop-shadow-xs"
          role="img"
          aria-label="خريطة التوزيع الجغرافي للزيارات"
        >
          <g>
            {Object.entries(mapData.countries).map(([code, pathD]) => {
              const country = countryMap.get(code);
              const isSelected = activeCode?.toLowerCase() === code;
              const hasTraffic = Boolean(country && country.count > 0);

              let fillColor = 'var(--map-neutral, #e2e8f0)';
              let strokeColor = 'var(--map-stroke, #cbd5e1)';

              if (hasTraffic && country) {
                const ratio = country.count / maxCount;
                if (ratio > 0.6) {
                  fillColor = '#A42424'; // Intense Crimson
                } else if (ratio > 0.3) {
                  fillColor = '#dc2626'; // Red-600
                } else if (ratio > 0.1) {
                  fillColor = '#f87171'; // Red-400
                } else {
                  fillColor = '#fca5a5'; // Red-300
                }
                strokeColor = '#7f1d1d';
              }

              if (isSelected) {
                fillColor = '#b91c1c';
                strokeColor = '#ffffff';
              }

              return (
                <path
                  key={code}
                  id={code}
                  d={pathD}
                  className={`transition-colors duration-200 ${
                    hasTraffic
                      ? 'cursor-pointer hover:opacity-85 hover:stroke-white dark:hover:stroke-slate-200'
                      : 'cursor-default'
                  }`}
                  style={{
                    fill: fillColor,
                    stroke: strokeColor,
                    strokeWidth: isSelected ? '1.5' : hasTraffic ? '0.75' : '0.4',
                  }}
                  onMouseEnter={(e) => country && handleMouseMove(e, country)}
                  onMouseMove={(e) => country && handleMouseMove(e, country)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => {
                    if (country && onSelectCountry) {
                      onSelectCountry(isSelected ? null : country.code);
                    }
                  }}
                />
              );
            })}
          </g>
        </svg>
      </div>

      {/* Map Legend */}
      <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <span>كثافة المشاهدات:</span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#fca5a5] inline-block" />
            <span className="w-2.5 h-2.5 rounded-xs bg-[#f87171] inline-block" />
            <span className="w-2.5 h-2.5 rounded-xs bg-[#dc2626] inline-block" />
            <span className="w-2.5 h-2.5 rounded-xs bg-[#A42424] inline-block" />
          </span>
          <span className="text-[10px] text-slate-400 font-mono">(مرتفع ← منخفض)</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span>الدول النشطة: {countries.length}</span>
        </div>
      </div>
    </div>
  );
}
