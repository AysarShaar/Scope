'use client';

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Graticule,
} from 'react-simple-maps';
import geoData from '@/lib/world-countries-110m.json';
import { X, RotateCcw } from 'lucide-react';

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
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 20]);
  const [isDark, setIsDark] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Synchronize dark mode class with documentElement
  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

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

  // Selected Country data
  const selectedCountry = useMemo(() => {
    if (!activeCode) return null;
    return countryMap.get(activeCode.toLowerCase()) || null;
  }, [activeCode, countryMap]);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setCenter([0, 20]);
  }, []);

  // Tooltip tracking on country
  const handleCountryMouseMove = (e: React.MouseEvent, country: WorldMapCountry) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setHoveredCountry(country);
    }
  };

  const handleCountryMouseLeave = () => {
    setHoveredCountry(null);
    setTooltipPos(null);
  };

  const handleCountryClick = (country: WorldMapCountry) => {
    const isSelected = activeCode?.toLowerCase() === country.code.toLowerCase();
    if (onSelectCountry) {
      onSelectCountry(isSelected ? null : country.code);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl bg-slate-50/80 dark:bg-[#070b14] border border-slate-200/80 dark:border-slate-800/90 p-2 sm:p-4 select-none overflow-hidden transition-colors"
      onDoubleClick={handleResetZoom}
    >
      {/* Subtle Zoom Status Pill (Shows current zoom level without buttons) */}
      {zoom > 1.05 && (
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xs animate-in fade-in duration-150">
          <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300" dir="ltr">
            {zoom.toFixed(1)}x
          </span>
          <button
            type="button"
            onClick={handleResetZoom}
            aria-label="إعادة ضبط التكبير"
            title="انقر نقراً مزدوجاً أو اضغط هنا لإعادة الضبط"
            className="text-[10px] text-slate-400 hover:text-[#A42424] dark:hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">إعادة ضبط</span>
          </button>
        </div>
      )}

      {/* Selected Country Pinned Banner */}
      {selectedCountry && (
        <div className="mb-2 p-2.5 rounded-lg bg-rose-50/90 dark:bg-rose-950/40 border border-[#A42424]/40 dark:border-rose-500/40 flex items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="text-xl leading-none">{selectedCountry.flag}</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {selectedCountry.nameAr}
            </span>
            <span className="text-xs font-mono text-slate-400" dir="ltr">
              ({selectedCountry.code})
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
              {selectedCountry.count.toLocaleString()}{' '}
              <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 font-sans">
                مشاهدة
              </span>
            </span>
            <span className="font-mono font-bold text-xs text-rose-600 dark:text-rose-400">
              ({selectedCountry.percentage}%)
            </span>
            <button
              type="button"
              onClick={() => onSelectCountry && onSelectCountry(null)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-rose-100/60 dark:hover:bg-rose-900/40 transition-colors cursor-pointer"
              aria-label="إلغاء التحديد"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Smart Tooltip */}
      {hoveredCountry && tooltipPos && (
        <div
          className={`absolute z-30 pointer-events-none px-3 py-2 rounded-lg bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white text-xs shadow-xl border border-slate-700/60 whitespace-nowrap transition-transform duration-75 ${
            tooltipPos.y < 85 ? 'translate-y-4' : '-translate-y-full -mt-2'
          }`}
          style={{
            left: `${Math.max(60, Math.min((containerRef.current?.clientWidth || 300) - 120, tooltipPos.x))}px`,
            top: `${tooltipPos.y}px`,
            transform: `translateX(-50%) ${tooltipPos.y < 85 ? 'translateY(16px)' : 'translateY(-100%)'}`,
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

      {/* Mercator Projection Map Canvas via react-simple-maps */}
      <div className="w-full overflow-hidden rounded-xl aspect-[16/9] max-h-[390px] flex items-center justify-center">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 125,
            center: [0, 20],
          }}
          width={800}
          height={460}
          className="w-full h-full object-contain"
        >
          <ZoomableGroup
            zoom={zoom}
            minZoom={1}
            maxZoom={6}
            center={center}
            onMoveEnd={({ coordinates, zoom: nextZoom }) => {
              if (typeof nextZoom === 'number') {
                setZoom(nextZoom);
              }
              if (coordinates) {
                setCenter(coordinates as [number, number]);
              }
            }}
          >
            {/* Subtle Mercator Lat/Long Graticule Grid */}
            <Graticule
              stroke={isDark ? '#1e293b' : '#e2e8f0'}
              strokeWidth={0.35}
              strokeDasharray="2,3"
            />

            <Geographies geography={geoData as any}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const code = (geo.properties?.code || '').toLowerCase();
                  const country = countryMap.get(code);
                  const isSelected = activeCode?.toLowerCase() === code;
                  const hasTraffic = Boolean(country && country.count > 0);

                  let fillColor = isDark ? '#161f31' : '#e2e8f0';
                  let strokeColor = isDark ? '#26334d' : '#cbd5e1';
                  let strokeWidth = 0.35;

                  if (hasTraffic && country) {
                    const ratio = country.count / maxCount;
                    if (ratio > 0.6) {
                      fillColor = '#881337'; // Deep Wine Crimson
                      strokeColor = '#4c0519';
                    } else if (ratio > 0.3) {
                      fillColor = '#A42424'; // Brand Crimson
                      strokeColor = '#7f1d1d';
                    } else if (ratio > 0.1) {
                      fillColor = '#e11d48'; // Rich Rose Red
                      strokeColor = '#9f1239';
                    } else {
                      fillColor = '#fb7185'; // Soft Rose
                      strokeColor = '#f43f5e';
                    }
                    strokeWidth = 0.5;
                  }

                  if (isSelected) {
                    fillColor = '#991b1b';
                    strokeColor = '#ffffff';
                    strokeWidth = 1.2;
                  }

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      className={`transition-colors duration-150 outline-none ${
                        hasTraffic
                          ? 'cursor-pointer hover:opacity-85 hover:stroke-white dark:hover:stroke-slate-200'
                          : 'cursor-default'
                      } ${
                        !hasTraffic
                          ? 'hover:fill-slate-300 dark:hover:fill-slate-800'
                          : ''
                      }`}
                      style={{ outline: 'none' }}
                      onMouseEnter={(e) => country && handleCountryMouseMove(e, country)}
                      onMouseMove={(e) => country && handleCountryMouseMove(e, country)}
                      onMouseLeave={handleCountryMouseLeave}
                      onClick={() => country && handleCountryClick(country)}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Map Legend: منخفض on right by light boxes, مرتفع on left by dark boxes */}
      <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span className="text-[10px] text-slate-400 hidden sm:inline">
          التكبير والتصغير بإصبعين أو بدولاب الماوس
        </span>
        <div className="flex items-center gap-2" dir="rtl">
          <span className="text-slate-400">منخفض</span>
          <div className="flex items-center gap-1" dir="ltr">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#881337] inline-block" />
            <span className="w-2.5 h-2.5 rounded-xs bg-[#A42424] inline-block" />
            <span className="w-2.5 h-2.5 rounded-xs bg-[#e11d48] inline-block" />
            <span className="w-2.5 h-2.5 rounded-xs bg-[#fb7185] inline-block" />
          </div>
          <span className="text-slate-400">مرتفع</span>
        </div>
      </div>
    </div>
  );
}
