'use client';

import React, { useState } from 'react';
import Link from '../../components/NavLink';
import { useRouter } from 'next/navigation';
import { ScopeHeader } from '../../components/ScopeHeader';
import { ScopeFooter } from '../../components/ScopeFooter';
import { ScopeLiveModal } from '../../components/ScopeLiveModal';
import { useLanguage } from '../../context/LanguageContext';

export default function PrivacyPolicyPage() {
  const router = useRouter();
  const { lang, dir, toggleLang } = useLanguage();
  const [isLiveOpen, setIsLiveOpen] = useState(false);

  const isAr = lang === 'AR';

  const sections = isAr
    ? [
        { id: 'commitment', title: '1. التزامنا بحماية الخصوصية' },
        { id: 'data-collected', title: '2. البيانات التي يتم جمعها' },
        { id: 'journalistic-sources', title: '3. حماية المصادر والسرية الصحفية' },
        { id: 'cookies', title: '4. ملفات تعريف الارتباط والتقنيات التحليلية' },
        { id: 'third-parties', title: '5. عدم مشاركة البيانات مع جهات تجارية' },
        { id: 'user-rights', title: '6. حقوق القارئ والتحكم في البيانات' },
        { id: 'security', title: '7. معايير أمن المعلومات والأنظمة' },
      ]
    : [
        { id: 'commitment', title: '1. Privacy Commitment' },
        { id: 'data-collected', title: '2. Data Collected' },
        { id: 'journalistic-sources', title: '3. Protection of Journalistic Sources' },
        { id: 'cookies', title: '4. Cookies & Analytical Technologies' },
        { id: 'third-parties', title: '5. No Commercial Data Sharing' },
        { id: 'user-rights', title: '6. Reader Rights & Control' },
        { id: 'security', title: '7. Information Security Standards' },
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
              {isAr ? 'سياسة الخصوصية وحماية البيانات' : 'Privacy & Data Protection'}
            </span>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            SCOPE MEDIA · LEGAL & PRIVACY
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-[1480px] mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        <header className="mb-10 pb-8 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#A42424] dark:text-rose-400 block">
            {isAr ? 'وثيقة رسمية' : 'Official Document'}
          </span>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            {isAr ? 'سياسة الخصوصية وحماية البيانات' : 'Privacy & Data Protection Policy'}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
            <span>{isAr ? 'آخر تحديث: أكتوبر 2026' : 'Last Updated: October 2026'}</span>
            <span>•</span>
            <span className="font-mono">REF: PRIV-2026</span>
            <span>•</span>
            <span>{isAr ? 'منصة SCOPE MEDIA المستقلة' : 'SCOPE MEDIA Independent Platform'}</span>
          </div>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl pt-2">
            {isAr
              ? 'توضح هذه الوثيقة المعايير المتبعة في منصة SCOPE MEDIA لمعالجة وتأمين البيانات، مع الالتزام التام بمبادئ النزاهة الصحفية وحماية سرية المعلومات والمصادر.'
              : 'This document sets forth the principles observed by SCOPE MEDIA in managing and safeguarding data, adhering strictly to journalistic integrity and source confidentiality.'}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <aside className="lg:col-span-4 sticky top-16 space-y-4 order-2 lg:order-1">
            <div className="p-5 rounded-xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-sm text-slate-900 dark:text-white block">
                  {isAr ? 'فهرس البنود' : 'Table of Contents'}
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
            <section id="commitment" className="scroll-mt-24 p-6 sm:p-8 rounded-xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                {isAr ? '1. التزامنا بحماية الخصوصية' : '1. Privacy Commitment'}
              </h2>
              <div className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 space-y-3">
                <p>
                  {isAr
                    ? 'تعتبر منصة SCOPE MEDIA أن خصوصية القراء وحرية الوصول إلى المعلومة ركيزتان أساسيتان للعمل الصحفي النزيه. تلتزم المنصة بعدم بيع أو تأجير أي بيانات شخصية لأي جهات تجارية أو إعلانية تحت أي ظرف.'
                    : 'SCOPE MEDIA regards reader privacy and unobstructed access to information as fundamental pillars of honest journalism. The platform never sells or rents personal information to commercial or advertising third parties.'}
                </p>
                <p>
                  {isAr
                    ? 'يقتصر جمع البيانات على الحد الأدنى اللازم لتشغيل المنصة التقنية وتقديم البث والمحتوى الإخباري بأعلى كفاءة ممكنة.'
                    : 'Data collection is strictly limited to the minimum technical requirement needed to operate the digital infrastructure and provide editorial broadcasts.'}
                </p>
              </div>
            </section>

            <section id="data-collected" className="scroll-mt-24 p-6 sm:p-8 rounded-xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                {isAr ? '2. البيانات التي يتم جمعها' : '2. Data Collected'}
              </h2>
              <div className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 space-y-3">
                <ul className="space-y-3">
                  <li className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="font-semibold text-slate-900 dark:text-white block mb-1">
                      {isAr ? 'البيانات التقنية العامة:' : 'General Technical Telemetry:'}
                    </span>
                    <span>
                      {isAr
                        ? 'عناوين بروتوكول الإنترنت المجهولة الهوية جزئياً، نوع المتصفح، الصفحات التي تتم زيارتها، وتوقيت الزيارة لغرض تحليل الأداء وتحسين كفاءة التصفح.'
                        : 'Partially anonymized IP addresses, browser specifications, viewed pages, and request timestamps to monitor system performance.'}
                    </span>
                  </li>
                  <li className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="font-semibold text-slate-900 dark:text-white block mb-1">
                      {isAr ? 'البيانات التفاعلية الطوعية:' : 'Voluntary Interactions:'}
                    </span>
                    <span>
                      {isAr
                        ? 'البريد الإلكتروني المقدم طوعاً عند الاشتراك في النشرات الإخبارية، أو الملاحظات المرسلة لغرفة التحرير.'
                        : 'Email addresses provided voluntarily when subscribing to editorial newsletters or reaching the news desk.'}
                    </span>
                  </li>
                  <li className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="font-semibold text-slate-900 dark:text-white block mb-1">
                      {isAr ? 'تفضيلات الواجهة المحلية:' : 'Local Interface Preferences:'}
                    </span>
                    <span>
                      {isAr
                        ? 'حالة المظهر (الوضع الليلي والنهاري) وتفضيل اللغة، المخزنة محلياً في متصفح المستخدم دون نقلها لخوادم خارجية.'
                        : 'Theme mode and language preferences stored locally within the user browser without transmission to external servers.'}
                    </span>
                  </li>
                </ul>
              </div>
            </section>

            <section id="journalistic-sources" className="scroll-mt-24 p-6 sm:p-8 rounded-xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                {isAr ? '3. حماية المصادر والسرية الصحفية' : '3. Protection of Journalistic Sources'}
              </h2>
              <div className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 space-y-3">
                <p>
                  {isAr
                    ? 'تعتبر حماية المصادر الصحفية مبدأً غير قابل للتفاوض في نهج SCOPE MEDIA الاستقصائي. تخضع المواد والمعلومات المستلمة عبر القنوات الخاصة لسرية مطلقة وتدابير عزل مشددة تمنع كشف هوية المصادر.'
                    : 'The protection of confidential journalistic sources is non-negotiable at SCOPE MEDIA. Information received through specialized channels is maintained under strict confidentiality.'}
                </p>
                <p>
                  {isAr
                    ? 'لا يتم الاحتفاظ بأي سجلات تعريفية للمصادر على الخوادم العامة التابعة للموقع.'
                    : 'No identifying source logs are retained on public-facing web servers.'}
                </p>
              </div>
            </section>

            <section id="cookies" className="scroll-mt-24 p-6 sm:p-8 rounded-xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                {isAr ? '4. ملفات تعريف الارتباط والتقنيات التحليلية' : '4. Cookies & Analytical Technologies'}
              </h2>
              <div className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 space-y-3">
                <p>
                  {isAr
                    ? 'يستخدم الموقع ملفات تعريف ارتباط وظيفية فقط لضمان عمل الواجهة وحفظ الجلسات وتشغيل الوسائط المرئية. لا تستخدم المنصة أي ملفات تعريف ارتباط لأغراض التتبع الإعلاني المتبادل عبر المواقع.'
                    : 'The website utilizes only functional cookies to maintain session states and media player rendering, avoiding third-party cross-site behavioral tracking.'}
                </p>
                <p>
                  {isAr
                    ? 'يمكن للمستخدم تعطيل هذه الملفات من إعدادات المتصفح في أي وقت دون أن يفقد القدرة على الوصول إلى المحتوى التحريري.'
                    : 'Users can disable these cookies via browser preferences at any time without impeding access to core editorial content.'}
                </p>
              </div>
            </section>

            <section id="third-parties" className="scroll-mt-24 p-6 sm:p-8 rounded-xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                {isAr ? '5. عدم مشاركة البيانات مع جهات تجارية' : '5. No Commercial Data Sharing'}
              </h2>
              <div className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 space-y-3">
                <p>
                  {isAr
                    ? 'لا تشارك المنصة بيانات قرائها مع وسطاء البيانات أو الشبكات الدعائية. يقتصر التعامل التقني على مزودي البنية التحتية والشبكات السحابية لتأمين الوصول ومكافحة الهجمات السيبرانية.'
                    : 'The platform does not share audience records with data brokers or ad networks. Interactions are restricted to cloud infrastructure partners ensuring security and performance.'}
                </p>
              </div>
            </section>

            <section id="user-rights" className="scroll-mt-24 p-6 sm:p-8 rounded-xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                {isAr ? '6. حقوق القارئ والتحكم في البيانات' : '6. Reader Rights & Control'}
              </h2>
              <div className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 space-y-3">
                <p>
                  {isAr
                    ? 'يحق لكل قارئ طلب الاطلاع على أي بيانات مخزنة ترتبط به، أو تصحيحها، أو طلب حذف بريده الإلكتروني بشكل نهائي من قوائم النشرات الإخبارية، والاعتراض على أي معالجة إضافية لبياناته.'
                    : 'Readers retain the right to inspect, rectify, or request permanent deletion of their email records from subscriptions at any time.'}
                </p>
              </div>
            </section>

            <section id="security" className="scroll-mt-24 p-6 sm:p-8 rounded-xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                {isAr ? '7. معايير أمن المعلومات والأنظمة' : '7. Information Security Standards'}
              </h2>
              <div className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 space-y-3">
                <p>
                  {isAr
                    ? 'تعتمد المنصة معايير أمان رقمية صارمة تشمل التشفير الكامل لنقل البيانات (HTTPS)، وجدران الحماية المتقدمة ضد محاولات الاختراق، والمراجعة الدورية للبنية البرمجية لضمان سلامة وسرية الأنظمة.'
                    : 'The platform enforces robust security measures including modern HTTPS data transport encryption, firewalls against intrusion, and continuous architecture reviews.'}
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
