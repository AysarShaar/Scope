'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ScopeArticle } from '../data/scopeData';

interface ScopeVisualProps {
  type: ScopeArticle['imageType'];
  className?: string;
  badge?: string;
  badgeColor?: 'red' | 'blue';
  priority?: boolean;
}

// Curated high-resolution photojournalism imagery for authoritative media
const editorialImageMap: Record<ScopeArticle['imageType'], { url: string; alt: string; credit: string }> = {
  anchor_studio: {
    url: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1400&q=80',
    alt: 'استوديو الأخبار الرئيسي والبث الفضائي المباشر',
    credit: 'رويترز / استوديو الأخبار',
  },
  skyline_sunset: {
    url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
    alt: 'أبراج المركز المالي والمدينة الحديثة عند الغروب',
    credit: 'تصوير: بلومبرغ الشرق',
  },
  colosseum_history: {
    url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80',
    alt: 'المعالم الأثرية التاريخية والمدرج الروماني العريق',
    credit: 'أرشيف التراث العالمي',
  },
  society_people: {
    url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
    alt: 'رواد الأعمال والشباب المبتكر في ملتقى التكنولوجيا',
    credit: 'تصوير وثائقي مستقل',
  },
  diplomats_meeting: {
    url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
    alt: 'جلسة المباحثات الدبلوماسية والقمة الإقليمية',
    credit: 'المكتب الإعلامي للقمة',
  },
  oil_shipping: {
    url: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1200&q=80',
    alt: 'مشاريع الطاقة النظيفة وتوربينات الرياح العملاقة',
    credit: 'وكالة الأنباء الدولية للطاقة',
  },
  world_flags: {
    url: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1200&q=80',
    alt: 'مبنى الجمعية العامة للأمم المتحدة وأعلام الدول',
    credit: 'قسم الإعلام - الأمم المتحدة',
  },
  city_ruins: {
    url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
    alt: 'مواقع التراث المعماري والمدن التاريخية العريقة',
    credit: 'هيئة الآثار والتراث',
  },
  youth_future: {
    url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    alt: 'الجيل الجديد من المبتكرين في بيئة العمل الرقمية',
    credit: 'وحدة التحقيقات - SCOPE',
  },
  comedy_emoji: {
    url: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&q=80',
    alt: 'استوديو حواري إذاعي وتلفزيوني مباشر',
    credit: 'إنتاج SCOPE MEDIA',
  },
  vintage_book: {
    url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1200&q=80',
    alt: 'مخطوطات تاريخية نادرة ومكتبات التراث العريق',
    credit: 'خزانة الوثائق التاريخية',
  },
  lightbulb_idea: {
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    alt: 'مختبرات الذكاء الاصطناعي والحوسبة الفائقة',
    credit: 'معهد الابتكار التقني',
  },
  number_one: {
    url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80',
    alt: 'لقاءات القيادة التنفيذية ورواد الأعمال المؤثرين',
    credit: 'سلسلة برامج سكوب',
  },
  deep_investigation: {
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    alt: 'شبكات البيانات العالمية ومسارات التجارة الرقمية',
    credit: 'تحقيقات SCOPE الحصرية',
  },
};

export const ScopeVisual: React.FC<ScopeVisualProps> = ({
  type,
  className = '',
  badge,
  badgeColor = 'red',
  priority = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const data = editorialImageMap[type] || editorialImageMap.anchor_studio;

  return (
    <div className={`relative overflow-hidden w-full h-full bg-[#0d1624] ${className}`}>
      {/* High-Resolution Editorial Photography */}
      {!imageError && (
        <Image
          src={data.url}
          alt={data.alt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
          className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
        />
      )}

      {/* Subtle Editorial Vignette & Grading Layer */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10 pointer-events-none" />

      {/* Fallback Mesh Background if image fails to load */}
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center p-4 bg-gradient-to-br from-stone-900 via-stone-850 to-stone-950 text-stone-400">
          <div className="text-center">
            <span className="text-xs font-mono tracking-wider text-rose-400 block mb-1">
              SCOPE MEDIA
            </span>
            <p className="text-xs font-medium text-stone-300 max-w-xs">{data.alt}</p>
          </div>
        </div>
      )}

      {/* Clean Unboxed Kicker Badge (if provided) */}
      {badge && (
        <span
          className={`absolute top-3 right-3 text-[11px] font-bold tracking-wide px-2.5 py-0.5 rounded-none text-white shadow-sm z-10 ${
            badgeColor === 'blue' ? 'bg-[#0369a1]' : 'bg-[#be123c]'
          }`}
        >
          {badge}
        </span>
      )}
    </div>
  );
};
