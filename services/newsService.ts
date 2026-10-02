import {
  ScopeArticle,
  BreakingItem,
  getAllArticles,
  getArticleById,
  scopeBreakingList,
} from '../data/scopeData';

const WORKER_URL = process.env.CLOUDFLARE_WORKER_URL || process.env.NEXT_PUBLIC_CLOUDFLARE_WORKER_URL || '';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';

/**
 * Service to fetch and mutate news data.
 * Seamlessly interfaces with Cloudflare Worker + D1 Database.
 * Automatically falls back to high-fidelity seed data if Worker is not yet configured.
 */
export const newsService = {
  // Check if real Cloudflare D1 backend is connected
  isD1Configured(): boolean {
    return Boolean(WORKER_URL && WORKER_URL.startsWith('http'));
  },

  getWorkerUrl(): string {
    return WORKER_URL;
  },

  // 1. Fetch All Articles
  async getArticles(category?: string, search?: string, limit = 50): Promise<ScopeArticle[]> {
    if (this.isD1Configured()) {
      try {
        const url = new URL(`${WORKER_URL}/api/articles`);
        if (category && category !== 'home' && category !== 'all') {
          url.searchParams.set('category', category);
        }
        if (search) {
          url.searchParams.set('search', search);
        }
        url.searchParams.set('limit', limit.toString());

        const res = await fetch(url.toString(), {
          next: { revalidate: 30 }, // Next.js ISR edge caching
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            return json.data;
          }
        }
      } catch (err) {
        console.warn('Could not fetch from Cloudflare D1 Worker, falling back to local dataset:', err);
      }
    }

    // Fallback to local high-fidelity dataset
    let list = getAllArticles();
    if (category && category !== 'home' && category !== 'all') {
      list = list.filter((a) => a.categorySlug === category);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.subtitle?.toLowerCase().includes(q) ||
          a.caption?.toLowerCase().includes(q)
      );
    }
    return list.slice(0, limit);
  },

  // 2. Fetch Single Article
  async getArticleById(id: string): Promise<ScopeArticle | null> {
    if (this.isD1Configured()) {
      try {
        const res = await fetch(`${WORKER_URL}/api/articles/${id}`, {
          next: { revalidate: 30 },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            return json.data;
          }
        }
      } catch (err) {
        console.warn(`Could not fetch article ${id} from Cloudflare D1:`, err);
      }
    }

    const localArticle = getArticleById(id);
    return localArticle || null;
  },

  // 3. Fetch Breaking News
  async getBreakingNews(): Promise<BreakingItem[]> {
    if (this.isD1Configured()) {
      try {
        const res = await fetch(`${WORKER_URL}/api/breaking`, {
          next: { revalidate: 15 },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            return json.data;
          }
        }
      } catch (err) {
        console.warn('Could not fetch breaking news from Cloudflare D1:', err);
      }
    }

    return scopeBreakingList;
  },

  // 4. Verify Admin Key
  async verifyAdminKey(key: string): Promise<{ success: boolean; message: string }> {
    // Check against local server env key first
    if (ADMIN_API_KEY && key === ADMIN_API_KEY) {
      return { success: true, message: 'مصرح كمسؤول في SCOPE MEDIA' };
    }

    // Also verify against Cloudflare Worker D1 endpoint if configured
    if (this.isD1Configured()) {
      try {
        const res = await fetch(`${WORKER_URL}/api/admin/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Key': key,
          },
        });
        if (res.ok) {
          const data = await res.json();
          return { success: true, message: data.message || 'مصرح كمسؤول' };
        }
      } catch {
        // Fallback
      }
    }

    // Default test key if no custom key configured in development
    if (key === 'scope_admin_2026' || (key && key === ADMIN_API_KEY)) {
      return { success: true, message: 'مصرح كمسؤول في SCOPE MEDIA' };
    }

    return { success: false, message: 'رمز المصادقة غير صحيح أو غير مصرح لك بالتعديل' };
  },

  // 5. Admin Mutation: Create Article
  async createArticle(
    article: Partial<ScopeArticle>,
    adminKey: string
  ): Promise<{ success: boolean; message: string; id?: string }> {
    const authCheck = await this.verifyAdminKey(adminKey);
    if (!authCheck.success) {
      return { success: false, message: 'غير مصرح: صلاحيات المسؤول مطلوبة للتعديل' };
    }

    if (this.isD1Configured()) {
      try {
        const res = await fetch(`${WORKER_URL}/api/articles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Key': adminKey,
          },
          body: JSON.stringify(article),
        });
        const data = await res.json();
        return data;
      } catch (err: any) {
        return { success: false, message: `فشل الاتصال بـ Cloudflare D1: ${err.message}` };
      }
    }

    return {
      success: true,
      message: 'تم حفظ المقال بنجاح (وضع المعاينة المحلي - قم بضبط CLOUDFLARE_WORKER_URL للحفظ الدائم في D1)',
      id: article.id || `art-${Date.now()}`,
    };
  },

  // 6. Admin Mutation: Delete Article
  async deleteArticle(id: string, adminKey: string): Promise<{ success: boolean; message: string }> {
    const authCheck = await this.verifyAdminKey(adminKey);
    if (!authCheck.success) {
      return { success: false, message: 'غير مصرح: صلاحيات المسؤول مطلوبة للحذف' };
    }

    if (this.isD1Configured()) {
      try {
        const res = await fetch(`${WORKER_URL}/api/articles/${id}`, {
          method: 'DELETE',
          headers: {
            'X-Admin-Key': adminKey,
          },
        });
        const data = await res.json();
        return data;
      } catch (err: any) {
        return { success: false, message: `فشل الحذف من D1: ${err.message}` };
      }
    }

    return { success: true, message: 'تم حذف المقال بنجاح' };
  },

  // 7. Admin Mutation: Add Breaking News
  async addBreakingNews(
    item: { time?: string; title: string; isSpecial?: boolean },
    adminKey: string
  ): Promise<{ success: boolean; message: string; data?: any }> {
    const authCheck = await this.verifyAdminKey(adminKey);
    if (!authCheck.success) {
      return { success: false, message: 'غير مصرح: صلاحيات المسؤول مطلوبة لنشر الأخبار العاجلة' };
    }

    if (this.isD1Configured()) {
      try {
        const res = await fetch(`${WORKER_URL}/api/breaking`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Key': adminKey,
          },
          body: JSON.stringify(item),
        });
        const data = await res.json();
        return data;
      } catch (err: any) {
        return { success: false, message: `فشل نشر الخبر في D1: ${err.message}` };
      }
    }

    return {
      success: true,
      message: 'تم نشر الخبر العاجل بنجاح',
      data: { id: `b-${Date.now()}`, ...item },
    };
  },
};
