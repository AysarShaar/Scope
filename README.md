# SCOPE MEDIA | سكوب ميديا

منصة إخبارية عربية: موقع للقرّاء، ولوحة تحكم للمحررين لإدارة المقالات والبرامج والأخبار العاجلة.

## التقنيات

| الطبقة | الاختيار |
|---|---|
| الواجهة | Next.js (App Router) + React + Tailwind CSS |
| قاعدة البيانات | Cloudflare D1 (SQLite) عبر Drizzle ORM |
| الاستضافة | Cloudflare Workers عبر `@opennextjs/cloudflare` |
| تسجيل الدخول | NextAuth (Google OAuth) |
| الصور والملفات | Cloudflare R2 (`img.scope-media.net`)، والصور القديمة ما زالت على Cloudinary |
| محرر المقالات | TipTap |
| اللغات | العربية (RTL) مع ترجمات في `lib/translations.ts` |

## هيكل المشروع

```
app/
  (صفحات القرّاء)   page.tsx, news/[id], category/[slug], programs, videos, search
  admin/            لوحة التحكم (محمية بتسجيل الدخول)
    components/     شاشات اللوحة (ArticleEditor, ProgramsManager, ...) ومكوناتها الفرعية
    hooks/          useImageUpload (رفع الصور المشترك)
    lib/            articleHtml.ts (تحويل HTML المحرر <-> كتل المقال)
  api/              articles, programs, episodes, editors, breaking, settings, upload
components/         مكونات الواجهة المشتركة
lib/
  articleContent.ts تنظيف HTML وفحص محتوى المقال
  dates.ts          تواريخ المقالات (عربي / ISO): تحليل، وتنسيق، ومنع المستقبل
  errors.ts         errorMessage() لاستخراج رسالة الخطأ من unknown
  server/           قراءة D1 على الخادم + المحوّلات المشتركة (articleMapper, programMapper)
  auth.ts           التحقق من الصلاحيات
db/
  schema.ts         جداول Drizzle
  migrations/       تعديلات قاعدة البيانات بالترتيب
types/              تعريفات next-auth (الدور ومعرّف المحرر داخل الجلسة)
middleware.ts       حماية طلبات الكتابة + ترويسات الأمان (CSP)
```

## التخزين المؤقت لقراءات الـ API

قراءات `GET` العامة (المقالات، والبرامج، والأخبار العاجلة، والإعدادات) تُخزَّن لثوانٍ في Cache API الخاص بـ Cloudflare
(`lib/server/edgeCache.ts`) كي لا يتحول كل زائر للصفحة الرئيسية إلى استعلام D1.
الطلبات التي تحمل جلسة تسجيل دخول لا تمر عبره، فلوحة التحكم ترى البيانات الحية دائماً.
التعديلات تظهر للزوار العامين بعد 30 إلى 120 ثانية كحد أقصى. رأس الاستجابة `X-Edge-Cache` يوضح HIT أو MISS.

## تقليل الـ invocations والكاش

- كاش الصفحات في `worker.ts` (Cache API): يقدّم النسخة القديمة فوراً (`X-Worker-Cache: STALE`) ويجدّدها في الخلفية.
- المتصفح يخزّن الصفحة حتى 60 ثانية فلا تصل الزيارات المتكررة إلى الـ Worker.
- لا يوجد incremental cache (ISR على R2) عن قصد؛ يمكن إضافته لاحقاً في `open-next.config.ts` إن لزم.

## SEO

- لا يوجد canonical عام في `app/layout.tsx`؛ لكل صفحة canonical خاص بها.
- `/sitemap.xml` (المقالات والأقسام والبرامج مع lastmod حقيقي) و`/news-sitemap.xml` (مقالات آخر 48 ساعة لـ Google News).
- بيانات `NewsArticle` تستخدم تواريخ ISO من `created_at` و`updated_at`.

## الصلاحيات

ثلاثة أدوار: `admin` و`editor_in_chief` و`editor`. المحرر العادي تُحفظ مقالاته بحالة معلّقة،
ولا ينشر مباشرة ولا يعدّل بيانات الكاتب. النشر والموافقة لرئيس التحرير والمدير فقط.
عناوين البريد الواردة في `ADMIN_EMAILS` تأخذ صلاحية المدير.

## التشغيل محلياً

المتطلبات: Node.js 20+ وحساب Cloudflare (لقاعدة D1).

```bash
npm install
cp .env.example .env.local        # ثم عبّئ القيم
cp .dev.vars.example .dev.vars    # أسرار Wrangler المحلية
npm run db:migrate:local          # إنشاء الجداول في D1 المحلية
npm run dev
```

متغيرات البيئة موضّحة في `.env.example` (Cloudinary، وNextAuth، وGoogle OAuth، وقائمة المدراء).

## الأوامر

| الأمر | الوظيفة |
|---|---|
| `npm run dev` | تشغيل محلي |
| `npm test` | تشغيل الاختبارات (Vitest) |
| `npm run lint` | فحص ESLint |
| `npm run db:migrate:remote` | تطبيق migrations على قاعدة الإنتاج |
| `npm run deploy` | بناء ونشر على Cloudflare |

## النشر

الأسرار (`NEXTAUTH_SECRET`, `GOOGLE_CLIENT_SECRET`, `CLOUDINARY_API_SECRET`) تُضاف عبر
`npx wrangler secret put <NAME>` ولا تُكتب في `wrangler.jsonc`.

## قرارات وملاحظات

انظر [DECISIONS.md](./DECISIONS.md).

## ترحيل الصور القديمة من Cloudinary إلى R2

```bash
node scripts/migrate-cloudinary-to-r2.mjs            # تجربة فقط: يعرض ما سيُنقل دون تغيير
node scripts/migrate-cloudinary-to-r2.mjs --apply    # ينقل الصور ويكتب cloudinary-migration/migrate.sql
npx wrangler d1 execute DB --remote --file=cloudinary-migration/migrate.sql
```

لا يحذف شيئاً من Cloudinary ولا يغيّر قاعدة البيانات؛ ملف `migrate.sql` تراجعه ثم تشغّله بنفسك.
# Scope
