'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import mapData from '@/lib/worldMapPaths.json';
import { ZoomIn, ZoomOut, RotateCcw, X } from 'lucide-react';

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
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Zoom controls
  const handleZoomIn = () => {
    setZoom((z) => Math.min(6, +(z + 0.6).toFixed(1)));
  };

  const handleZoomOut = () => {
    setZoom((z) => {
      const next = Math.max(1, +(z - 0.6).toFixed(1));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.3 : -0.3;
    setZoom((z) => {
      const next = Math.min(6, Math.max(1, +(z + delta).toFixed(1)));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  // Mouse pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMoveMap = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const maxX = (zoom - 1) * 350;
    const maxY = (zoom - 1) * 200;
    const newX = Math.min(maxX, Math.max(-maxX, e.clientX - dragStartRef.current.x));
    const newY = Math.min(maxY, Math.max(-maxY, e.clientY - dragStartRef.current.y));
    setPan({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Tooltip tracking on country
  const handleCountryMouseMove = (e: React.MouseEvent<SVGElement>, country: WorldMapCountry) => {
    if (isDragging) return;
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
    if (isDragging) return;
    const isSelected = activeCode?.toLowerCase() === country.code.toLowerCase();
    if (onSelectCountry) {
      onSelectCountry(isSelected ? null : country.code);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-xl bg-slate-50/70 dark:bg-[#070b14] border border-slate-100 dark:border-slate-800/80 p-2 sm:p-4 select-none"
    >
      {/* Zoom and Pan Controls Toolbar */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-1 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <button
          type="button"
          onClick={handleZoomIn}
          aria-label="تكبير الخريطة"
          title="تكبير"
          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={zoom <= 1}
          aria-label="تصغير الخريطة"
          title="تصغير"
          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 transition-colors cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        {zoom > 1 && (
          <button
            type="button"
            onClick={handleReset}
            aria-label="إعادة ضبط الحجم"
            title="إعادة ضبط"
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
        <span className="px-1.5 text-[10px] font-mono text-slate-400 font-bold" dir="ltr">
          {zoom.toFixed(1)}x
        </span>
      </div>

      {/* Selected Country Pinned Banner (Always visible & never clipped) */}
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

      {/* Floating Smart Tooltip (Positioned above or below depending on boundary) */}
      {hoveredCountry && tooltipPos && (
        <div
          className={`absolute z-30 pointer-events-none px-3 py-2 rounded-lg bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-xs text-white text-xs shadow-2xl border border-slate-700/60 whitespace-nowrap transition-transform duration-75 ${
            tooltipPos.y < 85
              ? 'translate-y-4' // Top country: show BELOW point to prevent clipping
              : '-translate-y-full -mt-2' // Normal: show ABOVE point
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

      {/* SVG Map Container with Overflow Control & Pan Handlers */}
      <div
        className={`w-full overflow-hidden rounded-lg aspect-[16/9] max-h-[380px] flex items-center justify-center ${
          zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
        }`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMoveMap}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          viewBox={mapData.viewBox}
          className="w-full h-full object-contain filter drop-shadow-xs transition-transform duration-100 ease-out"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
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
                  className={`transition-colors duration-150 ${
                    hasTraffic
                      ? 'cursor-pointer hover:opacity-85 hover:stroke-white dark:hover:stroke-slate-200'
                      : 'cursor-default'
                  }`}
                  style={{
                    fill: fillColor,
                    stroke: strokeColor,
                    strokeWidth: isSelected ? '1.5' : hasTraffic ? '0.75' : '0.4',
                  }}
                  onMouseEnter={(e) => country && handleCountryMouseMove(e, country)}
                  onMouseMove={(e) => country && handleCountryMouseMove(e, country)}
                  onMouseLeave={handleCountryMouseLeave}
                  onClick={() => country && handleCountryClick(country)}
                />
              );
            })}
          </g>
        </svg>
      </div>

      {/* Map Legend (Corrected RTL Alignment: منخفض on right by light boxes, مرتفع on left by dark boxes) */}
      <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-end text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2" dir="rtl">
          <span className="text-slate-400">منخفض</span>
          <div className="flex items-center gap-1" dir="ltr">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#fca5a5] inline-block" />
            <span className="w-2.5 h-2.5 rounded-xs bg-[#f87171] inline-block" />
            <span className="w-2.5 h-2.5 rounded-xs bg-[#dc2626] inline-block" />
            <span className="w-2.5 h-2.5 rounded-xs bg-[#A42424] inline-block" />
          </div>
          <span className="text-slate-400">مرتفع</span>
        </div>
      </div>
    </div>
  );
}
