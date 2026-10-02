# 🚀 دليل نشر موقع SCOPE MEDIA على Cloudflare Pages

تم تجهيز المشروع بالكامل ليتوافق مع **Cloudflare Pages** باستخدام المحول الرسمي `@cloudflare/next-on-pages` للعمل بكفاءة وسرعة على شبكة Cloudflare العالمية (Edge Network).

---

## 1. الإعدادات المطلوبة في لوحة تحكم Cloudflare Pages

عند ربط مستودع GitHub بـ **Cloudflare Pages** (Create a project > Pages > Connect to Git):

| الإعداد (Setting) | القيمة المطلوبة (Value) | ملاحظات |
| :--- | :--- | :--- |
| **Framework preset** | `None` أو `Next.js` | اختر `None` أو `Next.js` |
| **Build command** | `npm run pages:build` | يقوم بتشغيل `npx @cloudflare/next-on-pages` |
| **Build output directory** | `.vercel/output/static` | مسار المخرجات المتوافق مع Cloudflare Pages |
| **Root directory** | `/` (اتركه فارغاً) | جذر المشروع |

---

## 2. متغيرات البيئة (Environment Variables) في Cloudflare Pages

من إعدادات المشروع (**Settings > Environment variables**)، أضف المتغيرات التالية لكل من (Production & Preview):

1. **`NODE_VERSION`**
   * القيمة: `20` *(مهم جداً لدعم أحدث إصدارات Next.js)*
2. **`NEXT_PUBLIC_CLOUDFLARE_WORKER_URL`**
   * القيمة: رابط الـ Worker الخاص بك، مثل:
   * `https://scope-media-worker.<your-subdomain>.workers.dev`
3. **`ADMIN_API_KEY`**
   * القيمة: المفتاح السري المخصص للوحة الإدارة وحماية التعديلات.

---

## 3. تفعيل راية التوافق (Compatibility Flag)

لضمان عمل وظائف Node.js السحابية بدون أي أخطاء:
1. اذهب إلى **Settings** > **Functions**.
2. انزل إلى قسم **Compatibility flags**.
3. أضف الراية: `nodejs_compat` لكل من **Production** و **Preview**.

---

## 4. ربط الواجهة (Pages) بقاعدة بيانات D1 عبر الـ Worker

الموقع الآن مبرمج تلقائياً بنظام مزدوج وذكي (`services/newsService.ts`):
* **في حال توفر رابط الـ Worker:** يجلب الأخبار والمقالات الحية مباشرة من **D1 Database**، ويسمح للأدمن فقط بإنشاء وتعديل الأخبار.
* **في حال عدم الاتصال بالـ Worker:** يعرض الموقع بيانات تجريبية عالية الدقة تلقائياً لضمان عدم توقف الموقع أو ظهور شاشات بيضاء.

---

## 5. خطوات تشغيل الـ Backend (Worker + D1)

من جهازك المحلي داخل مجلد `cloudflare-worker`:

```bash
cd cloudflare-worker

# 1. إنشاء قاعدة بيانات D1
npx wrangler d1 create scope_media_db

# 2. إنشاء الجداول وتجهيز البيانات
npx wrangler d1 execute scope_media_db --file=./schema.sql
npx wrangler d1 execute scope_media_db --file=./seed.sql

# 3. نشر الـ Worker على Cloudflare
npx wrangler deploy
```

بعد النشر، انسخ الرابط الذي يظهر لك وضعه كقيمة لـ `NEXT_PUBLIC_CLOUDFLARE_WORKER_URL` في Cloudflare Pages!
