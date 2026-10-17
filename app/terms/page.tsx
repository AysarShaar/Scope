'use client';

import React, { useState } from 'react';
import Link from '../../components/NavLink';
import { useRouter } from 'next/navigation';
import { ScopeHeader } from '../../components/ScopeHeader';
import { ScopeFooter } from '../../components/ScopeFooter';
import { ScopeLiveModal } from '../../components/ScopeLiveModal';
import { useLanguage } from '../../context/LanguageContext';

export default function TermsOfUsePage() {
  const router = useRouter();
  const { lang, dir, toggleLang } = useLanguage();
  const [isLiveOpen, setIsLiveOpen] = useState(false);

  const isAr = lang === 'AR';

  const sections = isAr
    ? [
        { id: 'acceptance', title: '1. قبول الشروط ونطاق السريان' },
        { id: 'ip-copyright', title: '2. الملكية الفكرية وحقوق النشر' },
        { id: 'acceptable-use', title: '3. ضوابط الاستخدام المشروع' },
        { id: 'comments-ugc', title: '4. ضوابط التعليقات ومشاركات القراء' },
        { id: 'accuracy-corrections', title: '5. سياسة التصحيح وحق الرد' },
        { id: 'third-party-links', title: '6. الروابط الخارجية والمصادر المرجعية' },
        { id: 'disclaimer-liability', title: '7. حدود المسؤولية عن التحليلات' },
        { id: 'governing-law', title: '8. القانون الحاكم وفض النزاعات' },
      ]
    : [
        { id: 'acceptance', title: '1. Acceptance & Scope' },
        { id: 'ip-copyright', title: '2. Intellectual Property & Copyright' },
        { id: 'acceptable-use', title: '3. Acceptable Use Policy' },
        { id: 'comments-ugc', title: '4. Comments & Reader Submissions' },
        { id: 'accuracy-corrections', title: '5. Corrections Policy & Right of Reply' },
        { id: 'third-party-links', title: '6. External Links & References' },
        { id: 'disclaimer-liability', title: '7. Analytical Disclaimers' },
        { id: 'governing-law', title: '8. Governing Law & Dispute Resolution' },
      ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0A0F1D] text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <ScopeHeader
        currentTab="home"
        onSelectTab={(tab) => {
          if (tab === 'home') router.push('/');
          else router.push(`/?tab=${tab}`);
        }}
        onOpenLive={() => setIsLiveOpen(true)}
        currentLang={lang}
        onToggleLang={toggleLang}
      />

      <nav aria-label="Breadcrumb" className="border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0F172A]/70 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-[1480px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Link
              href="/"
              prefetch={false}
              className="hover:text-[#A42424] dark:hover:text-rose-400 font-semibold transition-colors"
            >
              {isAr ? 'الرئيسية' : 'Home'}
            </Link>
            <span className="text-slate-400">/</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {isAr ? 'شروط الاستخدام' : 'Terms of Use'}
            </span>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            SCOPE MEDIA · EDITORIAL & LEGAL
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-[1480px] mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        <header className="mb-10 pb-8 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#A42424] dark:text-rose-400 block">
            {isAr ? 'المعايير التحريرية والتنظيمية' : 'Editorial & Regulatory Framework'}
          </span>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            {isAr ? 'شروط الاستخدام' : 'Terms of Use'}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
            <span>{isAr ? 'تاريخ النفاذ: أكتوبر 2026' : 'Effective: October 2026'}</span>
            <span>•</span>
            <span className="font-mono">REF: TOS-2026</span>
            <span>•</span>
            <span>{isAr ? 'ملزمة لكافة قراء ومستخدمي المنصة' : 'Binding for all platform users'}</span>
          </div>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl pt-2">
            {isAr
              ? 'تحدد هذه الوثيقة الشروط المنظمة للوصول إلى منصة SCOPE MEDIA والاستفادة من محتواها الإخباري والاستقصائي والمرئي. يُعد استخدام الموقع إقراراً بالموافقة على هذه الضوابط.'
              : 'This document sets out the terms governing access to SCOPE MEDIA and its investigative, news, and multimedia coverage. Using the platform constitutes agreement with these regulations.'}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <aside className="lg:col-span-4 sticky top-16 space-y-4 order-2 lg:order-1">
            <div className="p-5 rounded-xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-sm text-slate-900 dark:text-white block">
                  {isAr ? 'فهرس الشروط' : 'Table of Terms'}
                </span>
              </div>

              <nav className="space-y-1">
                {sections.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-[#A42424] dark:hover:text-rose-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    {sec.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <div className="lg:col-span-8 space-y-8 order-1 lg:order-2">
            <section id="acceptance" className="scroll-mt-24 p-6 sm:p-8 rounded-xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                {isAr ? '1. قبول الشروط ونطاق السريان' : '1. Acceptance & Scope'}
              </h2>
              <div className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 space-y-3">
                <p>
                  {isAr
                    ? 'تسري هذه الاتفاقية على كافة زوار المنصة ومتابعيها. يشمل ذلك تصفح المواد التحريرية، ومشاهدة برامج الفيديو، ومتابعة البث الحي. يُعد استمرار التصفح قبولاً تاماً لهذه البنود دون تحفظ.'
                    : 'This agreement applies to all visitors and subscribers of SCOPE MEDIA, encompassing editorial reading, video show viewing, and live streaming. Continued usage represents full acceptance of these terms.'}
                </p>
              </div>
            </section>

            <section id="ip-copyright" className="scroll-mt-24 p-6 sm:p-8 rounded-xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                {isAr ? '2. الملكية الفكرية وحقوق النشر' : '2. Intellectual Property & Copyright'}
              </h2>
              <div className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 space-y-3">
                <p>
                  {isAr
                    ? 'كافة المواد المنشورة على SCOPE MEDIA، بما في ذلك التحقيقات الاستقصائية، والتحليلات السياسية والاقتصادية، والتقارير المصورة، والشعارات، هي ملكية فكرية حصرية للمنصة ومحمية بموجب القوانين والاتفاقيات الدولية لحقوق الملكية الفكرية.'
                    : 'All editorial output published on SCOPE MEDIA, including investigative reporting, geopolitical analyses, video features, and branding assets, are proprietary intellectual property protected under applicable copyright laws.'}
                </p>
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="font-semibold text-slate-900 dark:text-white block">
                    {isAr ? 'شروط الاقتباس الصحفي:' : 'Press Quotation Guidelines:'}
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                    <li>{isAr ? 'يُسمح بالاقتباس المحدود للأغراض الإخبارية مع الإشارة الصريحة إلى "SCOPE MEDIA" وتضمين رابط مباشر للمقال الأصلي.' : 'Fair journalistic quotation is permitted provided explicit attribution to "SCOPE MEDIA" is accompanied by a direct link.'}</li>
                    <li>{isAr ? 'يُمنع الاستنساخ الكامل أو إعادة النشر التجاري للمقالات والبرامج دون موافقة خطية مسبقة.' : 'Full syndication or commercial reproduction is prohibited without prior written authorization.'}</li>
                  </ul>
                </div>
              </div>
            </section>

            <section id="acceptable-use" className="scroll-mt-24 p-6 sm:p-8 rounded-xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                {isAr ? '3. ضوابط الاستخدام المشروع' : '3. Acceptable Use Policy'}
              </h2>
              <div className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 space-y-3">
                <p>
                  {isAr
                    ? 'يُحظر على أي مستخدم استغلال المنصة في أي نشاط يخالف القوانين أو يمس بسلامة الأنظمة، بما في ذلك:'
                    : 'Users are strictly prohibited from engaging in activities that compromise system integrity, including:'}
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                  <li>{isAr ? 'محاولات استخراج البيانات الآلية (Scraping) أو شن هجمات حرمان من الخدمة.' : 'Automated scraping or denial-of-service attempts.'}</li>
                  <li>{isAr ? 'انتحال صفة محرري المنصة أو كتابها أو موظفيها.' : 'Impersonation of editorial staff or correspondents.'}</li>
                  <li>{isAr ? 'محاولة اختراق أو تعطيل مشغلات البث أو الخدمات التفاعلية.' : 'Tampering with broadcast players or streaming services.'}</li>
                </ul>
              </div>
            </section>

            <section id="comments-ugc" className="scroll-mt-24 p-6 sm:p-8 rounded-xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                {isAr ? '4. ضوابط التعليقات ومشاركات القراء' : '4. Comments & Reader Submissions'}
              </h2>
              <div className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 space-y-3">
                <p>
                  {isAr
                    ? 'ترحب المنصة بالنقاشات الهادفة والرأي المستنير، وتحتفظ بحق حجب أو حذف أي تعليقات تتضمن خطاب كراهية أو تمييزاً، أو سباً وقذفاً، أو روابط ترويجية دعائية غير مصرح بها.'
                    : 'The platform welcomes informed civil discourse and retains editorial authority to moderate or delete comments containing hate speech, discrimination, defamation, or unsolicited commercial spam.'}
                </p>
              </div>
            </section>

            <section id="accuracy-corrections" className="scroll-mt-24 p-6 sm:p-8 rounded-xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                {isAr ? '5. سياسة التصحيح وحق الرد' : '5. Corrections Policy & Right of Reply'}
              </h2>
              <div className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 space-y-3">
                <p>
                  {isAr
                    ? 'تلتزم المنصة بتدقيق الحقائق، وفي حال ثبوت وجود خطأ واقعي في أي مادة منشورة، تلتزم هيئة التحرير بنشر تصحيح واضح ومؤرخ داخل التقرير.'
                    : 'SCOPE MEDIA enforces rigorous fact verification. In the event of a factual error, editorial corrections are published transparently alongside the relevant article.'}
                </p>
                <p>
                  {isAr
                    ? 'يُكفل حق الرد للأفراد والمؤسسات المعنية بالتحقيقات الاستقصائية وفق الأعراف الصحفية المستقرة.'
                    : 'The Right of Reply is fully respected for entities addressed in investigative pieces in accordance with accepted journalistic standards.'}
                </p>
              </div>
            </section>

            <section id="third-party-links" className="scroll-mt-24 p-6 sm:p-8 rounded-xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                {isAr ? '6. الروابط الخارجية والمصادر المرجعية' : '6. External Links & References'}
              </h2>
              <div className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 space-y-3">
                <p>
                  {isAr
                    ? 'قد تحتوي التقارير على روابط توثيقية لمصادر خارجية أو دراسات بحثية، ولا تتحمل المنصة مسؤولية السياسات أو المحتويات المنشورة على تلك المواقع المستقلة.'
                    : 'Editorial reporting may reference external research or third-party databases. SCOPE MEDIA assumes no responsibility for external platform content or practices.'}
                </p>
              </div>
            </section>

            <section id="disclaimer-liability" className="scroll-mt-24 p-6 sm:p-8 rounded-xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                {isAr ? '7. حدود المسؤولية عن التحليلات' : '7. Analytical Disclaimers'}
              </h2>
              <div className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 space-y-3">
                <p>
                  {isAr
                    ? 'التحليلات الاقتصادية وأسواق الطاقة المنشورة تعكس تقييمات الخبراء والكتاب، ولا تمثل بأي صورة توصية استثمارية أو مشورة مالية مباشرة للمتعاملين.'
                    : 'Financial analyses and market evaluations published represent the analytical views of their authors and do not constitute formal investment advice.'}
                </p>
              </div>
            </section>

            <section id="governing-law" className="scroll-mt-24 p-6 sm:p-8 rounded-xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                {isAr ? '8. القانون الحاكم وفض النزاعات' : '8. Governing Law & Dispute Resolution'}
              </h2>
              <div className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 space-y-3">
                <p>
                  {isAr
                    ? 'تخضع هذه الاتفاقية للتشريعات والقوانين المنظمة للنشر الرقمي والصحافة، وتختص المحاكم المعنية بالنظر في أي خلاف ينشأ بخصوص تفسير أو تنفيذ هذه البنود.'
                    : 'This agreement is governed by applicable digital publishing and media laws, subject to the jurisdiction of competent courts overseeing press regulations.'}
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <ScopeFooter onSelectTab={(tab) => router.push(tab === 'home' ? '/' : `/?tab=${tab}`)} />

      <ScopeLiveModal isOpen={isLiveOpen} onClose={() => setIsLiveOpen(false)} />
    </div>
  );
}
