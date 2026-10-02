/**
 * Cloudflare Worker for SCOPE MEDIA (سكوب ميديا)
 * Interacts with Cloudflare D1 Database.
 * Public reads, strict Admin-Only authorization for all writes & mutations.
 */

// Fallback type for environments without @cloudflare/workers-types installed
type D1Database = any;

export interface Env {
  DB: D1Database;
  ADMIN_API_KEY?: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key',
  'Content-Type': 'application/json; charset=utf-8',
};

// Helper response functions
function jsonResponse(data: unknown, status = 200, extraHeaders = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, ...extraHeaders },
  });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message, success: false }, status);
}

// Authentication Middleware: Checks if request has a valid Admin Key
function checkAdminAuth(request: Request, env: Env): boolean {
  const configuredKey = env.ADMIN_API_KEY;
  if (!configuredKey) {
    // If not set in worker env, reject all mutations to remain secure by default
    return false;
  }

  const authHeader = request.headers.get('Authorization');
  const customHeader = request.headers.get('X-Admin-Key');

  let token = customHeader;
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  return Boolean(token && token === configuredKey);
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    try {
      // Health check & info
      if (path === '/' || path === '/health') {
        return jsonResponse({
          status: 'ok',
          service: 'SCOPE MEDIA Cloudflare D1 API',
          version: '1.0.0',
          d1Connected: Boolean(env.DB),
          timestamp: new Date().toISOString(),
        });
      }

      // =====================================================================
      // 1. ADMIN AUTH VERIFICATION ENDPOINT
      // =====================================================================
      if (path === '/api/admin/verify' && method === 'POST') {
        const isAuth = checkAdminAuth(request, env);
        if (!isAuth) {
          return errorResponse('رمز المصادقة غير صالح أو غير مصرح لك بالتعديل', 401);
        }
        return jsonResponse({ success: true, message: 'مصرح كمسؤول في SCOPE MEDIA', role: 'admin' });
      }

      // =====================================================================
      // 2. BREAKING NEWS ENDPOINTS
      // =====================================================================
      if (path === '/api/breaking') {
        if (method === 'GET') {
          const { results } = await env.DB.prepare(
            'SELECT id, time, title, is_special as isSpecial FROM breaking_news ORDER BY created_at DESC LIMIT 30'
          ).all();
          return jsonResponse({ success: true, count: results.length, data: results });
        }

        // POST /api/breaking: Create Breaking Alert (Admin Only)
        if (method === 'POST') {
          if (!checkAdminAuth(request, env)) {
            return errorResponse('غير مصرح لك بإضافة أخبار عاجلة (يتطلب صلاحيات الأدمن)', 401);
          }
          const body = (await request.json()) as { time?: string; title: string; isSpecial?: boolean };
          if (!body.title) {
            return errorResponse('عنوان الخبر العاجل مطلوب');
          }
          const id = `b-${Date.now()}`;
          const time = body.time || new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
          const isSpecial = body.isSpecial ? 1 : 0;

          await env.DB.prepare(
            'INSERT INTO breaking_news (id, time, title, is_special) VALUES (?, ?, ?, ?)'
          ).bind(id, time, body.title, isSpecial).run();

          return jsonResponse({ success: true, message: 'تم نشر الخبر العاجل بنجاح', data: { id, time, title: body.title, isSpecial: Boolean(isSpecial) } }, 201);
        }
      }

      if (path.startsWith('/api/breaking/') && method === 'DELETE') {
        if (!checkAdminAuth(request, env)) {
          return errorResponse('غير مصرح لك بحذف الأخبار العاجلة', 401);
        }
        const id = path.replace('/api/breaking/', '');
        await env.DB.prepare('DELETE FROM breaking_news WHERE id = ?').bind(id).run();
        return jsonResponse({ success: true, message: 'تم حذف الخبر العاجل بنجاح' });
      }

      // =====================================================================
      // 3. ARTICLES ENDPOINTS
      // =====================================================================
      if (path === '/api/articles') {
        // GET /api/articles (Public)
        if (method === 'GET') {
          const category = url.searchParams.get('category');
          const search = url.searchParams.get('search');
          const limit = parseInt(url.searchParams.get('limit') || '50', 10);

          let query = 'SELECT * FROM articles';
          const params: (string | number)[] = [];
          const whereClauses: string[] = [];

          if (category && category !== 'all' && category !== 'home') {
            whereClauses.push('category_slug = ?');
            params.push(category);
          }

          if (search) {
            whereClauses.push('(title LIKE ? OR subtitle LIKE ? OR caption LIKE ?)');
            const s = `%${search}%`;
            params.push(s, s, s);
          }

          if (whereClauses.length > 0) {
            query += ' WHERE ' + whereClauses.join(' AND ');
          }

          query += ' ORDER BY created_at DESC LIMIT ?';
          params.push(limit);

          const { results } = await env.DB.prepare(query).bind(...params).all();

          // Transform DB rows to ScopeArticle format
          const formattedArticles = results.map((row: any) => ({
            id: row.id,
            title: row.title,
            subtitle: row.subtitle,
            category: row.category,
            categorySlug: row.category_slug,
            categoryColor: row.category_color,
            time: row.time,
            date: row.date,
            views: row.views,
            commentsCount: row.comments_count,
            isSpecial: Boolean(row.is_special),
            imageType: row.image_type,
            caption: row.caption,
            author: row.author_name ? { name: row.author_name, role: row.author_role } : undefined,
            content: row.content_json ? JSON.parse(row.content_json) : [],
          }));

          return jsonResponse({ success: true, count: formattedArticles.length, data: formattedArticles });
        }

        // POST /api/articles: Create Article (Admin Only)
        if (method === 'POST') {
          if (!checkAdminAuth(request, env)) {
            return errorResponse('غير مصرح لك بإنشاء مقال (يتطلب صلاحية المسؤول فقط)', 401);
          }

          const body = (await request.json()) as any;
          if (!body.title || !body.category) {
            return errorResponse('عنوان المقال والقسم حقول مطلوبة');
          }

          const id = body.id || `art-${Date.now()}`;
          const date = body.date || new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
          const contentJson = JSON.stringify(Array.isArray(body.content) ? body.content : [body.content || '']);

          await env.DB.prepare(
            `INSERT INTO articles (
              id, title, subtitle, category, category_slug, category_color,
              date, views, comments_count, is_special, image_type, caption,
              author_name, author_role, content_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            id,
            body.title,
            body.subtitle || '',
            body.category,
            body.categorySlug || 'news',
            body.categoryColor || 'red',
            date,
            body.views || 100,
            0,
            body.isSpecial ? 1 : 0,
            body.imageType || 'anchor_studio',
            body.caption || '',
            body.author?.name || 'فريق تحرير SCOPE MEDIA',
            body.author?.role || 'محرر صحفي',
            contentJson
          ).run();

          return jsonResponse({ success: true, message: 'تم نشر المقال بنجاح في قاعدة بيانات D1', id }, 201);
        }
      }

      // Single Article Operations: /api/articles/:id
      if (path.startsWith('/api/articles/')) {
        const id = path.replace('/api/articles/', '').split('/')[0];

        // GET single article (Public)
        if (method === 'GET') {
          const row: any = await env.DB.prepare('SELECT * FROM articles WHERE id = ?').bind(id).first();
          if (!row) {
            return errorResponse('المقال غير موجود في أرشيف D1', 404);
          }

          // Increment view count asynchronously
          await env.DB.prepare('UPDATE articles SET views = views + 1 WHERE id = ?').bind(id).run();

          const article = {
            id: row.id,
            title: row.title,
            subtitle: row.subtitle,
            category: row.category,
            categorySlug: row.category_slug,
            categoryColor: row.category_color,
            time: row.time,
            date: row.date,
            views: row.views + 1,
            commentsCount: row.comments_count,
            isSpecial: Boolean(row.is_special),
            imageType: row.image_type,
            caption: row.caption,
            author: row.author_name ? { name: row.author_name, role: row.author_role } : undefined,
            content: row.content_json ? JSON.parse(row.content_json) : [],
          };

          return jsonResponse({ success: true, data: article });
        }

        // PUT /api/articles/:id: Update Article (Admin Only)
        if (method === 'PUT') {
          if (!checkAdminAuth(request, env)) {
            return errorResponse('غير مصرح لك بتعديل المقال (صلاحيات المسؤول مطلوبة)', 401);
          }

          const body = (await request.json()) as any;
          const contentJson = body.content ? JSON.stringify(body.content) : null;

          await env.DB.prepare(
            `UPDATE articles SET
              title = COALESCE(?, title),
              subtitle = COALESCE(?, subtitle),
              category = COALESCE(?, category),
              category_slug = COALESCE(?, category_slug),
              image_type = COALESCE(?, image_type),
              caption = COALESCE(?, caption),
              author_name = COALESCE(?, author_name),
              author_role = COALESCE(?, author_role),
              content_json = COALESCE(?, content_json),
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`
          ).bind(
            body.title || null,
            body.subtitle || null,
            body.category || null,
            body.categorySlug || null,
            body.imageType || null,
            body.caption || null,
            body.author?.name || null,
            body.author?.role || null,
            contentJson,
            id
          ).run();

          return jsonResponse({ success: true, message: 'تم تحديث المقال بنجاح' });
        }

        // DELETE /api/articles/:id: Delete Article (Admin Only)
        if (method === 'DELETE') {
          if (!checkAdminAuth(request, env)) {
            return errorResponse('غير مصرح لك بحذف هذا المقال (صلاحيات المسؤول فقط)', 401);
          }

          await env.DB.prepare('DELETE FROM articles WHERE id = ?').bind(id).run();
          return jsonResponse({ success: true, message: 'تم حذف المقال من قاعدة البيانات بنجاح' });
        }
      }

      // =====================================================================
      // 4. COMMENTS ENDPOINTS
      // =====================================================================
      if (path.startsWith('/api/comments/')) {
        const articleId = path.replace('/api/comments/', '');

        if (method === 'GET') {
          const { results } = await env.DB.prepare(
            'SELECT id, article_id as articleId, author_name as authorName, avatar, date, content, likes_count as likesCount FROM comments WHERE article_id = ? AND is_approved = 1 ORDER BY created_at DESC'
          ).bind(articleId).all();
          return jsonResponse({ success: true, count: results.length, data: results });
        }

        if (method === 'POST') {
          const body = (await request.json()) as any;
          if (!body.authorName || !body.content) {
            return errorResponse('اسم الكاتب ومحتوى التعليق مطلوبان');
          }

          const id = `c-${Date.now()}`;
          const date = 'الآن';
          await env.DB.prepare(
            'INSERT INTO comments (id, article_id, author_name, avatar, date, content, likes_count, is_approved) VALUES (?, ?, ?, ?, ?, ?, 0, 1)'
          ).bind(id, articleId, body.authorName, body.avatar || '', date, body.content).run();

          await env.DB.prepare('UPDATE articles SET comments_count = comments_count + 1 WHERE id = ?').bind(articleId).run();

          return jsonResponse({ success: true, message: 'تم نشر التعليق بنجاح', data: { id, authorName: body.authorName, content: body.content, date } }, 201);
        }
      }

      return errorResponse('المسار غير متوفر في خدمة SCOPE MEDIA API', 404);
    } catch (err: any) {
      return errorResponse(err.message || 'خطأ داخلي في الخادم', 500);
    }
  },
};

export default worker;
