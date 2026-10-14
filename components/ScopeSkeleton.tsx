'use client';

import React from 'react';

export function SkeletonBox({
  className = '',
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`relative overflow-hidden bg-[#e5e5e5] dark:bg-[#222222] ${className}`}
    >
      <div
        className="absolute inset-0 rtl:translate-x-full ltr:-translate-x-full rtl:animate-[ytShimmerRTL_1.5s_infinite] ltr:animate-[ytShimmerLTR_1.5s_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-white/7 to-transparent pointer-events-none"
      />
      {children}
    </div>
  );
}

export function ScopeHeroGridSkeleton() {
  return (
    <div className="w-full space-y-7 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-5 items-stretch">
        
        <div className="md:col-span-4 xl:col-span-3 flex flex-col justify-between gap-3 h-auto md:h-[470px] lg:h-[490px] order-2 md:order-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="relative flex-1 min-h-[135px] md:min-h-0 rounded-xl overflow-hidden bg-[#e5e5e5] dark:bg-[#222222] p-3 sm:p-3.5 flex flex-col justify-between"
            >
              <SkeletonBox className="w-full h-full absolute inset-0" />
              <div className="relative z-10 flex items-center gap-1.5">
                <SkeletonBox className="w-14 h-4 rounded bg-white/70 dark:bg-black/40" />
                <SkeletonBox className="w-10 h-3 rounded bg-white/50 dark:bg-black/30" />
              </div>
              <div className="relative z-10 space-y-1.5 pt-2">
                <SkeletonBox className="w-full h-4 rounded bg-white/70 dark:bg-black/40" />
                <SkeletonBox className="w-3/4 h-3 rounded bg-white/50 dark:bg-black/30" />
              </div>
            </div>
          ))}
        </div>

        <div className="md:col-span-8 xl:col-span-6 relative rounded-2xl overflow-hidden min-h-[340px] sm:min-h-[400px] md:min-h-[470px] lg:min-h-[490px] h-full order-1 md:order-2">
          <SkeletonBox className="w-full h-full absolute inset-0 rounded-2xl" />
        </div>

        <div className="md:col-span-12 xl:col-span-3 h-auto md:h-[470px] lg:h-[490px] order-3">
          <div className="relative w-full h-full min-h-[340px] sm:min-h-[400px] md:min-h-0 rounded-2xl overflow-hidden p-4 sm:p-5 flex flex-col justify-between">
            <SkeletonBox className="w-full h-full absolute inset-0 rounded-2xl" />
            <div className="relative z-10 flex items-center justify-between gap-2">
              <SkeletonBox className="w-24 h-6 rounded-full bg-white/70 dark:bg-black/40" />
              <SkeletonBox className="w-14 h-5 rounded-full bg-white/70 dark:bg-black/40" />
            </div>
            <div className="relative z-10 space-y-2 mt-auto pt-16">
              <SkeletonBox className="w-full h-5 rounded bg-white/70 dark:bg-black/40" />
              <SkeletonBox className="w-5/6 h-5 rounded bg-white/70 dark:bg-black/40" />
              <SkeletonBox className="w-3/4 h-3.5 rounded bg-white/50 dark:bg-black/30" />
              <div className="pt-3 mt-1 border-t border-white/20 dark:border-black/20 flex items-center justify-between">
                <SkeletonBox className="w-20 h-3 rounded bg-white/50 dark:bg-black/30" />
                <SkeletonBox className="w-20 h-3 rounded bg-white/50 dark:bg-black/30" />
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="w-full bg-[#f4f4f4] dark:bg-[#181818] p-3.5 sm:p-4 rounded-2xl">
        <div className="flex items-center justify-between pb-2 border-b border-[#e5e5e5] dark:border-[#272727] mb-3.5">
          <div className="flex items-center gap-2">
            <SkeletonBox className="w-2.5 h-2.5 rounded-full" />
            <SkeletonBox className="w-28 h-5 rounded-md" />
          </div>
          <SkeletonBox className="w-20 h-5 rounded-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#1f1f1f] p-2.5 rounded-xl shadow-2xs flex flex-col justify-between space-y-2.5"
            >
              <div>
                <SkeletonBox className="aspect-[16/10] w-full rounded-lg mb-2" />
                <SkeletonBox className="w-14 h-3 rounded mb-1.5" />
                <SkeletonBox className="w-full h-4 rounded mb-1" />
                <SkeletonBox className="w-4/5 h-4 rounded" />
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#f0f0f0] dark:border-[#282828]">
                <SkeletonBox className="w-16 h-3 rounded" />
                <SkeletonBox className="w-16 h-3 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full space-y-3 pt-2">
        <div className="flex items-center justify-between pb-2 border-b border-[#e5e5e5] dark:border-[#272727]">
          <div className="flex items-center gap-2">
            <SkeletonBox className="w-2.5 h-2.5 rounded-full" />
            <SkeletonBox className="w-32 h-5 rounded-md" />
          </div>
          <SkeletonBox className="w-24 h-5 rounded-full" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="aspect-[16/11] rounded-xl overflow-hidden bg-[#e5e5e5] dark:bg-[#222222] p-2.5 flex flex-col justify-end"
            >
              <SkeletonBox className="w-full h-full absolute inset-0" />
              <div className="relative z-10 space-y-1">
                <SkeletonBox className="w-4/5 h-3.5 rounded bg-white/70 dark:bg-black/40" />
                <SkeletonBox className="w-1/2 h-2.5 rounded bg-white/50 dark:bg-black/30" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes ytShimmerRTL {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        @keyframes ytShimmerLTR {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}

export function ScopeProgramsRowSkeleton() {
  return (
    <div className="w-full space-y-3 pt-2 animate-in fade-in duration-200">
      <div className="flex items-center justify-between pb-2 border-b border-[#e5e5e5] dark:border-[#272727]">
        <div className="flex items-center gap-2">
          <SkeletonBox className="w-2.5 h-2.5 rounded-full" />
          <SkeletonBox className="w-36 h-5 rounded-md" />
        </div>
        <SkeletonBox className="w-24 h-6 rounded-full" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="aspect-[16/11] rounded-xl overflow-hidden bg-[#e5e5e5] dark:bg-[#222222] p-2.5 flex flex-col justify-end"
          >
            <SkeletonBox className="w-full h-full absolute inset-0" />
            <div className="relative z-10 space-y-1">
              <SkeletonBox className="w-4/5 h-3.5 rounded bg-white/70 dark:bg-black/40" />
              <SkeletonBox className="w-1/2 h-2.5 rounded bg-white/50 dark:bg-black/30" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScopeCategoryGridSkeleton() {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-[#e5e5e5] dark:border-[#222222]">
        <div className="flex items-center gap-2.5">
          <SkeletonBox className="w-3 h-5 rounded-sm" />
          <SkeletonBox className="w-36 h-6 rounded-md" />
        </div>
        <SkeletonBox className="w-20 h-4 rounded-md" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="relative aspect-[16/10] bg-[#e5e5e5] dark:bg-[#222222] overflow-hidden">
                <SkeletonBox className="w-full h-full" />
                <div className="absolute top-2.5 right-2.5">
                  <SkeletonBox className="w-16 h-4 rounded-full bg-white/70 dark:bg-black/50" />
                </div>
              </div>
              <div className="p-3.5 space-y-2">
                <SkeletonBox className="w-full h-4 rounded-md" />
                <SkeletonBox className="w-4/5 h-4 rounded-md" />
                <SkeletonBox className="w-2/3 h-3 rounded-md mt-1" />
              </div>
            </div>
            <div className="p-3.5 pt-0 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 mt-2">
              <SkeletonBox className="w-20 h-3 rounded-md mt-2.5" />
              <SkeletonBox className="w-16 h-3 rounded-md mt-2.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScopeArticleSkeleton() {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      <div className="w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#0c1628]/90 py-2.5 px-4 sm:px-6">
        <div className="max-w-[1480px] mx-auto flex items-center gap-2">
          <SkeletonBox className="w-14 h-3.5 rounded" />
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <SkeletonBox className="w-20 h-3.5 rounded" />
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <SkeletonBox className="w-60 h-3.5 rounded" />
        </div>
      </div>

      <div className="max-w-[1480px] mx-auto w-full px-3 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-8 space-y-6">
            <div className="w-full bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 sm:p-10 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <SkeletonBox className="w-20 h-6 rounded-md" />
                <SkeletonBox className="w-28 h-4 rounded" />
              </div>

              <div className="space-y-3">
                <SkeletonBox className="w-full h-8 sm:h-10 rounded-lg" />
                <SkeletonBox className="w-4/5 h-8 sm:h-10 rounded-lg" />
              </div>

              <SkeletonBox className="w-full h-16 rounded-xl" />

              <div className="flex items-center justify-between py-2 border-y border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <SkeletonBox className="w-10 h-10 rounded-full" />
                  <div className="space-y-1.5">
                    <SkeletonBox className="w-28 h-3.5 rounded" />
                    <SkeletonBox className="w-16 h-3 rounded" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <SkeletonBox className="w-8 h-8 rounded-lg" />
                  <SkeletonBox className="w-8 h-8 rounded-lg" />
                  <SkeletonBox className="w-8 h-8 rounded-lg" />
                </div>
              </div>

              <SkeletonBox className="w-full aspect-[16/9] rounded-xl" />

              <div className="space-y-3 pt-2">
                <SkeletonBox className="w-full h-4 rounded" />
                <SkeletonBox className="w-full h-4 rounded" />
                <SkeletonBox className="w-11/12 h-4 rounded" />
                <SkeletonBox className="w-4/5 h-4 rounded" />
              </div>
            </div>
          </div>

          <aside className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
              <SkeletonBox className="w-28 h-5 rounded" />
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-2.5 items-start">
                    <SkeletonBox className="w-28 aspect-[16/10] rounded-lg shrink-0" />
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <SkeletonBox className="w-full h-3.5 rounded" />
                      <SkeletonBox className="w-4/5 h-3.5 rounded" />
                      <SkeletonBox className="w-16 h-2.5 rounded mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}

export function ScopeSidebarSkeleton() {
  return (
    <aside className="w-full space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center gap-2.5 pb-2 border-b border-[#e5e5e5] dark:border-[#222222]">
        <SkeletonBox className="w-5 h-5 rounded-full" />
        <SkeletonBox className="w-28 h-4 rounded-md" />
      </div>

      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-3 items-start">
            <SkeletonBox className="w-24 aspect-video rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5 min-w-0">
              <SkeletonBox className="w-full h-3.5 rounded-sm" />
              <SkeletonBox className="w-3/4 h-3.5 rounded-sm" />
              <SkeletonBox className="w-16 h-2.5 rounded-sm mt-1" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
