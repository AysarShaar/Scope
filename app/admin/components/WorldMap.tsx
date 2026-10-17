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

interface CardPosition {
  x: number;
  y: number;
}

export default function WorldMap({ countries, activeCode, onSelectCountry }: WorldMapProps) {
  const [hoveredCountry, setHoveredCountry] = useState<WorldMapCountry | null>(null);
  const [cardPos, setCardPos] = useState<CardPosition | null>(null);
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

  // Active country to display in the card (hovered takes preview precedence, otherwise selected)
  const displayCountry = hoveredCountry || selectedCountry;
  const isPinned = Boolean(selectedCountry && (!hoveredCountry || hoveredCountry.code === selectedCountry.code));

  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setCenter([0, 20]);
  }, []);

  // Helper to compute a stable position beside an anchor point or country element
  const calculateCardPosition = useCallback(
    (anchorX: number, anchorY: number): CardPosition | null => {
      const container = containerRef.current;
      if (!container) return null;
      const contRect = container.getBoundingClientRect();

      const cardWidth = 186;
      const cardHeight = 82;
      const offset = 14;

      // Position beside: to the left if in right half of map, to the right if in left half
      const placeOnLeft = anchorX > contRect.width / 2;
      const targetLeft = placeOnLeft
        ? anchorX - cardWidth - offset
        : anchorX + offset;

      const targetTop = anchorY - cardHeight / 2;

      // Clamp strictly inside container bounds
      const x = Math.max(10, Math.min(contRect.width - cardWidth - 10, targetLeft));
      const y = Math.max(10, Math.min(contRect.height - cardHeight - 10, targetTop));

      return { x, y };
    },
    []
  );

  // Position from country SVG element centroid (used when selected from list or after zoom/pan)
  const updatePositionFromElement = useCallback(
    (code: string) => {
      const container = containerRef.current;
      if (!container) return;
      const el = container.querySelector(`[data-country-code="${code.toLowerCase()}"]`);
      if (!el) return;

      const contRect = container.getBoundingClientRect();
      const rect = el.getBoundingClientRect();

      const centerX = rect.left + rect.width / 2 - contRect.left;
      const centerY = rect.top + rect.height / 2 - contRect.top;

      const pos = calculateCardPosition(centerX, centerY);
      if (pos) {
        setCardPos(pos);
      }
    },
    [calculateCardPosition]
  );

  // When activeCode changes or zoom/center moves, re-anchor card if country is selected
  useEffect(() => {
    if (activeCode) {
      // Delay slightly to let SVG transform complete
      const timer = setTimeout(() => {
        updatePositionFromElement(activeCode);
      }, 50);
      return () => clearTimeout(timer);
    } else if (!hoveredCountry) {
      setCardPos(null);
    }
  }, [activeCode, zoom, center, updatePositionFromElement, hoveredCountry]);

  // Handle country mouse enter (calculates position once to avoid cursor jitter)
  const handleCountryMouseEnter = (country: WorldMapCountry, e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;
    const contRect = container.getBoundingClientRect();

    const anchorX = e.clientX - contRect.left;
    const anchorY = e.clientY - contRect.top;

    const pos = calculateCardPosition(anchorX, anchorY);
    if (pos) {
      setCardPos(pos);
      setHoveredCountry(country);
    }
  };

  const handleCountryMouseLeave = () => {
    setHoveredCountry(null);
    if (selectedCountry) {
      updatePositionFromElement(selectedCountry.code);
    } else {
      setCardPos(null);
    }
  };

  const handleCountryClick = (country: WorldMapCountry, e: React.MouseEvent) => {
    e.stopPropagation();
    const isSelected = activeCode?.toLowerCase() === country.code.toLowerCase();
    if (onSelectCountry) {
      onSelectCountry(isSelected ? null : country.code);
    }

    if (!isSelected) {
      const container = containerRef.current;
      if (container) {
        const contRect = container.getBoundingClientRect();
        const pos = calculateCardPosition(e.clientX - contRect.left, e.clientY - contRect.top);
        if (pos) setCardPos(pos);
      }
    } else {
      setCardPos(null);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl bg-slate-50/80 dark:bg-[#070b14] border border-slate-200/80 dark:border-slate-800/90 p-2 sm:p-4 select-none overflow-hidden transition-colors"
      onDoubleClick={handleResetZoom}
      onClick={() => {
        // Deselect if user clicks on empty space outside countries
        if (activeCode && onSelectCountry) {
          onSelectCountry(null);
          setCardPos(null);
        }
      }}
    >
      {/* Subtle Zoom Status Pill (Shows current zoom level without buttons) */}
      {zoom > 1.05 && (
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xs animate-in fade-in duration-150">
          <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300" dir="ltr">
            {zoom.toFixed(1)}x
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleResetZoom();
            }}
            aria-label="إعادة ضبط التكبير"
            title="انقر نقراً مزدوجاً أو اضغط هنا لإعادة الضبط"
            className="text-[10px] text-slate-400 hover:text-[#0F4468] dark:hover:text-sky-400 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">إعادة ضبط</span>
          </button>
        </div>
      )}

      {/* Elegant Bespoke Country Card (Stably positioned beside country) */}
      {displayCountry && cardPos && (
        <div
          className="absolute z-30 pointer-events-auto transition-all duration-150 ease-out"
          style={{
            left: `${cardPos.x}px`,
            top: `${cardPos.y}px`,
            width: '186px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative rounded-xl p-3 bg-white/95 dark:bg-[#0c121e]/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.12),0_4px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_14px_30px_-6px_rgba(0,0,0,0.65)] animate-in fade-in zoom-in-95 duration-150">
            {/* Header: Name, Code, Close button if pinned */}
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-bold text-[13px] text-slate-900 dark:text-slate-100 truncate">
                  {displayCountry.nameAr}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span
                  className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60"
                  dir="ltr"
                >
                  {displayCountry.code}
                </span>
                {isPinned && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCountry?.(null);
                      setHoveredCountry(null);
                      setCardPos(null);
                    }}
                    className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    aria-label="إلغاء التحديد"
                    title="إغلاق"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Hairline Divider */}
            <div className="my-2 h-px bg-slate-100 dark:bg-slate-800/80" />

            {/* Metrics Row */}
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-1">
                <span className="font-mono tabular-nums font-bold text-sm text-slate-900 dark:text-white">
                  {displayCountry.count.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 font-sans">مشاهدة</span>
              </div>
              <span
                className="font-mono tabular-nums font-bold text-[11px] px-2 py-0.5 rounded-full bg-sky-50 text-[#0F4468] dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60 shrink-0"
                dir="ltr"
              >
                {displayCountry.percentage}%
              </span>
            </div>
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
            translateExtent={[
              [-20, -80],
              [820, 470],
            ]}
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
                      fillColor = '#0F4468'; // Primary Deep Navy
                      strokeColor = '#09283d';
                    } else if (ratio > 0.3) {
                      fillColor = '#1A5A85'; // Rich Brand Blue
                      strokeColor = '#103d5c';
                    } else if (ratio > 0.1) {
                      fillColor = '#2979AD'; // Medium Blue
                      strokeColor = '#1c577c';
                    } else {
                      fillColor = '#60A5D6'; // Soft Sky Blue
                      strokeColor = '#3b82b6';
                    }
                    strokeWidth = 0.5;
                  }

                  if (isSelected) {
                    fillColor = '#0c3652';
                    strokeColor = '#38bdf8';
                    strokeWidth = 1.3;
                  }

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      data-country-code={code}
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
                      onMouseEnter={(e) => country && handleCountryMouseEnter(country, e)}
                      onMouseLeave={handleCountryMouseLeave}
                      onClick={(e) => country && handleCountryClick(country, e)}
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
            <span className="w-2.5 h-2.5 rounded-xs bg-[#0F4468] inline-block" />
            <span className="w-2.5 h-2.5 rounded-xs bg-[#1A5A85] inline-block" />
            <span className="w-2.5 h-2.5 rounded-xs bg-[#2979AD] inline-block" />
            <span className="w-2.5 h-2.5 rounded-xs bg-[#60A5D6] inline-block" />
          </div>
          <span className="text-slate-400">مرتفع</span>
        </div>
      </div>
    </div>
  );
}
