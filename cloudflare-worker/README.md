# 🌐 إعداد وتشغيل Cloudflare Worker مع قاعدة بيانات D1 لمنصة SCOPE MEDIA

تم تجهيز هذا المجلد لربط منصة **SCOPE MEDIA** بقاعدة بيانات **Cloudflare D1** الموزعة عبر **Cloudflare Worker**، مع حماية كاملة تمنع أي شخص غير **المسؤول (Admin)** من تعديل، إضافة، أو حذف البيانات.

---

## 🛠️ خطوات التشغيل في 3 دقائق

### 1. تثبيت Wrangler وتسجيل الدخول
تأكد من تسجيل الدخول إلى حسابك في Cloudflare:
```bash
npx wrangler login
```

### 2. إنشاء قاعدة بيانات Cloudflare D1
قم بإنشاء قاعدة البيانات باسم `scope_media_db`:
```bash
npx wrangler d1 create scope_media_db
```
عند تنفيذ الأمر، سيعطيك Cloudflare معرف قاعدة البيانات `database_id` (UUID). انسخه وضعه في ملف `wrangler.toml` مكان `YOUR_D1_DATABASE_UUID_HERE`.

### 3. تطبيق الجداول (Schema) والبيانات الأولية (Seed)
نفذ أوامر إنشاء الجداول وحقن الأخبار الأولية:
```bash
# إنشاء الجداول
npx wrangler d1 execute scope_media_db --file=./schema.sql

# حقن البيانات الأولية والمقالات
npx wrangler d1 execute scope_media_db --file=./seed.sql
```

### 4. تعيين الرمز السري للأدمن (Admin Secret Key)
لمنع أي تعديل غير مصرح به، قم بتعيين المفتاح السري كـ Secret مشفر داخل Cloudflare:
```bash
npx wrangler secret put ADMIN_API_KEY
```
(أدخل الرمز السري الذي تختاره للمسؤول، مثلاً: `scope_admin_sec_2026_x9`)

### 5. نشر الـ Worker (Deploy)
```bash
npx wrangler deploy
```
ستحصل على رابط الـ Worker مثل:
`https://scope-media-worker.<your-subdomain>.workers.dev`

---

## 🔗 ربط الـ Worker بتطبيق Next.js
في إعدادات تطبيق Next.js أو ملف المتغيرات `.env`:
```env
CLOUDFLARE_WORKER_URL="https://scope-media-worker.<your-subdomain>.workers.dev"
ADMIN_API_KEY="scope_admin_sec_2026_x9"
```

---

## 🛡️ سياسة الحماية وصلاحيات الأدمن
- **القراءة (GET):** عامة وسريعة للجميع (`/api/articles`, `/api/breaking`, `/api/comments`).
- **التعديل والإضافة والحذف (POST, PUT, DELETE):** محميّة تماماً، ويتم فحص الترويسة `Authorization: Bearer <ADMIN_API_KEY>` أو `X-Admin-Key`. في حال غياب المفتاح أو عدم تطابقه يتم إرجاع `401 Unauthorized` فوراً مع تسجيل محاولة التعديل.
